"use client";
import { useState, useRef } from "react";

interface Props {
  filmId: string;
  fichierUrl: string;
  duree: number;
  onSaved: (posterUrl: string) => void;
  onCancel: () => void;
}

interface Frame { timecode: number; dataUrl: string; }

export default function ThumbnailPicker({ filmId, fichierUrl, duree, onSaved, onCancel }: Props) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);


  const timecodes = [
    Math.floor(duree * 0.25),
    Math.floor(duree * 0.50),
    Math.floor(duree * 0.75),
  ];

  // Capture via le vrai élément vidéo dans le DOM
  async function captureAt(tc: number): Promise<string> {
    const video = videoRef.current!;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 8000);
      const onSeeked = () => {
        clearTimeout(timeout);
        video.removeEventListener("seeked", onSeeked);
        const canvas = document.createElement("canvas");
        canvas.width = 453;
        canvas.height = 340;
        canvas.getContext("2d")?.drawImage(video, 0, 0, 453, 340);
        resolve(canvas.toDataURL("image/png"));
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = tc;
    });
  }

  async function handleVideoReady() {
    const captured: Frame[] = [];
    try {
      for (const tc of timecodes) {
        const dataUrl = await captureAt(tc);
        captured.push({ timecode: tc, dataUrl });
      }
      setFrames(captured);
      setSelected(1);
    } catch {
      setError("Impossible de capturer les frames.");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (selected === null || !frames[selected]) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/films/${filmId}/thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: frames[selected].dataUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { poster_url } = await res.json();
      onSaved(poster_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
    setSaving(false);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={s.modal}>
        <div style={s.header}>
          <span style={s.title}>Choisir une miniature</span>
          <button onClick={onCancel} style={s.btnClose}>✕</button>
        </div>

        <div style={s.body}>
          {/* Vidéo cachée dans le DOM pour la capture canvas */}
          <video
            ref={videoRef}
            src={fichierUrl}
            crossOrigin="anonymous"
            preload="auto"
            style={{ display: "none" }}
            onLoadedData={handleVideoReady}
            onError={() => { setError("Impossible de charger la vidéo. Vérifiez que le fichier est accessible via /videos/."); setLoading(false); }}
          />

          {loading ? (
            <div style={s.loadingWrap}>
              <p style={s.loadingText}>Capture des frames en cours…</p>
              <div style={s.spinner} />
            </div>
          ) : error ? (
            <p style={s.errorText}>{error}</p>
          ) : (
            <>
              <p style={s.hint}>Cliquez sur la frame à utiliser comme miniature</p>
              <div style={s.frames}>
                {frames.map((f, i) => (
                  <div key={i} style={{ ...s.frameWrap,
                    outline: selected === i ? "2px solid #4a9eff" : "2px solid transparent" }}
                    onClick={() => setSelected(i)}>
                    <img src={f.dataUrl} alt={`Frame à ${fmt(f.timecode)}`} style={s.frameImg} />
                    <div style={{ ...s.frameLabel, background: selected === i ? "#4a9eff" : "#1a1a1a" }}>
                      {fmt(f.timecode)} {selected === i ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && <p style={s.errorText}>{error}</p>}
        </div>

        <div style={s.footer}>
          <button onClick={onCancel} style={s.btnCancel}>Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || selected === null || loading}
            style={s.btnSave}>
            {saving ? "Enregistrement…" : "Utiliser cette frame"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, zIndex: 1000, background: "#000000cc",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1.5rem", backdropFilter: "blur(4px)" },
  modal: { background: "#1a1a1a", borderRadius: "10px", border: "1px solid #2a2a2a",
    width: "100%", maxWidth: "780px", overflow: "hidden",
    display: "flex", flexDirection: "column", boxShadow: "0 24px 80px #000000bb" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1rem 1.25rem", borderBottom: "1px solid #222" },
  title: { fontSize: "0.95rem", fontWeight: 600, color: "#fff" },
  btnClose: { background: "#222", border: "1px solid #333", color: "#aaa",
    width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" },
  body: { padding: "1.25rem" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" },
  loadingText: { color: "#888", fontSize: "0.9rem" },
  spinner: { width: "24px", height: "24px", border: "2px solid #333",
    borderTopColor: "#4a9eff", borderRadius: "50%",
    animation: "spin 0.8s linear infinite" },
  hint: { fontSize: "0.82rem", color: "#666", marginBottom: "1rem" },
  frames: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" },
  frameWrap: { borderRadius: "6px", overflow: "hidden", cursor: "pointer",
    transition: "outline 0.15s" },
  frameImg: { width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" },
  frameLabel: { textAlign: "center", fontSize: "0.78rem", color: "#fff",
    padding: "4px 0", transition: "background 0.15s" },
  errorText: { color: "#e07070", fontSize: "0.85rem" },
  footer: { display: "flex", justifyContent: "flex-end", gap: "0.75rem",
    padding: "1rem 1.25rem", borderTop: "1px solid #222" },
  btnCancel: { padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #333",
    background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.88rem" },
  btnSave: { padding: "0.5rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold",
    cursor: "pointer", fontSize: "0.88rem" },
};
