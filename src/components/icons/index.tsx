/**
 * src/components/icons/index.tsx
 * Superholic Lab icon system v1 — React/Next.js companion to /public/js/icons.js.
 *
 * 13 inline SVG icons, identical artwork to the vanilla version.
 * All paths use stroke="currentColor" / fill="currentColor" so the parent's
 * `color` cascades. Theme via Tailwind text-* utilities or inline `style.color`.
 *
 * Style: 24×24 viewBox, stroke-width 1.75, line+light-fill hybrid.
 * Aesthetic: Halo Reach (clean hard-edge geometry) + Genshin Impact (rune accents).
 *
 * Usage:
 *   import { Icon } from '@/components/icons'
 *   <Icon name="quest" size={28} style={{ color: 'var(--rose)' }} />
 *
 * Pair with /public/js/icons.js — both files MUST export the same 13 names
 * and identical SVG paths so vanilla and Next.js render the same artwork.
 */

import * as React from "react"

export type IconName =
  | "quest"
  | "quiz"
  | "tutor"
  | "exam"
  | "progress"
  | "diagnosis"
  | "roadmap"
  | "day"
  | "flame"
  | "shield"
  | "lock"
  | "play"
  | "chevron"

type Props = {
  name: IconName
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}

// ─── 13 icon path bodies (kept verbatim from /public/js/icons.js) ─────
const PATHS: Record<IconName, React.ReactNode> = {
  quest: (
    <>
      <path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <path d="M16 4v3h3" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M12 11.8v4.4M9.8 14h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  quiz: (
    <>
      <path d="M6 3h9l3 3v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <path d="M15 3v3h3" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <path d="M8.5 14l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="8" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  tutor: (
    <>
      <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="9.5" r="1" fill="currentColor" />
      <circle cx="15" cy="9.5" r="1" fill="currentColor" />
      <path d="M9 12.5c1 1 4.5 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),

  exam: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M9 11h6M9 14h6M9 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  progress: (
    <>
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="5" y="14" width="3" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <rect x="10.5" y="9" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <rect x="16" y="5" width="3" height="16" rx="0.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="17.5" cy="3.5" r="1.2" fill="currentColor" />
    </>
  ),

  diagnosis: (
    <>
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="18" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="18" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="18" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path
        d="M8.2 12h2c1 0 1.8-.5 2.4-1.2L14.5 7.8M8.2 12h2c1 0 1.8 0 2.4 0H16M8.2 12h2c1 0 1.8.5 2.4 1.2L14.5 16.2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
    </>
  ),

  roadmap: (
    <>
      <path d="M4 19h4v-5h4V9h4V4h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="4" cy="19" r="1.5" fill="currentColor" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" />
      <circle cx="20" cy="4" r="1.5" fill="currentColor" />
    </>
  ),

  day: <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />,

  flame: (
    <>
      <path d="M12 3c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-1-5 0 1.5-1 2-2 2 1-3 0-5-1-6z"
            stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18" />
      <path d="M10 14a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),

  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
            stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),

  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </>
  ),

  play: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" fill="currentColor" fillOpacity="0.08" />
      <path d="M10 8.5l6 3.5-6 3.5v-7z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="currentColor" />
    </>
  ),

  chevron: (
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
}

/**
 * Renders one of the 13 Superholic Lab icons.
 * Color inherits from the parent's CSS `color` (because every path uses currentColor).
 */
export function Icon({ name, size = 24, className, style, title }: Props) {
  const path = PATHS[name]
  if (!path) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Icon] unknown name: ${name}`)
    }
    return null
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable={false}
      className={className}
      style={style}
    >
      {path}
    </svg>
  )
}

/** List of all valid icon names (handy for tests + Storybook indexes). */
export const ICON_NAMES: ReadonlyArray<IconName> = Object.freeze(Object.keys(PATHS) as IconName[])
