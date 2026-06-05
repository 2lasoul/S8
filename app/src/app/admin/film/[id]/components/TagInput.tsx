"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
}

export default function TagInput({ label, value, onChange, suggestions }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );
  const showAdd = input.trim() && !suggestions.includes(input.trim()) && !value.includes(input.trim());

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
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Tab" && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  }

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
          {open && (filtered.length > 0 || showAdd) && (
            <div style={s.dropdown}>
              {filtered.map((s) => (
                <div key={s} style={s2.item} onMouseDown={() => addTag(s)}>{s}</div>
              ))}
              {showAdd && (
                <div style={{ ...s2.item, ...s2.addItem }} onMouseDown={() => addTag(input)}>
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
    maxHeight: "180px", overflowY: "auto", marginTop: "2px" },
};

const s2: Record<string, React.CSSProperties> = {
  item: { padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.88rem",
    color: "#ccc", borderBottom: "1px solid #2a2a2a" },
  addItem: { color: "#4a9eff" },
};
