
    /* ── PARTICLE NETWORK ── */
    (function() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const canvas = document.getElementById('particleCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let W, H, particles;
      const COUNT = (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches) ? 30 : 72;
      const MAX_DIST = 150;
      const MOUSE_RADIUS = 130;
      let mouse = { x: null, y: null };

      function resize() {
        const hero = canvas.closest('.hero');
        W = canvas.width  = hero.offsetWidth;
        H = canvas.height = hero.offsetHeight;
      }

      class Particle {
        constructor() { this.init(); }
        init() {
          this.x  = Math.random() * W;
          this.y  = Math.random() * H;
          this.vx = (Math.random() - 0.5) * 0.35;
          this.vy = (Math.random() - 0.5) * 0.35;
          this.r  = Math.random() * 1.2 + 0.5;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.x < 0 || this.x > W) this.vx *= -1;
          if (this.y < 0 || this.y > H) this.vy *= -1;
          if (mouse.x !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < MOUSE_RADIUS && d > 0) {
              const force = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
              this.x += (dx / d) * force * 1.8;
              this.y += (dy / d) * force * 1.8;
            }
          }
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fill();
        }
      }

      function init() {
        resize();
        particles = Array.from({ length: COUNT }, () => new Particle());
      }

      function drawLines() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < MAX_DIST) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(255,255,255,${(1 - d / MAX_DIST) * 0.18})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      let running = true, rafId = null;
      function loop() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        rafId = requestAnimationFrame(loop);
      }

      window.addEventListener('resize', () => { resize(); particles.forEach(p => p.init()); });
      document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      document.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
      init();
      loop();

      /* Pause the particle loop (and background orbs) while the hero is off-screen */
      const heroEl = canvas.closest('.hero');
      if (heroEl && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            document.body.classList.toggle('hero-hidden', !e.isIntersecting);
            if (e.isIntersecting) {
              if (!running) { running = true; loop(); }
            } else {
              running = false;
              if (rafId) cancelAnimationFrame(rafId);
            }
          });
        }, { threshold: 0 }).observe(heroEl);
      }
    })();

    /* ── CURSOR GLOW (rAF-throttled, transform-based, desktop-only) ── */
    (function () {
      const glow = document.getElementById('cursorGlow');
      if (!glow || window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
      let gx = window.innerWidth / 2, gy = window.innerHeight / 2, queued = false;
      document.addEventListener('mousemove', (e) => {
        gx = e.clientX; gy = e.clientY;
        if (!queued) {
          queued = true;
          requestAnimationFrame(() => {
            glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0) translate(-50%,-50%)';
            queued = false;
          });
        }
      }, { passive: true });
    })();

    /* ── COOKIE CONSENT ── */
    (function() {
      const stored = localStorage.getItem('alsflow_consent');
      if (stored === 'granted') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
      } else if (stored === 'denied') {
        /* stay denied */
      } else {
        setTimeout(() => document.getElementById('cookieBanner').classList.add('show'), 1400);
      }
    })();

    window.cookieAccept = function() {
      localStorage.setItem('alsflow_consent', 'granted');
      gtag('consent', 'update', { analytics_storage: 'granted' });
      document.getElementById('cookieBanner').classList.remove('show');
    };
    window.cookieDecline = function() {
      localStorage.setItem('alsflow_consent', 'denied');
      document.getElementById('cookieBanner').classList.remove('show');
    };

    /* ── NAV scroll shrink ── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    });

    /* ── CYCLING EYEBROW TEXT ── */
    const cycleWords = ['kadeřníky', 'veterináře', 'fyzioterapeuty', 'zubní ordinace', 'salony krásy'];
    let cycleIdx = 0;
    const cycleEl = document.getElementById('cyclingWord');
    setInterval(() => {
      cycleEl.style.opacity = '0';
      cycleEl.style.transform = 'translateY(8px)';
      setTimeout(() => {
        cycleIdx = (cycleIdx + 1) % cycleWords.length;
        cycleEl.textContent = cycleWords[cycleIdx];
        cycleEl.style.opacity = '1';
        cycleEl.style.transform = 'translateY(0)';
      }, 290);
    }, 2200);

    /* ── REVEAL ON SCROLL ── */
    // FIX: Lowered threshold from 0.1 to 0.01 so tall layout components trigger instantly when entering frame
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.01 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* ── PAUSE OFF-SCREEN SECTION ANIMATIONS ── */
    (function () {
      if (!('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.target.classList.toggle('anim-off', !e.isIntersecting));
      }, { rootMargin: '160px 0px' });
      document.querySelectorAll('section, footer').forEach((s) => io.observe(s));
    })();

    /* ── COUNTER ANIMATION ── */
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.target;
        let current = 0;
        const step = target / 55;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = target >= 100 ? Math.floor(current).toLocaleString() : Math.floor(current);
          if (current >= target) clearInterval(timer);
        }, 18);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

    /* ── 3D CARD TILT ── */
    document.querySelectorAll('.persona-card, .pricing-card, .feat-card, .step-card').forEach(card => {
      const liftY = card.classList.contains('pricing-card') ? -6 : card.classList.contains('step-card') ? -4 : 0;
      const intensity = card.classList.contains('feat-card') ? 8 : 10;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(8px) translateY(${liftY}px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.55s ease, box-shadow 0.3s ease';
        setTimeout(() => { card.style.transition = ''; }, 550);
      });
    });

    /* ── PRICING BUTTON: prevent tilt conflict ── */
    document.querySelectorAll('.pricing-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => e.stopPropagation());
      btn.addEventListener('mouseenter', () => {
        const card = btn.closest('.pricing-card');
        if (card) card.style.transform = '';
      });
    });

    /* ── MAGNETIC BUTTONS ── */
    document.querySelectorAll('.nav-cta, .btn-primary-lg').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.45s ease, box-shadow 0.2s';
        setTimeout(() => { btn.style.transition = ''; }, 450);
      });
    });

    /* ── MINI REPLY IN FEATURE CARD ── */
    window.showReplyDemo = function(btn) {
      const box = document.getElementById('miniReplyBox');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
      btn.textContent = box.style.display === 'none' ? '◆ AI odpověď' : '✕ Skrýt';
    };

    /* ── DEMO TAB SWITCH ── */
    window.switchDemo = function(tab, btn) {
      document.querySelectorAll('.demo-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.demo-pane').forEach(p => p.classList.remove('active'));
      document.getElementById('pane-' + tab).classList.add('active');
    };

    /* ── EMAIL DEMO ── */
    const emailReplies = [
      `Dobrý den, Kateřino,<br><br>děkuji za zájem! Ve středu od 10:00 a ve čtvrtek od 14:00 mám volno — hodí se vám některý z termínů? Potvrďte prosím a pošlu vám potvrzení.<br><br>S pozdravem`,
      `Dobrý den, Marku,<br><br>první návštěva stojí 850 Kč a trvá přibližně 45 minut. Zahrnuje vstupní konzultaci a ošetření. Chcete rovnou naplánovat termín?<br><br>S pozdravem`,
      `Dobrý den, Lenko,<br><br>samozřejmě, termín přesuneme. V příštím týdnu mám volno v pondělí 10:00 nebo v úterý 15:00 — co vám vyhovuje víc?<br><br>S pozdravem`
    ];
    window.selectEmail = function(row, idx) {
      document.querySelectorAll('.demo-email-row').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
    };
    window.generateReply = function(e, idx) {
      e.stopPropagation();
      selectEmail(e.target.closest('.demo-email-row'), idx);
      const area = document.getElementById('aiReplyArea');
      const text = document.getElementById('aiReplyText');
      area.classList.remove('show');
      document.getElementById('sentMsg').style.display = 'none';
      setTimeout(() => {
        text.innerHTML = emailReplies[idx];
        area.classList.add('show');
      }, 340);
    };
    window.showSent = function() {
      document.getElementById('aiReplyArea').classList.remove('show');
      const msg = document.getElementById('sentMsg');
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 3500);
    };

    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── AI RECEPCE DEMO ── */
    const calResponses = {
      'Kdy máte volno tento týden?': '◷ Volné termíny tento týden:<br>• Středa <strong>10:00</strong> a <strong>15:30</strong><br>• Čtvrtek <strong>09:00</strong> a <strong>14:00</strong><br>• Pátek <strong>11:00</strong><br>Který vám vyhovuje?',
      'Zarezervuj mi pátek 14:00': '✓ Hotovo! <strong>Pátek 14:00</strong> je zarezervováno. Potvrzení vám přijde na e-mail. Připomínku pošlu ve čtvrtek večer.',
      'Kolik stojí ošetření?': '◆ Ceník:<br>• Základní ošetření: <strong>850 Kč</strong> (45 min)<br>• Prodloužené ošetření: <strong>1 200 Kč</strong> (75 min)<br>• První návštěva se vstupní konzultací: <strong>950 Kč</strong>',
      'Chci zrušit termín ve čtvrtek': '✕ Zrušeno: váš <strong>čtvrteční termín</strong> byl zrušen. Chcete rovnou najít náhradní termín?',
      'Kde vás najdu?': '📍 Najdete nás na adrese <strong>Mánesova 12, Praha 2</strong>. MHD: metro Náměstí Míru (výstup A). Parkování na ulici.',
    };

    window.sendDemo = function(text) {
      const input = document.getElementById('calInput');
      const msg = text || input.value.trim();
      if (!msg) return;
      input.value = '';
      const wrap = document.getElementById('demoChatWrap');
      const userBubble = document.createElement('div');
      userBubble.className = 'demo-bubble user';
      userBubble.textContent = msg;
      wrap.appendChild(userBubble);
      wrap.scrollTop = wrap.scrollHeight;
      
      const typing = document.createElement('div');
      typing.className = 'demo-bubble bot';
      typing.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
      wrap.appendChild(typing);
      wrap.scrollTop = wrap.scrollHeight;

      setTimeout(() => {
        typing.remove();
        const botBubble = document.createElement('div');
        botBubble.className = 'demo-bubble bot';
        const reply = calResponses[msg] || `Na tohle mám v ukázce jen připravené odpovědi. 🙂 Skutečný AI bot odpoví na cokoliv — otevřete chat vpravo dole tlačítkem „Otevřít chat".`;
        botBubble.innerHTML = reply;
        wrap.appendChild(botBubble);
        wrap.scrollTop = wrap.scrollHeight;
      }, 880);
    };


    /* ── HAMBURGER MENU ── */
    window.toggleMenu = function() {
      const btn  = document.getElementById('hamburger');
      const menu = document.getElementById('mobileMenu');
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    window.closeMenu = function() {
      document.getElementById('hamburger').classList.remove('open');
      document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
      document.getElementById('mobileMenu').classList.remove('open');
      document.body.style.overflow = '';
    };
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });

    /* ── CONTACT MODAL ── */
    const serviceMap = {
      'recepce':  'recepce',
      'email':    'email_bot',
      'feedback': 'feedback',
      'bundle':   'bundle',
      'custom':   'custom',
      'demo':     ''
    };
    const headlineMap = {
      'recepce':  'Začněte s Rezervacemi & Připomínkami',
      'email':    'Začněte s E-mailovými odpověďmi',
      'feedback': 'Začněte se Zpětnou vazbou',
      'bundle':   'Získejte bundle nabídku',
      'custom':   'Poptejte bota na míru',
      'demo':     'Nezávazná konzultace'
    };

    window.openModal = function(source) {
      const modal   = document.getElementById('contactModal');
      const svcSel  = document.getElementById('f-service');
      const hl      = document.getElementById('modalHeadline');
      
      document.getElementById('contactForm').reset();
      document.getElementById('modalFormInner').classList.remove('hide');
      document.getElementById('modalSuccess').classList.remove('show');
      document.getElementById('modalSubmit').disabled = false;
      document.getElementById('modalSubmit').textContent = 'Odeslat a čekat na nabídku →';
      
      if (headlineMap[source]) hl.textContent = headlineMap[source];
      if (serviceMap[source])  svcSel.value = serviceMap[source];
      
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (window.__lenis) window.__lenis.stop(); // Lenis hijacks the wheel — stop it so the page behind doesn't scroll
      setTimeout(() => document.getElementById('f-name').focus(), 120);
    };

    window.closeModal = function() {
      document.getElementById('contactModal').classList.remove('open');
      document.body.style.overflow = '';
      if (window.__lenis) window.__lenis.start(); // resume smooth scroll
    };
    window.handleOverlayClick = function(e) {
      if (e.target === document.getElementById('contactModal')) closeModal();
    };
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      if (!this.checkValidity()) { this.reportValidity(); return; }
      const btn = document.getElementById('modalSubmit');
      btn.disabled = true;
      btn.textContent = 'Odesílám…';
      
      const payload = {
        name:    document.getElementById('f-name').value,
        email:   document.getElementById('f-email').value,
        phone:   document.getElementById('f-phone').value || '',
        city:    document.getElementById('f-city').value,
        urgency: document.getElementById('f-urgency').value,
        biz:     document.getElementById('f-biz').value,
        size:    document.getElementById('f-size').value,
        service: document.getElementById('f-service').value,
        pain:     document.getElementById('f-pain').value,
        pref_time: document.getElementById('f-pref').value || 'kdykoliv',
        msg:     document.getElementById('f-msg').value || '',
        website: (document.getElementById('f-website') || {}).value || '',
        turnstileToken: (document.querySelector('[name="cf-turnstile-response"]') || {}).value || ''
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) {
        if (!res.ok) throw new Error('server');
        document.getElementById('modalFormInner').classList.add('hide');
        document.getElementById('modalSuccess').classList.add('show');
      })
      .catch(function() {
        btn.disabled = false;
        btn.textContent = 'Odeslat';
        var err = document.getElementById('formError');
        if (!err) {
          err = document.createElement('p');
          err.id = 'formError';
          err.style.cssText = 'color:#f87171;font-size:0.875rem;margin-top:0.75rem;text-align:center';
          btn.parentNode.insertBefore(err, btn.nextSibling);
        }
        err.textContent = 'Něco se pokazilo. Zkuste to prosim znovu nebo nás kontaktujte na info@alsflow.cz.';
        if (window.turnstile) window.turnstile.reset(); // token is single-use — refresh it for the retry
      });
    });
  
    /* -- CHAT WIDGET JS -- */
    (function() {
      var WEBHOOK = 'https://primary-production-4f62.up.railway.app/webhook/alsflow-chat';
      var API_KEY = 'alsflow-chat-2026';
      var MAX = 20;
      var sid = sessionStorage.getItem('als_chat_sid');
      if (!sid) {
        sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        sessionStorage.setItem('als_chat_sid', sid);
      }
      var history = []; var msgCount = 0; var sending = false; var opened = false;
      window.toggleChat = function() {
        opened = !opened;
        var panel = document.getElementById('chatPanel');
        var badge = document.getElementById('chatBadge');
        if (panel) panel.classList.toggle('open', opened);
        if (panel) panel.setAttribute('aria-hidden', String(!opened));
        if (opened && badge) badge.style.display = 'none';
        if (opened) setTimeout(function() { var i = document.getElementById('chatInput'); if(i) i.focus(); }, 300);
      };
      function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
      function addMsg(role, text) {
        var wrap = document.getElementById('chatMessages'); if (!wrap) return;
        var div = document.createElement('div'); div.className = 'chat-msg ' + role;
        var bub = document.createElement('div'); bub.className = 'chat-bubble-msg';
        bub.innerHTML = esc(text).replace(/\n/g,'<br>');
        div.appendChild(bub); wrap.appendChild(div); wrap.scrollTop = wrap.scrollHeight;
      }
      function addTyping() {
        var wrap = document.getElementById('chatMessages'); if (!wrap) return;
        var div = document.createElement('div'); div.className = 'chat-msg bot'; div.id = 'chatTyping';
        div.innerHTML = '<div class="chat-bubble-msg"><span class="chat-typing-dots"><span></span><span></span><span></span></span></div>';
        wrap.appendChild(div); wrap.scrollTop = wrap.scrollHeight;
      }
      function removeTyping() { var t = document.getElementById('chatTyping'); if(t) t.remove(); }
      function updateCounter() { var el = document.getElementById('chatCounter'); if(el) el.textContent = msgCount + '/' + MAX; }
      window.sendChatMessage = function() {
        if (sending || msgCount >= MAX) return;
        var input = document.getElementById('chatInput');
        var msg = input ? input.value.trim() : ''; if (!msg) return;
        if (input) input.value = '';
        msgCount++; updateCounter(); addMsg('user', msg);
        var sendHistory = history.slice();
        history.push({ role: 'user', content: msg });
        if (history.length > 12) history = history.slice(-12);
        sending = true;
        var btn = document.getElementById('chatSend'); if(btn) btn.disabled = true;
        addTyping();
        fetch(WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify({ message: msg, session_id: sid, history: sendHistory, website: '' })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          removeTyping();
          var reply = (data && data.reply) ? String(data.reply) : 'Omlouváme se, zkuste to prosím znovu.';
          addMsg('bot', reply);
          history.push({ role: 'model', content: reply });
          if (history.length > 12) history = history.slice(-12);
        })
        .catch(function() { removeTyping(); addMsg('bot', 'Omlouváme se, momentálně nemohu odpovědět. Napište nám na info@alsflow.cz.'); })
        .finally(function() {
          sending = false; if(btn) btn.disabled = (msgCount >= MAX); updateCounter();
          if (msgCount >= MAX) addMsg('bot', 'Dosáhli jste limitu zpráv. Kontaktujte nás na info@alsflow.cz nebo využijte formulář.');
        });
      };
    })();

    /* -- DEMO INTERACTIVITY HINTS -- */
    (function() {
      var examples = ['Kdy máte volno tento týden?','Zarezervuj mi pátek 14:00','Kolik stojí ošetření?','Chci zrušit termín ve čtvrtek','Kde vás najdu?'];
      var pi = 0;
      var calInput = document.getElementById('calInput');
      if (calInput) {
        calInput.placeholder = examples[0];
        setInterval(function() {
          if (document.activeElement !== calInput) { pi = (pi + 1) % examples.length; calInput.placeholder = examples[pi]; }
        }, 2800);
      }
      function pulseFirstChip() {
        var chip = document.querySelector('#pane-cal .demo-chip'); if (!chip) return;
        var n = 0;
        var iv = setInterval(function() {
          chip.style.background  = n % 2 === 0 ? 'rgba(59,130,246,0.15)' : '';
          chip.style.borderColor = n % 2 === 0 ? 'rgba(59,130,246,0.4)' : '';
          chip.style.color       = n % 2 === 0 ? '#93c5fd' : '';
          if (++n >= 6) { clearInterval(iv); chip.style.background = chip.style.borderColor = chip.style.color = ''; }
        }, 320);
      }
      var demoSection = document.getElementById('demo');
      if (demoSection && window.IntersectionObserver) {
        var done = false;
        new IntersectionObserver(function(entries, obs) {
          if (entries[0].isIntersecting && !done && document.documentElement.scrollTop > 80) {
            done = true; obs.disconnect();
            var calBtn = document.getElementById('calTabBtn');
            if (calBtn) { calBtn.click(); setTimeout(pulseFirstChip, 400); }
          }
        }, { threshold: 0.45 }).observe(demoSection);
      }
    })();
  