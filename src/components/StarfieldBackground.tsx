import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkle: number;
  twinkleSpeed: number;
  color: { r: number; g: number; b: number };
  layer: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
}

export const StarfieldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    const numStars = 200;  // Reduced from 500
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const getStarColor = () => {
      const colors = [
        { r: 255, g: 255, b: 255 },  // white
        { r: 200, g: 220, b: 255 },  // cool blue
        { r: 255, g: 240, b: 220 },  // warm white
        { r: 180, g: 200, b: 255 },  // blue
        { r: 255, g: 250, b: 240 },  // slight yellow
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        const layer = Math.floor(Math.random() * 3);
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width + canvas.width * 0.2,  // Start further away
          size: Math.random() * 1 + 0.3,  // Smaller stars
          opacity: Math.random() * 0.6 + 0.3,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.015 + 0.005,  // Slower twinkle
          color: getStarColor(),
          layer,
        });
      }
    };

    const createShootingStar = () => {
      if (Math.random() > 0.995) {  // Less frequent shooting stars
        const angle = Math.random() * Math.PI / 4 + Math.PI / 6;
        const speed = Math.random() * 8 + 12;
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          length: Math.random() * 60 + 80,
          opacity: 1,
          life: 1,
        });
      }
    };

    const animate = () => {
      time += 0.01;
      
      // Clear with more opacity for sharper look
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw stars with layers
      stars.forEach((star) => {
        const layerSpeed = 0.1 * (star.layer + 1);  // Slower, more distinct layers
        star.z -= layerSpeed;
        star.twinkle += star.twinkleSpeed;

        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - canvas.width / 2;
          star.y = Math.random() * canvas.height - canvas.height / 2;
          star.z = canvas.width + canvas.width * 0.2;
          star.opacity = Math.random() * 0.6 + 0.3;
          star.color = getStarColor();
        }

        const k = 128 / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const depth = 1 - star.z / canvas.width;
          const size = depth * star.size * 2;
          const twinkleEffect = Math.sin(star.twinkle) * 0.2 + 0.8;  // Subtler twinkle
          const opacity = depth * star.opacity * twinkleEffect;

          // Reduced glow - only for brighter stars
          if (opacity > 0.4) {
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
            gradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${opacity * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${opacity * 0.15})`);
            gradient.addColorStop(1, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, size * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw core
          ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // Only show trail for closest, fastest stars
          if (depth > 0.7) {
            const trailAlpha = (depth - 0.7) * 3.3 * opacity * 0.3;
            ctx.strokeStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${trailAlpha})`;
            ctx.lineWidth = size * 0.4;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - (px - centerX) * 0.02, py - (py - centerY) * 0.02);
            ctx.stroke();
          }
        }
      });

      // Draw shooting stars
      createShootingStar();
      shootingStars = shootingStars.filter((star) => {
        star.x += star.vx;
        star.y += star.vy;
        star.life -= 0.01;
        star.opacity = star.life;

        if (star.life > 0 && star.x > 0 && star.x < canvas.width && star.y > 0 && star.y < canvas.height) {
          const gradient = ctx.createLinearGradient(
            star.x,
            star.y,
            star.x - star.vx * 2,
            star.y - star.vy * 2
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
          gradient.addColorStop(0.5, `rgba(200, 220, 255, ${star.opacity * 0.6})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x - star.vx * 2, star.y - star.vy * 2);
          ctx.stroke();

          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.3})`;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;

          return true;
        }
        return false;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initStars();
    animate();

    const handleResize = () => {
      resizeCanvas();
      initStars();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(to bottom, #000000 0%, #0a0a14 50%, #000000 100%)' }}
    />
  );
};
