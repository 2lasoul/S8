"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoLightbox from "./VideoLightbox";

interface SegmentResult {
  id: string;
  film_id: string;
  film_titre: string;
  fichier_url: string;
  tc_debut: number;
  tc_fin: number;
  titre: string | null;
  personnes: string[];
  evenements: string[];
  lieux: string[];
  branches: string[];
}

interface BrancheRef { valeur: string; couleur: string | null; }
interface Props { segments: SegmentResult[]; branches: BrancheRef[]; }

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`
               : `${m}:${sec.toString().padStart(2,"0")}`;
}

const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  personne:  { bg: "#1a3a5c", color: "#6ab0f5" },
  evenement: { bg: "#3a2a1a", color: "#f5a96a" },
  lieu:      { bg: "#1a3a2a", color: "#6af5a9" },
};

export default function SegmentResults({ segments, branches }: Props) {
  const [lightbox, setLightbox] = useState<SegmentResult | null>(null);

  if (!segments.length) return null;

  function getBrancheColor(valeur: string) {
    return branches.find((b) => b.valeur === valeur)?.couleur ?? "#888";
  }

  return (
    <>
      <div style={s.wrap}>
        <h3 style={s.title}>
          {segments.length} séquence{segments.length > 1 ? "s" : ""} correspondante{segments.length > 1 ? "s" : ""}
        </h3>
        <div style={s.list}>
          {segments.map((seg) => (
            <div key={seg.id} style={s.item}>
              <div style={s.itemLeft}>
                <span style={s.filmTitre}>{seg.film_titre}</span>
                <span style={s.tc}>{fmt(seg.tc_debut)} → {fmt(seg.tc_fin)}</span>
                {seg.titre && <span style={s.segTitre}>{seg.titre}</span>}
                <div style={s.tags}>
                  {seg.personnes.map((t) => <span key={t} style={{ ...s.tag, ...CAT_COLOR.personne }}>{t}</span>)}
                  {seg.evenements.map((t) => <span key={t} style={{ ...s.tag, ...CAT_COLOR.evenement }}>{t}</span>)}
                  {seg.lieux.map((t) => <span key={t} style={{ ...s.tag, ...CAT_COLOR.lieu }}>{t}</span>)}
                  {seg.branches.map((t) => (
                    <span key={t} style={{ ...s.tag,
                      background: getBrancheColor(t) + "33",
                      color: getBrancheColor(t) }}>{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setLightbox(seg)} style={s.btnLire}>▶ Lire</button>
            </div>
          ))}
        </div>
      </div>

      {lightbox && (
        <VideoLightbox
          filmId={lightbox.film_id}
          filmTitre={lightbox.film_titre}
          fichierUrl={lightbox.fichier_url}
          tcDebut={lightbox.tc_debut}
          tcFin={lightbox.tc_fin}
          segmentTitre={lightbox.titre}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: "2rem" },
  title: { fontSize: "0.8rem", color: "#444", fontWeight: 500, margin: "0 0 0.75rem",
    textTransform: "uppercase", letterSpacing: "0.05em" },
  list: { display: "flex", flexDirection: "column", gap: "6px" },
  item: { display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#141414", border: "1px solid #1e1e1e", borderRadius: "6px",
    padding: "0.6rem 0.75rem", gap: "1rem" },
  itemLeft: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", flex: 1 },
  filmTitre: { fontSize: "0.85rem", color: "#fff", fontWeight: 500 },
  tc: { fontSize: "0.78rem", color: "#555" },
  segTitre: { fontSize: "0.82rem", color: "#aaa" },
  tags: { display: "flex", flexWrap: "wrap", gap: "3px" },
  tag: { fontSize: "0.72rem", padding: "2px 7px", borderRadius: "10px" },
  btnLire: { padding: "5px 14px", borderRadius: "4px", border: "none",
    background: "#1e2a1e", color: "#6af5a9", cursor: "pointer",
    fontSize: "0.82rem", whiteSpace: "nowrap", flexShrink: 0 },
};
