const ParticleManager = {
  particles: [],
  scorePopups: [],
  sparkles: [],
  rings: [],
  shimmers: [],

  spawnBlockBreak(x, y, colorIdx, count) {
    const numParticles = Math.min(count * 4, 40);
    const color = BLOCK_COLORS[colorIdx] || '#fff';
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.4,
        color,
        size: 2 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  },

  spawnScorePopup(x, y, score) {
    let size, color, glowColor, tier;
    if (score >= 70) {
      size = 48; color = '#ffd700'; glowColor = '#ffaa00'; tier = 4;
    } else if (score >= 50) {
      size = 40; color = '#ff6b6b'; glowColor = '#ff4444'; tier = 3;
    } else if (score >= 30) {
      size = 32; color = '#ffe66d'; glowColor = '#ffcc00'; tier = 2;
    } else {
      size = 24; color = '#4ecca3'; glowColor = '#44ddaa'; tier = 1;
    }

    this.scorePopups.push({
      x, y,
      score,
      life: 1.6,
      maxLife: 1.6,
      size,
      color,
      glowColor,
      tier,
      vy: -45,
      age: 0,
    });

    this.rings.push({
      x, y,
      maxRadius: 30 + tier * 20,
      life: 1.0,
      maxLife: 0.5 + tier * 0.15,
      color,
      lineWidth: 2 + tier,
    });

    if (tier >= 3) {
      this.rings.push({
        x, y,
        maxRadius: 20 + tier * 30,
        life: 1.0,
        maxLife: 0.4 + tier * 0.1,
        color: glowColor,
        lineWidth: 1 + tier * 0.5,
      });
    }

    const sparkleCount = tier === 1 ? 0 : tier === 2 ? 6 : tier === 3 ? 12 : 20;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.sparkles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.7 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 3,
        color: tier >= 4 ? '#ffd700' : color,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    if (tier >= 4) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.shimmers.push({
          x: x + Math.cos(angle) * 5,
          y: y + Math.sin(angle) * 5,
          vx: Math.cos(angle) * 80,
          vy: Math.sin(angle) * 80,
          life: 1.0,
          maxLife: 0.6,
          size: 3 + Math.random() * 2,
          color: '#fff8aa',
        });
      }
    }
  },

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      p.vx *= 0.96;
      p.rotation += p.rotSpeed * dt;
      p.life -= dt / p.maxLife;
      return p.life > 0;
    });

    this.scorePopups = this.scorePopups.filter(s => {
      s.age += dt;
      s.y += s.vy * dt;
      s.vy *= 0.93;
      s.life -= dt / s.maxLife;
      return s.life > 0;
    });

    this.sparkles = this.sparkles.filter(s => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 150 * dt;
      s.vx *= 0.95;
      s.twinkle += dt * 10;
      s.life -= dt / s.maxLife;
      return s.life > 0;
    });

    this.rings = this.rings.filter(r => {
      r.life -= dt / r.maxLife;
      return r.life > 0;
    });

    this.shimmers = this.shimmers.filter(s => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy *= 0.9;
      s.life -= dt / s.maxLife;
      return s.life > 0;
    });
  },

  render(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    this.rings.forEach(r => {
      const progress = 1 - r.life;
      const radius = r.maxRadius * (0.3 + progress * 0.7);
      ctx.save();
      ctx.globalAlpha = r.life * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth * r.life;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    this.sparkles.forEach(s => {
      const twinkle = 0.5 + Math.abs(Math.sin(s.twinkle)) * 0.5;
      ctx.save();
      ctx.globalAlpha = s.life * twinkle;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.shimmers.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.life * 5);
      const sz = s.size * s.life;
      ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2);
      ctx.fillRect(-sz / 4, -sz / 2, sz / 2, sz);
      ctx.restore();
    });

    this.scorePopups.forEach(s => {
      ctx.save();

      const entranceProgress = Math.min(s.age / 0.25, 1);
      const entranceScale = entranceProgress < 1
        ? 0.3 + (1 - Math.pow(1 - entranceProgress, 3)) * 0.9
        : 1 + Math.sin((s.age - 0.25) * 3) * 0.04;

      const alpha = s.life > 0.3 ? 1 : s.life / 0.3;
      ctx.globalAlpha = alpha;

      const fontSize = Math.floor(s.size * entranceScale);

      ctx.shadowColor = s.glowColor;
      ctx.shadowBlur = 15 + s.tier * 5;

      if (s.tier >= 3) {
        ctx.strokeStyle = s.glowColor;
        ctx.lineWidth = 2;
        ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(`+${s.score}`, s.x, s.y);
      }

      ctx.shadowBlur = 15 + s.tier * 5;
      ctx.fillStyle = s.color;
      ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${s.score}`, s.x, s.y);

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    ctx.globalAlpha = 1;
  },

  clear() {
    this.particles = [];
    this.scorePopups = [];
    this.sparkles = [];
    this.rings = [];
    this.shimmers = [];
  },
};
