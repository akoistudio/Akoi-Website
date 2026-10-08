import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKŌI Form Studio",
  description: "Design precise lamps and home decor with parametric shapes, textures, and closed-bottom magnet recesses.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
