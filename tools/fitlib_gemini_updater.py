#!/usr/bin/env python3
"""
FitLib Vault — Cost-Optimized, Scientifically Grounded Gemini Updater
=====================================================================

Solves the three failure modes of automated knowledge-base updates:
  1. Citation hallucinations & publisher HTTP 403 blocks -> Grounds every note
     using free PubMed E-utilities + Crossref DOI API BEFORE invoking Gemini,
     then enforces a hard zero-hallucination citation gate on the output.
  2. Wasted spend & broken runs -> Idempotent SHA-256 manifest skips already
     verified notes; exponential backoff handles 429/503; --dry-run prints
     exact token & USD estimates before spending a cent.
  3. Overpaying for flagship models -> 3-tier routing:
       * gemini-2.5-flash-lite : metadata, tags, skill-ladder extraction
       * gemini-2.5-flash      : core scientific audit & rewrite (default)
       * gemini-2.5-pro        : escalation ONLY when Flash flags conflict/safety
     Supports both --pilot N (sync) and --batch-prepare (50% cheaper Batch API).

Dependencies: Python 3.10+ standard library only (zero fragile SDK lock-in).

Quick start:
  export GEMINI_API_KEY="your-key"
  python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --dry-run
  python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --pilot 5
  python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --batch-prepare
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

PROMPT_VERSION = "2026-11-v2-grounded"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
PUBMED_ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
CROSSREF_WORKS = "https://api.crossref.org/works/"

# Approximate USD per 1M tokens (standard / batch 50% off) for pre-run cost estimation
MODEL_PRICING_PER_1M = {
    "gemini-2.5-flash-lite": {"in": 0.10, "out": 0.40},
    "gemini-2.5-flash": {"in": 0.30, "out": 2.50},
    "gemini-2.5-pro": {"in": 1.25, "out": 10.00},
}

SKIP_FILENAMES = frozenset({
    "README.md",
    "fitlib.md",
    "citation_validation_report.md",
    "cost_controlled_report.md",
    "ORGANIZATION_COMPLETE_REPORT.md",
})

DOMAIN_HINTS = {
    "A": "exercise physiology biomechanics",
    "B": "resistance training strength hypertrophy",
    "C": "sports nutrition protein metabolism",
    "D": "weight loss energy balance body composition",
    "E": "cardiovascular endurance vo2max running",
    "F": "sleep recovery athletic testing",
    "G": "exercise special populations clinical",
    "M": "exercise recovery fatigue hrv",
    "N": "exercise adherence behavior change habit psychology",
    "X": "sports performance calisthenics plyometrics skill acquisition",
}


@dataclass
class GroundedStudy:
    pmid: Optional[str]
    doi: Optional[str]
    title: str
    authors: str
    journal: str
    year: str
    pub_types: List[str]
    quality_score: float
    verified_via: str


def http_json(
    url: str,
    method: str = "GET",
    payload: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 45,
    max_retries: int = 4,
) -> Dict[str, Any]:
    req_headers = {"User-Agent": "FitLibScientificUpdater/2.0 (mailto:fitlib@local)"}
    if headers:
        req_headers.update(headers)

    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")

    for attempt in range(max_retries):
        req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8", errors="ignore")[:400]
            if err.code in (429, 500, 502, 503, 504) and attempt < max_retries - 1:
                sleep_s = (2 ** attempt) + random.uniform(0.25, 1.0)
                print(f"  [retry {attempt + 1}] HTTP {err.code} — sleeping {sleep_s:.1f}s...", file=sys.stderr)
                time.sleep(sleep_s)
                continue
            raise RuntimeError(f"HTTP {err.code} for {url}: {err_body}") from err
        except (urllib.error.URLError, TimeoutError) as err:
            if attempt < max_retries - 1:
                sleep_s = (2 ** attempt) + random.uniform(0.25, 1.0)
                time.sleep(sleep_s)
                continue
            raise RuntimeError(f"Network error for {url}: {err}") from err
    raise RuntimeError(f"Exhausted retries for {url}")


def load_json_file(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return default
    return default


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as tmp:
        tmp.write(content)
        tmp.flush()
        os.fsync(tmp.fileno())
        tmp_path = Path(tmp.name)
    os.replace(tmp_path, path)


def score_study(pub_types: List[str], year_str: str) -> float:
    types_lower = " ".join(pub_types).lower()
    if "meta-analysis" in types_lower or "systematic review" in types_lower:
        design = 1.0
    elif "randomized controlled trial" in types_lower:
        design = 0.9
    elif "clinical trial" in types_lower or "review" in types_lower:
        design = 0.72
    else:
        design = 0.5
    try:
        age = max(0, datetime.now().year - int(year_str[:4]))
    except Exception:
        age = 8
    recency = max(0.35, 1.0 - (age * 0.04))
    return round(0.7 * design + 0.3 * recency, 3)


def verify_doi_crossref(doi: str, cache: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi.strip(), flags=re.I)
    cache_key = f"doi:{clean_doi.lower()}"
    if cache_key in cache:
        return cache[cache_key]
    url = CROSSREF_WORKS + urllib.parse.quote(clean_doi, safe="")
    try:
        data = http_json(url, timeout=15, max_retries=2)
        msg = data.get("message", {})
        result = {
            "doi": f"https://doi.org/{clean_doi}",
            "title": (msg.get("title") or [""])[0],
            "journal": (msg.get("container-title") or [""])[0],
            "year": str((msg.get("published", {}).get("date-parts") or [[""]])[0][0]),
            "valid": True,
        }
    except Exception:
        result = None
    cache[cache_key] = result
    time.sleep(0.12)
    return result


def fetch_pubmed_evidence(topic_title: str, prefix: str, cache: Dict[str, Any], max_studies: int = 5) -> List[GroundedStudy]:
    clean_topic = re.sub(r"^[A-Z]{1,3}\d+(?:\.\d+)?\.?\s*", "", topic_title).strip()
    clean_topic = re.sub(r"[^a-zA-Z0-9\s-]", " ", clean_topic)
    hint = DOMAIN_HINTS.get(prefix.upper(), "exercise science")
    query_terms = " ".join(clean_topic.split()[:6])
    term = (
        f"({query_terms}) AND ({hint.split()[0]}) AND humans[MeSH Terms] "
        f"AND (Meta-Analysis[ptyp] OR Systematic Review[ptyp] OR Randomized Controlled Trial[ptyp] OR Review[ptyp])"
    )
    cache_key = f"pubmed:{hashlib.sha1(term.encode()).hexdigest()[:16]}"
    if cache_key in cache:
        return [GroundedStudy(**s) for s in cache[cache_key]]

    params = urllib.parse.urlencode({
        "db": "pubmed",
        "term": term,
        "retmode": "json",
        "retmax": str(max_studies * 2),
        "sort": "relevance",
    })
    studies: List[GroundedStudy] = []
    try:
        search = http_json(f"{PUBMED_ESEARCH}?{params}", timeout=20, max_retries=3)
        pmids = search.get("esearchresult", {}).get("idlist", [])
        if pmids:
            time.sleep(0.35)  # Polite NCBI rate limit (<=3 req/s without key)
            sum_params = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(pmids), "retmode": "json"})
            summary = http_json(f"{PUBMED_ESUMMARY}?{sum_params}", timeout=20, max_retries=3).get("result", {})
            for pmid in pmids:
                item = summary.get(pmid)
                if not isinstance(item, dict):
                    continue
                doi = None
                for aid in item.get("articleids", []):
                    if aid.get("idtype") == "doi":
                        doi = f"https://doi.org/{aid.get('value')}"
                        break
                authors = ", ".join(a.get("name", "") for a in item.get("authors", [])[:3])
                if len(item.get("authors", [])) > 3:
                    authors += " et al."
                pub_types = item.get("pubtype", [])
                year = str(item.get("pubdate", ""))[:4]
                studies.append(GroundedStudy(
                    pmid=pmid,
                    doi=doi,
                    title=item.get("title", "").strip(),
                    authors=authors or "Unknown",
                    journal=item.get("fulljournalname") or item.get("source") or "",
                    year=year,
                    pub_types=pub_types,
                    quality_score=score_study(pub_types, year),
                    verified_via="pubmed",
                ))
            studies.sort(key=lambda s: s.quality_score, reverse=True)
            studies = studies[:max_studies]
    except Exception as err:
        print(f"  [warn] PubMed lookup skipped for '{topic_title}': {err}", file=sys.stderr)

    cache[cache_key] = [asdict(s) for s in studies]
    time.sleep(0.35)
    return studies


def collect_vault_notes(vault_dir: Path) -> List[Path]:
    notes: List[Path] = []
    for path in sorted(vault_dir.glob("*.md")):
        if path.name in SKIP_FILENAMES or path.name.startswith("FINAL_"):
            continue
        if path.stat().st_size < 40:
            continue
        notes.append(path)
    return notes


def extract_existing_dois_and_pmids(text: str) -> Tuple[Set[str], Set[str]]:
    dois = {m.group(0).rstrip(").,]").lower() for m in re.finditer(r"https?://(?:dx\.)?doi\.org/[^\s)\]]+", text, re.I)}
    pmids = {m.group(1) for m in re.finditer(r"(?:PMID[:\s]*|pubmed\.ncbi\.nlm\.nih\.gov/)(\d{6,9})", text, re.I)}
    return dois, pmids


def build_system_instruction(task: str) -> str:
    if task == "metadata":
        return (
            "You are an exercise science taxonomy extractor. Return ONLY strict JSON with keys: "
            "summary (1-2 sentences), key_points (3-5 concise bullets), skill_meta "
            "(object with prerequisites[], regressions[], progressions[], limiting_factors[], contraindications[] or null if not a physical skill/exercise), "
            "and tags (5-8 lowercase hyphenated tags)."
        )
    return (
        "You are a senior exercise physiologist and scientific editor auditing FitLib Vault notes.\n"
        "NON-NEGOTIABLE SCIENTIFIC RULES:\n"
        "1. NEVER invent, guess, or alter any DOI, PMID, author name, or year. ONLY cite studies "
        "present in the provided VERIFIED EVIDENCE BRIEF or already-verified DOIs from the note.\n"
        "2. Preserve the note's original ID header, Obsidian [[wikilinks]] (do not invent broken links), "
        "and core section layout (Quick Takeaway, Key Points, Deep Dive, Practical Application, Research Evidence).\n"
        "3. Correct outdated claims, clarify effect sizes/populations, and add practical autoregulation cues "
        "(e.g., how HRV/sleep/fatigue modify application) where scientifically appropriate.\n"
        "4. Return strict JSON with keys:\n"
        "   - updated_markdown (string): full refreshed markdown note\n"
        "   - scientific_changes (array of short strings): key factual updates made\n"
        "   - confidence_score (number 0-1)\n"
        "   - needs_pro_review (boolean): true ONLY if studies genuinely conflict or involve high-risk clinical contraindications\n"
        "   - pro_review_reason (string or null)"
    )


def build_user_prompt(note_name: str, note_text: str, evidence: List[GroundedStudy], existing_valid_dois: List[str]) -> str:
    evidence_block = json.dumps([asdict(s) for s in evidence], indent=2) if evidence else "[]"
    return (
        f"NOTE FILENAME: {note_name}\n"
        f"TODAY: {datetime.now(timezone.utc).date().isoformat()}\n\n"
        f"ALREADY-VERIFIED DOIs IN NOTE:\n{json.dumps(existing_valid_dois)}\n\n"
        f"VERIFIED PUBMED EVIDENCE BRIEF (ONLY CITE FROM HERE OR ALREADY-VERIFIED DOIs):\n{evidence_block}\n\n"
        f"CURRENT NOTE MARKDOWN:\n{note_text[:18000]}"
    )


def call_gemini(
    api_key: str,
    model: str,
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.2,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    url = f"{GEMINI_API_BASE}/models/{model}:generateContent?key={urllib.parse.quote(api_key)}"
    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }
    resp = http_json(url, method="POST", payload=payload, timeout=90, max_retries=4)
    candidates = resp.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"Gemini returned no candidates: {json.dumps(resp)[:300]}")
    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not text:
        raise RuntimeError("Gemini returned empty response text")
    parsed = json.loads(text)
    usage_meta = resp.get("usageMetadata", {})
    usage = {
        "input_tokens": int(usage_meta.get("promptTokenCount", 0)),
        "output_tokens": int(usage_meta.get("candidatesTokenCount", 0)),
    }
    return parsed, usage


def verify_output_gates(
    updated_md: str,
    allowed_dois: Set[str],
    allowed_pmids: Set[str],
    vault_basenames: Set[str],
) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    if len(updated_md.strip()) < 200:
        errors.append("Updated note suspiciously short (<200 chars)")

    out_dois, out_pmids = extract_existing_dois_and_pmids(updated_md)
    unverified_dois = {d for d in out_dois if d not in allowed_dois}
    unverified_pmids = {p for p in out_pmids if p not in allowed_pmids}
    if unverified_dois:
        errors.append(f"Hallucinated/unverified DOIs rejected: {sorted(unverified_dois)[:3]}")
    if unverified_pmids:
        errors.append(f"Hallucinated/unverified PMIDs rejected: {sorted(unverified_pmids)[:3]}")

    # Check wikilinks don't introduce brand-new broken targets
    out_links = set(re.findall(r"\[\[([^\]|#]+)", updated_md))
    broken_links = [lnk for lnk in out_links if lnk.strip().lower() not in vault_basenames]
    if len(broken_links) > 3:
        errors.append(f"Too many unresolved wikilinks ({len(broken_links)}): {broken_links[:3]}")

    return (len(errors) == 0), errors


def estimate_cost(notes: List[Path], model: str, batch: bool) -> Dict[str, Any]:
    total_chars = sum(p.stat().st_size for p in notes)
    # Prompt overhead (~900 tokens) + evidence brief (~600 tokens) + note text (~4 chars/token)
    est_input_tokens = int((total_chars / 4) + (len(notes) * 1500))
    est_output_tokens = int((total_chars / 4) * 1.15)
    pricing = MODEL_PRICING_PER_1M.get(model, MODEL_PRICING_PER_1M["gemini-2.5-flash"])
    discount = 0.5 if batch else 1.0
    cost_usd = ((est_input_tokens / 1e6) * pricing["in"] + (est_output_tokens / 1e6) * pricing["out"]) * discount
    return {
        "notes_queued": len(notes),
        "model": model,
        "batch_50pct_discount": batch,
        "est_input_tokens": est_input_tokens,
        "est_output_tokens": est_output_tokens,
        "est_cost_usd": round(cost_usd, 3),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="FitLib Vault Grounded Gemini Scientific Updater")
    parser.add_argument("--vault", required=True, help="Path to local fitlibvault directory")
    parser.add_argument("--task", choices=["audit", "metadata"], default="audit")
    parser.add_argument("--model", default=None, help="Override Gemini model (default: 2.5-flash or 2.5-flash-lite)")
    parser.add_argument("--escalate-pro", action="store_true", help="Escalate flagged complex notes to gemini-2.5-pro")
    parser.add_argument("--dry-run", action="store_true", help="Estimate scope & USD cost without calling APIs")
    parser.add_argument("--pilot", type=int, default=0, help="Run synchronously on first N pending notes")
    parser.add_argument("--batch-prepare", action="store_true", help="Write Gemini Batch API JSONL file (50%% cheaper)")
    parser.add_argument("--force", action="store_true", help="Re-process notes already in manifest")
    parser.add_argument("--skip-pubmed", action="store_true", help="Skip live PubMed fetch (faster dry-run/metadata)")
    args = parser.parse_args()

    vault_dir = Path(args.vault).expanduser().resolve()
    if not vault_dir.exists():
        print(f"Vault directory not found: {vault_dir}", file=sys.stderr)
        return 1

    model = args.model or ("gemini-2.5-flash-lite" if args.task == "metadata" else "gemini-2.5-flash")
    state_dir = vault_dir / ".gemini_updater"
    staging_dir = state_dir / "staged"
    manifest_path = state_dir / "manifest.json"
    evidence_cache_path = state_dir / "evidence_cache.json"

    all_notes = collect_vault_notes(vault_dir)
    vault_basenames = {p.stem.lower() for p in all_notes}
    manifest: Dict[str, Any] = load_json_file(manifest_path, {})
    evidence_cache: Dict[str, Any] = load_json_file(evidence_cache_path, {})

    pending_notes: List[Path] = []
    for note_path in all_notes:
        content = note_path.read_text(encoding="utf-8", errors="ignore")
        digest = hashlib.sha256(f"{PROMPT_VERSION}:{args.task}:{content}".encode("utf-8")).hexdigest()[:24]
        prev = manifest.get(note_path.name)
        if not args.force and prev and prev.get("digest") == digest and prev.get("status") == "verified":
            continue
        pending_notes.append(note_path)

    if args.dry_run:
        std_est = estimate_cost(pending_notes, model, batch=False)
        batch_est = estimate_cost(pending_notes, model, batch=True)
        print(json.dumps({
            "vault": str(vault_dir),
            "total_vault_notes": len(all_notes),
            "already_verified_skipped": len(all_notes) - len(pending_notes),
            "pending_notes": len(pending_notes),
            "standard_estimate": std_est,
            "batch_api_estimate": batch_est,
        }, indent=2))
        return 0

    system_instruction = build_system_instruction(args.task)

    if args.batch_prepare:
        state_dir.mkdir(parents=True, exist_ok=True)
        jsonl_path = state_dir / f"gemini_batch_{args.task}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        target_notes = pending_notes[: args.pilot] if args.pilot > 0 else pending_notes
        lines: List[str] = []
        for idx, note_path in enumerate(target_notes, 1):
            note_text = note_path.read_text(encoding="utf-8", errors="ignore")
            prefix = note_path.stem[:1].upper()
            evidence = [] if args.skip_pubmed else fetch_pubmed_evidence(note_path.stem, prefix, evidence_cache)
            existing_dois, _ = extract_existing_dois_and_pmids(note_text)
            valid_dois = []
            if not args.skip_pubmed:
                for doi in sorted(existing_dois)[:8]:
                    if verify_doi_crossref(doi, evidence_cache):
                        valid_dois.append(doi)
            prompt = build_user_prompt(note_path.name, note_text, evidence, valid_dois)
            request_entry = {
                "key": note_path.name,
                "request": {
                    "system_instruction": {"parts": [{"text": system_instruction}]},
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generation_config": {"temperature": 0.2, "response_mime_type": "application/json"},
                },
            }
            lines.append(json.dumps(request_entry))
            if idx % 20 == 0:
                atomic_write_text(evidence_cache_path, json.dumps(evidence_cache))
                print(f"Prepared {idx}/{len(target_notes)} batch requests...")

        atomic_write_text(evidence_cache_path, json.dumps(evidence_cache))
        atomic_write_text(jsonl_path, "\n".join(lines) + "\n")
        print(f"Wrote {len(lines)} grounded Batch API requests -> {jsonl_path}")
        print("Upload this JSONL file to the Gemini Batch API for 50% off token pricing.")
        return 0

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("Set GEMINI_API_KEY before running live updates (or use --dry-run / --batch-prepare).", file=sys.stderr)
        return 1

    target_notes = pending_notes[: args.pilot] if args.pilot > 0 else pending_notes[:10]
    print(f"Running grounded Gemini updater on {len(target_notes)} note(s) with {model}...")

    totals = {"ok": 0, "failed": 0, "escalated_pro": 0, "input_tokens": 0, "output_tokens": 0}
    for note_path in target_notes:
        print(f"-> {note_path.name}")
        note_text = note_path.read_text(encoding="utf-8", errors="ignore")
        digest = hashlib.sha256(f"{PROMPT_VERSION}:{args.task}:{note_text}".encode("utf-8")).hexdigest()[:24]
        prefix = note_path.stem[:1].upper()

        evidence = [] if args.skip_pubmed else fetch_pubmed_evidence(note_path.stem, prefix, evidence_cache)
        existing_dois, existing_pmids = extract_existing_dois_and_pmids(note_text)
        valid_existing_dois: Set[str] = set()
        if not args.skip_pubmed:
            for doi in existing_dois:
                if verify_doi_crossref(doi, evidence_cache):
                    valid_existing_dois.add(doi.lower())

        allowed_dois = valid_existing_dois | {s.doi.lower() for s in evidence if s.doi}
        allowed_pmids = existing_pmids | {s.pmid for s in evidence if s.pmid}
        prompt = build_user_prompt(note_path.name, note_text, evidence, sorted(valid_existing_dois))

        try:
            result, usage = call_gemini(api_key, model, system_instruction, prompt)
            totals["input_tokens"] += usage["input_tokens"]
            totals["output_tokens"] += usage["output_tokens"]

            if args.task == "audit" and args.escalate_pro and result.get("needs_pro_review"):
                print(f"   Escalating to gemini-2.5-pro: {result.get('pro_review_reason')}")
                result, pro_usage = call_gemini(api_key, "gemini-2.5-pro", system_instruction, prompt, temperature=0.15)
                totals["input_tokens"] += pro_usage["input_tokens"]
                totals["output_tokens"] += pro_usage["output_tokens"]
                totals["escalated_pro"] += 1

            if args.task == "audit":
                updated_md = str(result.get("updated_markdown", ""))
                passed, gate_errors = verify_output_gates(updated_md, allowed_dois, allowed_pmids, vault_basenames)
                if not passed:
                    raise RuntimeError("Quality gate rejected output: " + "; ".join(gate_errors))
                atomic_write_text(staging_dir / note_path.name, updated_md)
            else:
                atomic_write_text(staging_dir / f"{note_path.stem}.meta.json", json.dumps(result, indent=2))

            manifest[note_path.name] = {
                "digest": digest,
                "status": "verified",
                "model": model,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "evidence_count": len(evidence),
            }
            totals["ok"] += 1
        except Exception as err:
            print(f"   [FAILED] {err}", file=sys.stderr)
            manifest[note_path.name] = {
                "digest": digest,
                "status": "failed",
                "error": str(err)[:300],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            totals["failed"] += 1

        atomic_write_text(manifest_path, json.dumps(manifest, indent=2))
        atomic_write_text(evidence_cache_path, json.dumps(evidence_cache))

    print("\nRun Summary:", json.dumps(totals, indent=2))
    print(f"Staged verified outputs in: {staging_dir}")
    return 0 if totals["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
