"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Frise from "./components/Frise";
import FilmGrid from "./components/FilmGrid";
import SearchBar from "./components/SearchBar";
import SegmentResults from "./components/SegmentResults";

interface Film {
  id: string; titre: string; fichier_url: string; duree: number;
  annee: number | null; annee_fin: number | null; date_label: string | null;
  description: string | null; poster_url: string | null;
  couverture: number; branches: string[];
}
interface BrancheRef { valeur: string; couleur: string | null; }
interface ActiveFilter { valeur: string; categorie: "personne" | "lieu" | "evenement" | "branche"; }
interface SegmentResult {
  id: string; film_id: string; film_titre: string;
  fichier_url: string;
  tc_debut: number; tc_fin: number; titre: string | null;
  personnes: string[]; evenements: string[];
  lieux: string[]; branches: string[];
}

export default function Page() {
  return <Suspense><HomePage /></Suspense>;
}

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allFilms, setAllFilms] = useState<Film[]>([]);
  const [filteredFilms, setFilteredFilms] = useState<Film[]>([]);
  const [branches, setBranches] = useState<BrancheRef[]>([]);
  const [activeBranche, setActiveBranche] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [segmentResults, setSegmentResults] = useState<SegmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Lecture des filtres depuis l'URL au chargement
  useEffect(() => {
    const p = searchParams.get("personne");
    const l = searchParams.get("lieu");
    const e = searchParams.get("evenement");
    const b = searchParams.get("branche");
    if (p) setActiveFilter({ valeur: p, categorie: "personne" });
    else if (l) setActiveFilter({ valeur: l, categorie: "lieu" });
    else if (e) setActiveFilter({ valeur: e, categorie: "evenement" });
    else if (b) setActiveBranche(b);
  }, []);

  // Chargement des branches
  useEffect(() => {
    fetch("/api/referentiel?categorie=branche")
      .then((r) => r.json()).then(setBranches);
  }, []);

  // Chargement des films selon le filtre actif
  const loadFilms = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeFilter) params.set(activeFilter.categorie, activeFilter.valeur);

    const res = await fetch(`/api/films${params.toString() ? "?" + params : ""}`);
    if (res.ok) {
      const data = await res.json();
      if (activeFilter) {
        setFilteredFilms(data);
        // Tous les films sans filtre pour la frise complète
        const allRes = await fetch("/api/films");
        if (allRes.ok) setAllFilms(await allRes.json());
      } else {
        setAllFilms(data);
        setFilteredFilms(data);
      }
    }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => { loadFilms(); }, [loadFilms]);

  // Chargement des segments résultats quand filtre tag actif
  useEffect(() => {
    if (!activeFilter) { setSegmentResults([]); return; }
    const params = new URLSearchParams();
    params.set(activeFilter.categorie, activeFilter.valeur);
    fetch(`/api/segments?${params}`)
      .then((r) => r.json()).then(setSegmentResults);
  }, [activeFilter]);

  // Mise à jour de l'URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter) params.set(activeFilter.categorie, activeFilter.valeur);
    else if (activeBranche) params.set("branche", activeBranche);
    const url = params.toString() ? `/?${params}` : "/";
    router.replace(url, { scroll: false });
  }, [activeFilter, activeBranche]);

  // Films à afficher dans la grille (filtre branche local)
  const displayFilms = activeBranche && !activeFilter
    ? filteredFilms.filter((f) => f.branches.includes(activeBranche))
    : filteredFilms;

  const filteredIds = new Set(displayFilms.map((f) => f.id));

  return (
    <div style={s.page}>
      <header style={s.header}>
        <span style={s.logo}>Archives Super 8</span>
        <nav style={s.nav}>
          <a href="/admin" style={s.navLink}>Administration</a>
        </nav>
      </header>

      <main style={s.main}>
        <SearchBar
          branches={branches}
          activeBranche={activeBranche}
          activeFilter={activeFilter}
          onBrancheChange={(b) => { setActiveBranche(b); setActiveFilter(null); }}
          onFilterChange={setActiveFilter}
        />

        {loading ? (
          <p style={s.muted}>Chargement…</p>
        ) : allFilms.length === 0 ? (
          <p style={s.muted}>Aucun film dans les archives.</p>
        ) : (
          <>
            <Frise
              films={allFilms}
              filteredIds={filteredIds}
              branches={branches}
              activeBranche={activeBranche}
            />

            {/* Résultats segments sous la frise si filtre tag actif */}
            {activeFilter && (
              <SegmentResults segments={segmentResults} branches={branches} />
            )}

            {displayFilms.length === 0 ? (
              <p style={s.muted}>Aucun film pour ce filtre.</p>
            ) : (
              <FilmGrid films={displayFilms} branches={branches} />
            )}
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
  navLink: { color: "#555", textDecoration: "none", fontSize: "0.88rem" },
  main: { maxWidth: "1300px", margin: "0 auto", padding: "2rem" },
  muted: { color: "#555", fontStyle: "italic" },
};
