import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, MessageSquare, ShieldCheck, User } from 'lucide-react';

const colors = {
  gold: '#f59e0b',
  teal: '#14b8a6',
  coral: '#f97316',
  muted: '#64748b'
};

export default function P31MeshClock({ userId, externalEvent, activeNodes = [] }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pendulumAngle = useRef(0);
  const pendulumVelocity = useRef(0);
  const particles = useRef([]);
  const lastSecond = useRef(-1);
  const [isClient, setIsClient] = useState(false);

  const triggerQuantumEvent = useCallback((title, subtitle, color, Icon) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create burst of particles
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.5;
      const velocity = 2 + Math.random() * 3;
      particles.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        color: color,
        size: 2 + Math.random() * 3,
        type: 'burst'
      });
    }

    // Create floating text label
    particles.current.push({
      x: canvas.width / 2,
      y: canvas.height / 2 - 60,
      vx: (Math.random() - 0.5) * 1,
      vy: -1.5,
      life: 3.0,
      decay: 0.005,
      color: color,
      size: 12,
      type: 'label',
      title: title,
      subtitle: subtitle,
      Icon: Icon
    });
  }, []);

  // Watch for events passed down from the Command Center
  useEffect(() => {
    if (!externalEvent) return;

    const { type, payload } = externalEvent;
    
    switch (type) {
      case 'message:new':
        triggerQuantumEvent(
          payload.decrypted ? 'Secure Payload' : 'Encrypted Burst', 
          `Data from ${payload.senderId}`, 
          payload.decrypted ? colors.teal : colors.muted, 
          MessageSquare
        );
        break;
      case 'typing:indicator':
        if (payload.typing) {
          triggerQuantumEvent('Wave Fluctuation', `${payload.userId} is transmitting`, colors.coral, Activity);
        }
        break;
      case 'commit':
        triggerQuantumEvent('Epoch Ratchet', `TreeKEM updated by ${payload.sender}`, colors.gold, ShieldCheck);
        break;
      case 'presence:changed':
        triggerQuantumEvent('Topology Shift', `${payload.userId} is ${payload.status}`, colors.gold, User);
        break;
    }
  }, [externalEvent, triggerQuantumEvent]);

  // Cuckoo bird particle burst (on the hour)
  const triggerCuckooBurst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25;
      const velocity = 3 + Math.random() * 4;
      particles.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 40,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        life: 1.5,
        decay: 0.02,
        color: colors.gold,
        size: 3 + Math.random() * 4,
        type: 'cuckoo'
      });
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const pendulumLength = Math.min(width, height) * 0.28;

    // Clear with fade effect
    ctx.fillStyle = 'rgba(5, 5, 8, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Draw connecting lines between active nodes
    if (activeNodes.length > 1) {
      ctx.strokeStyle = 'rgba(77, 184, 168, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
          const angle1 = (2 * Math.PI * i) / activeNodes.length - Math.PI / 2;
          const angle2 = (2 * Math.PI * j) / activeNodes.length - Math.PI / 2;
          const x1 = centerX + Math.cos(angle1) * pendulumLength * 0.6;
          const y1 = centerY + Math.sin(angle1) * pendulumLength * 0.6;
          const x2 = centerX + Math.cos(angle2) * pendulumLength * 0.6;
          const y2 = centerY + Math.sin(angle2) * pendulumLength * 0.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw pendulum arm
    const pendulumX = centerX + Math.sin(pendulumAngle.current) * pendulumLength;
    const pendulumY = centerY + Math.cos(pendulumAngle.current) * pendulumLength;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pendulumX, pendulumY);
    ctx.strokeStyle = 'rgba(77, 184, 168, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pendulum bob with glow
    const bobRadius = Math.min(width, height) * 0.025;
    const gradient = ctx.createRadialGradient(pendulumX, pendulumY, 0, pendulumX, pendulumY, bobRadius * 3);
    gradient.addColorStop(0, 'rgba(77, 184, 168, 0.8)');
    gradient.addColorStop(0.5, 'rgba(77, 184, 168, 0.3)');
    gradient.addColorStop(1, 'rgba(77, 184, 168, 0)');
    
    ctx.beginPath();
    ctx.arc(pendulumX, pendulumY, bobRadius * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pendulumX, pendulumY, bobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f766e';
    ctx.fill();
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw center node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(77, 184, 168, 0.5)';
    ctx.fill();

    // Draw active node indicators
    activeNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(activeNodes.length, 1) - Math.PI / 2;
      const x = centerX + Math.cos(angle) * pendulumLength * 0.6;
      const y = centerY + Math.sin(angle) * pendulumLength * 0.6;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#14b8a6';
      ctx.fill();
    });

    // Update and draw particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life);
      
      if (p.type === 'label') {
        ctx.font = '12px system-ui';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.title, p.x, p.y);
        ctx.font = '10px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(p.subtitle, p.x, p.y + 14);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Draw time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    ctx.font = 'bold 48px system-ui';
    ctx.fillStyle = '#14b8a6';
    ctx.textAlign = 'center';
    ctx.fillText(`${hours}:${minutes}:${seconds}`, centerX, centerY + pendulumLength + 60);

    ctx.font = '12px system-ui';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.fillText(`Node ${userId}`, centerX, centerY + pendulumLength + 85);

    // Cuckoo on the hour
    if (now.getSeconds() !== lastSecond.current) {
      lastSecond.current = now.getSeconds();
      if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        triggerCuckooBurst();
      }
    }

    // Pendulum physics
    const gravity = 0.0008;
    const damping = 0.999;
    const acceleration = -gravity * Math.sin(pendulumAngle.current);
    pendulumVelocity.current += acceleration;
    pendulumVelocity.current *= damping;
    pendulumAngle.current += pendulumVelocity.current;

    // Limit angle
    const maxAngle = Math.PI / 3;
    pendulumAngle.current = Math.max(-maxAngle, Math.min(maxAngle, pendulumAngle.current));

    animationRef.current = requestAnimationFrame(draw);
  }, [userId, triggerCuckooBurst, activeNodes]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  if (!isClient) {
    return <div className="w-full h-full bg-[#050508]" />;
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
