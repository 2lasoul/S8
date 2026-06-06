"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Cooccurrence {
  valeur: string;
  categorie: string;
  count: number;
}

interface Props {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  // Pour les co-occurrences : tags déjà saisis dans les AUTRES champs du même formulaire
  otherTags?: string[];
  // Catégorie de ce champ (pour filtrer les co-occurrences pertinentes)
  categorie?: "personne" | "evenement" | "lieu" | "branche";
}

export default function TagInput({ label, value, onChange, suggestions, otherTags = [], categorie }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [cooc, setCooc] = useState<Cooccurrence[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cherche les co-occurrences dès qu'un tag est saisi dans un autre champ
  useEffect(() => {
    if (otherTags.length === 0) { setCooc([]); return; }
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(async () => {
      // Une seule requête avec le premier tag le plus significatif
      const tag = otherTags[0];
      const res = await fetch(
        `/api/referentiel/cooccurrences?valeur=${encodeURIComponent(tag)}${categorie ? `&categorie=${categorie}` : ""}`
      );
      if (!res.ok) return;
      const data: Cooccurrence[] = await res.json();
      setCooc(data.filter((d) => !value.includes(d.valeur)).slice(0, 6));
    }, 600);
  }, [otherTags.join(","), value.join(",")]);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );
  const showAdd = input.trim() && !suggestions.includes(input.trim()) && !value.includes(input.trim());

  // Co-occurrences non déjà présentes dans les suggestions filtrées
  const coocFiltered = cooc.filter(
    (c) => !value.includes(c.valeur) && c.valeur.toLowerCase().includes(input.toLowerCase())
  );

  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault(); addTag(input);
    } else if (e.key === "Tab" && input.trim()) {
      e.preventDefault(); addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const showDropdown = open && (filtered.length > 0 || showAdd || coocFiltered.length > 0);

  return (
    <div style={s.wrapper}>
      <label style={s.label}>{label}</label>
      <div style={s.box} onClick={() => inputRef.current?.focus()}>
        {value.map((t) => (
          <span key={t} style={s.tag}>
            {t}
            <button type="button" onClick={() => removeTag(t)} style={s.tagX}>×</button>
          </span>
        ))}
        <div style={{ position: "relative", flex: 1, minWidth: "120px" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onKeyDown={handleKey}
            onFocus={() => setOpen(true)}
            onBlur={() => { setTimeout(() => { if (input.trim()) addTag(input); setOpen(false); }, 150); }}
            style={s.input}
            placeholder={value.length ? "" : "Saisir…"}
          />
          {showDropdown && (
            <div style={s.dropdown}>
              {/* Co-occurrences en premier */}
              {coocFiltered.map((c) => (
                <div key={`cooc-${c.valeur}`} style={s.coocItem} onMouseDown={() => addTag(c.valeur)}>
                  <span>{c.valeur}</span>
                  <span style={s.coocBadge}>↔ {c.count}x</span>
                </div>
              ))}
              {/* Séparateur si co-occurrences + suggestions */}
              {coocFiltered.length > 0 && filtered.length > 0 && (
                <div style={s.separator} />
              )}
              {/* Suggestions classiques */}
              {filtered.map((v) => (
                <div key={v} style={s.item} onMouseDown={() => addTag(v)}>{v}</div>
              ))}
              {/* Ajouter nouveau */}
              {showAdd && (
                <div style={{ ...s.item, ...s.addItem }} onMouseDown={() => addTag(input)}>
                  + Ajouter &ldquo;{input}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  label: { fontSize: "0.8rem", color: "#aaa", fontWeight: 500 },
  box: { display: "flex", flexWrap: "wrap", gap: "4px", padding: "6px 8px",
    border: "1px solid #333", borderRadius: "4px", background: "#1a1a1a",
    cursor: "text", minHeight: "38px", alignItems: "center" },
  tag: { display: "inline-flex", alignItems: "center", gap: "4px",
    background: "#2a2a2a", color: "#ccc", padding: "2px 8px",
    borderRadius: "12px", fontSize: "0.82rem" },
  tagX: { background: "none", border: "none", color: "#666", cursor: "pointer",
    padding: 0, fontSize: "1rem", lineHeight: 1 },
  input: { border: "none", background: "transparent", color: "#fff",
    fontSize: "0.9rem", outline: "none", width: "100%", padding: "2px 0" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
    background: "#1e1e1e", border: "1px solid #333", borderRadius: "4px",
    maxHeight: "200px", overflowY: "auto", marginTop: "2px" },
  item: { padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.88rem",
    color: "#ccc", borderBottom: "1px solid #2a2a2a" },
  addItem: { color: "#4a9eff" },
  coocItem: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.88rem",
    color: "#e0c97a", borderBottom: "1px solid #2a2a2a", background: "#1a1a00" },
  coocBadge: { fontSize: "0.72rem", color: "#888", background: "#2a2a1a",
    padding: "1px 6px", borderRadius: "8px" },
  separator: { height: "1px", background: "#333", margin: "2px 0" },
};
