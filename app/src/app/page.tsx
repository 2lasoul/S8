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

export interface ActiveFilters {
  personne?: string;
  lieu?: string;
  evenement?: string;
  branche?: string;
}

interface SegmentResult {
  id: string; film_id: string; film_titre: string;
  fichier_url: string; tc_debut: number; tc_fin: number;
  titre: string | null; personnes: string[];
  evenements: string[]; lieux: string[]; branches: string[];
}

function hasFilters(f: ActiveFilters) {
  return !!(f.personne || f.lieu || f.evenement || f.branche);
}

function filtersToParams(f: ActiveFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.personne)  p.set("personne",  f.personne);
  if (f.lieu)      p.set("lieu",      f.lieu);
  if (f.evenement) p.set("evenement", f.evenement);
  if (f.branche)   p.set("branche",   f.branche);
  return p;
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
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [segmentResults, setSegmentResults] = useState<SegmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Lecture des filtres depuis l'URL au chargement
  useEffect(() => {
    const f: ActiveFilters = {};
    if (searchParams.get("personne"))  f.personne  = searchParams.get("personne")!;
    if (searchParams.get("lieu"))      f.lieu      = searchParams.get("lieu")!;
    if (searchParams.get("evenement")) f.evenement = searchParams.get("evenement")!;
    if (searchParams.get("branche"))   { setActiveBranche(searchParams.get("branche")); return; }
    if (hasFilters(f)) setFilters(f);
  }, []);

  // Chargement des branches
  useEffect(() => {
    fetch("/api/referentiel?categorie=branche")
      .then((r) => r.json()).then(setBranches);
  }, []);

  // Chargement des films selon les filtres actifs
  const loadFilms = useCallback(async () => {
    setLoading(true);
    const params = filtersToParams(filters);
    const res = await fetch(`/api/films${params.toString() ? "?" + params : ""}`);
    if (res.ok) {
      const data = await res.json();
      if (hasFilters(filters)) {
        setFilteredFilms(data);
        const allRes = await fetch("/api/films");
        if (allRes.ok) setAllFilms(await allRes.json());
      } else {
        setAllFilms(data);
        setFilteredFilms(data);
      }
    }
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => { loadFilms(); }, [loadFilms]);

  // Chargement des segments résultats
  useEffect(() => {
    if (!hasFilters(filters)) { setSegmentResults([]); return; }
    const params = filtersToParams(filters);
    fetch(`/api/segments?${params}`)
      .then((r) => r.json()).then(setSegmentResults);
  }, [JSON.stringify(filters)]);

  // Mise à jour de l'URL
  useEffect(() => {
    const params = hasFilters(filters)
      ? filtersToParams(filters)
      : activeBranche ? new URLSearchParams({ branche: activeBranche }) : new URLSearchParams();
    router.replace(params.toString() ? `/?${params}` : "/", { scroll: false });
  }, [JSON.stringify(filters), activeBranche]);

  // Films à afficher dans la grille
  const displayFilms = activeBranche && !hasFilters(filters)
    ? filteredFilms.filter((f) => f.branches.includes(activeBranche))
    : filteredFilms;

  const filteredIds = new Set(displayFilms.map((f) => f.id));

  function handleFiltersChange(newFilters: ActiveFilters) {
    setFilters(newFilters);
    setActiveBranche(null);
  }

  function handleBrancheChange(b: string | null) {
    setActiveBranche(b);
    setFilters({});
  }

  function handleReset() {
    setFilters({});
    setActiveBranche(null);
  }

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
          filters={filters}
          onBrancheChange={handleBrancheChange}
          onFiltersChange={handleFiltersChange}
          onReset={handleReset}
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
              hasActiveFilter={hasFilters(filters)}
            />

            {hasFilters(filters) && (
              <SegmentResults segments={segmentResults} branches={branches} />
            )}

            {displayFilms.length === 0 ? (
              <p style={s.muted}>Aucun film pour ces filtres.</p>
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
