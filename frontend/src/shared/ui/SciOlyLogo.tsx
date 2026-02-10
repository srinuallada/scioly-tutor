/**
 * Custom SVG logo for SciOly Tutor.
 * A flask/beaker with orbiting electrons and sparkle accents.
 */
export default function SciOlyLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="flask-fill" x1="45" y1="55" x2="75" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect x="4" y="4" width="112" height="112" rx="26" fill="url(#logo-bg)" />

      {/* Flask body */}
      <path
        d="M52 28 L52 52 L36 82 C33.5 86.5 36.5 92 42 92 L78 92 C83.5 92 86.5 86.5 84 82 L68 52 L68 28"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Flask opening rim */}
      <line x1="47" y1="28" x2="73" y2="28" stroke="white" strokeWidth="3.5" strokeLinecap="round" />

      {/* Liquid inside flask */}
      <path
        d="M42 75 L44 71 L78 71 L76 75 L78 92 C83.5 92 86.5 86.5 84 82 L76 71 L44 71 L36 82 C33.5 86.5 36.5 92 42 92 Z"
        fill="url(#flask-fill)"
      />

      {/* Bubbles in liquid */}
      <circle cx="52" cy="80" r="3" fill="white" fillOpacity="0.5" />
      <circle cx="64" cy="76" r="2" fill="white" fillOpacity="0.4" />
      <circle cx="58" cy="84" r="2.5" fill="white" fillOpacity="0.35" />

      {/* Atom orbit – ellipse around flask */}
      <ellipse
        cx="60"
        cy="58"
        rx="32"
        ry="12"
        transform="rotate(-30 60 58)"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        fill="none"
        strokeDasharray="4 3"
      />

      {/* Orbiting electron */}
      <circle cx="34" cy="44" r="3.5" fill="#fbbf24" filter="url(#glow)" />

      {/* Sparkle top-right */}
      <g transform="translate(88, 20)" fill="white" fillOpacity="0.9">
        <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" />
      </g>

      {/* Small sparkle */}
      <g transform="translate(28, 18) scale(0.5)" fill="white" fillOpacity="0.6">
        <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" />
      </g>
    </svg>
  )
}
