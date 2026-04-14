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
    loadProgress += Math.floor(Math.random() * 5) + 1;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      
      // Animate Loader Out
      gsap.to(loader, {
        yPercent: -100,
        duration: 1,
        ease: "power4.inOut",
        delay: 0.2,
        onComplete: initHeroAnimations
      });
    }
    loaderPercentage.textContent = loadProgress < 10 ? `0${loadProgress}%` : `${loadProgress}%`;
    loaderBar.style.width = `${loadProgress}%`;
  }, 30);


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

  // 3. Canvas Starfield
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
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
  for(let i = 0; i < 50; i++) {
    milkyWay.push(new MilkyWayCloud());
  }

  let bgPlanets = [];
  for(let i = 0; i < 6; i++) {
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
  for(let i=0; i<8; i++) meteors.push(new Meteor());

  for (let i = 0; i < 400; i++) {
    stars.push(new Star());
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
  let pw = pCanvas.width = 800;
  let ph = pCanvas.height = 800;
  let planetAngle = 0;

  function drawPlanet() {
    pCtx.clearRect(0, 0, pw, ph);
    let centerX = pw / 2;
    let centerY = ph / 2;
    let radius = 180;

    // Pulsing Atmosphere Halo
    let pulseAngle = planetAngle * 80; 
    let pulseRad = radius * 1.25 + Math.abs(Math.sin(pulseAngle)) * 15;
    
    let radGrad = pCtx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, pulseRad);
    radGrad.addColorStop(0, 'rgba(170, 108, 250, 0.4)');
    radGrad.addColorStop(1, 'transparent');
    pCtx.fillStyle = radGrad;
    pCtx.fillRect(0, 0, pw, ph);

    pCtx.save();
    pCtx.translate(centerX, centerY);
    
    // Setup planet circle clipping for body and clouds
    pCtx.save();
    pCtx.beginPath();
    pCtx.arc(0, 0, radius, 0, Math.PI * 2);
    pCtx.clip();
    
    // Planet Body - Brighter gradient so it's fully visible against deep space
    let planetGrad = pCtx.createLinearGradient(-radius, -radius, radius, radius);
    planetGrad.addColorStop(0, '#00f0ff'); // Bright Cyan
    planetGrad.addColorStop(0.5, '#aa6cfa'); // Vibrant Purple
    planetGrad.addColorStop(1, '#1a0533'); // Darker purple shadow
    pCtx.fillStyle = planetGrad;
    pCtx.fill();

    // Rotating Cloud Bands (Brighter clouds)
    pCtx.rotate(planetAngle * 1.5);
    pCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for(let j=0; j<8; j++) {
       pCtx.beginPath();
       pCtx.ellipse(0, (j-4)*35, radius * 1.8, 25, 0, 0, Math.PI*2);
       pCtx.fill();
    }
    // Deep shadow craters on opposite side
    pCtx.fillStyle = 'rgba(0,0,0,0.4)';
    pCtx.beginPath(); pCtx.arc(50, 50, 60, 0, Math.PI*2); pCtx.fill();
    pCtx.beginPath(); pCtx.arc(-80, 20, 80, 0, Math.PI*2); pCtx.fill();
    pCtx.restore(); // remove clip

    // Saturn Rings
    pCtx.save();
    pCtx.rotate(Math.PI / 8); 
    pCtx.scale(1, 0.25); // Squash for perspective 
    
    pCtx.lineWidth = 4;
    for(let r = 210; r < 350; r += 8) {
       pCtx.beginPath();
       pCtx.arc(0, 0, r, 0, Math.PI*2);
       let op = (Math.sin((r-210)/(140) * Math.PI * 6) * 0.4) + 0.3; // Higher base opacity
       // Brighter ring colors
       let rCol = r % 16 === 0 ? '255, 255, 255' : (r % 24 === 0 ? '0, 240, 255' : '170, 108, 250');
       pCtx.strokeStyle = `rgba(${rCol}, ${op})`;
       pCtx.stroke();
    }
    
    // Moons
    let mt = planetAngle * 60;
    let mt2 = planetAngle * 40 + Math.PI;
    
    let mx1 = Math.cos(mt) * 380;
    let my1 = Math.sin(mt) * 380; 
    let mx2 = Math.cos(mt2) * 260; 
    let my2 = Math.sin(mt2) * 260;

    pCtx.save();
    pCtx.scale(1, 4); // undo perspective squash
    
    pCtx.shadowBlur = 10;
    pCtx.shadowColor = '#ffffff';
    pCtx.beginPath(); pCtx.arc(mx1, my1/4, 6, 0, Math.PI*2); pCtx.fillStyle = '#ffffff'; pCtx.fill();
    
    pCtx.shadowColor = '#ff007f';
    pCtx.beginPath(); pCtx.arc(mx2, my2/4, 4, 0, Math.PI*2); pCtx.fillStyle = '#ff007f'; pCtx.fill();
    pCtx.restore();

    pCtx.restore();

    // Lens Flare
    let hx = -radius * 0.55;
    let hy = -radius * 0.55;
    pCtx.save();
    pCtx.translate(hx, hy);
    pCtx.fillStyle = '#ffffff';
    pCtx.shadowBlur = 15;
    pCtx.shadowColor = '#ffffff';
    pCtx.beginPath(); pCtx.arc(0, 0, 6, 0, Math.PI*2); pCtx.fill();
    
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    pCtx.lineWidth = 1.5;
    for(let a=0; a<Math.PI*2; a+=Math.PI/6) {
      pCtx.beginPath();
      pCtx.moveTo(0,0);
      let len = (a % (Math.PI/3) === 0) ? 80 : 40;
      pCtx.lineTo(Math.cos(a)*len, Math.sin(a)*len);
      pCtx.stroke();
    }
    pCtx.restore();

    pCtx.restore();

    planetAngle += 0.002;
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

  /* === UPGRADE: Advanced Canvas Draw Loop (Planet Rim, CRT + Wormhole) === */
  // Create Wormhole Canvas
  const wormCanv = document.createElement('canvas');
  wormCanv.id = 'wormholeCanvas';
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.prepend(wormCanv);
    const wCtx = wormCanv.getContext('2d');
    
    let time = 0;
    function updateAdvancedVisuals() {
      time += Math.PI / 180; // roughly increment angle
      
      // Wormhole draw
      if(wormCanv.width !== window.innerWidth) {
        wormCanv.width = window.innerWidth;
        wormCanv.height = contactSection.clientHeight;
      }
      wCtx.clearRect(0,0, wormCanv.width, wormCanv.height);
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
    sContainer.addEventListener('mousemove', (e) => {
      const rect = sContainer.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    sContainer.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    function getDistance(n1, n2) {
      let dx = n1.x - n2.x;
      let dy = n1.y - n2.y;
      return Math.sqrt(dx*dx + dy*dy);
    }

    function simulatePhysics() {
      const config = {
        repulsion: 4500, 
        springLength: 220, 
        springRestoringForce: 0.02, 
        centerGravity: 0.005, 
        friction: 0.85 
      };

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        let n1 = nodes[i];
        
        // Center gravity
        n1.vx += (sw/2 - n1.x) * config.centerGravity;
        n1.vy += (sh/2 - n1.y) * config.centerGravity;

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
