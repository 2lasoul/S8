"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/famille", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Erreur");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Archives Super 8</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "…" : "Entrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111",
  },
  card: {
    background: "#1a1a1a",
    padding: "2.5rem",
    borderRadius: "8px",
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  title: {
    color: "#fff",
    fontSize: "1.4rem",
    fontFamily: "sans-serif",
    margin: 0,
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #333",
    background: "#222",
    color: "#fff",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    borderRadius: "4px",
    border: "none",
    background: "#c8a96e",
    color: "#111",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: { color: "#e07070", fontSize: "0.85rem", margin: 0 },
};
