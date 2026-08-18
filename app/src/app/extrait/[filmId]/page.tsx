"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ExtraitPage() {
  return <Suspense><ExtraitPlayer /></Suspense>;
}

function ExtraitPlayer() {
  const { filmId } = useParams<{ filmId: string }>();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const tcDebut = Number(searchParams.get("t") ?? 0);
  const tcFin = searchParams.get("fin") ? Number(searchParams.get("fin")) : null;

  const [titre, setTitre] = useState("");
  const [fichierUrl, setFichierUrl] = useState("");
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(tcDebut);
  const endCheckDisabled = useRef(false);
  const seekDone = useRef(false);

  useEffect(() => {
    fetch(`/api/extrait/${filmId}`)
      .then((r) => r.json())
      .then((d) => { setTitre(d.titre); setFichierUrl(d.fichier_url); });
  }, [filmId]);

  function handleMetadata() {
    const v = videoRef.current;
    if (!v || seekDone.current) return;
    seekDone.current = true;
    v.currentTime = tcDebut;
    v.play();
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (tcFin && !ended && !endCheckDisabled.current && v.currentTime >= tcFin) {
      v.pause();
      setEnded(true);
    }
  }

  function handleContinue() {
    endCheckDisabled.current = true;
    setEnded(false);
    videoRef.current?.play();
  }

  const duree = tcFin ? tcFin - tcDebut : null;
  const progress = duree && tcFin
    ? Math.min(((currentTime - tcDebut) / duree) * 100, 100)
    : 0;

  if (!fichierUrl) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Chargement…</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* En-tête minimal */}
        <div style={s.header}>
          <span style={s.logo}>Archives Super 8</span>
          <span style={s.titre}>{titre}</span>
          {tcFin && (
            <span style={s.dureeLabel}>{fmt(tcDebut)} → {fmt(tcFin)}</span>
          )}
        </div>

        {/* Player */}
        <div style={s.playerWrap}>
          <video
            ref={videoRef}
            src={fichierUrl}
            playsInline
            style={s.video}
            onLoadedMetadata={handleMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          {/* Modale fin d'extrait */}
          {ended && (
            <div style={s.endOverlay}>
              <div style={s.endCard}>
                <p style={s.endText}>Fin de l'extrait</p>
                <div style={s.endActions}>
                  <button onClick={handleContinue} style={s.btnContinue}>
                    Continuer la lecture
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barre de progression de l'extrait */}
        {tcFin && (
          <div style={s.progressWrap}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
        )}

        <div style={s.footer}>
          <span style={s.footerText}>
            {tcFin
              ? `Extrait · ${fmt(Math.max(0, currentTime - tcDebut))} / ${fmt(tcFin - tcDebut)}`
              : fmt(Math.floor(currentTime))}
          </span>
          {!playing && !ended && (
            <span style={s.footerHint}>Cliquez sur la vidéo pour lancer la lecture</span>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0a0a0a", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "sans-serif" },
  loading: { color: "#555", fontStyle: "italic", fontSize: "0.9rem" },
  card: { width: "100%", maxWidth: "860px", background: "#141414",
    border: "1px solid #1e1e1e", borderRadius: "10px", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", gap: "1rem",
    padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" },
  logo: { fontSize: "0.78rem", color: "#444", letterSpacing: "0.05em",
    textTransform: "uppercase", flexShrink: 0 },
  titre: { fontSize: "0.95rem", fontWeight: 600, color: "#fff", flex: 1 },
  dureeLabel: { fontSize: "0.78rem", color: "#555", flexShrink: 0 },
  playerWrap: { position: "relative", background: "#000" },
  video: { width: "100%", display: "block", maxHeight: "75vh" },
  endOverlay: { position: "absolute", inset: 0, background: "#000000dd",
    display: "flex", alignItems: "center", justifyContent: "center" },
  endCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px",
    padding: "1.5rem 2rem", textAlign: "center" },
  endText: { color: "#ddd", fontSize: "0.95rem", margin: "0 0 1rem" },
  endActions: { display: "flex", justifyContent: "center" },
  btnContinue: { padding: "0.55rem 1.25rem", borderRadius: "5px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" },
  progressWrap: { height: "3px", background: "#1e1e1e" },
  progressFill: { height: "100%", background: "#4a9eff", transition: "width 0.3s" },
  footer: { padding: "0.6rem 1.25rem", display: "flex", alignItems: "center",
    gap: "1rem", borderTop: "1px solid #1a1a1a" },
  footerText: { fontSize: "0.78rem", color: "#555" },
  footerHint: { fontSize: "0.75rem", color: "#444", fontStyle: "italic" },
};
