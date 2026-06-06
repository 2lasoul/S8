"use client";
import { useState, useRef, useEffect } from "react";

interface BrancheRef { valeur: string; couleur: string | null; }
interface RefEntry { valeur: string; categorie: string; }

interface ActiveFilter {
  valeur: string;
  categorie: "personne" | "lieu" | "evenement" | "branche";
}

interface Props {
  branches: BrancheRef[];
  activeBranche: string | null;
  onBrancheChange: (b: string | null) => void;
  onFilterChange: (filter: ActiveFilter | null) => void;
  activeFilter: ActiveFilter | null;
}

const CAT_LABEL: Record<string, string> = {
  personne: "Personne", lieu: "Lieu", evenement: "Événement", branche: "Branche",
};
const CAT_COLOR: Record<string, string> = {
  personne: "#6ab0f5", lieu: "#6af5a9", evenement: "#f5a96a", branche: "#c09af5",
};

export default function SearchBar({ branches, activeBranche, onBrancheChange, onFilterChange, activeFilter }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<RefEntry[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplétion depuis le référentiel
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(async () => {
      const res = await fetch("/api/referentiel");
      if (!res.ok) return;
      const all: RefEntry[] = await res.json();
      const q = input.toLowerCase();
      setSuggestions(
        all.filter((e) => e.valeur.toLowerCase().includes(q)).slice(0, 8)
      );
    }, 250);
  }, [input]);

  function selectSuggestion(entry: RefEntry) {
    onFilterChange({ valeur: entry.valeur, categorie: entry.categorie as ActiveFilter["categorie"] });
    setInput("");
    setSuggestions([]);
    setOpen(false);
  }

  function reset() {
    onFilterChange(null);
    onBrancheChange(null);
    setInput("");
  }

  const hasFilter = activeBranche || activeFilter;

  return (
    <div style={s.wrap}>
      {/* Barre de recherche */}
      <div style={s.searchRow}>
        <div style={s.inputWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Rechercher une personne, un lieu, un événement…"
            style={s.input}
          />
          {input && (
            <button onClick={() => setInput("")} style={s.clearBtn}>✕</button>
          )}
          {/* Dropdown suggestions */}
          {open && suggestions.length > 0 && (
            <div style={s.dropdown}>
              {suggestions.map((e) => (
                <div key={`${e.categorie}:${e.valeur}`}
                  style={s.suggItem}
                  onMouseDown={() => selectSuggestion(e)}>
                  <span style={{ ...s.catBadge, color: CAT_COLOR[e.categorie] ?? "#888",
                    background: (CAT_COLOR[e.categorie] ?? "#888") + "22" }}>
                    {CAT_LABEL[e.categorie] ?? e.categorie}
                  </span>
                  <span style={s.suggValeur}>{e.valeur}</span>
                </div>
              ))}
            </div>
          )}
          {open && input && suggestions.length === 0 && (
            <div style={s.dropdown}>
              <div style={s.noResult}>Aucun tag correspondant dans les archives</div>
            </div>
          )}
        </div>

        {hasFilter && (
          <button onClick={reset} style={s.resetBtn}>✕ Réinitialiser</button>
        )}
      </div>

      {/* Filtre actif (tag recherché) */}
      {activeFilter && (
        <div style={s.activeFilterRow}>
          <span style={s.activeFilterLabel}>Filtre actif :</span>
          <span style={{ ...s.activeFilterTag,
            color: CAT_COLOR[activeFilter.categorie] ?? "#888",
            background: (CAT_COLOR[activeFilter.categorie] ?? "#888") + "22",
            borderColor: (CAT_COLOR[activeFilter.categorie] ?? "#888") + "55",
          }}>
            {CAT_LABEL[activeFilter.categorie]} · {activeFilter.valeur}
            <button onClick={() => onFilterChange(null)} style={s.tagX}>✕</button>
          </span>
        </div>
      )}

      {/* Filtres branche */}
      <div style={s.brancheRow}>
        <button onClick={() => onBrancheChange(null)}
          style={{ ...s.chip, ...(activeBranche === null && !activeFilter ? s.chipActive : {}) }}>
          Toutes
        </button>
        {branches.map((b) => {
          const isActive = activeBranche === b.valeur;
          const color = b.couleur ?? "#888";
          return (
            <button key={b.valeur}
              onClick={() => { onBrancheChange(isActive ? null : b.valeur); onFilterChange(null); }}
              style={{ ...s.chip,
                background: isActive ? color + "33" : "transparent",
                borderColor: isActive ? color : "#333",
                color: isActive ? color : "#666",
              }}>
              <span style={{ ...s.dot, background: color }} />
              {b.valeur}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  searchRow: { display: "flex", gap: "0.75rem", alignItems: "center" },
  inputWrap: { position: "relative", flex: 1 },
  searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
    fontSize: "0.85rem", pointerEvents: "none" },
  input: { width: "100%", padding: "0.6rem 2.5rem 0.6rem 2.25rem", borderRadius: "6px",
    border: "1px solid #2a2a2a", background: "#161616", color: "#fff",
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  clearBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.85rem" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px",
    marginTop: "4px", overflow: "hidden", boxShadow: "0 8px 24px #00000088" },
  suggItem: { display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #222" },
  catBadge: { fontSize: "0.72rem", padding: "1px 7px", borderRadius: "8px",
    whiteSpace: "nowrap", fontWeight: 500 },
  suggValeur: { fontSize: "0.88rem", color: "#ccc" },
  noResult: { padding: "0.75rem", fontSize: "0.85rem", color: "#555", fontStyle: "italic" },
  activeFilterRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  activeFilterLabel: { fontSize: "0.8rem", color: "#555" },
  activeFilterTag: { display: "inline-flex", alignItems: "center", gap: "6px",
    fontSize: "0.82rem", padding: "3px 10px", borderRadius: "12px",
    border: "1px solid transparent" },
  tagX: { background: "none", border: "none", color: "inherit",
    cursor: "pointer", fontSize: "0.8rem", padding: 0, opacity: 0.7 },
  brancheRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  chip: { display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "4px 12px", borderRadius: "20px", border: "1px solid #2a2a2a",
    background: "transparent", color: "#666", cursor: "pointer", fontSize: "0.82rem" },
  chipActive: { background: "#ffffff18", borderColor: "#aaa", color: "#fff" },
  dot: { width: "7px", height: "7px", borderRadius: "50%" },
  resetBtn: { background: "none", border: "none", color: "#555",
    cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap" },
};
