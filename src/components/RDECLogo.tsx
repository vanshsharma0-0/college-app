import React, { useState } from 'react';

interface RDECLogoProps {
  className?: string;
  size?: number; // size in px (e.g. 40, 48, 64)
  showBorder?: boolean;
}

export const RDECLogo: React.FC<RDECLogoProps> = ({
  className = '',
  size = 44,
  showBorder = false,
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={`object-contain rounded-full shrink-0 select-none ${className}`}
        aria-label="R.D. Engineering College Crest"
      >
        <circle cx="100" cy="100" r="96" fill="#000000" />
        <g fill="#000000">
          {[...Array(16)].map((_, i) => (
            <rect
              key={i}
              x="92"
              y="0"
              width="16"
              height="18"
              transform={`rotate(${i * 22.5} 100 100)`}
            />
          ))}
        </g>
        <circle cx="100" cy="100" r="82" fill="#1E88E5" stroke="#000000" strokeWidth="4" />
        <circle cx="100" cy="100" r="54" fill="#64B5F6" stroke="#000000" strokeWidth="3" />
        <path id="textCircle" d="M 28,100 A 72,72 0 1,1 172,100" fill="none" />
        <text fill="#FFFFFF" fontSize="12" fontWeight="bold" letterSpacing="0.8">
          <textPath href="#textCircle" startOffset="50%" textAnchor="middle">
            R.D. ENGINEERING COLLEGE
          </textPath>
        </text>
        <path id="bottomCircle" d="M 166,108 A 70,70 0 0,1 34,108" fill="none" />
        <text fill="#FFFFFF" fontSize="12" fontWeight="bold" letterSpacing="0.8">
          <textPath href="#bottomCircle" startOffset="50%" textAnchor="middle">
            GHAZIABAD
          </textPath>
        </text>
        <path id="sanskritArc" d="M 52,90 A 48,48 0 0,1 148,90" fill="none" />
        <text fill="#000000" fontSize="10" fontWeight="bold">
          <textPath href="#sanskritArc" startOffset="50%" textAnchor="middle">
            विद्ययाऽमृतमश्नुते
          </textPath>
        </text>
        <circle cx="100" cy="92" r="16" fill="none" stroke="#000000" strokeWidth="2" strokeDasharray="3,2" />
        <path d="M 100 76 C 96 86 96 92 100 96 C 104 92 104 86 100 76 Z" fill="#FDD835" stroke="#000000" strokeWidth="1.5" />
        <path d="M 76 112 C 84 130 116 130 124 112 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
        <line x1="100" y1="96" x2="100" y2="120" stroke="#000000" strokeWidth="2.5" />
      </svg>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full ${
        showBorder ? 'ring-2 ring-blue-500/20 shadow-xs' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/aistudio/ChatGPT_Image_Sep_11__2026__10_16_33_AM__1__472278a0.png"
        alt="R.D. Engineering College, Ghaziabad"
        width={size}
        height={size}
        onError={() => setImageError(true)}
        className="w-full h-full object-contain rounded-full select-none"
      />
    </div>
  );
};
