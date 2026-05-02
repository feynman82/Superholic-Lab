import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import SmoothScroll from "@/components/marketing/SmoothScroll"

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
        {/* Supabase client must be available before /quest hydrates */}
        <script defer src="/js/supabase-client.js" />
      </head>
      {/* body classes match the vanilla HTML pages: bg-page sets #F9FAFA, texture-light-grid adds the subtle grid watermark.
          suppressHydrationWarning on body + custom elements: deferred scripts upgrade the
          web components and inject children before React hydrates, which would otherwise
          surface as React #418. The mismatch is benign — the custom elements own their own
          DOM subtree and React doesn't manage it. */}
      <body className="has-bottom-nav bg-page texture-light-grid" suppressHydrationWarning>
        {/* @ts-expect-error vanilla web component */}
        <global-header suppressHydrationWarning />
        <SmoothScroll>{children}</SmoothScroll>
        {/* @ts-expect-error vanilla web component */}
        <global-footer suppressHydrationWarning />
        {/* @ts-expect-error vanilla web component */}
        <global-bottom-nav suppressHydrationWarning />
        {/* Web-component upgrade scripts: run AFTER React hydrates so the
            customElements.define() + connectedCallback DOM injection happens
            on a stable subtree React no longer touches. */}
        <Script src="/js/icons.js" strategy="afterInteractive" />
        <Script src="/js/header.js" strategy="afterInteractive" />
        <Script src="/js/footer.js" strategy="afterInteractive" />
        <Script src="/js/bottom-nav.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
