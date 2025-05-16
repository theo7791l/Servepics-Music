
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  element: HTMLDivElement;
}

const BackgroundParticles = () => {
  const particlesRef = useRef<HTMLDivElement>(null);
  const particlesArray = useRef<Particle[]>([]);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!particlesRef.current) return;
    
    const containerEl = particlesRef.current;
    const numParticles = 20; // Adjust for performance
    
    // Create particles
    for (let i = 0; i < numParticles; i++) {
      createParticle(containerEl);
    }
    
    // Animation loop
    const animate = () => {
      particlesArray.current.forEach(updateParticle);
      rafId.current = requestAnimationFrame(animate);
    };
    
    rafId.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      
      particlesArray.current.forEach(particle => {
        particle.element.remove();
      });
      
      particlesArray.current = [];
    };
  }, []);
  
  function createParticle(containerEl: HTMLDivElement) {
    // Create particle element
    const element = document.createElement('div');
    element.className = 'particle';
    
    // Random size between 3 and 8px
    const size = Math.random() * 5 + 3;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    
    // Random position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    // Random speed (slower for a more ambient feel)
    const speedX = (Math.random() - 0.5) * 0.5;
    const speedY = (Math.random() - 0.5) * 0.5;
    
    containerEl.appendChild(element);
    
    // Add to our array
    particlesArray.current.push({
      x,
      y, 
      size,
      speedX,
      speedY,
      element
    });
  }
  
  function updateParticle(particle: Particle) {
    // Update position
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    
    // Check boundaries and bounce
    if (particle.x < 0 || particle.x > window.innerWidth) {
      particle.speedX = -particle.speedX;
    }
    
    if (particle.y < 0 || particle.y > window.innerHeight) {
      particle.speedY = -particle.speedY;
    }
    
    // Update the DOM element position
    particle.element.style.left = `${particle.x}px`;
    particle.element.style.top = `${particle.y}px`;
  }
  
  return <div className="particles" ref={particlesRef}></div>;
};

export default BackgroundParticles;
