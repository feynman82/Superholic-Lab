export default function BarChart() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="8" y1="8" x2="8" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="40" x2="42" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="13" y="28" width="6" height="12" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="22" y="20" width="6" height="20" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="31" y="14" width="6" height="26" rx="1" fill="currentColor" />
    </svg>
  );
}
