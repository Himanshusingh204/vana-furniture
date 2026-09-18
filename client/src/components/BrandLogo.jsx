import React from 'react';

/**
 * BrandLogo — Architectural vector mark and luxury wordmark for VANA.
 * Concept: Interlocking geometric timber joinery chevron forming a modern architectural 'V'.
 */
export default function BrandLogo({
  size = 36,
  showWordmark = true,
  showSubtitle = false,
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  className = ''
}) {
  const iconSize = size;
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexDirection: isVertical ? 'column' : 'row',
        gap: isVertical ? '0.5rem' : '0.75rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      {/* Architectural Joinery Mark (SVG) */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Outer faceted shield / mortise boundary */}
        <path
          d="M24 4L42 12V32L24 44L6 32V12L24 4Z"
          stroke="var(--accent-gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.4"
        />
        {/* Left timber wing - 45-degree architectural lap */}
        <path
          d="M14 16L24 34L28 34L18 16H14Z"
          fill="var(--accent-gold)"
        />
        {/* Right timber wing - intersecting chevron tenon */}
        <path
          d="M34 16L24 34L20 34L30 16H34Z"
          fill="var(--text-primary)"
          fillOpacity="0.85"
        />
        {/* Central brass key / anchor pin */}
        <circle
          cx="24"
          cy="22"
          r="2.5"
          fill="var(--accent-gold)"
        />
      </svg>

      {/* Wordmark & Subtitle */}
      {showWordmark && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: isVertical ? 'center' : 'left'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: `${Math.max(1.15, size * 0.04)}rem`,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 1
            }}
          >
            VANA
          </span>
          {showSubtitle && (
            <span
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: '0.62rem',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--accent-gold)',
                marginTop: '0.28rem',
                lineHeight: 1
              }}
            >
              Architectural Woodcraft
            </span>
          )}
        </div>
      )}
    </div>
  );
}
