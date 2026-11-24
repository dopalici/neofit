import React from "react";

export default function ScanlineEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent opacity-30 scanlines" />
    </div>
  );
}
