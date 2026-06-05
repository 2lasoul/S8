"use client";
import { useState, useRef } from "react";

interface BrancheRef { valeur: string; couleur: string | null; }

interface Props {
  branches: BrancheRef[];
  activeBranche: string | null;
  onBrancheChange: (b: string | null) => void;
  onSearchChange: (tags: string[]) => void;
}

export default function SearchBar({ branches, activeBranche, onBrancheChange, onSearchChange }: Props) {
  const [input, setInput] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  function toggleBranche(b: string) {
    onBrancheChange(activeBranche === b ? null : b);
  }

  function removeTag(tag: string) {
    const next = activeTags.filter((t) => t !== tag);
    setActiveTags(next);
    onSearchChange(next);
  }

  function reset() {
    setActiveTags([]);
    setInput("");
    onBrancheChange(null);
    onSearchChange([]);
  }

  const hasFilter = activeBranche || activeTags.length > 0;

  return (
    <div style={s.wrap}>
      {/* Filtres branche */}
      <div style={s.row}>
        <button
          onClick={() => { onBrancheChange(null); }}
          style={{ ...s.chip, ...(activeBranche === null ? s.chipActive : {}) }}>
          Toutes
        </button>
        {branches.map((b) => {
          const isActive = activeBranche === b.valeur;
          const color = b.couleur ?? "#888";
          return (
            <button key={b.valeur} onClick={() => toggleBranche(b.valeur)}
              style={{
                ...s.chip,
                background: isActive ? color + "33" : "transparent",
                borderColor: isActive ? color : "#333",
                color: isActive ? color : "#888",
              }}>
              <span style={{ ...s.dot, background: color }} />
              {b.valeur}
            </button>
          );
        })}

        {hasFilter && (
          <button onClick={reset} style={s.resetBtn}>✕ Réinitialiser</button>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  row: { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  chip: { display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "5px 14px", borderRadius: "20px", border: "1px solid #333",
    background: "transparent", color: "#888", cursor: "pointer",
    fontSize: "0.85rem", transition: "all 0.15s" },
  chipActive: { background: "#ffffff18", borderColor: "#aaa", color: "#fff" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" },
  resetBtn: { marginLeft: "0.5rem", background: "none", border: "none",
    color: "#555", cursor: "pointer", fontSize: "0.82rem" },
};
