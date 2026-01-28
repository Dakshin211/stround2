import React from 'react';

export const CRTOverlay: React.FC = () => {
  return (
    <>
      {/* Subtle scanlines overlay */}
      <div className="crt-overlay" />
      
      {/* Subtle vignette - much lighter */}
      <div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--void-black) / 0.4) 100%)'
        }}
      />
      
      {/* Light leak effect */}
      <div className="fixed inset-0 pointer-events-none z-30 light-leak" />
    </>
  );
};
