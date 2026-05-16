import React from 'react';

export const ChatbotIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 800 800" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
          }
          @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          @keyframes scanLine {
            0% { transform: translateY(-50px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(50px); opacity: 0; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.5; filter: blur(10px); }
            50% { opacity: 1; filter: blur(15px); }
          }
          .bot-main { animation: float 4s ease-in-out infinite; transform-origin: center; }
          .eye { animation: blink 4s ease-in-out infinite; transform-origin: center; }
          .scanner { animation: scanLine 3s linear infinite; }
          .glow { animation: pulseGlow 2s ease-in-out infinite; }
        `}
      </style>
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6F9DFF" />
          <stop offset="60%" stopColor="#3B6FB6" />
          <stop offset="100%" stopColor="#1C4B8C" />
        </radialGradient>
        <radialGradient id="visorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1A2B45" />
          <stop offset="100%" stopColor="#081326" />
        </radialGradient>
        <filter id="eyeGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g className="bot-main">
        {/* Soft Shadow Underneath */}
        <ellipse cx="400" cy="740" rx="120" ry="20" fill="rgba(0,0,0,0.15)" className="glow" />

        {/* Side Pods / Ears */}
        <rect x="150" y="380" width="60" height="120" rx="30" fill="#3B6FB6" />
        <rect x="590" y="380" width="60" height="120" rx="30" fill="#3B6FB6" />
        
        {/* Main Body (Rounded Square/Circle Hybrid) */}
        <rect x="200" y="200" width="400" height="420" rx="100" fill="url(#bodyGrad)" />
        
        {/* Glassmorphism Face Visor */}
        <rect x="240" y="280" width="320" height="220" rx="60" fill="url(#visorGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
        
        {/* Internal Details - Scan Line */}
        <rect x="260" y="380" width="280" height="4" fill="#00F2FF" opacity="0.5" className="scanner" />

        {/* Eyes - High Fidelity Glowing Lenses */}
        <g className="eye">
          <circle cx="330" cy="370" r="35" fill="rgba(111,157,255,0.2)" />
          <circle cx="330" cy="370" r="15" fill="#00F2FF" filter="url(#eyeGlow)" />
          <circle cx="335" cy="365" r="5" fill="white" opacity="0.8" />
        </g>
        <g className="eye">
          <circle cx="470" cy="370" r="35" fill="rgba(111,157,255,0.2)" />
          <circle cx="470" cy="370" r="15" fill="#00F2FF" filter="url(#eyeGlow)" />
          <circle cx="475" cy="365" r="5" fill="white" opacity="0.8" />
        </g>

        {/* Mouth Accent (Red/Coral like Target SVG) */}
        <path d="M350 540 Q400 580 450 540" fill="none" stroke="#D9362A" strokeWidth="12" strokeLinecap="round" />
        
        {/* Antenna / Light */}
        <rect x="390" y="140" width="20" height="80" rx="10" fill="#3B6FB6" />
        <circle cx="400" cy="140" r="15" fill="#FFB700" filter="url(#eyeGlow)" className="glow" />

        {/* Glass Reflection Highlight */}
        <path d="M260 320 Q280 300 320 290" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
      </g>
    </svg>
  );
};
