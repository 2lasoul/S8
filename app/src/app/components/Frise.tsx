"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface Film {
  id: string; titre: string; duree: number;
  annee: number | null; annee_fin: number | null;
  date_label: string | null; couverture: number; branches: string[];
}
interface BrancheRef { valeur: string; couleur: string | null; }
interface Props {
  films: Film[];
  filteredIds: Set<string>;
  branches: BrancheRef[];
  activeBranches: string[];
  hasActiveFilter?: boolean;
}

function getBrancheColor(branches: BrancheRef[], valeur: string): string {
  return branches.find((b) => b.valeur === valeur)?.couleur ?? "#888";
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

export default function Frise({ films, filteredIds, branches, activeBranches, hasActiveFilter }: Props) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ film: Film; x: number; y: number } | null>(null);

  const filmsWithYear = films.filter((f) => f.annee !== null);
  if (filmsWithYear.length === 0) return null;

  // Films correspondant aux filtres (pour le recadrage)
  const filteredWithYear = filmsWithYear.filter((f) => filteredIds.has(f.id));
  const refFilms = hasActiveFilter && filteredWithYear.length > 0 ? filteredWithYear : filmsWithYear;

  // Période de la frise : recadrée sur les résultats si filtre actif
  const yearMin = Math.min(...refFilms.map((f) => f.annee!)) - 1;
  const yearMax = Math.max(...refFilms.map((f) => f.annee_fin ?? f.annee!)) + 2;

  // Période complète pour positionner TOUS les films (y compris hors période)
  const yearMinAll = Math.min(...filmsWithYear.map((f) => f.annee!)) - 1;
  const yearMaxAll = Math.max(...filmsWithYear.map((f) => f.annee_fin ?? f.annee!)) + 2;

  const span = yearMax - yearMin;

  // Position dans la fenêtre affichée
  function pct(year: number) {
    return ((year - yearMin) / span) * 100;
  }

  // Indique si un film est dans la fenêtre temporelle affichée
  function inWindow(film: Film) {
    const fin = film.annee_fin ?? film.annee!;
    return fin >= yearMin && film.annee! <= yearMax;
  }

  // Hauteur des lignes (lane) pour éviter les chevauchements
  const lanes: Film[][] = [];
  const sorted = [...filmsWithYear].sort((a, b) => a.annee! - b.annee!);
  for (const film of sorted) {
    const fin = film.annee_fin ?? film.annee!;
    const lane = lanes.findIndex((l) => {
      const last = l[l.length - 1];
      return (last.annee_fin ?? last.annee!) < film.annee!;
    });
    if (lane === -1) lanes.push([film]);
    else lanes[lane].push(film);
  }

  const LANE_H = 28;
  const LANE_GAP = 6;
  const friseH = lanes.length * (LANE_H + LANE_GAP) + 32;

  // Repères temporels
  const tickYears: number[] = [];
  const tickStep = span <= 10 ? 1 : span <= 20 ? 2 : 5;
  for (let y = Math.ceil(yearMin / tickStep) * tickStep; y <= yearMax; y += tickStep) {
    tickYears.push(y);
  }

  return (
    <div style={s.wrap}>
      {/* Frise */}
      <div style={{ ...s.frise, height: `${friseH}px` }}>
        {/* Repères temporels */}
        {tickYears.map((y) => (
          <div key={y} style={{ ...s.tick, left: `${pct(y)}%` }}>
            <div style={s.tickLine} />
            <span style={s.tickLabel}>{y}</span>
          </div>
        ))}

        {/* Films */}
        {lanes.map((lane, li) =>
          lane.map((film) => {
            const isFiltered = filteredIds.has(film.id);
            if (hasActiveFilter && !inWindow(film)) return null;
            const x1 = pct(film.annee!);
            const x2 = pct((film.annee_fin ?? film.annee!) + 1);
            const w = Math.max(x2 - x1, 1.2);
            const mainColor = film.branches.length > 0
              ? getBrancheColor(branches, film.branches[0])
              : "#555";
            const top = 28 + li * (LANE_H + LANE_GAP);

            return (
              <div
                key={film.id}
                style={{
                  ...s.bar,
                  left: `${x1}%`,
                  width: `${w}%`,
                  top: `${top}px`,
                  height: `${LANE_H}px`,
                  background: mainColor + (isFiltered ? "cc" : "33"),
                  border: `1px solid ${mainColor}${isFiltered ? "88" : "33"}`,
                  opacity: isFiltered ? 1 : 0.2,
                  cursor: "pointer",
                }}
                onClick={() => {
                  const el = document.getElementById(`film-card-${film.id}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  else router.push(`/film/${film.id}`);
                }}
                onMouseEnter={(e) => setTooltip({ film, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Barre de couverture en bas du bloc */}
                {film.couverture > 0 && (
                  <div style={{ ...s.coverageStrip, width: `${film.couverture}%`, background: mainColor }} />
                )}
                {/* Titre si assez large */}
                {w > 4 && (
                  <span style={s.barLabel}>{film.titre}</span>
                )}
                {/* Indicateurs branches secondaires */}
                {film.branches.slice(1).map((b) => (
                  <span key={b} style={{ ...s.brancheDot, background: getBrancheColor(branches, b) }} />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Indicateur de recadrage */}
      {hasActiveFilter && filteredWithYear.length > 0 && (
        <div style={s.recadrageInfo}>
          Période affichée : {yearMin + 1} – {yearMax - 2}
          {yearMinAll !== yearMin || yearMaxAll !== yearMax
            ? ` (étendue complète : ${yearMinAll + 1} – ${yearMaxAll - 2})`
            : ""}
        </div>
      )}

      {/* Légende */}
      {branches.length > 0 && (
        <div style={s.legend}>
          {branches.map((b) => (
            <span key={b.valeur} style={s.legendItem}>
              <span style={{ ...s.legendDot, background: b.couleur ?? "#888" }} />
              {b.valeur}
            </span>
          ))}
          <span style={s.legendItem}>
            <span style={{ ...s.legendDot, background: "#555" }} />
            Commun
          </span>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{ ...s.tooltip, left: tooltip.x + 14, top: tooltip.y - 10 }}>
          <strong>{tooltip.film.titre}</strong>
          <span>{tooltip.film.date_label || (tooltip.film.annee_fin
            ? `${tooltip.film.annee} – ${tooltip.film.annee_fin}`
            : tooltip.film.annee ? String(tooltip.film.annee) : "")}</span>
          <span>{formatDuration(tooltip.film.duree)}</span>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: "2.5rem", userSelect: "none" },
  frise: { position: "relative", width: "100%", marginBottom: "0.75rem", overflow: "hidden" },
  tick: { position: "absolute", top: 0, transform: "translateX(-50%)" },
  tickLine: { width: "1px", background: "#1e1e1e", position: "absolute",
    top: "18px", bottom: "-100vh", left: "50%" },
  tickLabel: { fontSize: "0.72rem", color: "#444", whiteSpace: "nowrap" },
  bar: { position: "absolute", borderRadius: "4px", overflow: "hidden",
    transition: "opacity 0.2s", display: "flex", alignItems: "center",
    paddingLeft: "6px", gap: "4px" },
  barLabel: { fontSize: "0.72rem", color: "#fff", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis", flex: 1 },
  coverageStrip: { position: "absolute", bottom: 0, left: 0, height: "3px", opacity: 0.7 },
  brancheDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
  recadrageInfo: { fontSize: "0.75rem", color: "#555", fontStyle: "italic",
    marginBottom: "0.5rem" },
  legend: { display: "flex", gap: "1.25rem", flexWrap: "wrap", paddingTop: "0.5rem",
    borderTop: "1px solid #1a1a1a" },
  legendItem: { display: "flex", alignItems: "center", gap: "5px",
    fontSize: "0.78rem", color: "#666" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%" },
  tooltip: { position: "fixed", zIndex: 1000, background: "#1e1e1e",
    border: "1px solid #333", borderRadius: "6px", padding: "8px 12px",
    display: "flex", flexDirection: "column", gap: "2px",
    fontSize: "0.82rem", color: "#ccc", pointerEvents: "none",
    boxShadow: "0 4px 16px #00000088" },
};
