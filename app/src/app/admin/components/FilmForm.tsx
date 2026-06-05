"use client";
import { useState, useEffect } from "react";

interface FilmFormData {
  titre: string;
  fichier_url: string;
  duree: string;
  date_label: string;
  annee: string;
  annee_fin: string;
  description: string;
}

interface Props {
  initial?: Partial<FilmFormData & { id: string }>;
  onSave: (data: FilmFormData) => Promise<void>;
  onCancel: () => void;
}

const empty: FilmFormData = {
  titre: "", fichier_url: "", duree: "",
  date_label: "", annee: "", annee_fin: "", description: "",
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

export default function FilmForm({ initial, onSave, onCancel }: Props) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<FilmFormData>({ ...empty, ...initial });
  const [errors, setErrors] = useState<Partial<FilmFormData>>({});
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const slug = isEdit ? initial?.id : slugify(form.titre);

  function set(field: keyof FilmFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const e: Partial<FilmFormData> = {};
    if (!form.titre.trim()) e.titre = "Obligatoire";
    if (!form.fichier_url.trim()) e.fichier_url = "Obligatoire";
    if (!form.duree.trim()) e.duree = "Obligatoire";
    else if (isNaN(Number(form.duree)) || Number(form.duree) <= 0) e.duree = "Durée invalide";
    if (form.annee_fin && form.annee && Number(form.annee_fin) < Number(form.annee))
      e.annee_fin = "Doit être ≥ à l'année de début";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function detectDuration() {
    if (!form.fichier_url) return;
    setDetecting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { set("duree", String(Math.round(v.duration))); resolve(); };
        v.onerror = () => reject(new Error("Impossible de lire le fichier"));
        v.src = form.fichier_url;
      });
    } catch {
      alert("Impossible de détecter la durée automatiquement. Saisissez-la manuellement.");
    }
    setDetecting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
  }

  const durationNum = Number(form.duree);

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.row}>
        <label style={s.label}>Titre *</label>
        <input style={errors.titre ? { ...s.input, ...s.inputError } : s.input}
          value={form.titre} onChange={(e) => set("titre", e.target.value)} />
        {errors.titre && <span style={s.err}>{errors.titre}</span>}
      </div>

      {slug && (
        <div style={s.row}>
          <label style={s.label}>Identifiant</label>
          <input style={{ ...s.input, ...s.readOnly }} value={slug} readOnly />
        </div>
      )}

      <div style={s.row}>
        <label style={s.label}>URL vidéo *</label>
        <input style={errors.fichier_url ? { ...s.input, ...s.inputError } : s.input}
          value={form.fichier_url} onChange={(e) => set("fichier_url", e.target.value)}
          placeholder="/videos/bobine.mp4 ou URL YouTube/Vimeo" />
        {errors.fichier_url && <span style={s.err}>{errors.fichier_url}</span>}
      </div>

      <div style={s.row}>
        <label style={s.label}>Durée (secondes) *</label>
        <div style={s.inputGroup}>
          <input style={{ ...(errors.duree ? { ...s.input, ...s.inputError } : s.input), width: "120px" }}
            value={form.duree} onChange={(e) => set("duree", e.target.value)} placeholder="ex : 324" />
          <button type="button" onClick={detectDuration} disabled={detecting || !form.fichier_url} style={s.btnSecondary}>
            {detecting ? "Détection…" : "⏱ Auto"}
          </button>
        </div>
        {form.duree && !isNaN(durationNum) && durationNum > 0 && (
          <span style={s.hint}>{formatDuration(durationNum)}</span>
        )}
        {errors.duree && <span style={s.err}>{errors.duree}</span>}
      </div>

      <div style={s.row}>
        <label style={s.label}>Libellé de période</label>
        <input style={s.input} value={form.date_label}
          onChange={(e) => set("date_label", e.target.value)} placeholder="ex : Été 1972" />
      </div>

      <div style={{ ...s.row, flexDirection: "row", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label style={s.label}>Année de début</label>
          <input style={s.input} type="number" value={form.annee}
            onChange={(e) => set("annee", e.target.value)} placeholder="1972" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={s.label}>Année de fin</label>
          <input style={errors.annee_fin ? { ...s.input, ...s.inputError } : s.input}
            type="number" value={form.annee_fin}
            onChange={(e) => set("annee_fin", e.target.value)} placeholder="1974" />
          {errors.annee_fin && <span style={s.err}>{errors.annee_fin}</span>}
        </div>
      </div>

      <div style={s.row}>
        <label style={s.label}>Description</label>
        <textarea style={{ ...s.input, height: "80px", resize: "vertical" }}
          value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div style={s.actions}>
        <button type="button" onClick={onCancel} style={s.btnCancel}>Annuler</button>
        <button type="submit" disabled={loading} style={s.btnPrimary}>
          {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le film"}
        </button>
      </div>
    </form>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  row: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  label: { fontSize: "0.8rem", color: "#aaa", fontWeight: 500 },
  input: { padding: "0.6rem 0.75rem", borderRadius: "4px", border: "1px solid #333",
    background: "#1a1a1a", color: "#fff", fontSize: "0.95rem", width: "100%", boxSizing: "border-box" },
  readOnly: { background: "#111", color: "#666", cursor: "default" },
  inputError: { borderColor: "#e07070" },
  inputGroup: { display: "flex", gap: "0.5rem", alignItems: "center" },
  hint: { fontSize: "0.78rem", color: "#888" },
  err: { fontSize: "0.78rem", color: "#e07070" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" },
  btnPrimary: { padding: "0.6rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" },
  btnSecondary: { padding: "0.6rem 0.875rem", borderRadius: "4px", border: "1px solid #444",
    background: "transparent", color: "#ccc", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" },
  btnCancel: { padding: "0.6rem 1.25rem", borderRadius: "4px", border: "1px solid #444",
    background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.9rem" },
};
