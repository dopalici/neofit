// src/components/dashboard/KnowledgeBaseBrowser.jsx
import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Dumbbell, Search, Sparkles } from "lucide-react";
import {
  getKnowledgeBase,
  getPersonalizedRecommendations,
  loadDefaultKnowledgeBase,
  searchKnowledge,
} from "../../services/knowledgeBaseService";

export default function KnowledgeBaseBrowser({ userData, onNavigateToWorkouts }) {
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entriesMap, setEntriesMap] = useState({});

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadDefaultKnowledgeBase()
      .then((kb) => {
        if (!active) return;
        const resolved = kb && Object.keys(kb).length > 0 ? kb : getKnowledgeBase();
        setEntriesMap(resolved || {});
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
      const results = searchKnowledge(query.trim(), 30);
      return results
        .map((r) => entriesMap[r.id])
        .filter((e) => e && (selectedCategory === "All" || e.category === selectedCategory));
    }
    return allEntries
      .filter((e) => selectedCategory === "All" || e.category === selectedCategory)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)))
      .slice(0, 40);
  }, [entriesMap, query, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-900 border border-cyan-900 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-gray-900 border border-cyan-900 rounded"></div>
          <div className="md:col-span-2 h-64 bg-gray-900 border border-cyan-900 rounded"></div>
        </div>
      </div>
    );
  }

  const totalCount = Object.keys(entriesMap).length;

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-gray-900 border border-cyan-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center">
            <BookOpen size={18} className="text-cyan-400 mr-2" />
            <h2 className="text-lg font-mono text-cyan-300">
              FITLIB EVIDENCE-BASED KNOWLEDGE BASE
            </h2>
          </div>
          <span className="text-xs font-mono text-cyan-500">
            {totalCount} INDEXED NOTES
          </span>
        </div>

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-2.5 text-cyan-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hypertrophy, VO2 max, sleep, protein, squats..."
            className="w-full bg-gray-950 border border-cyan-800 rounded pl-9 pr-3 py-2 text-sm font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                selectedCategory === cat
                  ? "bg-cyan-900/70 border-cyan-400 text-cyan-200"
                  : "bg-gray-950 border-cyan-900 text-cyan-600 hover:text-cyan-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-5">
          <h3 className="text-xs font-mono text-cyan-400 mb-3 flex items-center">
            <Sparkles size={14} className="mr-1.5 text-yellow-400" />
            RECOMMENDED FOR YOUR CURRENT METRICS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => setSelectedEntry(entriesMap[rec.id] || rec)}
                className="text-left p-3 bg-gray-950 border border-cyan-900 hover:border-cyan-500 rounded transition-colors"
              >
                <p className="text-xs font-mono text-cyan-300 font-bold">{rec.title}</p>
                <p className="text-[11px] font-mono text-cyan-600 mt-1">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results List + Note Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {displayedEntries.length === 0 ? (
            <p className="text-xs font-mono text-cyan-600 text-center py-8">
              No notes match your search.
            </p>
          ) : (
            displayedEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedEntry?.id === entry.id
                    ? "bg-cyan-950/60 border-cyan-400"
                    : "bg-gray-950 border-cyan-900/70 hover:border-cyan-600"
                }`}
              >
                <p className="text-xs font-mono text-cyan-300 font-bold">{entry.title}</p>
                <p className="text-[10px] font-mono text-cyan-600 mt-0.5">
                  {entry.category || "General"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-cyan-800 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cyan-900 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedEntry.category || "FitLib"}
                  </span>
                  <h3 className="text-lg font-mono text-cyan-200 font-bold mt-2">
                    {selectedEntry.title}
                  </h3>
                </div>
                {onNavigateToWorkouts &&
                  (selectedEntry.category === "Exercise Library" ||
                    selectedEntry.category === "Resistance Training") && (
                    <button
                      type="button"
                      onClick={onNavigateToWorkouts}
                      className="px-3 py-1.5 text-xs font-mono bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 rounded flex items-center"
                    >
                      <Dumbbell size={13} className="mr-1.5" /> LOG WORKOUT
                    </button>
                  )}
              </div>

              <div className="text-xs font-mono text-cyan-100 whitespace-pre-wrap leading-relaxed">
                {selectedEntry.content || selectedEntry.summary}
              </div>

              {selectedEntry.links && selectedEntry.links.length > 0 && (
                <div className="pt-3 border-t border-cyan-900">
                  <p className="text-[11px] font-mono text-cyan-500 mb-2">RELATED NOTES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.links.map((link) => (
                      <button
                        key={link}
                        type="button"
                        onClick={() => {
                          const match = Object.values(entriesMap).find(
                            (e) =>
                              e.title.toLowerCase() === link.toLowerCase() ||
                              e.id.toLowerCase() === link.toLowerCase()
                          );
                          if (match) setSelectedEntry(match);
                          else setQuery(link);
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 bg-gray-950 border border-cyan-900 hover:border-cyan-500 rounded text-cyan-400"
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
              <BookOpen size={32} className="mx-auto text-cyan-700 mb-3" />
              <p className="text-sm font-mono text-cyan-500">
                SELECT A NOTE TO READ EVIDENCE-BASED PROTOCOLS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
