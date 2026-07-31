/**
 * Brand mark for the English site: the Integram link icon plus a Latin
 * wordmark. The Russian site uses an SVG whose wordmark is drawn in Cyrillic
 * letters — it cannot be reused here, so only the icon is taken from the brand
 * set and the name is set in type.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 202.65 133.33"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-auto"
        role="img"
        aria-label="Integram"
      >
        <polygon
          fill="#307fe2"
          points="116.92 41.15 108.17 50.57 123.11 66.66 74.45 118.53 12.68 98.54 12.68 34.79 74.45 14.8 85.63 26.99 94.46 17.68 78.14 0 0 25.29 0 108.04 78.14 133.33 140.69 66.66 116.92 41.15"
        />
        <polygon
          fill="#307fe2"
          points="85.74 92.18 94.48 82.76 79.55 66.67 128.21 14.8 189.97 34.79 189.97 98.54 128.21 118.53 117 106.31 108.17 115.63 124.51 133.33 202.65 108.05 202.65 25.29 124.51 0 61.96 66.67 85.74 92.18"
        />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-slate-900">Integram</span>
    </span>
  )
}
