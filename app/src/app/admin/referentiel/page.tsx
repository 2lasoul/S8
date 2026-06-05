"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type Categorie = "branche" | "personne" | "evenement" | "lieu";

interface Entry {
  id: number;
  categorie: Categorie;
  valeur: string;
  couleur: string | null;
  branche: string | null;
}

const TABS: { key: Categorie; label: string }[] = [
  { key: "branche", label: "Branches" },
  { key: "personne", label: "Personnes" },
  { key: "evenement", label: "Événements" },
  { key: "lieu", label: "Lieux" },
];

const DEFAULT_COLORS = ["#e05c5c","#e0945c","#c8a96e","#5cb85c","#5ca8e0","#7c5ce0","#e05ca8","#888888"];

export default function ReferentielPage() {
  const [tab, setTab] = useState<Categorie>("branche");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [counts, setCounts] = useState<Record<Categorie, number>>({ branche: 0, personne: 0, evenement: 0, lieu: 0 });
  const [loading, setLoading] = useState(true);
  const [newValeur, setNewValeur] = useState("");
  const [newCouleur, setNewCouleur] = useState(DEFAULT_COLORS[0]);
  const [newBranche, setNewBranche] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValeur, setEditValeur] = useState("");
  const [editCouleur, setEditCouleur] = useState<string | null>(null);
  const [editBranche, setEditBranche] = useState<string | null>(null);
  const [error, setError] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/referentiel");
    if (res.ok) {
      const all: Entry[] = await res.json();
      setEntries(all);
      setCounts({
        branche: all.filter((e) => e.categorie === "branche").length,
        personne: all.filter((e) => e.categorie === "personne").length,
        evenement: all.filter((e) => e.categorie === "evenement").length,
        lieu: all.filter((e) => e.categorie === "lieu").length,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = entries.filter((e) => e.categorie === tab);
  const branches = entries.filter((e) => e.categorie === "branche");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValeur.trim()) return;
    setAdding(true);
    setError("");
    const res = await fetch("/api/referentiel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categorie: tab,
        valeur: newValeur.trim(),
        couleur: tab === "branche" ? newCouleur : null,
        branche: tab === "personne" ? (newBranche || null) : null,
      }),
    });
    if (res.ok) {
      setNewValeur("");
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Erreur");
    }
    setAdding(false);
  }

  async function handleUpdate(entry: Entry) {
    setError("");
    const res = await fetch(`/api/referentiel/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valeur: editValeur.trim(),
        couleur: editCouleur,
        branche: entry.categorie === "personne" ? (editBranche || null) : undefined,
      }),
    });
    if (res.ok) {
      setEditId(null);
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Erreur");
    }
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Supprimer "${entry.valeur}" ?\n\nLes segments existants ne seront pas modifiés.`)) return;
    await fetch(`/api/referentiel/${entry.id}`, { method: "DELETE" });
    load();
  }

  function startEdit(entry: Entry) {
    setEditId(entry.id);
    setEditValeur(entry.valeur);
    setEditCouleur(entry.couleur);
    setEditBranche(entry.branche);
    setError("");
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.headerTitle}>Archives Super 8</h1>
        <nav style={s.nav}>
          <a href="/admin" style={s.navLink}>Films</a>
          <a href="/" style={s.navLink}>Site public</a>
        </nav>
      </header>

      <main style={s.main}>
        <h2 style={s.pageTitle}>Référentiel de tags</h2>

        {/* Onglets */}
        <div style={s.tabs}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditId(null); setError(""); }}
              style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
              {t.label}
              <span style={{ ...s.tabCount, ...(tab === t.key ? s.tabCountActive : {}) }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div style={s.content}>
          {/* Formulaire d'ajout */}
          <form onSubmit={handleAdd} style={s.addForm}>
            {tab === "branche" && (
              <div style={s.colorPicker}>
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setNewCouleur(c)}
                    style={{ ...s.colorSwatch, background: c,
                      outline: newCouleur === c ? `2px solid #fff` : "none" }} />
                ))}
                <input type="color" value={newCouleur}
                  onChange={(e) => setNewCouleur(e.target.value)}
                  style={s.colorCustom} title="Couleur personnalisée" />
                <div style={{ ...s.colorPreview, background: newCouleur }} />
                <span style={s.colorHex}>{newCouleur}</span>
              </div>
            )}
            {tab === "personne" && (
              <div style={s.brancheRow}>
                <label style={s.brancheLabel}>Branche associée</label>
                <select value={newBranche} onChange={(e) => setNewBranche(e.target.value)} style={s.select}>
                  <option value="">— Aucune —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.valeur}>{b.valeur}</option>
                  ))}
                </select>
                {newBranche && (
                  <span style={{ ...s.dot, background: branches.find(b => b.valeur === newBranche)?.couleur ?? "#888" }} />
                )}
              </div>
            )}
            <div style={s.addRow}>
              <input
                ref={newInputRef}
                value={newValeur}
                onChange={(e) => { setNewValeur(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd(e)}
                placeholder={`Nouvelle ${tab === "branche" ? "branche" : tab === "personne" ? "personne" : tab === "evenement" ? "événement" : "lieu"}…`}
                style={s.input}
              />
              <button type="submit" disabled={adding || !newValeur.trim()} style={s.btnAdd}>
                {adding ? "…" : "Ajouter"}
              </button>
            </div>
            {error && <p style={s.error}>{error}</p>}
          </form>

          {/* Liste */}
          {loading ? (
            <p style={s.empty}>Chargement…</p>
          ) : visible.length === 0 ? (
            <p style={s.empty}>Aucune entrée. Ajoutez-en une ci-dessus.</p>
          ) : (
            <div style={s.list}>
              {visible.map((entry) => (
                <div key={entry.id} style={s.item}>
                  {editId === entry.id ? (
                    /* Mode édition */
                    <div style={s.editRow}>
                      {tab === "branche" && (
                        <div style={s.colorPicker}>
                          {DEFAULT_COLORS.map((c) => (
                            <button key={c} type="button"
                              onClick={() => setEditCouleur(c)}
                              style={{ ...s.colorSwatch, background: c,
                                outline: editCouleur === c ? "2px solid #fff" : "none" }} />
                          ))}
                          <input type="color" value={editCouleur ?? "#888888"}
                            onChange={(e) => setEditCouleur(e.target.value)}
                            style={s.colorCustom} />
                        </div>
                      )}
                      {tab === "personne" && (
                        <div style={s.brancheRow}>
                          <label style={s.brancheLabel}>Branche associée</label>
                          <select value={editBranche ?? ""} onChange={(e) => setEditBranche(e.target.value || null)} style={s.select}>
                            <option value="">— Aucune —</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.valeur}>{b.valeur}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={s.addRow}>
                        <input value={editValeur}
                          onChange={(e) => setEditValeur(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate(entry)}
                          style={s.input} autoFocus />
                        <button onClick={() => handleUpdate(entry)} style={s.btnSave}>✓</button>
                        <button onClick={() => setEditId(null)} style={s.btnCancel}>✕</button>
                      </div>
                    </div>
                  ) : (
                    /* Mode lecture */
                    <div style={s.viewRow}>
                      {entry.couleur && (
                        <span style={{ ...s.dot, background: entry.couleur }} />
                      )}
                      <span style={s.valeur}>{entry.valeur}</span>
                      {entry.branche && (
                        <span style={{ ...s.brancheTag,
                          background: (branches.find(b => b.valeur === entry.branche)?.couleur ?? "#888") + "33",
                          color: branches.find(b => b.valeur === entry.branche)?.couleur ?? "#888",
                        }}>
                          {entry.branche}
                        </span>
                      )}
                      <div style={s.itemActions}>
                        <button onClick={() => startEdit(entry)} style={s.btnIcon}>✎</button>
                        <button onClick={() => handleDelete(entry)}
                          style={{ ...s.btnIcon, color: "#e07070" }}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem", height: "56px", borderBottom: "1px solid #222", background: "#0d0d0d" },
  headerTitle: { fontSize: "1rem", fontWeight: 600, margin: 0, color: "#ccc" },
  nav: { display: "flex", gap: "1.5rem" },
  navLink: { color: "#aaa", textDecoration: "none", fontSize: "0.9rem" },
  main: { maxWidth: "760px", margin: "0 auto", padding: "2rem" },
  pageTitle: { fontSize: "1.2rem", fontWeight: 600, margin: "0 0 1.5rem", color: "#fff" },
  tabs: { display: "flex", gap: "0", borderBottom: "1px solid #222", marginBottom: "1.5rem" },
  tab: { padding: "0.6rem 1.25rem", background: "none", border: "none",
    borderBottomWidth: "2px", borderBottomStyle: "solid", borderBottomColor: "transparent",
    color: "#666", cursor: "pointer", fontSize: "0.9rem",
    display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "-1px" },
  tabActive: { color: "#fff", borderBottomColor: "#4a9eff" },
  tabCount: { fontSize: "0.72rem", background: "#222", color: "#666",
    padding: "1px 6px", borderRadius: "10px" },
  tabCountActive: { background: "#1a3a5c", color: "#4a9eff" },
  content: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  addForm: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  addRow: { display: "flex", gap: "0.5rem" },
  input: { flex: 1, padding: "0.6rem 0.75rem", borderRadius: "4px",
    border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "0.9rem" },
  btnAdd: { padding: "0.6rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" },
  colorPicker: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
  colorSwatch: { width: "20px", height: "20px", borderRadius: "50%",
    border: "2px solid transparent", cursor: "pointer", padding: 0 },
  colorCustom: { width: "28px", height: "28px", border: "none", borderRadius: "4px",
    cursor: "pointer", padding: 0, background: "none" },
  colorPreview: { width: "16px", height: "16px", borderRadius: "3px" },
  colorHex: { fontSize: "0.78rem", color: "#666" },
  error: { color: "#e07070", fontSize: "0.85rem", margin: 0 },
  empty: { color: "#555", fontStyle: "italic", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: "4px" },
  item: { background: "#161616", borderRadius: "4px", padding: "0.1rem 0.5rem",
    border: "1px solid #1e1e1e" },
  viewRow: { display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.4rem 0.25rem" },
  editRow: { display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0.25rem" },
  dot: { width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0 },
  valeur: { flex: 1, fontSize: "0.9rem", color: "#ddd" },
  itemActions: { display: "flex", gap: "2px" },
  btnIcon: { background: "none", border: "none", color: "#555",
    cursor: "pointer", fontSize: "0.95rem", padding: "2px 6px" },
  btnSave: { padding: "0.4rem 0.75rem", borderRadius: "4px", border: "none",
    background: "#5cb85c", color: "#fff", cursor: "pointer", fontSize: "0.85rem" },
  btnCancel: { padding: "0.4rem 0.75rem", borderRadius: "4px", border: "1px solid #333",
    background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.85rem" },
  brancheRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  brancheLabel: { fontSize: "0.8rem", color: "#aaa", whiteSpace: "nowrap" },
  select: { padding: "0.5rem 0.6rem", borderRadius: "4px", border: "1px solid #333",
    background: "#1a1a1a", color: "#fff", fontSize: "0.88rem", cursor: "pointer" },
  brancheTag: { fontSize: "0.75rem", padding: "1px 8px", borderRadius: "10px",
    fontWeight: 500, whiteSpace: "nowrap" },
};
