"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SiteLogo from "../components/SiteLogo";

type Tab = "apropos" | "naviguer";

export default function AProposPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("apropos");
  const [contenu, setContenu] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/pages/apropos").then((r) => r.json()).then((d) => setContenu(d.contenu));
    fetch("/api/auth").then((r) => { if (r.ok) setIsAdmin(true); }).catch(() => {});
  }, []);

  async function handleSave() {
    if (!editorRef.current) return;
    setSaving(true);
    const html = editorRef.current.innerHTML;
    await fetch("/api/pages/apropos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: html }),
    });
    setContenu(html);
    setEditing(false);
    setSaving(false);
  }

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button onClick={() => router.push("/")} style={s.back}>← Archives</button>
        <SiteLogo />
        <span style={{ width: "80px" }} />
      </header>

      <main style={s.main}>
        {/* Onglets */}
        <div style={s.tabs}>
          <button onClick={() => setTab("apropos")}
            style={{ ...s.tab, ...(tab === "apropos" ? s.tabActive : {}) }}>
            À propos
          </button>
          <button onClick={() => setTab("naviguer")}
            style={{ ...s.tab, ...(tab === "naviguer" ? s.tabActive : {}) }}>
            Comment naviguer
          </button>
        </div>

        {/* À propos */}
        {tab === "apropos" && (
          <div style={s.section}>
            {isAdmin && !editing && (
              <button onClick={() => { setEditing(true); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = contenu; }, 0); }}
                style={s.btnEdit}>
                ✎ Modifier
              </button>
            )}

            {editing ? (
              <div>
                {/* Barre d'outils */}
                <div style={s.toolbar}>
                  {[
                    { label: "G", cmd: "bold", title: "Gras" },
                    { label: "I", cmd: "italic", title: "Italique" },
                    { label: "S", cmd: "underline", title: "Souligné" },
                  ].map(({ label, cmd, title }) => (
                    <button key={cmd} onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
                      style={s.toolBtn} title={title}><strong>{label}</strong></button>
                  ))}
                  <span style={s.toolSep} />
                  <button onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "h2"); }}
                    style={s.toolBtn} title="Titre">H</button>
                  <button onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "p"); }}
                    style={s.toolBtn} title="Paragraphe">¶</button>
                  <button onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList"); }}
                    style={s.toolBtn} title="Liste">≡</button>
                  <span style={s.toolSep} />
                  <button onMouseDown={(e) => { e.preventDefault(); execCmd("removeFormat"); }}
                    style={s.toolBtn} title="Effacer formatage">✕</button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  style={s.editor}
                />
                <div style={s.editActions}>
                  <button onClick={() => setEditing(false)} style={s.btnCancel}>Annuler</button>
                  <button onClick={handleSave} disabled={saving} style={s.btnSave}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            ) : contenu ? (
              <div className="rich-content" style={s.content} dangerouslySetInnerHTML={{ __html: contenu }} />
            ) : (
              <p style={s.empty}>
                {isAdmin ? "Cliquez sur « Modifier » pour rédiger la page À propos." : "Contenu à venir."}
              </p>
            )}
          </div>
        )}

        {/* Comment naviguer */}
        {tab === "naviguer" && (
          <div style={s.section}>
            <div className="rich-content" style={s.content}>

              <h2>La frise chronologique</h2>
              <p>En haut de la page d'accueil, une frise représente tous les films classés dans le temps. Chaque bloc correspond à un film, coloré selon la famille la plus présente dans ses annotations. Survolez un bloc pour voir le titre, la période et la durée. <strong>Cliquez sur un bloc</strong> pour faire défiler la page vers la carte correspondante dans la grille.</p>

              <h2>Filtrer par branche familiale</h2>
              <p>Sous la barre de recherche, des chips colorés représentent chaque branche de la famille. Cliquez sur une ou plusieurs branches pour n'afficher que les films qui leur correspondent. Cliquez sur <strong>Toutes</strong> pour revenir à l'affichage complet.</p>

              <h2>Rechercher une personne, un lieu ou un événement</h2>
              <p>La barre de recherche propose une autocomplétion sur toutes les personnes, lieux et événements référencés. Sélectionnez une suggestion pour filtrer les films et voir la liste des séquences correspondantes sous la frise.</p>

              <h2>Le filtre avancé</h2>
              <p>Le bouton <strong>⚙ Filtre avancé</strong> permet de combiner plusieurs critères simultanément : une personne ET un lieu ET un événement. Les résultats correspondent aux séquences où tous les critères sont réunis.</p>

              <h2>Ouvrir un film</h2>
              <p>Cliquez sur une carte dans la grille pour ouvrir la page du film. Vous y trouverez le lecteur vidéo et, en cliquant sur <strong>🏷 annotations</strong>, un panneau latéral listant toutes les séquences annotées. Le segment en cours de lecture est automatiquement mis en évidence.</p>

              <h2>Lire une séquence depuis les résultats</h2>
              <p>Quand un filtre est actif, la liste des séquences correspondantes s'affiche sous la frise. Cliquez sur <strong>▶ Lire</strong> pour ouvrir la séquence directement au bon timecode dans une fenêtre superposée, sans quitter la page de recherche.</p>

              <h2>Capturer une image</h2>
              <p>Sur la page d'un film, le bouton <strong>📷</strong> dans la barre de contrôles permet de capturer l'image affichée à l'instant. L'image est téléchargée automatiquement sur votre appareil.</p>

              <h2>Partager une recherche</h2>
              <p>L'URL se met à jour automatiquement à chaque filtre actif. Copiez-la pour partager directement une recherche avec un autre membre de la famille.</p>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem", height: "56px", borderBottom: "1px solid #1a1a1a" },
  back: { background: "none", border: "none", color: "#555", cursor: "pointer",
    fontSize: "0.85rem", width: "80px", textAlign: "left" },
  logo: { fontSize: "1rem", fontWeight: 600, color: "#fff", letterSpacing: "0.03em" },
  main: { maxWidth: "800px", margin: "0 auto", padding: "2rem" },
  tabs: { display: "flex", gap: "0", borderBottom: "1px solid #1a1a1a", marginBottom: "2rem" },
  tab: { padding: "0.6rem 1.5rem", background: "none", border: "none", color: "#555",
    cursor: "pointer", fontSize: "0.9rem", borderBottom: "2px solid transparent",
    marginBottom: "-1px" },
  tabActive: { color: "#fff", borderBottomColor: "#4a9eff" },
  section: { position: "relative" },
  btnEdit: { position: "absolute", top: 0, right: 0, padding: "4px 12px",
    background: "transparent", border: "1px solid #333", borderRadius: "4px",
    color: "#666", cursor: "pointer", fontSize: "0.8rem" },
  toolbar: { display: "flex", gap: "2px", alignItems: "center", padding: "0.4rem",
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderBottom: "none",
    borderRadius: "6px 6px 0 0" },
  toolBtn: { padding: "4px 10px", background: "transparent", border: "1px solid #333",
    borderRadius: "4px", color: "#ccc", cursor: "pointer", fontSize: "0.85rem" },
  toolSep: { width: "1px", height: "20px", background: "#333", margin: "0 4px" },
  editor: { minHeight: "300px", padding: "1rem", background: "#141414",
    border: "1px solid #2a2a2a", borderRadius: "0 0 6px 6px", outline: "none",
    color: "#ccc", fontSize: "0.95rem", lineHeight: 1.7 },
  editActions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" },
  btnCancel: { padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #333",
    background: "transparent", color: "#888", cursor: "pointer", fontSize: "0.88rem" },
  btnSave: { padding: "0.5rem 1.25rem", borderRadius: "4px", border: "none",
    background: "#4a9eff", color: "#fff", fontWeight: "bold",
    cursor: "pointer", fontSize: "0.88rem" },
  content: { fontSize: "0.95rem", color: "#bbb", lineHeight: 1.8,
    // Les éléments h2/p/ul dans dangerouslySetInnerHTML héritent via className global
  },
  empty: { color: "#555", fontStyle: "italic" },
};
