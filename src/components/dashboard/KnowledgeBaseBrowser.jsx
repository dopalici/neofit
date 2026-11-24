// src/components/dashboard/KnowledgeBaseBrowser.jsx
import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Dumbbell, ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";
import {
  getKnowledgeBase,
  getKnowledgeBaseStats,
  getPersonalizedRecommendations,
  loadDefaultKnowledgeBase,
  searchKnowledge,
} from "../../services/knowledgeBaseService";

export default function KnowledgeBaseBrowser({
  userData,
  initialEntryId,
  onNavigateToWorkouts,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entriesMap, setEntriesMap] = useState({});
  const [kbStats, setKbStats] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadDefaultKnowledgeBase()
      .then((kb) => {
        if (!active) return;
        const resolved = kb && Object.keys(kb).length > 0 ? kb : getKnowledgeBase();
        setEntriesMap(resolved || {});
        setKbStats(getKnowledgeBaseStats());
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Jump directly to a specific FitLib node ID when navigated from a Goal Rung or Daily Quest
  useEffect(() => {
    if (initialEntryId && entriesMap[initialEntryId]) {
      setSelectedEntry(entriesMap[initialEntryId]);
      setSelectedCategory("All");
    }
  }, [initialEntryId, entriesMap]);

  const categories = useMemo(() => {
    const cats = [
      ...new Set(
        Object.values(entriesMap)
          .map((e) => e?.category)
          .filter(Boolean)
      ),
    ];
    return ["All", ...cats.sort()];
  }, [entriesMap]);

  const recommendations = useMemo(() => {
    if (Object.keys(entriesMap).length === 0) return [];
    return getPersonalizedRecommendations(userData || {}, 3);
  }, [entriesMap, userData]);

  const displayedEntries = useMemo(() => {
    const allEntries = Object.values(entriesMap);
    if (query.trim()) {
      const results = searchKnowledge(query.trim(), 35);
      return results
        .map((r) => entriesMap[r.id])
        .filter((e) => e && (selectedCategory === "All" || e.category === selectedCategory));
    }
    return allEntries
      .filter((e) => selectedCategory === "All" || e.category === selectedCategory)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)))
      .slice(0, 50);
  }, [entriesMap, query, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-900 border border-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
          <div className="md:col-span-2 h-64 bg-slate-900 border border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalCount = Object.keys(entriesMap).length;
  const totalCitations = kbStats?.totalCitations || 0;

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-[#0b1520] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center">
            <BookOpen size={18} className="text-cyan-400 mr-2" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                FITLIB VAULT — VERIFIED EVIDENCE KNOWLEDGE BASE
              </h2>
              <p className="text-xs text-slate-400">
                Decoupled runtime bundle synced from dopalici/fitlibvault
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
              {totalCount} NOTES
            </span>
            {totalCitations > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 flex items-center">
                <ShieldCheck size={12} className="mr-1" />
                {totalCitations} CITATIONS
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search calisthenics, vertical jump, VO2 max, HRV, sleep, protein..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-[#0b1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-mono text-cyan-400 mb-3 flex items-center">
            <Sparkles size={14} className="mr-1.5 text-amber-400" />
            RECOMMENDED FOR YOUR CURRENT METRICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => setSelectedEntry(entriesMap[rec.id] || rec)}
                className="text-left p-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 rounded-lg transition-colors"
              >
                <p className="text-xs font-semibold text-slate-100">{rec.title}</p>
                <p className="text-[11px] text-slate-400 mt-1">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results List + Note Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#0b1520] border border-slate-800 rounded-xl p-4 max-h-[65vh] overflow-y-auto space-y-2">
          {displayedEntries.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 text-center py-8">
              No notes match your search.
            </p>
          ) : (
            displayedEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedEntry?.id === entry.id
                    ? "bg-cyan-950/50 border-cyan-400"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-100 leading-snug">
                    {entry.title}
                  </p>
                  {entry.citationCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      {entry.citationCount} ref
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  {entry.category || "General"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-[#0b1520] border border-slate-800 rounded-xl p-6 max-h-[65vh] overflow-y-auto">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                      {selectedEntry.category || "FitLib"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {selectedEntry.id}
                    </span>
                    {selectedEntry.updated && (
                      <span className="text-[10px] font-mono text-slate-500">
                        Updated: {selectedEntry.updated}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mt-2">
                    {selectedEntry.title}
                  </h3>
                </div>
                {onNavigateToWorkouts &&
                  (selectedEntry.category === "Exercise Library" ||
                    selectedEntry.category === "Strength & Hypertrophy" ||
                    selectedEntry.category === "Sports & Physical Skills") && (
                    <button
                      type="button"
                      onClick={onNavigateToWorkouts}
                      className="px-3 py-1.5 text-xs font-mono bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 rounded-lg flex items-center"
                    >
                      <Dumbbell size={13} className="mr-1.5" /> LOG WORKOUT
                    </button>
                  )}
              </div>

              {/* Key Points Callout */}
              {Array.isArray(selectedEntry.keyPoints) && selectedEntry.keyPoints.length > 0 && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5">
                  <p className="text-[10px] font-mono text-cyan-400 uppercase mb-2">
                    KEY EVIDENCE TAKEAWAYS
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                    {selectedEntry.keyPoints.map((pt, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Note Body */}
              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {selectedEntry.content || selectedEntry.summary}
              </div>

              {/* Verified Research Citations */}
              {Array.isArray(selectedEntry.citations) && selectedEntry.citations.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-[11px] font-mono text-emerald-400 mb-2 flex items-center">
                    <ShieldCheck size={13} className="mr-1.5" />
                    VERIFIED RESEARCH CITATIONS ({selectedEntry.citations.length})
                  </p>
                  <div className="space-y-2">
                    {selectedEntry.citations.map((cite, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200">
                            {cite.author || "Research Study"}{" "}
                            {cite.year ? `(${cite.year})` : ""}
                          </span>
                          {cite.type && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300">
                              {cite.type}
                            </span>
                          )}
                          {cite.title && (
                            <p className="text-slate-400 truncate mt-0.5">{cite.title}</p>
                          )}
                        </div>
                        {cite.doi && (
                          <a
                            href={cite.doi}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center shrink-0"
                          >
                            DOI <ExternalLink size={11} className="ml-1" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related FitLib Links */}
              {selectedEntry.links && selectedEntry.links.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-[11px] font-mono text-slate-400 mb-2">RELATED NOTES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.links.map((link) => (
                      <button
                        key={link}
                        type="button"
                        onClick={() => {
                          const match =
                            entriesMap[link] ||
                            Object.values(entriesMap).find(
                              (e) =>
                                e.title.toLowerCase() === link.toLowerCase() ||
                                e.id.toLowerCase() === link.toLowerCase()
                            );
                          if (match) setSelectedEntry(match);
                          else setQuery(link);
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded text-cyan-300"
                      >
                        {link}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={32} className="mx-auto text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-300">
                Select a FitLib note to inspect evidence-based protocols & citations
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Every goal rung and AI coach answer links directly into this verified library.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
