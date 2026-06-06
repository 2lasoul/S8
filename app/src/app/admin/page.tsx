"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FilmForm from "./components/FilmForm";
import ThumbnailPicker from "./components/ThumbnailPicker";

interface Film {
  id: string;
  titre: string;
  fichier_url: string;
  duree: number;
  annee: number | null;
  annee_fin: number | null;
  date_label: string | null;
  description: string | null;
  poster_url: string | null;
  couverture: number;
  branches: string[];
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}m` : `${m}m${sec.toString().padStart(2, "0")}s`;
}

function periode(f: Film) {
  if (f.date_label) return f.date_label;
  if (f.annee && f.annee_fin) return `${f.annee} – ${f.annee_fin}`;
  if (f.annee) return String(f.annee);
  return "—";
}

function statusBadge(couverture: number) {
  if (couverture === 0) return { label: "À annoter", color: "#666" };
  if (couverture < 100) return { label: "En cours", color: "#c8a96e" };
  return { label: "Complété", color: "#5cb85c" };
}

export default function AdminPage() {
  const router = useRouter();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editFilm, setEditFilm] = useState<Film | null>(null);
  const [thumbFilm, setThumbFilm] = useState<Film | null>(null);
  const [error, setError] = useState("");

  const loadFilms = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/films");
    if (res.ok) setFilms(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadFilms(); }, [loadFilms]);

  const stats = {
    total: films.length,
    completed: films.filter((f) => f.couverture === 100).length,
    inProgress: films.filter((f) => f.couverture > 0 && f.couverture < 100).length,
    todo: films.filter((f) => f.couverture === 0).length,
    yearMin: Math.min(...films.filter((f) => f.annee).map((f) => f.annee!)),
    yearMax: Math.max(...films.filter((f) => f.annee_fin ?? f.annee).map((f) => f.annee_fin ?? f.annee!)),
  };

  async function handleCreate(data: Record<string, string>) {
    setError("");
    const res = await fetch("/api/films", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        duree: Number(data.duree),
        annee: data.annee ? Number(data.annee) : null,
        annee_fin: data.annee_fin ? Number(data.annee_fin) : null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      loadFilms();
    } else {
      const d = await res.json();
      setError(d.error || "Erreur");
    }
  }

  async function handleUpdate(data: Record<string, string>) {
    if (!editFilm) return;
    setError("");
    const res = await fetch(`/api/films/${editFilm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        duree: Number(data.duree),
        annee: data.annee ? Number(data.annee) : null,
        annee_fin: data.annee_fin ? Number(data.annee_fin) : null,
      }),
    });
    if (res.ok) {
      setEditFilm(null);
      loadFilms();
    } else {
      const d = await res.json();
      setError(d.error || "Erreur");
    }
  }

  async function handleDelete(film: Film) {
    if (!confirm(`Supprimer "${film.titre}" et tous ses segments ?`)) return;
    await fetch(`/api/films/${film.id}`, { method: "DELETE" });
    loadFilms();
  }

  return (
    <div style={s.page}>
      {/* ThumbnailPicker */}
      {thumbFilm && (
        <ThumbnailPicker
          filmId={thumbFilm.id}
          fichierUrl={thumbFilm.fichier_url}
          duree={thumbFilm.duree}
          onSaved={(posterUrl) => {
            setThumbFilm(null);
            setFilms((prev) => prev.map((f) =>
              f.id === thumbFilm.id ? { ...f, poster_url: posterUrl } : f
            ));
          }}
          onCancel={() => setThumbFilm(null)}
        />
      )}

      {/* Header */}
      <header style={s.header}>
        <h1 style={s.headerTitle}>Archives Super 8</h1>
        <nav style={s.nav}>
          <a href="/admin/referentiel" style={s.navLink}>Référentiel</a>
          <a href="/" style={s.navLink}>Site public</a>
        </nav>
      </header>

      <main style={s.main}>
        {/* Stats */}
        {films.length > 0 && (
          <div style={s.stats}>
            <span style={s.stat}>{stats.total} film{stats.total > 1 ? "s" : ""}</span>
            {stats.yearMin && stats.yearMax && (
              <span style={s.stat}>{stats.yearMin} – {stats.yearMax}</span>
            )}
            <span style={{ ...s.statBadge, background: "#5cb85c22", color: "#5cb85c" }}>
              ✓ {stats.completed} complété{stats.completed > 1 ? "s" : ""}
            </span>
            <span style={{ ...s.statBadge, background: "#c8a96e22", color: "#c8a96e" }}>
              ◑ {stats.inProgress} en cours
            </span>
            <span style={{ ...s.statBadge, background: "#66666622", color: "#888" }}>
              ○ {stats.todo} à annoter
            </span>
          </div>
        )}

        {/* Bouton + formulaire d'ajout */}
        {!showForm && !editFilm && (
          <button onClick={() => setShowForm(true)} style={s.btnAdd}>+ Ajouter un film</button>
        )}

        {error && <p style={s.error}>{error}</p>}

        {showForm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Nouveau film</h2>
            <FilmForm
              onSave={handleCreate}
              onCancel={() => { setShowForm(false); setError(""); }}
            />
          </div>
        )}

        {editFilm && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Modifier — {editFilm.titre}</h2>
            <FilmForm
              initial={{
                id: editFilm.id,
                titre: editFilm.titre,
                fichier_url: editFilm.fichier_url,
                duree: String(editFilm.duree),
                date_label: editFilm.date_label ?? "",
                annee: editFilm.annee ? String(editFilm.annee) : "",
                annee_fin: editFilm.annee_fin ? String(editFilm.annee_fin) : "",
                description: editFilm.description ?? "",
              }}
              onSave={handleUpdate}
              onCancel={() => { setEditFilm(null); setError(""); }}
            />
          </div>
        )}

        {/* Liste des films */}
        {loading ? (
          <p style={s.empty}>Chargement…</p>
        ) : films.length === 0 && !showForm ? (
          <p style={s.empty}>Aucun film. Commencez par en ajouter un.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["Titre", "Période", "Durée", "Couverture", "Branches", ""].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {films.map((f) => {
                const badge = statusBadge(f.couverture);
                return (
                  <tr key={f.id} style={s.tr}
                    onClick={() => router.push(`/admin/film/${f.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1e1e")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={s.td}>
                      <span style={s.filmTitre}>{f.titre}</span>
                      <span style={s.filmSlug}>{f.id}</span>
                    </td>
                    <td style={s.td}>{periode(f)}</td>
                    <td style={s.td}>{formatDuration(f.duree)}</td>
                    <td style={s.td}>
                      <div style={s.coverageRow}>
                        <div style={s.coverageBar}>
                          <div style={{ ...s.coverageFill, width: `${f.couverture}%`,
                            background: badge.color }} />
                        </div>
                        <span style={{ ...s.badge, color: badge.color }}>{badge.label}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      {f.branches.length === 0
                        ? <span style={s.tagGrey}>Commun</span>
                        : f.branches.map((b) => <span key={b} style={s.tagGrey}>{b}</span>)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right" }}
                      onClick={(e) => e.stopPropagation()}>
                      {!f.fichier_url.includes("youtube") && !f.fichier_url.includes("vimeo") && (
                        <button onClick={() => setThumbFilm(f)} style={s.btnIcon} title="Générer miniature">🖼</button>
                      )}
                      <button onClick={() => { setEditFilm(f); setShowForm(false); }} style={s.btnIcon}>✎</button>
                      <button onClick={() => handleDelete(f)} style={{ ...s.btnIcon, color: "#e07070" }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
  main: { maxWidth: "1100px", margin: "0 auto", padding: "2rem" },
  stats: { display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" },
  stat: { fontSize: "0.9rem", color: "#888" },
  statBadge: { fontSize: "0.8rem", padding: "2px 10px", borderRadius: "12px" },
  btnAdd: { padding: "0.6rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold", cursor: "pointer",
    fontSize: "0.9rem", marginBottom: "1.5rem" },
  formCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: "6px",
    padding: "1.5rem", marginBottom: "1.5rem", maxWidth: "640px" },
  formTitle: { margin: "0 0 1.25rem", fontSize: "1rem", color: "#ccc" },
  error: { color: "#e07070", fontSize: "0.9rem", marginBottom: "1rem" },
  empty: { color: "#555", fontStyle: "italic" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.75rem",
    color: "#666", borderBottom: "1px solid #222", fontWeight: 500 },
  tr: { cursor: "pointer", transition: "background 0.1s" },
  td: { padding: "0.75rem", borderBottom: "1px solid #1a1a1a", fontSize: "0.9rem",
    color: "#ccc", verticalAlign: "middle" },
  filmTitre: { display: "block", color: "#fff", fontWeight: 500 },
  filmSlug: { display: "block", fontSize: "0.75rem", color: "#555", marginTop: "2px" },
  coverageRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  coverageBar: { width: "80px", height: "4px", background: "#2a2a2a", borderRadius: "2px" },
  coverageFill: { height: "100%", borderRadius: "2px", transition: "width 0.3s" },
  badge: { fontSize: "0.75rem" },
  tagGrey: { display: "inline-block", fontSize: "0.75rem", background: "#222",
    color: "#888", padding: "1px 7px", borderRadius: "10px", marginRight: "4px" },
  btnIcon: { background: "none", border: "none", color: "#666", cursor: "pointer",
    fontSize: "1rem", padding: "0.25rem 0.5rem" },
};
