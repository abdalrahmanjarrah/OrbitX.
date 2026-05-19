import React, { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
  color: string;
}

export default function StarBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const starColors = ['#ffffff', '#c7d2fe', '#fbcfe8', '#a78bfa'];
    const generatedStars: Star[] = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 5}s`,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#05050A]">
      {/* Dynamic Nebulas */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-600/10 blur-[150px] rounded-full mix-blend-screen opacity-50 animate-[pulse_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-[30%] left-[60%] w-[40vw] h-[40vw] bg-blue-600/10 blur-[130px] rounded-full mix-blend-screen opacity-40 animate-[pulse_12s_ease-in-out_infinite]" />

      {/* Twinkling Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full animate-[twinkle_var(--duration)_ease-in-out_infinite] opacity-80"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              // @ts-ignore
              '--duration': star.duration,
              animationDelay: star.delay,
              boxShadow: `0 0 ${parseFloat(star.size) * 2}px ${star.color}`
            }}
          />
        ))}
      </div>

      {/* Shooting Stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-px h-px bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.1),0_0_0_8px_rgba(255,255,255,0.1),0_0_20px_rgba(255,255,255,1)] animate-[shooting-star_5s_linear_infinite] opacity-0" />
        <div className="absolute top-[50%] left-[80%] w-px h-px bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.1),0_0_0_8px_rgba(255,255,255,0.1),0_0_20px_rgba(255,255,255,1)] animate-[shooting-star_8s_linear_infinite_3s] opacity-0" />
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; width: 0; }
          10% { width: 150px; opacity: 1; }
          20% { width: 0; opacity: 0; transform: translateX(-300px) translateY(300px) rotate(-45deg); }
          100% { width: 0; opacity: 0; transform: translateX(-300px) translateY(300px) rotate(-45deg); }
        }
      `}</style>
    </div>
  );
}
