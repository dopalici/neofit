# FitLib Vault -> Neofit Scientific Pipeline

This folder contains the grounded Gemini updater so you can keep `dopalici/fitlibvault` scientifically accurate at minimal cost and sync verified updates cleanly into Neofit.

## 1. Estimate Cost First (Zero Spend)
```bash
python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --dry-run
```

## 2. Run a 5-Note Grounded Pilot (Gemini 2.5 Flash + PubMed + Crossref)
```bash
export GEMINI_API_KEY="your-gemini-api-key"
python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --pilot 5 --escalate-pro
```
- Verified outputs are written safely to `<vault>/.gemini_updater/staged/` (never overwrites raw files in place).
- Any DOI or PMID not present in the grounded PubMed/Crossref brief is automatically rejected.
- Already-verified notes are tracked via SHA-256 hash in `.gemini_updater/manifest.json` so re-runs never double-bill.

## 3. Generate a 50%-Off Gemini Batch API Job for the Full Vault
```bash
python3 tools/fitlib_gemini_updater.py --vault /path/to/fitlibvault --batch-prepare
```

## 4. Sync Verified Vault Updates into Neofit
After promoting staged notes and exporting `fitlib_export.json` in `fitlibvault`:
```bash
# Sync from GitHub dopalici/fitlibvault:
npm run kb:sync

# Or sync from a local checkout:
node scripts/sync-fitlib-vault.mjs --source /path/to/fitlibvault/fitlib_export.json
```

## 5. Production AI Coach Proxy (`api/coach.js`)
Deploy `api/coach.js` (e.g. Vercel Serverless Functions) with `GEMINI_API_KEY` set in environment variables, then select **Production Proxy** in Neofit's AI Advisor settings (or set `REACT_APP_AI_PROVIDER=proxy` and `REACT_APP_AI_PROXY_URL=/api/coach`).
