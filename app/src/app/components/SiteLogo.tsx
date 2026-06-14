"use client";
import { useState } from "react";

interface SiteLogoProps {
  style?: React.CSSProperties;
}

export default function SiteLogo({ style }: SiteLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/img/logo.png"
        alt="Archives Super 8"
        onError={() => setImgError(true)}
        style={{ height: "32px", width: "auto", display: "block", ...style }}
      />
    );
  }

  return (
    <span style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", letterSpacing: "0.03em", ...style }}>
      Archives Super 8
    </span>
  );
}
