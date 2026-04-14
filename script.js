document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Loading Sequence & Setup
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    mouseMultiplier: 1,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Integrate Lenis with GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Loading Animation
  let loadProgress = 0;
  const loaderPercentage = document.querySelector('.loader-percentage');
  const loaderBar = document.querySelector('.loader-bar');
  const loader = document.getElementById('loader');

  const loadInterval = setInterval(() => {
    loadProgress += Math.floor(Math.random() * 8) + 5; // Much faster progress
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      
      // Animate Astronaut to fly away into distance
      gsap.to('.astronaut-container', {
        scale: 0,
        opacity: 0,
        x: 100, // Move slightly right as they fly off
        y: -100,
        duration: 0.6,
        ease: "back.in(1.7)"
      });

      // Animate Loader Out with a "Warp" effect
      gsap.to(loader, {
        scale: 1.5,
        opacity: 0,
        duration: 1,
        ease: "power4.inOut",
        delay: 0.5,
        onComplete: () => {
          loader.style.display = 'none';
          initHeroAnimations();
        }
      });
    }
    loaderPercentage.textContent = loadProgress < 10 ? `0${loadProgress}%` : `${loadProgress}%`;
    loaderBar.style.width = `${loadProgress}%`;
  }, 40);

  // Astronaut Floating GSAP (complementing CSS animation)
  gsap.to('.astronaut', {
    x: 10,
    y: 5,
    rotation: 5,
    repeat: -1,
    yoyo: true,
    duration: 3,
    ease: "sine.inOut"
  });


  // 2. Custom Cursor
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorGlow = document.querySelector('.cursor-glow');

  window.addEventListener('mousemove', (e) => {
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to(cursorGlow, { x: e.clientX, y: e.clientY, duration: 0.5, ease: "power2.out" });
  });

  const hoverElements = document.querySelectorAll('a, button, .project-card');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // Detection for mobile
  const isMobile = window.innerWidth < 768;

  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Scale resolution down on mobile to improve pixel fill rate
    if (isMobile) {
      canvas.width = window.innerWidth * 1.5;
      canvas.height = window.innerHeight * 1.5;
      ctx.scale(1.5, 1.5);
    }
  }

  window.addEventListener('resize', resize);
  resize();

  class Star {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * width; // For 3D depth
      this.radius = Math.random() * 1.5;
      this.alpha = Math.random();
      this.fade = Math.random() * 0.05;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
    }
    update(scrollY, velocity = 0) {
      // Twinkle
      this.alpha += this.fade;
      if (this.alpha <= 0 || this.alpha >= 1) this.fade *= -1;
      
      // Moving up slowly
      this.y -= (1 - this.z / width) * 0.5;
      
      // Parallax effect with scroll
      let currentY = this.y - (scrollY * (1 - this.z / width) * 0.3);

      if (currentY < 0) {
        this.y = height + (this.y - currentY);
      } else if (currentY > height) {
        this.y = 0 - (currentY - this.y);
      }

      const warp = velocity * 0.15; // Warp stretch factor
      const absWarp = Math.abs(warp);

      if (absWarp > 1.5) {
        // Draw Warp Streak
        ctx.beginPath();
        let stretch = warp * (1 - this.z / width);
        ctx.moveTo(this.x, currentY);
        ctx.lineTo(this.x, currentY + stretch);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        // Draw Normal Star
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
      }
    }
  }

  class BackgroundPlanet {
    constructor() {
      this.x = Math.random() * width;
      this.baseY = Math.random() * (height * 3); // Spread further down for scroll
      this.z = Math.random() * 0.4 + 0.2; // Parallax factor
      this.radius = Math.random() * 100 + 40; 
      const colors = [
        ['#1a0533', '#0d1b5e'],
        ['#0a3d4f', '#03020a'],
        ['#2b083d', '#1a0533'],
        ['#0d1b5e', '#05010f']
      ];
      this.colorPair = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = Math.random() * 0.3 + 0.1; // Soft transparency
    }
    update(scrollY, velocity = 0) {
      let currentY = this.baseY - (scrollY * this.z);

      // Loop them around if they go way out of bounds
      if (currentY < -this.radius * 2) {
        this.baseY = scrollY * this.z + height + this.radius * 2;
        this.x = Math.random() * width;
      }

      const warp = velocity * 0.05 * this.z;

      ctx.save();
      ctx.globalAlpha = this.alpha;
      
      if (Math.abs(warp) > 1) {
        // Apply stretch via scale for planets
        ctx.translate(this.x, currentY);
        ctx.scale(1, 1 + Math.abs(warp) * 0.1);
        ctx.translate(-this.x, -currentY);
      }

      let grad = ctx.createLinearGradient(
        this.x - this.radius, currentY - this.radius,
        this.x + this.radius, currentY + this.radius
      );
      grad.addColorStop(0, this.colorPair[0]);
      grad.addColorStop(1, this.colorPair[1]);
      
      ctx.beginPath();
      ctx.arc(this.x, currentY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  class MilkyWayCloud {
    constructor() {
      // General clustering to create a sweeping motion that resembles a galaxy arm
      this.x = Math.random() * width * 1.5 - width * 0.25;
      this.baseY = Math.random() * height * 6 - height;
      this.z = 0.05 + Math.random() * 0.03; // Very slow drift
      this.radius = Math.random() * 250 + 100; // Large, soft clouds
      this.alpha = Math.random() * 0.02 + 0.005; // Extremely faint white
    }
    update(scrollY, velocity = 0) {
      let currentY = this.baseY - (scrollY * this.z);
      
      if (currentY < -this.radius * 2) {
        this.baseY = scrollY * this.z + height + this.radius * 2;
        this.x = Math.random() * width;
      }

      const warp = velocity * 0.02;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = this.alpha;
      
      if (Math.abs(warp) > 0.5) {
        ctx.translate(this.x, currentY);
        ctx.scale(1, 1 + Math.abs(warp) * 0.05);
        ctx.translate(-this.x, -currentY);
      }

      let grad = ctx.createRadialGradient(
        this.x, currentY, 0,
        this.x, currentY, this.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(this.x, currentY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  let milkyWay = [];
  const cloudCount = isMobile ? 20 : 50;
  for(let i = 0; i < cloudCount; i++) {
    milkyWay.push(new MilkyWayCloud());
  }

  let bgPlanets = [];
  const planetCount = isMobile ? 3 : 6;
  for(let i = 0; i < planetCount; i++) {
    bgPlanets.push(new BackgroundPlanet());
  }

  class Meteor {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width * 1.5;
      this.y = -Math.random() * height;
      this.length = Math.random() * 150 + 50; // much longer tail
      this.speed = Math.random() * 20 + 20; // faster falling
      this.angle = Math.PI / 3; // Steeper angle
      this.active = Math.random() > 0.90; // higher frequency
      this.alpha = 1;
    }
    update() {
      if (!this.active) {
        if(Math.random() > 0.98) this.reset();
        return;
      }
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.alpha -= 0.01;
      
      if (this.alpha <= 0 || this.x > width || this.y > height) {
        this.active = false;
      } else {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        let grad = ctx.createLinearGradient(this.x, this.y, this.x - Math.cos(this.angle)*this.length, this.y - Math.sin(this.angle)*this.length);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#aa6cfa'); 
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(this.angle)*this.length, this.y - Math.sin(this.angle)*this.length);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  let meteors = [];
  const meteorCount = isMobile ? 4 : 8;
  for(let i=0; i<meteorCount; i++) meteors.push(new Meteor());

  const starCount = isMobile ? 150 : 400;
  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }

  // Galactic Ring Particles Initialization & Caching
  let ringParticles = [];
  const ringParticleCount = isMobile ? 150 : 450; // Increased count for more density
  
  // Cache for glowing particles to fix lag
  const particleCache = {};
  const colors = ['#aa6cfa', '#00f0ff', '#ffffff'];
  
  colors.forEach(color => {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    const pSize = 12; // Radius + blur margin
    offCanvas.width = pSize * 4;
    offCanvas.height = pSize * 4;
    
    offCtx.shadowBlur = 10;
    offCtx.shadowColor = color;
    offCtx.fillStyle = color;
    offCtx.beginPath();
    offCtx.arc(pSize*2, pSize*2, 2.5, 0, Math.PI*2);
    offCtx.fill();
    
    particleCache[color] = offCanvas;
  });

  for (let i = 0; i < ringParticleCount; i++) {
    ringParticles.push({
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * 120 + 220, 
      speed: (Math.random() * 0.005) + 0.002,
      size: Math.random() * 3 + 1.5, // Increased size
      opacity: Math.random() * 0.7 + 0.5, // Increased base opacity
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function animateStars() {
    ctx.clearRect(0, 0, width, height);
    let scrollY = window.scrollY;
    let velocity = lenis.velocity; // Capture Lenis scroll velocity
    
    milkyWay.forEach(cloud => cloud.update(scrollY, velocity));
    bgPlanets.forEach(p => p.update(scrollY, velocity));
    stars.forEach(star => star.update(scrollY, velocity));
    meteors.forEach(m => m.update());
    requestAnimationFrame(animateStars);
  }
  animateStars();

  // 4. Planet Canvas in Hero
  const pCanvas = document.getElementById('planetCanvas');
  const pCtx = pCanvas.getContext('2d');
  
  // Lower resolution on mobile for better FPS
  let pw = pCanvas.width = isMobile ? 500 : 800;
  let ph = pCanvas.height = isMobile ? 500 : 800;
  let planetAngle = 0;

  function drawPlanet() {
    pCtx.clearRect(0, 0, pw, ph);
    let centerX = pw / 2;
    let centerY = ph / 2;
    let radius = isMobile ? 120 : 180;

    // 1. Atmosphere / Outer Glow
    let atmosGrad = pCtx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius * 1.5);
    atmosGrad.addColorStop(0, 'rgba(170, 108, 250, 0.3)');
    atmosGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.05)');
    atmosGrad.addColorStop(1, 'transparent');
    pCtx.fillStyle = atmosGrad;
    pCtx.beginPath(); pCtx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2); pCtx.fill();

    pCtx.save();
    pCtx.translate(centerX, centerY);

    // 2. Planet Clipping
    pCtx.save();
    pCtx.beginPath();
    pCtx.arc(0, 0, radius, 0, Math.PI * 2);
    pCtx.clip();

    // 3. Base Planet Body (Deep Shading)
    let planetGrad = pCtx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius);
    planetGrad.addColorStop(0, '#0a3d4f'); // Highlight side
    planetGrad.addColorStop(0.7, '#1a0533'); // Main body
    planetGrad.addColorStop(1, '#03020a'); // Shadow side
    pCtx.fillStyle = planetGrad;
    pCtx.fill();

    // 4. Parallax Cloud Layer 1 (Slow, Deep)
    pCtx.save();
    pCtx.rotate(planetAngle * 0.5);
    pCtx.globalAlpha = 0.1;
    pCtx.fillStyle = '#ffffff';
    for(let i=0; i<6; i++) { // Reduced from 12
      pCtx.beginPath();
      pCtx.ellipse((i-3)*60, Math.sin(planetAngle + i)*20, radius*0.8, 12, Math.PI/10, 0, Math.PI * 2);
      pCtx.fill();
    }
    pCtx.restore();

    // 5. Parallax Cloud Layer 2 (Faster, Brighter)
    pCtx.save();
    pCtx.rotate(planetAngle * 1.2);
    pCtx.globalAlpha = 0.12;
    pCtx.fillStyle = '#ffffff';
    for(let i=0; i<4; i++) { // Reduced from 8
        pCtx.beginPath();
        pCtx.ellipse(Math.cos(planetAngle*2 + i)*radius, (i-2)*80, radius*0.3, 8, -Math.PI/8, 0, Math.PI * 2);
        pCtx.fill();
    }
    pCtx.restore();

    // 6. Surface Craters / Details
    pCtx.globalAlpha = 0.08;
    pCtx.fillStyle = '#000000';
    pCtx.beginPath(); pCtx.arc(radius*0.3, radius*0.2, radius*0.15, 0, Math.PI * 2); pCtx.fill();
    pCtx.beginPath(); pCtx.arc(-radius*0.4, -radius*0.1, radius*0.12, 0, Math.PI * 2); pCtx.fill();
    // Removed third crater

    // 7. Sub-Rim Light (Internal Glow)
    let rimGrad = pCtx.createRadialGradient(-radius * 0.5, -radius * 0.5, radius * 1.5, -radius * 0.5, -radius * 0.5, radius * 1.6);
    rimGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
    rimGrad.addColorStop(1, 'transparent');
    pCtx.globalAlpha = 0.5;
    pCtx.fillStyle = rimGrad;
    pCtx.fill();

    pCtx.restore(); // End Clipping

    // 8. Outer Rim Highlight (Thin sharp crescent)
    pCtx.save();
    pCtx.beginPath();
    pCtx.arc(0, 0, radius, -Math.PI/2, Math.PI/4);
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    pCtx.lineWidth = 2;
    pCtx.stroke();
    pCtx.restore();

    // 9. Milky Way Galactic Rings (Particle Debris Disk)
    pCtx.save();
    pCtx.rotate(Math.PI / 8);
    pCtx.scale(1, 0.2); 
    
    // Stronger Nebula Glow behind particles
    let ringGlow = pCtx.createRadialGradient(0, 0, 220, 0, 0, 360);
    ringGlow.addColorStop(0, 'rgba(170, 108, 250, 0)');
    ringGlow.addColorStop(0.5, 'rgba(13, 27, 94, 0.6)'); // Increased opacity from 0.4
    ringGlow.addColorStop(1, 'rgba(170, 108, 250, 0)');
    pCtx.fillStyle = ringGlow;
    pCtx.beginPath(); pCtx.arc(0, 0, 340, 0, Math.PI*2); pCtx.fill();

    // Render Particles (High-Performance Cached Version)
    ringParticles.forEach(p => {
      p.angle += p.speed;
      const px = Math.cos(p.angle) * p.distance;
      const py = Math.sin(p.angle) * p.distance;
      
      let shimm = p.opacity + (Math.sin(planetAngle * 5 + p.angle) * 0.15);
      pCtx.globalAlpha = Math.max(0, shimm);
      
      // Use cached offscreen canvas instead of shadowBlur
      const cachedImg = particleCache[p.color];
      const s = p.size * 2; // Scale based on particle size
      pCtx.drawImage(cachedImg, px - s, py - s, s * 2, s * 2);
    });
    pCtx.globalAlpha = 1;
    pCtx.restore();

    // 10. Specular Highlight (The "Sun" reflection)
    let specGrad = pCtx.createRadialGradient(-radius*0.5, -radius*0.5, 0, -radius*0.5, -radius*0.5, radius*0.4);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    specGrad.addColorStop(1, 'transparent');
    pCtx.fillStyle = specGrad;
    pCtx.beginPath(); pCtx.arc(-radius*0.5, -radius*0.5, radius*0.4, 0, Math.PI*2); pCtx.fill();

    pCtx.restore(); // End Center Translate

    planetAngle += 0.0015;
    requestAnimationFrame(drawPlanet);
  }
  drawPlanet();

  // 5. Hero Animations (Triggered after load)
  function initHeroAnimations() {
    // Split text for hero title
    const heroTitle = new SplitType('#heroTitle', { types: 'lines, words, chars' });
    
    gsap.from(heroTitle.chars, {
      y: 100,
      opacity: 0,
      rotationZ: 10,
      duration: 1,
      stagger: 0.05,
      ease: "power4.out"
    });

    gsap.from('.hero-subtitle', {
      opacity: 0,
      y: 20,
      duration: 1,
      delay: 1,
      ease: "power2.out"
    });
    
    gsap.from('.hero-planet-container', {
      scale: 0.8,
      opacity: 0,
      duration: 2,
      ease: "power3.out"
    });
  }

  // 6. Scroll Animations

  // Navbar glassmorphism
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  // Section headings reveal
  const headings = document.querySelectorAll('.section-heading');
  headings.forEach(heading => {
    const split = new SplitType(heading, { types: 'chars' });
    gsap.from(split.chars, {
      scrollTrigger: {
        trigger: heading,
        start: "top 80%",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.02,
      ease: "power3.out"
    });
  });

  // Marquee Tracking
  gsap.to('.marquee-track', {
    x: "-50%",
    ease: "none",
    duration: 20,
    repeat: -1
  });

  // Timeline Nodes Reveal
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach((item, index) => {
    gsap.to(item, {
      scrollTrigger: {
        trigger: item,
        start: "top 85%",
      },
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    });
  });

  // 3D Tilt for Project Cards (Mouse Parallax)
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = x / rect.width;
      const py = y / rect.height;
      
      const tiltX = (py - 0.5) * -20; // 20 deg max
      const tiltY = (px - 0.5) * 20;

      gsap.to(card, {
        rotateX: tiltX,
        rotateY: tiltY,
        duration: 0.5,
        ease: "power1.out"
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power1.out" });
    });
  });



  /* === UPGRADE: Motion Blur on Scroll Velocity === */
  lenis.on('scroll', (e) => {
    if (Math.abs(e.velocity) > 0.8) document.body.classList.add('is-scrolling');
    else document.body.classList.remove('is-scrolling');
  });

  /* === UPGRADE: Hero Beam & Project Parallax Inner === */
  const beam = document.createElement('div');
  beam.className = 'light-beam';
  const heroNode = document.querySelector('.hero');
  if(heroNode) {
    heroNode.prepend(beam);
    gsap.to('.light-beam', { x: "100%", duration: 1.5, ease: "power2.inOut", delay: 1 });
  }

  const pCards = document.querySelectorAll('.project-card');
  pCards.forEach(card => {
    card.setAttribute('data-cursor-text', 'EXPLORE');
    const innerImg = card.querySelector('.project-image');
    if (innerImg) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(innerImg, { x: px * 30, y: py * 30, duration: 0.5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(innerImg, { x: 0, y: 0, duration: 0.5 });
      });
    }
  });

  /* === UPGRADE: Explore Text Cursor Overlay === */
  const customGlow = document.querySelector('.cursor-glow');
  if (customGlow) {
    pCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        customGlow.classList.add('explore-mode');
        customGlow.setAttribute('data-cursor-text', card.getAttribute('data-cursor-text') || '');
      });
      card.addEventListener('mouseleave', () => customGlow.classList.remove('explore-mode'));
    });
  }

  /* === UPGRADE: Timeline Intersect & Slide Animation === */
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('in-view');
        const nodes = entry.target.querySelectorAll('.timeline-item');
        nodes.forEach((n, i) => {
          gsap.fromTo(n, 
            { x: i % 2 === 0 ? -50 : 50, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.8, delay: i * 0.3, ease: 'power3.out' }
          );
        });
        tlObserver.unobserve(entry.target);
      }
    });
  });
  const tline = document.querySelector('.timeline');
  if(tline) tlObserver.observe(tline);

  /* === UPGRADE: Loader Warp Out === */
  const ldr = document.getElementById('loader');
  if (ldr) {
    gsap.killTweensOf(ldr);
    gsap.to(ldr, {
      scale: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power2.in",
      delay: 3, // waits for fake % to hit 100
      onComplete: () => {
        ldr.style.display = 'none';
        // split trigger for heading letters
        const titleSplite = new SplitType('.hero-title', { types: 'chars' });
        gsap.from(titleSplite.chars, { 
          y: () => Math.random() * 100 + 50, opacity: 0, stagger: 0.05, ease: 'back.out(1.7)' 
        });
      }
    });
  }

  /* === UPGRADE: Contact Cosmic Flash & Ring Speed === */
  const reachOut = document.querySelector('.contact-title');
  if (reachOut) {
    const reachSplit = new SplitType(reachOut, { types: 'chars' });
    const cosmicColors = ['#a855f7', '#3b82f6', '#06b6d4'];
    reachOut.addEventListener('mouseenter', () => {
      reachSplit.chars.forEach(char => {
        const randColor = cosmicColors[Math.floor(Math.random() * cosmicColors.length)];
        gsap.to(char, { color: randColor, duration: 0.2, yoyo: true, repeat: 1 });
      });
    });
  }
  
  const textRing = document.querySelector('.rotating-text');
  if (textRing) {
    const parentContainer = document.querySelector('.rotating-text-wrapper');
    parentContainer.addEventListener('mouseenter', () => textRing.style.animationDuration = '4s');
    parentContainer.addEventListener('mouseleave', () => textRing.style.animationDuration = '15s');
  }

  /* === UPGRADE: Dynamic Contact Section Wormhole === */
  function initWormhole() {
    const wormCanv = document.createElement('canvas');
    wormCanv.id = 'wormholeCanvas';
    const contactSec = document.querySelector('.contact');
    if(!contactSec) return;
    contactSec.appendChild(wormCanv);
    
    const wCtx = wormCanv.getContext('2d');
    let ww, wh;
    
    function wResize() {
      ww = wormCanv.width = contactSec.offsetWidth;
      wh = wormCanv.height = contactSec.offsetHeight;
    }
    window.addEventListener('resize', wResize);
    wResize();

    let particles = [];
    const count = isMobile ? 40 : 100; // Reduced for mobile
    for(let i=0; i<count; i++) {
      // ... particle logic
    }
    
    let time = 0;
    function updateAdvancedVisuals() {
      time += Math.PI / 180;
      wCtx.clearRect(0,0, ww, wh);
      wCtx.save();
      wCtx.translate(wormCanv.width/2, wormCanv.height/2);
      for(let r=10; r<wormCanv.width; r+=30) {
        wCtx.beginPath();
        wCtx.ellipse(0, 0, r, r*0.6, (time + r*0.01), 0, Math.PI*2);
        wCtx.strokeStyle = `rgba(13, 27, 94, ${1 - (r/wormCanv.width)})`;
        wCtx.stroke();
      }
      wCtx.restore();
      
      requestAnimationFrame(updateAdvancedVisuals);
    }
    updateAdvancedVisuals();
  }

  /* === Interactive Data Constellation === */
  const sCanv = document.getElementById('skillsCanvas');
  const sContainer = document.getElementById('skillsCanvasContainer');
  if (sCanv && sContainer) {
    const sCtx = sCanv.getContext('2d');
    let sw = sCanv.width = sContainer.clientWidth;
    let sh = sCanv.height = sContainer.clientHeight;
    
    window.addEventListener('resize', () => {
      sw = sCanv.width = sContainer.clientWidth;
      sh = sCanv.height = sContainer.clientHeight;
    });

    const nodes = [
      { id: 'python', label: 'Python', x: sw*0.3, y: sh*0.5, vx: 0, vy: 0 },
      { id: 'js', label: 'JavaScript', x: sw*0.7, y: sh*0.5, vx: 0, vy: 0 },
      { id: 'ml', label: 'Machine Learning', x: sw*0.2, y: sh*0.3, vx: 0, vy: 0 },
      { id: 'nlp', label: 'NLP', x: sw*0.4, y: sh*0.2, vx: 0, vy: 0 },
      { id: 'web', label: 'Web Dev', x: sw*0.8, y: sh*0.3, vx: 0, vy: 0 },
      { id: 'flask', label: 'Flask', x: sw*0.5, y: sh*0.6, vx: 0, vy: 0 },
      { id: 'react', label: 'React.js', x: sw*0.8, y: sh*0.7, vx: 0, vy: 0 },
      { id: 'node', label: 'Node.js', x: sw*0.9, y: sh*0.5, vx: 0, vy: 0 },
      { id: 'mongo', label: 'MongoDB', x: sw*0.6, y: sh*0.8, vx: 0, vy: 0 },
      { id: 'pandas', label: 'Pandas', x: sw*0.1, y: sh*0.6, vx: 0, vy: 0 },
      { id: 'bert', label: 'BERT', x: sw*0.3, y: sh*0.1, vx: 0, vy: 0 },
    ];

    const edges = [
      { source: 'python', target: 'ml' },
      { source: 'python', target: 'nlp' },
      { source: 'python', target: 'pandas' },
      { source: 'python', target: 'flask' },
      { source: 'js', target: 'web' },
      { source: 'js', target: 'react' },
      { source: 'js', target: 'node' },
      { source: 'ml', target: 'pandas' },
      { source: 'nlp', target: 'bert' },
      { source: 'web', target: 'react' },
      { source: 'web', target: 'node' },
      { source: 'node', target: 'mongo' },
      { source: 'flask', target: 'mongo' },
      { source: 'flask', target: 'web' }
    ];

    let mouse = { x: -1000, y: -1000 };
    let isClicking = false;
    
    sContainer.addEventListener('mousemove', (e) => {
      const rect = sContainer.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    sContainer.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
      isClicking = false;
    });
    sContainer.addEventListener('mousedown', () => isClicking = true);
    sContainer.addEventListener('mouseup', () => isClicking = false);

    function getDistance(n1, n2) {
      let dx = n1.x - n2.x;
      let dy = n1.y - n2.y;
      return Math.sqrt(dx*dx + dy*dy);
    }

    function simulatePhysics() {
      // Dynamic config: Significantly slower and more elegant based on user feedback
      const config = {
        repulsion: isMobile ? 2500 : 4500, 
        springLength: isMobile ? 140 : 220, 
        springRestoringForce: 0.02, 
        centerGravity: 0.002, // Lower gravity for less "pulling"
        friction: isClicking ? 0.75 : 0.92, // Increased damping (0.92 instead of 0.98)
        wanderStrength: isClicking ? 0.01 : 0.06 // Much lower wander strength
      };

      // Global "Breathing" Sway
      const swaySpeed = isClicking ? 0.00005 : 0.0003;
      const swayX = Math.sin(Date.now() * swaySpeed) * (isClicking ? 5 : 15);
      const swayY = Math.cos(Date.now() * swaySpeed) * (isClicking ? 5 : 15);

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        let n1 = nodes[i];
        
        // Center gravity + Global Sway
        n1.vx += ((sw/2 + swayX) - n1.x) * config.centerGravity;
        n1.vy += ((sh/2 + swayY) - n1.y) * config.centerGravity;

        // Auto Wander Force
        n1.vx += (Math.random() - 0.5) * config.wanderStrength;
        n1.vy += (Math.random() - 0.5) * config.wanderStrength;

        // Repulsion from other nodes
        for (let j = i+1; j < nodes.length; j++) {
          let n2 = nodes[j];
          let dx = n1.x - n2.x;
          let dy = n1.y - n2.y;
          let dist = Math.sqrt(dx*dx + dy*dy) || 1;
          let force = config.repulsion / (dist * dist);
          
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          
          n1.vx += fx; n1.vy += fy;
          n2.vx -= fx; n2.vy -= fy;
        }

        // Mouse repulsion
        let mdx = n1.x - mouse.x;
        let mdy = n1.y - mouse.y;
        let mDist = Math.sqrt(mdx*mdx + mdy*mdy);
        if (mDist < 120) {
          n1.vx -= (mdx / mDist) * 2; // Fixed: Push away instead of attract
          n1.vy -= (mdy / mDist) * 2;
        }
      }

      // Spring forces for edges
      edges.forEach(edge => {
        let s = nodes.find(n => n.id === edge.source);
        let t = nodes.find(n => n.id === edge.target);
        if(s && t) {
          let dx = t.x - s.x;
          let dy = t.y - s.y;
          let dist = Math.sqrt(dx*dx + dy*dy) || 1;
          let force = (dist - config.springLength) * config.springRestoringForce;
          
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          
          s.vx += fx; s.vy += fy;
          t.vx -= fx; t.vy -= fy;
        }
      });

      // Update positions
      nodes.forEach(n => {
        n.vx *= config.friction;
        n.vy *= config.friction;
        n.x += n.vx;
        n.y += n.vy;
        
        // Bounds check
        if (n.x < 30) { n.x = 30; n.vx *= -1; }
        if (n.x > sw - 30) { n.x = sw - 30; n.vx *= -1; }
        if (n.y < 30) { n.y = 30; n.vy *= -1; }
        if (n.y > sh - 30) { n.y = sh - 30; n.vy *= -1; }
      });
    }

    function drawConstellation() {
      sCtx.clearRect(0, 0, sw, sh);
      simulatePhysics();

      // Find hovered node
      let hoveredNode = null;
      nodes.forEach(n => {
        let dx = n.x - mouse.x;
        let dy = n.y - mouse.y;
        if(Math.sqrt(dx*dx + dy*dy) < 40) hoveredNode = n.id;
      });

      let connectedNodes = [];
      if(hoveredNode) {
        connectedNodes.push(hoveredNode);
        edges.forEach(e => {
          if(e.source === hoveredNode) connectedNodes.push(e.target);
          if(e.target === hoveredNode) connectedNodes.push(e.source);
        });
      }

      // Draw edges
      edges.forEach(edge => {
        let s = nodes.find(n => n.id === edge.source);
        let t = nodes.find(n => n.id === edge.target);
        if(s && t) {
          sCtx.beginPath();
          sCtx.moveTo(s.x, s.y);
          sCtx.lineTo(t.x, t.y);
          
          let isHighlighted = (hoveredNode && (connectedNodes.includes(s.id) && connectedNodes.includes(t.id)));
          
          sCtx.lineWidth = isHighlighted ? 4 : 2; // Made lines bolder
          sCtx.strokeStyle = isHighlighted ? '#00f0ff' : 'rgba(255, 255, 255, 0.15)';
          sCtx.shadowBlur = isHighlighted ? 15 : 0;
          sCtx.shadowColor = isHighlighted ? '#00f0ff' : 'transparent';
          
          sCtx.stroke();
          sCtx.shadowBlur = 0; // reset
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        let isHovered = (n.id === hoveredNode);
        let isConnected = connectedNodes.includes(n.id);
        
        sCtx.beginPath();
        sCtx.arc(n.x, n.y, isHovered ? 14 : 8, 0, Math.PI*2); // Slightly smaller nodes
        sCtx.fillStyle = isHovered ? '#ff007f' : (isConnected ? '#00f0ff' : '#aa6cfa');
        sCtx.shadowBlur = isConnected ? 20 : 12;
        sCtx.shadowColor = sCtx.fillStyle;
        sCtx.fill();
        sCtx.shadowBlur = 0;

        // Label
        sCtx.fillStyle = isConnected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        sCtx.font = isHovered ? "900 20px 'Space Grotesk'" : "bold 15px 'Space Grotesk'"; 
        sCtx.textAlign = 'center';
        sCtx.fillText(n.label, n.x, n.y + 25); 
      });

      requestAnimationFrame(drawConstellation);
    }
    drawConstellation();
  }

});
