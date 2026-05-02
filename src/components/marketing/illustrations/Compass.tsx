export default function Compass() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="24" y1="6" x2="14" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="6" x2="34" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
      <path d="M14 38 Q24 32 34 38" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" />
    </svg>
  );
}
