export const metadata = { title: "Archives Super 8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; }
          .rich-content h2 { color: #fff; font-size: 1.1rem; margin: 1.5rem 0 0.5rem; font-weight: 600; }
          .rich-content p { margin: 0 0 0.75rem; }
          .rich-content ul { padding-left: 1.5rem; margin: 0 0 0.75rem; }
          .rich-content li { margin-bottom: 0.3rem; }
          .rich-content strong { color: #ddd; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
