import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ThunderEffect } from '@/components/ThunderEffect';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import upsideDownBg from '@/assets/upside-down-bg.png';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode, role } = location.state || {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${upsideDownBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <CRTOverlay />
      <ThunderEffect intensity="light" />
      <div className="absolute inset-0 bg-void/35 ambient-flicker" />
      
      <div className="relative z-10 w-full max-w-md text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <GlitchText as="h1" className="text-4xl md:text-5xl text-accent">
            COMMUNICATION
          </GlitchText>
          <GlitchText as="h1" className="text-4xl md:text-5xl">
            UNLOCKED
          </GlitchText>
        </div>
        
        <div className="bg-card/70 border border-accent/50 rounded-lg p-6 backdrop-blur-sm">
          <p className="text-foreground font-rajdhani leading-relaxed text-lg font-medium">
            The connection between worlds has been established. 
            The Upside Down speaks... and you have listened.
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-muted-foreground font-rajdhani text-sm font-semibold">
            Puzzle 1 Complete
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/50" />
            <div className="w-3 h-3 rounded-full bg-muted" />
            <div className="w-3 h-3 rounded-full bg-muted" />
            <div className="w-3 h-3 rounded-full bg-muted" />
          </div>
        </div>
        
        <ScaryButton 
          size="lg" 
          className="w-full"
          onClick={() => navigate('/')}
        >
          Continue
        </ScaryButton>
        
        <p className="text-muted-foreground/60 font-rajdhani text-xs font-medium">
          More puzzles coming soon...
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
