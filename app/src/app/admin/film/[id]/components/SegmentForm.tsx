"use client";
import { useState, useEffect } from "react";
import TagInput from "./TagInput";

interface Segment {
  id?: string;
  tc_debut: number | "";
  tc_fin: number | "";
  titre: string;
  personnes: string[];
  evenements: string[];
  lieux: string[];
  branches: string[];
  date_label: string;
  note: string;
}

interface Referentiel {
  personnes: string[];
  evenements: string[];
  lieux: string[];
  branches: string[];
}

interface Props {
  initial?: Partial<Segment>;
  currentTime: number;
  filmDuree: number;
  referentiel: Referentiel;
  onSave: (data: Segment) => Promise<string | void>;
  onCancel: () => void;
}

const empty: Segment = {
  tc_debut: "", tc_fin: "", titre: "",
  personnes: [], evenements: [], lieux: [], branches: [],
  date_label: "", note: "",
};

function fmt(s: number | "") {
  if (s === "") return "";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SegmentForm({ initial, currentTime, filmDuree, referentiel, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Segment>({ ...empty, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setForm({ ...empty, ...initial });
    setErrors({});
    setApiError("");
  }, [initial?.id]);

  function set<K extends keyof Segment>(k: K, v: Segment[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.tc_debut === "") e.tc_debut = "Obligatoire";
    if (form.tc_fin === "") e.tc_fin = "Obligatoire";
    if (form.tc_debut !== "" && form.tc_fin !== "" && Number(form.tc_fin) <= Number(form.tc_debut))
      e.tc_fin = "Doit être > tc début";
    if (form.tc_fin !== "" && Number(form.tc_fin) > filmDuree)
      e.tc_fin = `Max ${filmDuree}s (durée du film)`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Erreur");
    }
    setLoading(false);
  }

  const isEdit = !!initial?.id;

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <h3 style={s.title}>{isEdit ? "Modifier le segment" : "Nouveau segment"}</h3>

      {/* Timecodes */}
      <div style={s.row2}>
        <div style={s.col}>
          <label style={s.label}>Début (s) *</label>
          <div style={s.tcRow}>
            <input style={errors.tc_debut ? { ...s.input, ...s.inputErr } : s.input}
              type="number" min={0} value={form.tc_debut}
              onChange={(e) => set("tc_debut", e.target.value === "" ? "" : Number(e.target.value))} />
            <button type="button" style={s.btnHere}
              onClick={() => set("tc_debut", Math.floor(currentTime))} title="Timecode actuel">
              ⏱
            </button>
          </div>
          <span style={s.hint}>{fmt(form.tc_debut)}</span>
          {errors.tc_debut && <span style={s.err}>{errors.tc_debut}</span>}
        </div>
        <div style={s.col}>
          <label style={s.label}>Fin (s) *</label>
          <div style={s.tcRow}>
            <input style={errors.tc_fin ? { ...s.input, ...s.inputErr } : s.input}
              type="number" min={0} value={form.tc_fin}
              onChange={(e) => set("tc_fin", e.target.value === "" ? "" : Number(e.target.value))} />
            <button type="button" style={s.btnHere}
              onClick={() => set("tc_fin", Math.floor(currentTime))} title="Timecode actuel">
              ⏱
            </button>
          </div>
          <span style={s.hint}>{fmt(form.tc_fin)}</span>
          {errors.tc_fin && <span style={s.err}>{errors.tc_fin}</span>}
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Titre</label>
        <input style={s.input} value={form.titre}
          onChange={(e) => set("titre", e.target.value)} />
      </div>

      <TagInput label="Personnes" value={form.personnes}
        onChange={(v) => set("personnes", v)} suggestions={referentiel.personnes}
        categorie="personne"
        otherTags={[...form.evenements, ...form.lieux, ...form.branches]} />
      <TagInput label="Événements" value={form.evenements}
        onChange={(v) => set("evenements", v)} suggestions={referentiel.evenements}
        categorie="evenement"
        otherTags={[...form.personnes, ...form.lieux, ...form.branches]} />
      <TagInput label="Lieux" value={form.lieux}
        onChange={(v) => set("lieux", v)} suggestions={referentiel.lieux}
        categorie="lieu"
        otherTags={[...form.personnes, ...form.evenements, ...form.branches]} />
      <TagInput label="Branches" value={form.branches}
        onChange={(v) => set("branches", v)} suggestions={referentiel.branches}
        categorie="branche"
        otherTags={[...form.personnes, ...form.evenements, ...form.lieux]} />

      <div style={s.field}>
        <label style={s.label}>Date estimée</label>
        <input style={s.input} value={form.date_label}
          onChange={(e) => set("date_label", e.target.value)} placeholder="ex : Été 1972" />
      </div>

      <div style={s.field}>
        <label style={s.label}>Note</label>
        <textarea style={{ ...s.input, height: "70px", resize: "vertical" }}
          value={form.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      {apiError && <p style={s.err}>{apiError}</p>}

      <div style={s.actions}>
        <button type="button" onClick={onCancel} style={s.btnCancel}>Annuler</button>
        <button type="submit"
          disabled={loading || form.tc_debut === "" || form.tc_fin === ""}
          style={s.btnSave}>
          {loading ? "…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  title: { margin: "0 0 0.25rem", fontSize: "0.95rem", color: "#ccc", fontWeight: 600 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  col: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  label: { fontSize: "0.78rem", color: "#aaa", fontWeight: 500 },
  tcRow: { display: "flex", gap: "4px" },
  input: { padding: "0.5rem 0.6rem", borderRadius: "4px", border: "1px solid #333",
    background: "#1a1a1a", color: "#fff", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" },
  inputErr: { borderColor: "#e07070" },
  hint: { fontSize: "0.75rem", color: "#666" },
  err: { fontSize: "0.75rem", color: "#e07070" },
  btnHere: { padding: "0 8px", background: "#222", border: "1px solid #333",
    borderRadius: "4px", color: "#aaa", cursor: "pointer", fontSize: "0.9rem" },
  actions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.25rem" },
  btnSave: { padding: "0.5rem 1rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" },
  btnCancel: { padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #444",
    background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.85rem" },
};
