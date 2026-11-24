import React from "react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`rounded-xl px-3.5 py-3 text-sm font-sans leading-relaxed border ${
        isUser
          ? "bg-cyan-950/50 border-cyan-500/35 text-slate-100 ml-8"
          : "nv-surface-subtle border-l-2 border-l-cyan-400 text-slate-200 mr-6"
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
      {message.references && message.references.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Grounded Sources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {message.references.map((ref, i) => (
              <span
                key={i}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-cyan-300 border border-slate-800"
              >
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}