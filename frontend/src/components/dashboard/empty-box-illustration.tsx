/** Open box drawing used for Zoom-style empty states (original SVG). */
export function EmptyBoxIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden>
      <ellipse cx="88" cy="96" rx="62" ry="8" fill="#e8f0ff" />
      <path d="M30 42 80 28l50 14-50 14z" fill="#0b5cff" />
      <path d="M30 42v40l50 16V56z" fill="#3d7dff" />
      <path d="M130 42v40L80 98V56z" fill="#0b5cff" />
      <path d="M30 42 14 24l50-14 16 18z" fill="#8fb4ff" />
      <path d="M130 42l16-18-50-14-16 18z" fill="#bcd3ff" />
      <path d="M80 56 64 74 14 60l16-18z" fill="#a9c6ff" />
    </svg>
  );
}
