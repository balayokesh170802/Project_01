/* ==========================================================================
   ÆTHER STUDIO — PREMIUM DYNAMIC CANVAS GRID & INTERACTION (REVISED)
   ========================================================================== */

(function () {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Grid Configuration
  let cellWidth = 100;
  let cellHeight = 100;
  const cornerRadius = 16; // exactly 16px corner radius
  
  // Grid Blocks & State
  let blocks = [];
  let cols = 0;
  let rows = 0;
  let startX = 0;
  let startY = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;

  // Mouse Interaction State
  let mouseX = 0;
  let mouseY = 0;
  let mouseActive = false;
  let targetMouseX = 0;
  let targetMouseY = 0;

  // Generate grid cell layout dynamically based on current viewport columns, rows, and scroll Y
  function generateGrid() {
    blocks = [];
    // Compute current scroll boundaries in terms of rows
    const startRow = Math.floor(window.scrollY / cellHeight) - 2;
    const endRow = startRow + rows + 4;
    
    // Generate layout spanning the active viewport rows plus buffer padding
    for (let r = startRow; r <= endRow; r++) {
      for (let c = -2; c <= cols + 2; c++) {
        blocks.push({ c, r, w: 1, h: 1 });
      }
    }
  }

  // Pre-configured Faint Ambient Glow centers (Strategic background ambient lights)
  const ambientGlows = [
    { gridX: 3, gridY: 2, maxRadius: 180, phase: 0, speed: 0.0006 },        // Section 1
    { gridX: 12, gridY: 3, maxRadius: 220, phase: Math.PI / 4, speed: 0.0004 }, // Section 1
    { gridX: 6, gridY: 8, maxRadius: 200, phase: Math.PI / 2, speed: 0.0007 },  // Transition area
    { gridX: 2, gridY: 15, maxRadius: 210, phase: Math.PI * 0.75, speed: 0.0005 }, // Section 2
    { gridX: 11, gridY: 20, maxRadius: 190, phase: Math.PI, speed: 0.0006 },     // Section 2
    { gridX: 14, gridY: 28, maxRadius: 220, phase: Math.PI * 1.25, speed: 0.0004 }, // Section 3
    { gridX: 4, gridY: 34, maxRadius: 200, phase: Math.PI * 1.5, speed: 0.0005 },    // Section 3
    { gridX: 9, gridY: 42, maxRadius: 210, phase: Math.PI * 1.75, speed: 0.0006 },   // Section 4
    { gridX: 3, gridY: 52, maxRadius: 220, phase: Math.PI * 2, speed: 0.0005 }       // Section 5 (Contact)
  ];

  // Canvas Resize Handler
  function resizeCanvas() {
    // Read window viewport dimensions exactly
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas internal drawing resolution sharp (DPR applied only internally)
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    
    // Lock the CSS width and height to match window.innerWidth/innerHeight exactly (never DPR-scaled)
    canvas.style.width = viewportWidth + 'px';
    canvas.style.height = viewportHeight + 'px';
    
    ctx.scale(dpr, dpr);

    // Set cell size dynamically based on responsive breakpoints
    if (viewportWidth <= 768) {
      cellWidth = 60;
      cellHeight = 60;
    } else if (viewportWidth <= 1024) {
      cellWidth = 80;
      cellHeight = 80;
    } else {
      cellWidth = 100;
      cellHeight = 100;
    }

    // Calculate columns/rows and top-left offsets to center the grid
    cols = Math.ceil(viewportWidth / cellWidth) + 1;
    rows = Math.ceil(viewportHeight / cellHeight) + 1;
    startX = Math.floor((viewportWidth % cellWidth) / 2) - cellWidth;
    startY = Math.floor((viewportHeight % cellHeight) / 2) - cellHeight;

    generateGrid();
  }

  // Helper: Draw rounded rectangles
  function drawRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      // Fallback for older browsers
      ctx.rect(x, y, w, h);
    }
  }

  // Main Render Loop
  function render() {
    // Clear Canvas using correct viewport dimensions (no layout reflow triggers)
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    // Dynamically regenerate grid blocks matching current scroll Y offset
    generateGrid();

    // Smooth Mouse coordinates interpolation (adds inertia/fluidity)
    if (mouseActive) {
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
    }

    // 1. Draw static ambient glows in background (very subtle, max 5% opacity, scroll offset applied)
    ambientGlows.forEach(glow => {
      const x = startX + glow.gridX * cellWidth + cellWidth / 2;
      const y = startY + glow.gridY * cellHeight + cellHeight / 2 - window.scrollY;
      const time = Date.now();
      const breathing = Math.sin(time * glow.speed + glow.phase);
      
      // Calculate scroll proximity multiplier (Apple-level section entrance detail)
      const centerY = viewportHeight / 2;
      const distanceToCenter = Math.abs(y - centerY);
      let scrollMultiplier = 1;
      
      if (distanceToCenter < 500) {
        // factor rises from 0 to 1 as the section approaches viewport center
        const factor = 1 - (distanceToCenter / 500);
        scrollMultiplier = 1 + factor * 0.15; // up to 15% larger/brighter glow near center
      }
      
      const radius = glow.maxRadius * (0.85 + breathing * 0.15) * scrollMultiplier;
      const opacity = (0.038 + breathing * 0.012) * scrollMultiplier; // oscillates and scales dynamically
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(0, 102, 255, ${opacity})`);
      grad.addColorStop(1, 'rgba(0, 102, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Base Grid Lines (Subtle stroke-only, 1.8% white opacity, scroll offset applied)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
    ctx.lineWidth = 1;
    blocks.forEach(b => {
      const x = startX + b.c * cellWidth;
      const y = startY + b.r * cellHeight - window.scrollY;
      drawRoundRect(x, y, b.w * cellWidth, b.h * cellHeight, cornerRadius);
      ctx.stroke();
    });

    // 3. Draw Hover Spotlight overlay (illuminates borders near cursor, scroll offset applied)
    if (mouseActive) {
      const spotlightGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 220);
      spotlightGrad.addColorStop(0, 'rgba(27, 68, 246, 0.38)');  // brightened brand blue glow center
      spotlightGrad.addColorStop(0.35, 'rgba(27, 68, 246, 0.14)'); // fading blue
      spotlightGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.04)'); // subtle white highlight edge
      spotlightGrad.addColorStop(1, 'rgba(27, 68, 246, 0)');      // clean falloff

      ctx.strokeStyle = spotlightGrad;
      ctx.lineWidth = 1.5;
      blocks.forEach(b => {
        const x = startX + b.c * cellWidth;
        const y = startY + b.r * cellHeight - window.scrollY;
        const w = b.w * cellWidth;
        const h = b.h * cellHeight;
        
        // Performance optimization: only redraw lines within a 300px bounding box
        if (Math.abs(x + w / 2 - mouseX) < 300 && Math.abs(y + h / 2 - mouseY) < 300) {
          drawRoundRect(x, y, w, h, cornerRadius);
          ctx.stroke();
        }
      });
    }

    requestAnimationFrame(render);
  }

  // Interaction Event Listeners
  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
    
    // Set immediate positions on first mouse enter
    if (!mouseActive) {
      mouseX = targetMouseX;
      mouseY = targetMouseY;
      mouseActive = true;
    }
  });

  window.addEventListener('mouseleave', () => {
    mouseActive = false;
  });

  // Touch screen support (taps activate spotlight effect)
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      targetMouseX = e.touches[0].clientX;
      targetMouseY = e.touches[0].clientY;
      if (!mouseActive) {
        mouseX = targetMouseX;
        mouseY = targetMouseY;
        mouseActive = true;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouseActive = false;
  });

  // Initialization & Kickoff
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(render);

  // --- Mobile Navigation Hamburger Toggler ---
  const navToggle = document.querySelector('.nav-toggle');
  const siteHeader = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && siteHeader) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      siteHeader.classList.toggle('nav-open');
    });

    // Close mobile nav when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        siteHeader.classList.remove('nav-open');
      });
    });

    // Close menu when clicking outside of header
    document.addEventListener('click', (e) => {
      if (!siteHeader.contains(e.target)) {
        siteHeader.classList.remove('nav-open');
      }
    });
  }

  // --- Scroll Reveal Animation System ---
  const revealElements = document.querySelectorAll('.scroll-reveal');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Special logic for Process section: trigger timeline progressions
          if (entry.target.classList.contains('process-container') || entry.target.querySelector('.timeline-container')) {
            const timelineContainer = entry.target.querySelector('.timeline-container') || entry.target;
            const steps = entry.target.querySelectorAll('.process-step');
            if (timelineContainer && steps.length > 0) {
              // Wait for heading stagger (approx 300ms) before drawing line and activating steps
              setTimeout(() => {
                timelineContainer.classList.add('animate');
                steps.forEach((step, idx) => {
                  setTimeout(() => {
                    step.classList.add('active');
                  }, idx * 180); // Sequentially activates each circle
                });
              }, 300);
            }
          }
          
          revealObserver.unobserve(entry.target); // trigger animation only once
        }
      });
    }, {
      threshold: 0.12, // slightly earlier triggering for smooth entrance
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  }

  // --- Capabilities Section Network Hover Logic ---
  const networkNodes = document.querySelectorAll('.network-node');
  const centerHub = document.querySelector('.network-center-hub');
  
  if (networkNodes.length > 0 && centerHub) {
    networkNodes.forEach(node => {
      const lineId = node.getAttribute('data-line');
      const connectionLine = document.getElementById(lineId);
      
      node.addEventListener('mouseenter', () => {
        // 1. Activate laser data pulsing on matching connection path line
        if (connectionLine) connectionLine.classList.add('active');
        // 2. Trigger gentle pulse and restart expanding ripple animation
        centerHub.classList.remove('active');
        void centerHub.offsetWidth; // force DOM layout reflow to restart CSS animations perfectly
        centerHub.classList.add('active');
      });
      
      node.addEventListener('mouseleave', () => {
        // Revert all hover visual triggers
        if (connectionLine) connectionLine.classList.remove('active');
        centerHub.classList.remove('active');
      });
    });
  }

})();
