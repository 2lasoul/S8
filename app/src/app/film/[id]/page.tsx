"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Film {
  id: string; titre: string; fichier_url: string; duree: number;
  annee: number | null; annee_fin: number | null; date_label: string | null;
  description: string | null; poster_url: string | null; couverture: number;
}
interface Segment {
  id: string; tc_debut: number; tc_fin: number;
  titre: string | null; personnes: string[]; evenements: string[];
  lieux: string[]; branches: string[]; date_label: string | null; note: string | null;
}
interface BrancheRef { valeur: string; couleur: string | null; }

type Gap = { type: "gap"; tc_debut: number; tc_fin: number };
type Item = { type: "segment"; seg: Segment } | Gap;

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

function periode(f: Film) {
  if (f.date_label) return f.date_label;
  if (f.annee && f.annee_fin) return `${f.annee} – ${f.annee_fin}`;
  if (f.annee) return String(f.annee);
  return "";
}

function buildTimeline(segments: Segment[], duree: number): Item[] {
  const result: Item[] = [];
  let cursor = 0;
  for (const seg of [...segments].sort((a, b) => a.tc_debut - b.tc_debut)) {
    if (seg.tc_debut > cursor) result.push({ type: "gap", tc_debut: cursor, tc_fin: seg.tc_debut });
    result.push({ type: "segment", seg });
    cursor = seg.tc_fin;
  }
  if (cursor < duree) result.push({ type: "gap", tc_debut: cursor, tc_fin: duree });
  return result;
}

function youtubeEmbedUrl(url: string) {
  const id = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null;
}
function vimeoEmbedUrl(url: string) {
  const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  personne:  { bg: "#1a3a5c", color: "#6ab0f5" },
  evenement: { bg: "#3a2a1a", color: "#f5a96a" },
  lieu:      { bg: "#1a3a2a", color: "#6af5a9" },
  branche:   { bg: "#2a1a3a", color: "#c09af5" },
};

export default function FilmPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [film, setFilm] = useState<Film | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [brancheColors, setBrancheColors] = useState<BrancheRef[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const load = useCallback(async () => {
    const [fRes, sRes, rRes] = await Promise.all([
      fetch(`/api/films/${id}`),
      fetch(`/api/films/${id}/segments`),
      fetch("/api/referentiel?categorie=branche"),
    ]);
    if (!fRes.ok) { router.push("/"); return; }
    setFilm(await fRes.json());
    if (sRes.ok) setSegments(await sRes.json());
    if (rRes.ok) setBrancheColors(await rRes.json());
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const activeSegId = segments.find(
    (s) => currentTime >= s.tc_debut && currentTime < s.tc_fin
  )?.id ?? null;

  // Scroll vers le segment actif dans le panneau
  useEffect(() => {
    if (!activeSegId || !panelOpen) return;
    const el = segRefs.current[activeSegId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSegId, panelOpen]);

  if (!film) return <div style={s.loading}>Chargement…</div>;

  const video = videoRef.current;
  const isYoutube = /youtube|youtu\.be/.test(film.fichier_url);
  const isVimeo = /vimeo\.com/.test(film.fichier_url);
  const isEmbed = isYoutube || isVimeo;
  const embedUrl = isYoutube ? youtubeEmbedUrl(film.fichier_url) : vimeoEmbedUrl(film.fichier_url);

  const timeline = buildTimeline(segments, film.duree);

  function seek(t: number) { if (video) video.currentTime = t; }
  function toggle() {
    if (!video) return;
    if (video.paused) { video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  }
  function skip(d: number) {
    if (video) video.currentTime = Math.max(0, Math.min(video.currentTime + d, film.duree));
  }

  async function captureFrame() {
    if (!video) return;
    setCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const filename = `${film.id}_${Math.floor(currentTime)}s.png`;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = filename;
        a.click();
      });
    } catch { /* permission refusée */ }
    setCapturing(false);
  }

  function getBrancheColor(valeur: string) {
    return brancheColors.find((b) => b.valeur === valeur)?.couleur ?? "#888";
  }

  const activeSeg = segments.find((s) => s.id === activeSegId) ?? null;

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <button onClick={() => router.push("/")} style={s.back}>← Archives</button>
        <div style={s.headerCenter}>
          <span style={s.filmTitre}>{film.titre}</span>
          {periode(film) && <span style={s.filmPeriode}>{periode(film)}</span>}
        </div>
        <button onClick={() => setPanelOpen((o) => !o)} style={s.btnAnnot}>
          🏷 {segments.length} annotation{segments.length !== 1 ? "s" : ""}
        </button>
      </header>

      <div style={{ ...s.layout, gridTemplateColumns: panelOpen ? "1fr 320px" : "1fr" }}>
        {/* Zone player */}
        <div style={s.playerZone}>
          {/* Vidéo */}
          <div style={s.videoWrap}>
            {!isEmbed ? (
              <video
                ref={videoRef}
                src={film.fichier_url}
                style={{ ...s.video, maxHeight: panelOpen ? "80vh" : "65vh" }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div style={s.embedWrap}>
                <iframe src={embedUrl ?? ""} style={s.embed} allowFullScreen />
              </div>
            )}
          </div>

          {/* Contrôles MP4 */}
          {!isEmbed && (
            <>
              <div style={s.controls}>
                <button onClick={() => skip(-10)} style={s.btnCtrl}>-10s</button>
                <button onClick={toggle} style={s.btnPlay}>{playing ? "⏸" : "▶"}</button>
                <button onClick={() => skip(10)} style={s.btnCtrl}>+10s</button>
                <span style={s.tcDisplay}>{fmt(Math.floor(currentTime))} / {fmt(film.duree)}</span>
                <input type="range" min={0} max={film.duree} step={1}
                  value={Math.floor(currentTime)}
                  onChange={(e) => seek(Number(e.target.value))}
                  style={s.scrubber} />
                <button onClick={captureFrame} disabled={capturing} style={s.btnCtrl} title="Capturer la frame">
                  📷
                </button>
                <button onClick={() => videoRef.current?.requestFullscreen()} style={s.btnCtrl} title="Plein écran">
                  ⛶
                </button>
              </div>

              {/* Barre segments sous les contrôles */}
              {!panelOpen && <div style={s.segBar}>
                {timeline.map((item, i) => {
                  const dur = item.type === "segment"
                    ? item.seg.tc_fin - item.seg.tc_debut
                    : item.tc_fin - item.tc_debut;
                  const pct = (dur / film.duree) * 100;
                  if (item.type === "segment") {
                    const color = item.seg.branches.length > 0
                      ? getBrancheColor(item.seg.branches[0])
                      : "#c8a96e";
                    const isActive = item.seg.id === activeSegId;
                    return (
                      <div key={i} onClick={() => { seek(item.seg.tc_debut); if (video && !playing) video.play(); }}
                        style={{ ...s.segBarSeg, width: `${pct}%`, background: color,
                          opacity: isActive ? 1 : 0.5 }}
                        title={item.seg.titre ?? fmt(item.seg.tc_debut)} />
                    );
                  }
                  return <div key={i} style={{ ...s.segBarGap, width: `${pct}%` }} />;
                })}
              </div>}

              {/* Segment actif sous les contrôles */}
              {!panelOpen && activeSeg && (
                <div style={s.activeSegStrip}>
                  <div style={s.activeSegMeta}>
                    <span style={s.activeSegTc}>{fmt(activeSeg.tc_debut)} → {fmt(activeSeg.tc_fin)}</span>
                    {activeSeg.titre && <span style={s.activeSegTitre}>{activeSeg.titre}</span>}
                  </div>
                  {activeSeg.personnes.length > 0 && (
                    <div style={s.activeSegRow}>
                      {activeSeg.personnes.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.personne }}>{t}</span>)}
                    </div>
                  )}
                  {(activeSeg.lieux.length > 0 || activeSeg.evenements.length > 0) && (
                    <div style={s.activeSegRow}>
                      {activeSeg.lieux.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.lieu }}>{t}</span>)}
                      {activeSeg.evenements.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.evenement }}>{t}</span>)}
                    </div>
                  )}
                  {activeSeg.branches.length > 0 && (
                    <div style={s.activeSegRow}>
                      {activeSeg.branches.map((t) => (
                        <span key={t} style={{ ...s.tag, background: getBrancheColor(t) + "33", color: getBrancheColor(t) }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {activeSeg.note && <p style={s.activeSegNote}>{activeSeg.note}</p>}
                </div>
              )}
            </>
          )}

          {/* Description */}
          {film.description && (
            <p style={s.description}>{film.description}</p>
          )}
        </div>

        {/* Panneau annotations */}
        {panelOpen && (
          <div ref={panelRef} style={s.panel}>
            <div style={s.panelHeader}>
              <span style={s.panelTitle}>Annotations</span>
              <button onClick={() => setPanelOpen(false)} style={s.btnClose}>✕</button>
            </div>
            <div style={s.panelList}>
              {timeline.map((item, i) => {
                if (item.type === "gap") {
                  return (
                    <div key={`gap-${i}`} style={s.gapItem}>
                      <span style={s.gapLabel}>{fmt(item.tc_debut)} — {fmt(item.tc_fin)}</span>
                      <span style={s.gapText}>Séquence non annotée</span>
                    </div>
                  );
                }
                const seg = item.seg;
                const isActive = seg.id === activeSegId;
                const barColor = seg.branches.length > 0
                  ? getBrancheColor(seg.branches[0]) : "#c8a96e";
                const groups = [
                  seg.personnes.length > 0 ? seg.personnes.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.personne }}>{t}</span>) : null,
                  (seg.lieux.length > 0 || seg.evenements.length > 0) ? [
                    ...seg.lieux.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.lieu }}>{t}</span>),
                    ...seg.evenements.map((t) => <span key={t} style={{ ...s.tag, ...TAG_COLORS.evenement }}>{t}</span>),
                  ] : null,
                  seg.branches.length > 0 ? seg.branches.map((t) => (
                    <span key={t} style={{ ...s.tag, background: getBrancheColor(t) + "33", color: getBrancheColor(t) }}>{t}</span>
                  )) : null,
                ].filter(Boolean);

                return (
                  <div
                    key={seg.id}
                    ref={(el) => { segRefs.current[seg.id] = el; }}
                    style={{
                      ...s.segItem,
                      borderLeft: `3px solid ${barColor}`,
                      background: isActive ? "#1e1e1e" : "#141414",
                      opacity: activeSegId && !isActive ? 0.4 : 1,
                      transition: "opacity 0.1s, background 0.1s",
                    }}
                    onClick={() => { if (!isEmbed) { seek(seg.tc_debut); if (video) video.play(); } }}
                  >
                    <div style={s.segHeader}>
                      <span style={s.segTc}>{fmt(seg.tc_debut)} → {fmt(seg.tc_fin)}</span>
                      {!isEmbed && <span style={s.segPlay}>▶</span>}
                    </div>
                    {seg.titre && <p style={s.segTitre}>{seg.titre}</p>}
                    {groups.length > 0 && (
                      <div style={s.tagBlocks}>
                        {groups.map((g, gi) => (
                          <div key={gi} style={{ ...s.tagGroup,
                            ...(gi < groups.length - 1 ? {} : { borderBottom: "none", paddingBottom: 0 }) }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    )}
                    {seg.note && <p style={s.segNote}>{seg.note}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { padding: "2rem", color: "#666", fontFamily: "sans-serif", background: "#111", minHeight: "100vh" },
  page: { height: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", gap: "1rem", padding: "0 1.5rem",
    height: "52px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 },
  back: { background: "none", border: "none", color: "#666", cursor: "pointer",
    fontSize: "0.85rem", whiteSpace: "nowrap" },
  headerCenter: { flex: 1, display: "flex", alignItems: "baseline", gap: "0.75rem", overflow: "hidden" },
  filmTitre: { fontSize: "1rem", fontWeight: 600, color: "#fff", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis" },
  filmPeriode: { fontSize: "0.85rem", color: "#666", whiteSpace: "nowrap" },
  btnAnnot: { background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#aaa",
    padding: "5px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem",
    whiteSpace: "nowrap" },
  layout: { display: "grid", flex: 1, overflow: "hidden", minHeight: 0 },
  playerZone: { overflowY: "auto", padding: "1.5rem", minHeight: 0 },
  videoWrap: { borderRadius: "6px", overflow: "hidden", background: "#000" },
  video: { display: "block", width: "auto", maxWidth: "100%", margin: "0 auto", background: "#000" },
  embedWrap: { position: "relative", paddingBottom: "56.25%" },
  embed: { position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" },
  controls: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0 0.25rem" },
  btnCtrl: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a",
    borderRadius: "4px", color: "#ccc", cursor: "pointer", fontSize: "0.82rem" },
  btnPlay: { padding: "5px 16px", background: "#2a2a2a", border: "1px solid #333",
    borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "1rem" },
  tcDisplay: { fontSize: "0.82rem", color: "#666", whiteSpace: "nowrap" },
  scrubber: { flex: 1, accentColor: "#c8a96e" },
  segBar: { display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden",
    background: "#1a1a1a", marginBottom: "0.5rem", cursor: "pointer" },
  segBarSeg: { height: "100%", transition: "opacity 0.2s" },
  segBarGap: { height: "100%",
    backgroundImage: "repeating-linear-gradient(45deg,#1e1e1e 0,#1e1e1e 2px,#1a1a1a 2px,#1a1a1a 6px)" },
  activeSegStrip: { display: "flex", flexDirection: "column", gap: "0.4rem",
    padding: "0.6rem 0.75rem", background: "#161616", borderRadius: "4px",
    marginBottom: "0.75rem" },
  activeSegMeta: { display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "2px" },
  activeSegTc: { fontSize: "0.78rem", color: "#666", whiteSpace: "nowrap" },
  activeSegTitre: { fontSize: "0.88rem", color: "#ccc", fontWeight: 500 },
  activeSegRow: { display: "flex", flexWrap: "wrap", gap: "4px" },
  activeSegNote: { fontSize: "0.78rem", color: "#888", fontStyle: "italic",
    margin: "2px 0 0", lineHeight: 1.5, borderTop: "1px solid #222", paddingTop: "0.4rem" },
  description: { fontSize: "0.88rem", color: "#666", lineHeight: 1.6, marginTop: "1rem" },
  panel: { borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column",
    background: "#0a0a0a", overflow: "hidden", minHeight: 0 },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.75rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0 },
  panelTitle: { fontSize: "0.8rem", color: "#555", textTransform: "uppercase",
    letterSpacing: "0.05em", fontWeight: 500 },
  btnClose: { background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" },
  panelList: { overflowY: "auto", flex: 1, padding: "0.75rem" },
  gapItem: { padding: "0.4rem 0.75rem", marginBottom: "4px", opacity: 0.35 },
  gapLabel: { display: "block", fontSize: "0.72rem", color: "#555" },
  gapText: { fontSize: "0.75rem", color: "#444", fontStyle: "italic" },
  segItem: { borderRadius: "4px", padding: "0.6rem 0.75rem", marginBottom: "6px",
    border: "1px solid #1e1e1e", borderLeft: "3px solid #888", cursor: "pointer" },
  segHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" },
  segTc: { fontSize: "0.75rem", color: "#666" },
  segPlay: { fontSize: "0.7rem", color: "#555" },
  segTitre: { fontSize: "0.88rem", color: "#ccc", margin: "2px 0 4px", fontWeight: 500 },
  tagBlocks: { display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" },
  tagGroup: { display: "flex", flexWrap: "wrap", gap: "3px",
    paddingBottom: "4px", borderBottom: "1px solid #1e1e1e" },
  tag: { fontSize: "0.72rem", padding: "2px 7px", borderRadius: "10px" },
  segNote: { fontSize: "0.78rem", color: "#666", fontStyle: "italic", margin: "4px 0 0",
    lineHeight: 1.5 },
};
