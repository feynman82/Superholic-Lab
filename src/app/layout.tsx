import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Superholic Lab — Your Child's Path to AL1 Starts Here",
  description:
    "Singapore's AI-powered study system for P1–P6. MOE-aligned question bank, WA/EOY/PSLE practice papers, AL1–AL8 live tracking, Plan Quest, and Miss Wena AI Tutor. 7-day free trial.",
  openGraph: {
    title: "Superholic Lab — Diagnose Weaknesses. Track AL Progress.",
    description: "A complete AI study system for P1–P6. From S$12.99/month.",
    url: "https://www.superholiclab.com",
    type: "website",
    locale: "en_SG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superholic Lab — Your Child's Path to AL1 Starts Here",
  },
  alternates: { canonical: "https://www.superholiclab.com/" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/assets/favicon.ico" />
        <script defer data-domain="superholiclab.com" src="https://plausible.io/js/script.js" />
        {/* Vanilla JS web components — load in document order before use */}
        <script defer src="/js/supabase-client.js" />
        <script defer src="/js/icons.js" />
        <script defer src="/js/header.js" />
        <script defer src="/js/footer.js" />
        <script defer src="/js/bottom-nav.js" />
      </head>
      {/* body classes match the vanilla HTML pages: bg-page sets #F9FAFA, texture-light-grid adds the subtle grid watermark */}
      <body className="has-bottom-nav bg-page texture-light-grid">
        {/* @ts-expect-error vanilla web component */}
        <global-header />
        {children}
        {/* @ts-expect-error vanilla web component */}
        <global-footer />
        {/* @ts-expect-error vanilla web component */}
        <global-bottom-nav />
      </body>
    </html>
  )
}
