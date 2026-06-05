"use client";
import { useRouter } from "next/navigation";

interface Film {
  id: string; titre: string; fichier_url: string;
  annee: number | null; annee_fin: number | null;
  date_label: string | null; poster_url: string | null;
  couverture: number; branches: string[];
}
interface BrancheRef { valeur: string; couleur: string | null; }
interface Props { films: Film[]; branches: BrancheRef[]; }

function periode(f: Film) {
  if (f.date_label) return f.date_label;
  if (f.annee && f.annee_fin) return `${f.annee} – ${f.annee_fin}`;
  if (f.annee) return String(f.annee);
  return "";
}

function isYoutube(url: string) { return /youtube|youtu\.be/.test(url); }
function youtubeId(url: string) {
  return url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null;
}

export default function FilmGrid({ films, branches }: Props) {
  const router = useRouter();

  if (films.length === 0) {
    return <p style={{ color: "#555", fontStyle: "italic" }}>Aucun film pour ces filtres.</p>;
  }

  return (
    <div>
      <h2 style={s.title}>{films.length} film{films.length > 1 ? "s" : ""}</h2>
      <div style={s.grid}>
        {films.map((f) => {
          const mainBranche = f.branches[0] ?? null;
          const mainColor = branches.find((b) => b.valeur === mainBranche)?.couleur ?? "#444";
          const poster = f.poster_url
            ?? (isYoutube(f.fichier_url) && youtubeId(f.fichier_url)
              ? `https://img.youtube.com/vi/${youtubeId(f.fichier_url)}/hqdefault.jpg`
              : null);

          return (
            <div key={f.id} style={s.card} onClick={() => router.push(`/film/${f.id}`)}>
              {/* Poster */}
              <div style={{ ...s.poster, background: poster ? "#000" : mainColor + "44" }}>
                {poster
                  ? <img src={poster} alt={f.titre} style={s.posterImg} />
                  : <span style={s.posterIcon}>▶</span>
                }
                {/* Barre de couverture */}
                {f.couverture > 0 && f.couverture < 100 && (
                  <div style={s.coverageBarWrap}>
                    <div style={{ ...s.coverageBarFill, width: `${f.couverture}%`, background: mainColor }} />
                  </div>
                )}
                {f.couverture === 100 && (
                  <div style={s.coverageBadge}>✓</div>
                )}
              </div>

              {/* Infos */}
              <div style={s.info}>
                <p style={s.filmTitre}>{f.titre}</p>
                {periode(f) && <p style={s.filmPeriode}>{periode(f)}</p>}
                <div style={s.tags}>
                  {f.branches.length === 0
                    ? <span style={{ ...s.tag, background: "#22222288", color: "#666" }}>Commun</span>
                    : f.branches.map((b) => {
                        const color = branches.find((br) => br.valeur === b)?.couleur ?? "#888";
                        return (
                          <span key={b} style={{ ...s.tag, background: color + "33", color }}>
                            {b}
                          </span>
                        );
                      })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: "0.8rem", color: "#444", fontWeight: 500, margin: "0 0 1rem",
    textTransform: "uppercase", letterSpacing: "0.05em" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" },
  card: { background: "#141414", borderRadius: "8px", overflow: "hidden",
    border: "1px solid #1e1e1e", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" },
  poster: { position: "relative", aspectRatio: "16/9", display: "flex",
    alignItems: "center", justifyContent: "center", overflow: "hidden" },
  posterImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  posterIcon: { fontSize: "2rem", color: "#ffffff44" },
  coverageBarWrap: { position: "absolute", bottom: 0, left: 0, right: 0,
    height: "3px", background: "#00000055" },
  coverageBarFill: { height: "100%" },
  coverageBadge: { position: "absolute", top: "6px", right: "8px",
    fontSize: "0.7rem", background: "#5cb85ccc", color: "#fff",
    padding: "1px 6px", borderRadius: "10px" },
  info: { padding: "0.75rem" },
  filmTitre: { margin: "0 0 2px", fontSize: "0.9rem", color: "#fff", fontWeight: 500 },
  filmPeriode: { margin: "0 0 0.5rem", fontSize: "0.78rem", color: "#666" },
  tags: { display: "flex", flexWrap: "wrap", gap: "4px" },
  tag: { fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px" },
};
