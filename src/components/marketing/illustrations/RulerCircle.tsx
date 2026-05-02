export default function RulerCircle() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="28" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="28" y1="10" x2="28" y2="38" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <rect x="4" y="20" width="34" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" transform="rotate(-12 4 20)" />
      <line x1="9" y1="22" x2="9" y2="26" stroke="currentColor" strokeWidth="1" transform="rotate(-12 9 22)" />
      <line x1="15" y1="22" x2="15" y2="26" stroke="currentColor" strokeWidth="1" transform="rotate(-12 15 22)" />
      <line x1="21" y1="22" x2="21" y2="26" stroke="currentColor" strokeWidth="1" transform="rotate(-12 21 22)" />
    </svg>
  );
}
