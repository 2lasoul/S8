"use client";
import { useState, useRef, useEffect } from "react";
import type { ActiveFilters } from "../page";

interface BrancheRef { valeur: string; couleur: string | null; }
interface RefEntry { id: number; valeur: string; categorie: string; }

interface Props {
  branches: BrancheRef[];
  activeBranche: string | null;
  filters: ActiveFilters;
  onBrancheChange: (b: string | null) => void;
  onFiltersChange: (f: ActiveFilters) => void;
  onReset: () => void;
}

const CAT_COLOR: Record<string, string> = {
  personne: "#6ab0f5", lieu: "#6af5a9", evenement: "#f5a96a", branche: "#c09af5",
};
const CAT_LABEL: Record<string, string> = {
  personne: "Personne", lieu: "Lieu", evenement: "Événement", branche: "Branche",
};

function FilterSelect({
  label, categorie, value, referentiel, onChange,
}: {
  label: string; categorie: string; value: string;
  referentiel: RefEntry[]; onChange: (v: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const color = CAT_COLOR[categorie] ?? "#888";

  const suggestions = referentiel.filter(
    (e) => e.categorie === categorie &&
      e.valeur.toLowerCase().includes(input.toLowerCase())
  );

  useEffect(() => { setInput(value); }, [value]);

  function select(v: string) {
    setInput(v);
    onChange(v);
    setOpen(false);
  }

  function clear() {
    setInput("");
    onChange("");
  }

  return (
    <div style={fs.wrap}>
      <label style={{ ...fs.label, color }}>{label}</label>
      <div style={fs.inputWrap}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={`Filtrer par ${label.toLowerCase()}…`}
          style={{ ...fs.input, borderColor: value ? color + "88" : "#2a2a2a" }}
        />
        {value && (
          <button onClick={clear} style={fs.clearBtn}>✕</button>
        )}
        {open && suggestions.length > 0 && (
          <div style={fs.dropdown}>
            {suggestions.map((e) => (
              <div key={e.id} style={fs.item} onMouseDown={() => select(e.valeur)}>
                {e.valeur}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const fs: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  label: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em" },
  inputWrap: { position: "relative" },
  input: { width: "100%", padding: "0.5rem 0.75rem", borderRadius: "4px",
    border: "1px solid #2a2a2a", background: "#161616", color: "#fff",
    fontSize: "0.85rem", outline: "none", boxSizing: "border-box" },
  clearBtn: { position: "absolute", right: "8px", top: "50%",
    transform: "translateY(-50%)", background: "none", border: "none",
    color: "#555", cursor: "pointer", fontSize: "0.8rem" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300,
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px",
    maxHeight: "160px", overflowY: "auto", marginTop: "2px" },
  item: { padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.85rem",
    color: "#ccc", borderBottom: "1px solid #222" },
};

export default function SearchBar({ branches, activeBranche, filters, onBrancheChange, onFiltersChange, onReset }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<RefEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allRef, setAllRef] = useState<RefEntry[]>([]);
  const [advFilters, setAdvFilters] = useState<ActiveFilters>(filters);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement du référentiel complet pour le filtre avancé
  useEffect(() => {
    fetch("/api/referentiel").then((r) => r.json()).then(setAllRef);
  }, []);

  useEffect(() => { setAdvFilters(filters); }, [JSON.stringify(filters)]);

  // Autocomplétion recherche simple
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => {
      const q = input.toLowerCase();
      setSuggestions(allRef.filter((e) => e.valeur.toLowerCase().includes(q)).slice(0, 8));
    }, 200);
  }, [input, allRef]);

  function selectQuick(entry: RefEntry) {
    onFiltersChange({ [entry.categorie]: entry.valeur });
    setInput(""); setSuggestions([]); setOpen(false);
  }

  function applyAdvanced() {
    const hasAny = !!(advFilters.personne || advFilters.lieu || advFilters.evenement);
    if (hasAny) onFiltersChange(advFilters);
    setShowAdvanced(false);
  }

  function resetAdvanced() {
    setAdvFilters({});
    onReset();
    setShowAdvanced(false);
  }

  const hasFilter = !!(activeBranche || filters.personne || filters.lieu || filters.evenement);
  const activeFilterCount = [filters.personne, filters.lieu, filters.evenement].filter(Boolean).length;

  return (
    <div style={s.wrap}>
      {/* Ligne principale : recherche + bouton avancé */}
      <div style={s.searchRow}>
        <div style={s.inputWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Rechercher une personne, un lieu, un événement…"
            style={s.input}
          />
          {input && <button onClick={() => setInput("")} style={s.clearBtn}>✕</button>}
          {open && suggestions.length > 0 && (
            <div style={s.dropdown}>
              {suggestions.map((e) => (
                <div key={`${e.categorie}:${e.valeur}`} style={s.suggItem}
                  onMouseDown={() => selectQuick(e)}>
                  <span style={{ ...s.catBadge,
                    color: CAT_COLOR[e.categorie] ?? "#888",
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
              <div style={s.noResult}>Aucun tag correspondant</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          style={{ ...s.btnAdvanced, ...(showAdvanced || activeFilterCount > 0 ? s.btnAdvancedActive : {}) }}>
          ⚙ Filtre avancé {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
        </button>

        {hasFilter && (
          <button onClick={onReset} style={s.resetBtn}>✕ Réinitialiser</button>
        )}
      </div>

      {/* Filtres actifs (badges) */}
      {(filters.personne || filters.lieu || filters.evenement) && (
        <div style={s.activeRow}>
          {(["personne", "lieu", "evenement"] as const).map((cat) => filters[cat] && (
            <span key={cat} style={{ ...s.activeBadge,
              color: CAT_COLOR[cat], background: CAT_COLOR[cat] + "22",
              borderColor: CAT_COLOR[cat] + "55" }}>
              {CAT_LABEL[cat]} · {filters[cat]}
              <button onClick={() => onFiltersChange({ ...filters, [cat]: undefined })}
                style={s.badgeX}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Panneau filtre avancé */}
      {showAdvanced && (
        <div style={s.advPanel}>
          <p style={s.advTitle}>Combiner plusieurs critères (ET logique)</p>
          <div style={s.advFields}>
            <FilterSelect label="Personne" categorie="personne"
              value={advFilters.personne ?? ""}
              referentiel={allRef}
              onChange={(v) => setAdvFilters((f) => ({ ...f, personne: v || undefined }))} />
            <FilterSelect label="Lieu" categorie="lieu"
              value={advFilters.lieu ?? ""}
              referentiel={allRef}
              onChange={(v) => setAdvFilters((f) => ({ ...f, lieu: v || undefined }))} />
            <FilterSelect label="Événement" categorie="evenement"
              value={advFilters.evenement ?? ""}
              referentiel={allRef}
              onChange={(v) => setAdvFilters((f) => ({ ...f, evenement: v || undefined }))} />
          </div>
          <div style={s.advActions}>
            <button onClick={resetAdvanced} style={s.btnReset}>Réinitialiser</button>
            <button onClick={applyAdvanced}
              disabled={!advFilters.personne && !advFilters.lieu && !advFilters.evenement}
              style={s.btnApply}>
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Chips branche */}
      <div style={s.brancheRow}>
        <button onClick={() => onBrancheChange(null)}
          style={{ ...s.chip, ...(activeBranche === null && !hasFilter ? s.chipActive : {}) }}>
          Toutes
        </button>
        {branches.map((b) => {
          const isActive = activeBranche === b.valeur;
          const color = b.couleur ?? "#888";
          return (
            <button key={b.valeur}
              onClick={() => { onBrancheChange(isActive ? null : b.valeur); }}
              style={{ ...s.chip,
                background: isActive ? color + "33" : "transparent",
                borderColor: isActive ? color : "#2a2a2a",
                color: isActive ? color : "#666" }}>
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
  searchIcon: { position: "absolute", left: "12px", top: "50%",
    transform: "translateY(-50%)", fontSize: "0.85rem", pointerEvents: "none" },
  input: { width: "100%", padding: "0.6rem 2.5rem 0.6rem 2.25rem", borderRadius: "6px",
    border: "1px solid #2a2a2a", background: "#161616", color: "#fff",
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  clearBtn: { position: "absolute", right: "10px", top: "50%",
    transform: "translateY(-50%)", background: "none", border: "none",
    color: "#555", cursor: "pointer", fontSize: "0.85rem" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px",
    marginTop: "4px", overflow: "hidden", boxShadow: "0 8px 24px #00000088" },
  suggItem: { display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #222" },
  catBadge: { fontSize: "0.72rem", padding: "1px 7px", borderRadius: "8px",
    whiteSpace: "nowrap", fontWeight: 500 },
  suggValeur: { fontSize: "0.88rem", color: "#ccc" },
  noResult: { padding: "0.75rem", fontSize: "0.85rem", color: "#555", fontStyle: "italic" },
  btnAdvanced: { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #2a2a2a",
    background: "transparent", color: "#666", cursor: "pointer",
    fontSize: "0.82rem", whiteSpace: "nowrap" },
  btnAdvancedActive: { borderColor: "#4a9eff88", color: "#4a9eff", background: "#4a9eff11" },
  resetBtn: { background: "none", border: "none", color: "#555",
    cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap" },
  activeRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  activeBadge: { display: "inline-flex", alignItems: "center", gap: "6px",
    fontSize: "0.82rem", padding: "3px 10px", borderRadius: "12px",
    border: "1px solid transparent" },
  badgeX: { background: "none", border: "none", color: "inherit",
    cursor: "pointer", fontSize: "0.8rem", padding: 0, opacity: 0.7 },
  advPanel: { background: "#141414", border: "1px solid #2a2a2a", borderRadius: "8px",
    padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" },
  advTitle: { fontSize: "0.8rem", color: "#555", margin: 0 },
  advFields: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
  advActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem" },
  btnReset: { padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #333",
    background: "transparent", color: "#888", cursor: "pointer", fontSize: "0.85rem" },
  btnApply: { padding: "0.5rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold",
    cursor: "pointer", fontSize: "0.85rem" },
  brancheRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  chip: { display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "4px 12px", borderRadius: "20px", border: "1px solid #2a2a2a",
    background: "transparent", color: "#666", cursor: "pointer", fontSize: "0.82rem" },
  chipActive: { background: "#ffffff18", borderColor: "#aaa", color: "#fff" },
  dot: { width: "7px", height: "7px", borderRadius: "50%" },
};
