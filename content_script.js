// ==UserScript==
// @name         FB Ultra Aggressive No-Video (Enhanced Bengali Edition)
// @version      1.1
// @description  আরও শক্তিশালী video/reels/watch blocking সব Facebook সাইটে - CSS + DOM + Network + Memory Optimization
// @match        *://*.facebook.com/*
// @match        *://facebook.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- CONFIG: keywords & url parts to block ---
  const KEYWORDS = ['reels', 'reel', 'watch', 'video', 'videos', 'short', 'shorts', 'stories', 'story'];
  const URL_PARTS = ['/reels/', '/watch/', '/video/', '/videos/', '/shorts/', '/stories/', '/story/'];
  
  // Performance optimization: cache for checked nodes
  const checkedNodes = new WeakSet();
  let removeCount = 0;

  // --- STEP 0: Inject CSS immediately for instant hiding ---
  function injectBlockingCSS() {
    const style = document.createElement('style');
    style.id = 'fb-ultra-blocker-css';
    style.textContent = `
      /* Hide video-related elements instantly */
      video, iframe[src*="facebook.com/video"],
      a[href*="/reels/"], a[href*="/watch/"], a[href*="/video/"],
      a[href*="/shorts/"], a[href*="/stories/"],
      [data-pagelet*="Reel"], [data-pagelet*="Video"],
      [data-pagelet*="Watch"], [data-pagelet*="Stories"],
      [aria-label*="Reels"], [aria-label*="Watch"],
      [aria-label*="Video"], [aria-label*="Stories"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
    console.log('🚫 [FB Ultra Blocker] CSS injected');
  }

  // --- Utility helpers ---
  const safeInnerText = el => {
    try { return (el.innerText || '').toLowerCase(); } catch(e) { return ''; }
  };

  function matchesKeywordText(node) {
    if (checkedNodes.has(node)) return false; // Already checked
    checkedNodes.add(node);
    
    const txt = safeInnerText(node);
    if (!txt) return false;
    for (const k of KEYWORDS) if (txt.includes(k)) return true;
    return false;
  }

  function containsVideoElement(node) {
    try {
      if (!node || !node.querySelector) return false;
      return !!node.querySelector('video, iframe[src*="facebook"], iframe[src*="fbcdn"]');
    } catch(e) { return false; }
  }

  // Remove node safely (try remove, then hide)
  function removeNode(node) {
    if (!node || !node.parentNode) return;
    try {
      node.remove();
      removeCount++;
      return true;
    } catch(e) {
      try { 
        if (node.style) {
          node.style.display = 'none';
          node.style.visibility = 'hidden';
          node.style.opacity = '0';
        }
      } catch(_) {}
    }
    return false;
  }

  // Aggressive removal by selectors and heuristics
  function aggressiveSweep(root = document) {
    if (!root || !root.querySelectorAll) return;
    
    try {
      // 1) Remove direct video tags
      const vids = root.querySelectorAll('video, iframe[src*="facebook.com/video"], iframe[src*="fbcdn.net"]');
      vids.forEach(v => removeNode(v));

      // 2) Remove links/buttons with video-like hrefs
      URL_PARTS.forEach(part => {
        root.querySelectorAll(`a[href*="${part}"], a[data-href*="${part}"], [role="link"][href*="${part}"]`).forEach(a => {
          // Hide closest meaningful container
          const toHide = a.closest('[role="tab"], nav, header, li, [role="navigation"], [role="tablist"], div[role="button"], section, article');
          if (toHide) removeNode(toHide);
          else removeNode(a);
        });
      });

      // 3) Remove elements with keywords in visible text (optimized)
      const textElements = root.querySelectorAll('a, button, span, div[role], section, header, li');
      textElements.forEach(n => {
        try {
          if (matchesKeywordText(n)) {
            const container = n.closest('article, section, div[data-pagelet], li, [role="article"]');
            removeNode(container || n);
          }
        } catch(e){}
      });

      // 4) Remove containers with embedded video elements
      const possibleContainers = root.querySelectorAll('[data-pagelet], article, section, div[role="article"]');
      possibleContainers.forEach(c => {
        try {
          const dataStr = c.dataset ? JSON.stringify(c.dataset) : '';
          if (containsVideoElement(c) || /reel|watch|video|story|short/i.test(dataStr)) {
            removeNode(c);
          }
        } catch(e){}
      });

      // 5) Remove nav items with keywords in aria-label/alt
      root.querySelectorAll('[aria-label], img[alt], a[aria-label], button[aria-label], [role="tab"]').forEach(el => {
        try {
          const lab = (el.getAttribute('aria-label') || el.getAttribute('alt') || '').toLowerCase();
          for (const k of KEYWORDS) {
            if (lab.includes(k)) { 
              const parent = el.closest('a, button, li, div[role="tab"], nav, section');
              removeNode(parent || el);
              break;
            }
          }
        } catch(e){}
      });

      // 6) Remove Facebook-specific mobile nav items
      root.querySelectorAll('a[role="tab"], div[role="tab"], [data-sigil]').forEach(tab => {
        try {
          const href = tab.getAttribute('href') || '';
          const sigil = tab.getAttribute('data-sigil') || '';
          if (URL_PARTS.some(p => href.includes(p)) || /reel|watch|video|story/i.test(sigil)) {
            removeNode(tab);
          }
        } catch(e){}
      });

    } catch (e) {
      console.error('🚫 [FB Ultra Blocker] Sweep error:', e);
    }
  }

  // --- Intercept DOM insertion to immediately drop unwanted nodes ---
  function hookDOMInsertions() {
    const origAppend = Element.prototype.appendChild;
    const origInsertBefore = Element.prototype.insertBefore;
    const origReplaceChild = Element.prototype.replaceChild;

    function inspectAndMaybeBlock(node) {
      try {
        if (!node || node.nodeType !== 1) return false;
        
        const tag = node.tagName && node.tagName.toLowerCase();
        
        // Block video/iframe immediately
        if (tag === 'video' || (tag === 'iframe' && (node.src || '').includes('facebook'))) {
          removeNode(node);
          return true;
        }
        
        // Check href attributes
        const href = (node.getAttribute && (node.getAttribute('href') || node.getAttribute('data-href') || '')) || '';
        if (URL_PARTS.some(p => href.includes(p))) {
          removeNode(node);
          return true;
        }
        
        // Check data attributes
        if (node.dataset) {
          const dataStr = JSON.stringify(node.dataset);
          if (/reel|watch|video|story/i.test(dataStr)) {
            removeNode(node);
            return true;
          }
        }
        
        // Quick text check (only for small elements)
        if (node.childNodes && node.childNodes.length < 10) {
          if (matchesKeywordText(node)) {
            removeNode(node);
            return true;
          }
        }
        
        // Check for nested video elements
        if (node.querySelector) {
          setTimeout(() => {
            if (node.querySelector('video, iframe[src*="facebook"], a[href*="/reels/"], a[href*="/watch/"]')) {
              removeNode(node);
            }
          }, 0);
        }
      } catch(e){}
      return false;
    }

    Element.prototype.appendChild = function (node) {
      if (inspectAndMaybeBlock(node)) return node;
      return origAppend.call(this, node);
    };

    Element.prototype.insertBefore = function (node, ref) {
      if (inspectAndMaybeBlock(node)) return node;
      return origInsertBefore.call(this, node, ref);
    };

    Element.prototype.replaceChild = function (newNode, oldNode) {
      if (inspectAndMaybeBlock(newNode)) return newNode;
      return origReplaceChild.call(this, newNode, oldNode);
    };

    console.log('🔧 [FB Ultra Blocker] DOM insertion hooks installed');
  }

  // --- Network overrides to block video loading ---
  function tryNetworkOverrides() {
    try {
      const origFetch = window.fetch;
      window.fetch = function () {
        try {
          const url = arguments[0] && (arguments[0].url || arguments[0]);
          if (typeof url === 'string') {
            if (URL_PARTS.some(p => url.includes(p)) || /video|reel|watch|story/i.test(url)) {
              console.log('🚫 [FB Ultra Blocker] Blocked fetch:', url.substring(0, 100));
              return Promise.reject(new Error('Blocked by FB Ultra Blocker'));
            }
          }
        } catch(e){}
        return origFetch.apply(this, arguments);
      };
    } catch(e){ console.warn('⚠️ Fetch override failed:', e); }
    
    try {
      const OrigXHR = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        try {
          if (typeof url === 'string') {
            if (URL_PARTS.some(p => url.includes(p)) || /video|reel|watch|story/i.test(url)) {
              console.log('🚫 [FB Ultra Blocker] Blocked XHR:', url.substring(0, 100));
              this.abort();
              return;
            }
          }
        } catch(e){}
        return OrigXHR.apply(this, arguments);
      };
    } catch(e){ console.warn('⚠️ XHR override failed:', e); }
    
    console.log('🌐 [FB Ultra Blocker] Network overrides installed');
  }

  // --- Initialization & watchers ---
  function init() {
    console.log('🚀 [FB Ultra Blocker] Initializing...');
    
    // Inject CSS first
    injectBlockingCSS();
    
    // Initial sweep
    try { aggressiveSweep(document); } catch(e){}
    
    // Install hooks
    hookDOMInsertions();
    tryNetworkOverrides();

    // MutationObserver for dynamic loads (with throttling)
    let sweepQueued = false;
    const observer = new MutationObserver((mutations) => {
      if (sweepQueued) return;
      sweepQueued = true;
      
      requestAnimationFrame(() => {
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length) {
            m.addedNodes.forEach(n => {
              try { 
                if (n.nodeType === 1) aggressiveSweep(n); 
              } catch(e){}
            });
          }
        }
        // General sweep
        aggressiveSweep(document);
        sweepQueued = false;
      });
    });
    
    try {
      observer.observe(document.documentElement || document.body, { 
        childList: true, 
        subtree: true 
      });
      console.log('👁️ [FB Ultra Blocker] MutationObserver started');
    } catch(e) {
      console.warn('⚠️ Observer failed, using fallback');
      try { 
        observer.observe(document.body, { childList: true, subtree: true }); 
      } catch(_) {}
    }

    // Repeated interval as backup (reduced frequency)
    setInterval(() => {
      try { 
        aggressiveSweep(document);
        if (removeCount > 0) {
          console.log(`🗑️ [FB Ultra Blocker] Total removed: ${removeCount} elements`);
        }
      } catch(e){}
    }, 1000);
    
    console.log('✅ [FB Ultra Blocker] Initialized successfully');
  }

  // Start after tiny delay
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, {once: true});
    } else { 
      init(); 
    }
  } catch(e) { 
    init(); 
  }

  // Run on page visibility change (mobile battery optimization)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => aggressiveSweep(document), 100);
    }
  });

  console.log('🛡️ [FB Ultra Blocker] Script loaded');

})();
