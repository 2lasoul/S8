"use client";
import { useState, useEffect, useCallback } from "react";
import Frise from "./components/Frise";
import FilmGrid from "./components/FilmGrid";
import SearchBar from "./components/SearchBar";

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

interface BrancheRef {
  valeur: string;
  couleur: string | null;
}

export default function HomePage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [branches, setBranches] = useState<BrancheRef[]>([]);
  const [activeBranche, setActiveBranche] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([
      fetch("/api/films"),
      fetch("/api/referentiel?categorie=branche"),
    ]);
    if (fRes.ok) setFilms(await fRes.json());
    if (rRes.ok) setBranches(await rRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrage des films selon branche active et tags de recherche
  const filteredFilms = films.filter((f) => {
    if (activeBranche && !f.branches.includes(activeBranche)) return false;
    if (searchTags.length > 0) {
      // Les tags doivent tous être présents (dans branches du film)
      return searchTags.every((tag) => f.branches.includes(tag));
    }
    return true;
  });

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>Archives Super 8</span>
        <nav style={s.nav}>
          <a href="/admin" style={s.navLink}>Administration</a>
        </nav>
      </header>

      <main style={s.main}>
        {/* Barre de recherche */}
        <SearchBar
          branches={branches}
          activeBranche={activeBranche}
          onBrancheChange={setActiveBranche}
          onSearchChange={setSearchTags}
        />

        {loading ? (
          <p style={s.loading}>Chargement…</p>
        ) : films.length === 0 ? (
          <p style={s.empty}>Aucun film dans les archives.</p>
        ) : (
          <>
            {/* Frise chronologique */}
            <Frise
              films={films}
              filteredIds={new Set(filteredFilms.map((f) => f.id))}
              branches={branches}
              activeBranche={activeBranche}
            />

            {/* Grille de films */}
            <FilmGrid films={filteredFilms} branches={branches} />
          </>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem", height: "56px", borderBottom: "1px solid #1a1a1a" },
  logo: { fontSize: "1rem", fontWeight: 600, color: "#fff", letterSpacing: "0.03em" },
  nav: { display: "flex", gap: "1.5rem" },
  navLink: { color: "#666", textDecoration: "none", fontSize: "0.88rem" },
  main: { maxWidth: "1300px", margin: "0 auto", padding: "2rem" },
  loading: { color: "#555", fontStyle: "italic" },
  empty: { color: "#555", fontStyle: "italic" },
};
