"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  filmId: string;
  filmTitre: string;
  fichierUrl: string;
  tcDebut: number;
  tcFin: number;
  segmentTitre: string | null;
  onClose: () => void;
}

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

function youtubeEmbedUrl(url: string, startSec: number) {
  const id = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}?start=${startSec}&autoplay=1` : null;
}
function vimeoEmbedUrl(url: string, startSec: number) {
  const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return id ? `https://player.vimeo.com/video/${id}?autoplay=1#t=${startSec}s` : null;
}

export default function VideoLightbox({ filmId, filmTitre, fichierUrl, tcDebut, tcFin, segmentTitre, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const isYoutube = /youtube|youtu\.be/.test(fichierUrl);
  const isVimeo = /vimeo\.com/.test(fichierUrl);
  const isEmbed = isYoutube || isVimeo;

  const embedUrl = isYoutube
    ? youtubeEmbedUrl(fichierUrl, tcDebut)
    : vimeoEmbedUrl(fichierUrl, tcDebut);

  // Seek au timecode dès que la vidéo est prête
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      v.currentTime = tcDebut;
      setReady(true);
    };
    if (v.readyState >= 1) { v.currentTime = tcDebut; setReady(true); }
    else v.addEventListener("loadedmetadata", onMeta);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [tcDebut]);

  // Fermeture avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerInfo}>
            <span style={s.filmTitre}>{filmTitre}</span>
            <span style={s.segInfo}>
              {fmt(tcDebut)} → {fmt(tcFin)}
              {segmentTitre && <> · <em>{segmentTitre}</em></>}
            </span>
          </div>
          <div style={s.headerActions}>
            <a href={`/film/${filmId}`} style={s.btnFilm} target="_blank">
              Ouvrir le film ↗
            </a>
            <button onClick={onClose} style={s.btnClose}>✕</button>
          </div>
        </div>

        {/* Player */}
        <div style={s.playerWrap}>
          {!isEmbed ? (
            <video
              ref={videoRef}
              src={fichierUrl}
              controls
              autoPlay
              style={s.video}
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.currentTime = tcDebut;
              }}
            />
          ) : (
            <div style={s.embedWrap}>
              <iframe src={embedUrl ?? ""} style={s.embed} allowFullScreen
                allow="autoplay; encrypted-media" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "#000000cc",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1.5rem",
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#161616", borderRadius: "10px",
    border: "1px solid #2a2a2a",
    width: "100%", maxWidth: "900px",
    boxShadow: "0 24px 80px #000000bb",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.875rem 1.25rem", borderBottom: "1px solid #1e1e1e", gap: "1rem",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" },
  filmTitre: { fontSize: "0.95rem", fontWeight: 600, color: "#fff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  segInfo: { fontSize: "0.8rem", color: "#666" },
  headerActions: { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 },
  btnFilm: { fontSize: "0.8rem", color: "#6ab0f5", textDecoration: "none",
    padding: "4px 10px", border: "1px solid #1a3a5c", borderRadius: "4px",
    background: "#1a3a5c44", whiteSpace: "nowrap" },
  btnClose: { background: "#222", border: "1px solid #333", color: "#aaa",
    width: "30px", height: "30px", borderRadius: "6px",
    cursor: "pointer", fontSize: "1rem", display: "flex",
    alignItems: "center", justifyContent: "center" },
  playerWrap: { background: "#000" },
  video: { width: "100%", display: "block", maxHeight: "70vh" },
  embedWrap: { position: "relative", paddingBottom: "56.25%" },
  embed: { position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" },
};
