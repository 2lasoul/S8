"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import SegmentForm from "./components/SegmentForm";

interface Film {
  id: string; titre: string; fichier_url: string; duree: number;
  annee: number | null; annee_fin: number | null; date_label: string | null;
  couverture: number;
}
interface Segment {
  id: string; film_id: string; tc_debut: number; tc_fin: number;
  titre: string | null; personnes: string[]; evenements: string[];
  lieux: string[]; branches: string[]; date_label: string | null; note: string | null;
}
interface Referentiel { personnes: string[]; evenements: string[]; lieux: string[]; branches: string[]; }
interface BrancheColor { valeur: string; couleur: string | null; }

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}` : `${m}:${sec.toString().padStart(2,"0")}`;
}

function coverage(segments: Segment[], duree: number) {
  const total = segments.reduce((a, s) => a + (s.tc_fin - s.tc_debut), 0);
  return Math.round(total / duree * 100);
}

type Gap = { type: "gap"; tc_debut: number; tc_fin: number };
type SegOrGap = { type: "segment"; seg: Segment } | Gap;

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  personne:   { bg: "#1a3a5c", color: "#6ab0f5" },
  evenement:  { bg: "#3a2a1a", color: "#f5a96a" },
  lieu:       { bg: "#1a3a2a", color: "#6af5a9" },
  branche:    { bg: "#2a1a3a", color: "#c09af5" },
};

// Palette de couleurs distinctes pour la timeline (par index de segment)
const SEG_PALETTE = [
  "#7c6af5", "#5cb8e0", "#e05c8a", "#5ce08a", "#e0a95c",
  "#5c8ae0", "#e05c5c", "#a9e05c", "#e05ce0", "#5ce0c8",
];

function buildTimeline(segments: Segment[], duree: number): SegOrGap[] {
  const result: SegOrGap[] = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.tc_debut > cursor) result.push({ type: "gap", tc_debut: cursor, tc_fin: seg.tc_debut });
    result.push({ type: "segment", seg });
    cursor = seg.tc_fin;
  }
  if (cursor < duree) result.push({ type: "gap", tc_debut: cursor, tc_fin: duree });
  return result;
}

export default function FilmEditorPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [referentiel, setReferentiel] = useState<Referentiel>({ personnes: [], evenements: [], lieux: [], branches: [] });
  const [brancheColors, setBrancheColors] = useState<BrancheColor[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [editSeg, setEditSeg] = useState<Segment | null>(null);
  const [newSegInit, setNewSegInit] = useState<Partial<{ tc_debut: number; tc_fin: number }> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [fRes, sRes, rRes] = await Promise.all([
      fetch(`/api/films/${id}`),
      fetch(`/api/films/${id}/segments`),
      fetch("/api/referentiel"),
    ]);
    if (fRes.ok) setFilm(await fRes.json());
    if (sRes.ok) setSegments(await sRes.json());
    if (rRes.ok) {
      const rows: Array<{ categorie: string; valeur: string; couleur: string | null }> = await rRes.json();
      const ref: Referentiel = { personnes: [], evenements: [], lieux: [], branches: [] };
      const colors: BrancheColor[] = [];
      for (const r of rows) {
        if (r.categorie === "personne") ref.personnes.push(r.valeur);
        else if (r.categorie === "evenement") ref.evenements.push(r.valeur);
        else if (r.categorie === "lieu") ref.lieux.push(r.valeur);
        else if (r.categorie === "branche") {
          ref.branches.push(r.valeur);
          colors.push({ valeur: r.valeur, couleur: r.couleur });
        }
      }
      setReferentiel(ref);
      setBrancheColors(colors);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const video = videoRef.current;

  function seek(t: number) {
    if (video) { video.currentTime = t; }
  }
  function toggle() {
    if (!video) return;
    if (video.paused) { video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  }
  function skip(d: number) {
    if (video) video.currentTime = Math.max(0, Math.min(video.currentTime + d, video.duration));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleSave(data: any) {
    const url = editSeg ? `/api/segments/${editSeg.id}` : `/api/films/${id}/segments`;
    const method = editSeg ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tc_debut: Number(data.tc_debut), tc_fin: Number(data.tc_fin) }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Erreur");
    }
    setEditSeg(null);
    setNewSegInit(null);
    setShowForm(false);
    load();
  }

  async function handleDelete(seg: Segment) {
    if (!confirm(`Supprimer ce segment (${fmt(seg.tc_debut)} → ${fmt(seg.tc_fin)}) ?`)) return;
    await fetch(`/api/segments/${seg.id}`, { method: "DELETE" });
    load();
  }

  function openGap(gap: Gap) {
    setEditSeg(null);
    setNewSegInit({ tc_debut: gap.tc_debut, tc_fin: gap.tc_fin });
    setShowForm(true);
  }

  if (!film) return <div style={s.loading}>Chargement…</div>;

  const activeSegId = segments.find(
    (seg) => currentTime >= seg.tc_debut && currentTime < seg.tc_fin
  )?.id ?? null;

  const cov = coverage(segments, film.duree);
  const timeline = buildTimeline(segments, film.duree);
  const isYoutube = /youtube|youtu\.be/.test(film.fichier_url);
  const isVimeo = /vimeo\.com/.test(film.fichier_url);
  const isEmbed = isYoutube || isVimeo;

  const formInitial = editSeg ? {
    id: editSeg.id, tc_debut: editSeg.tc_debut, tc_fin: editSeg.tc_fin,
    titre: editSeg.titre ?? "", personnes: editSeg.personnes, evenements: editSeg.evenements,
    lieux: editSeg.lieux, branches: editSeg.branches,
    date_label: editSeg.date_label ?? "", note: editSeg.note ?? "",
  } : newSegInit ? { tc_debut: newSegInit.tc_debut, tc_fin: newSegInit.tc_fin } : undefined;

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <a href="/admin" style={s.back}>← Films</a>
          <span style={s.headerTitle}>{film.titre}</span>
          {film.date_label && <span style={s.headerSub}>{film.date_label}</span>}
        </div>
        <div style={s.headerRight}>
          <div style={s.coverageWrap}>
            <div style={s.coverageBar}>
              <div style={{ ...s.coverageFill, width: `${cov}%`,
                background: cov === 100 ? "#5cb85c" : "#c8a96e" }} />
            </div>
            <span style={s.coveragePct}>{cov === 100 ? "✓ Complété" : `${cov}%`}</span>
          </div>
          <a href={`/film/${id}`} target="_blank" style={s.navLink}>Voir public ↗</a>
        </div>
      </header>

      <div style={s.layout}>

        {/* Colonne gauche : liste des segments */}
        <div style={s.colLeft}>
          <h3 style={s.listTitle}>{segments.length} segment{segments.length !== 1 ? "s" : ""}</h3>
          {(() => {
            let segItemIdx = 0;
            return timeline.map((item, i) => {
              if (item.type === "gap") {
                const dur = item.tc_fin - item.tc_debut;
                return (
                  <div key={`gap-${i}`} style={s.gapItem} onClick={() => openGap(item)}>
                    <span style={s.gapLabel}>{fmt(item.tc_debut)} → {fmt(item.tc_fin)}</span>
                    <span style={s.gapDur}>{dur}s non annotées</span>
                  </div>
                );
              }
              const seg = item.seg;
              const barColor = SEG_PALETTE[segItemIdx % SEG_PALETTE.length];
              segItemIdx++;
              const isActive = seg.id === activeSegId;
              return (
                <div key={seg.id} style={{
                  ...s.segItem,
                  opacity: activeSegId && !isActive ? 0.4 : 1,
                  transition: "opacity 0.3s, background 0.3s",
                  background: isActive ? "#1e1e1e" : "#141414",
                  borderLeft: isActive ? `3px solid ${barColor}` : "3px solid transparent",
                }}>
                  <div style={s.segHeader}>
                    {!isActive && <div style={{ ...s.segBar, background: barColor }} />}
                    <span style={s.segTc}>{fmt(seg.tc_debut)} → {fmt(seg.tc_fin)}</span>
                    <div style={s.segActions}>
                      {!isEmbed && (
                        <button onClick={() => seek(seg.tc_debut)} style={s.btnIcon} title="Lire">▶</button>
                      )}
                      <button onClick={() => { setEditSeg(seg); setShowForm(false); setNewSegInit(null); }} style={s.btnIcon}>✎</button>
                      <button onClick={() => handleDelete(seg)} style={{ ...s.btnIcon, color: "#e07070" }}>✕</button>
                    </div>
                  </div>
                  {seg.titre && <p style={s.segTitre}>{seg.titre}</p>}
                  {(() => {
                    const groups = [
                      seg.personnes.length > 0 ? seg.personnes.map((t) => <span key={t} style={{ ...s.tag, background: TAG_COLORS.personne.bg, color: TAG_COLORS.personne.color }}>{t}</span>) : null,
                      (seg.lieux.length > 0 || seg.evenements.length > 0) ? [
                        ...seg.lieux.map((t) => <span key={t} style={{ ...s.tag, background: TAG_COLORS.lieu.bg, color: TAG_COLORS.lieu.color }}>{t}</span>),
                        ...seg.evenements.map((t) => <span key={t} style={{ ...s.tag, background: TAG_COLORS.evenement.bg, color: TAG_COLORS.evenement.color }}>{t}</span>),
                      ] : null,
                      seg.branches.length > 0 ? seg.branches.map((t) => {
                        const bc = brancheColors.find(b => b.valeur === t);
                        const bg = bc?.couleur ? bc.couleur + "33" : TAG_COLORS.branche.bg;
                        const color = bc?.couleur ?? TAG_COLORS.branche.color;
                        return <span key={t} style={{ ...s.tag, background: bg, color }}>{t}</span>;
                      }) : null,
                    ].filter(Boolean);
                    return groups.length > 0 ? (
                      <div style={s.tagBlocks}>
                        {groups.map((g, gi) => (
                          <div key={gi} style={{ ...s.tagGroup, ...(gi < groups.length - 1 ? {} : { borderBottom: "none", paddingBottom: 0 }) }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              );
            });
          })()}
        </div>

        {/* Colonne centre : player + timeline */}
        <div style={s.colCenter}>
          <div style={s.playerWrap}>
            {!isEmbed ? (
              <video
                ref={videoRef}
                src={film.fichier_url}
                style={s.video}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div style={s.embedWrap}>
                <iframe
                  src={isYoutube
                    ? `https://www.youtube.com/embed/${film.fichier_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`
                    : `https://player.vimeo.com/video/${film.fichier_url.match(/vimeo\.com\/(\d+)/)?.[1]}`}
                  style={s.embed}
                  allowFullScreen
                />
              </div>
            )}

            {/* Contrôles (MP4 uniquement) */}
            {!isEmbed && (
              <div style={s.controls}>
                <button onClick={() => skip(-5)} style={s.btnCtrl}>-5s</button>
                <button onClick={toggle} style={s.btnPlay}>{playing ? "⏸" : "▶"}</button>
                <button onClick={() => skip(5)} style={s.btnCtrl}>+5s</button>
                <span style={s.tcDisplay}>{fmt(Math.floor(currentTime))} / {fmt(film.duree)}</span>
                <input type="range" min={0} max={film.duree} step={1}
                  value={Math.floor(currentTime)}
                  onChange={(e) => seek(Number(e.target.value))}
                  style={s.scrubber} />
              </div>
            )}

            {/* Timeline visuelle */}
            <div style={s.timeline} title="Cliquez sur une zone non annotée pour créer un segment">
              {(() => {
                let segIdx = 0;
                return timeline.map((item, i) => {
                  const pct = ((item.type === "segment" ? item.seg.tc_fin - item.seg.tc_debut : item.tc_fin - item.tc_debut) / film.duree) * 100;
                  if (item.type === "segment") {
                    const color = SEG_PALETTE[segIdx % SEG_PALETTE.length];
                    segIdx++;
                    return (
                      <div key={i} style={{ ...s.tlSeg, width: `${pct}%`, background: color }}
                        onClick={() => seek(item.seg.tc_debut)}
                        title={`${fmt(item.seg.tc_debut)} → ${fmt(item.seg.tc_fin)}${item.seg.titre ? " — " + item.seg.titre : ""}`} />
                    );
                  }
                  return (
                    <div key={i} style={{ ...s.tlGap, width: `${pct}%` }}
                      onClick={() => openGap(item)}
                      title="Zone non annotée — cliquer pour créer un segment" />
                  );
                });
              })()}
              {/* Curseur de lecture */}
              {!isEmbed && (
                <div style={{ ...s.tlCursor, left: `${(currentTime / film.duree) * 100}%` }} />
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : formulaire */}
        <div style={s.colRight}>
          {(showForm || editSeg) ? (
            <div style={s.formWrap}>
              <SegmentForm
                key={editSeg?.id ?? "new"}
                initial={formInitial}
                currentTime={currentTime}
                filmDuree={film.duree}
                referentiel={referentiel}
                onSave={handleSave}
                onCancel={() => { setEditSeg(null); setShowForm(false); setNewSegInit(null); }}
              />
            </div>
          ) : (
            <button onClick={() => { setEditSeg(null); setNewSegInit(null); setShowForm(true); }} style={s.btnAdd}>
              + Nouveau segment
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { padding: "2rem", color: "#666", fontFamily: "sans-serif" },
  page: { minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 1.5rem", height: "52px", borderBottom: "1px solid #222", background: "#0d0d0d" },
  back: { color: "#666", textDecoration: "none", fontSize: "0.85rem", marginRight: "1rem" },
  headerTitle: { fontSize: "1rem", fontWeight: 600, color: "#fff" },
  headerSub: { marginLeft: "0.75rem", fontSize: "0.85rem", color: "#888" },
  headerRight: { display: "flex", alignItems: "center", gap: "1.5rem" },
  coverageWrap: { display: "flex", alignItems: "center", gap: "0.5rem" },
  coverageBar: { width: "100px", height: "4px", background: "#2a2a2a", borderRadius: "2px" },
  coverageFill: { height: "100%", borderRadius: "2px" },
  coveragePct: { fontSize: "0.8rem", color: "#aaa" },
  navLink: { color: "#666", textDecoration: "none", fontSize: "0.85rem" },
  layout: { display: "grid", gridTemplateColumns: "280px 1fr 320px", height: "calc(100vh - 52px)" },
  colLeft:   { padding: "1rem", overflowY: "auto", borderRight: "1px solid #1a1a1a", background: "#0d0d0d" },
  colCenter: { padding: "1.25rem", overflowY: "auto", borderRight: "1px solid #1a1a1a" },
  colRight:  { padding: "1.25rem", overflowY: "auto", background: "#0d0d0d" },
  playerWrap: { marginBottom: "1rem" },
  video: { width: "100%", borderRadius: "4px", background: "#000", display: "block" },
  embedWrap: { position: "relative", paddingBottom: "56.25%", background: "#000", borderRadius: "4px" },
  embed: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" },
  controls: { display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.5rem 0", borderBottom: "1px solid #1a1a1a", marginBottom: "0.5rem" },
  btnCtrl: { padding: "4px 10px", background: "#222", border: "1px solid #333",
    borderRadius: "4px", color: "#ccc", cursor: "pointer", fontSize: "0.82rem" },
  btnPlay: { padding: "4px 14px", background: "#333", border: "1px solid #444",
    borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "1rem" },
  tcDisplay: { fontSize: "0.82rem", color: "#888", marginLeft: "0.25rem", whiteSpace: "nowrap" },
  scrubber: { flex: 1, accentColor: "#4a9eff" },
  timeline: { position: "relative", display: "flex", height: "16px",
    background: "#1a1a1a", borderRadius: "3px", overflow: "hidden", cursor: "pointer" },
  tlSeg: { height: "100%", background: "#c8a96e", opacity: 0.85 },
  tlGap: { height: "100%",
    backgroundImage: "repeating-linear-gradient(45deg,#222 0,#222 3px,#1a1a1a 3px,#1a1a1a 8px)" },
  tlCursor: { position: "absolute", top: 0, width: "2px", height: "100%",
    background: "#fff", pointerEvents: "none" },
  formWrap: { background: "#161616", border: "1px solid #2a2a2a",
    borderRadius: "6px", padding: "1.25rem", marginBottom: "1rem" },
  btnAdd: { padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #333",
    background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.85rem" },
  listTitle: { fontSize: "0.8rem", color: "#555", fontWeight: 500,
    margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  segItem: { background: "#141414", borderRadius: "4px", padding: "0.6rem 0.75rem",
    marginBottom: "0.5rem", border: "1px solid #1e1e1e", borderLeft: "3px solid transparent" },
  segHeader: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" },
  segBar: { width: "3px", height: "16px", background: "#c8a96e",
    borderRadius: "2px", flexShrink: 0 },
  segTc: { fontSize: "0.78rem", color: "#888", flex: 1 },
  segTitre: { fontSize: "0.85rem", color: "#ccc", margin: "0.2rem 0" },
  segActions: { display: "flex", gap: "2px" },
  tagList: { display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "0.3rem" },
  tagBlocks: { display: "flex", flexDirection: "column", gap: "5px", marginTop: "0.4rem" },
  tagGroup: { display: "flex", flexWrap: "wrap", gap: "4px", paddingBottom: "5px", borderBottom: "1px solid #222" },
  tag: { fontSize: "0.72rem", background: "#222", color: "#888",
    padding: "3px 8px", borderRadius: "10px" },
  gapItem: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.4rem 0.75rem", marginBottom: "0.5rem", borderRadius: "4px",
    border: "1px dashed #222", cursor: "pointer", opacity: 0.6 },
  gapLabel: { fontSize: "0.78rem", color: "#555" },
  gapDur: { fontSize: "0.72rem", color: "#444" },
  btnIcon: { background: "none", border: "none", color: "#555",
    cursor: "pointer", fontSize: "0.9rem", padding: "2px 4px" },
};
