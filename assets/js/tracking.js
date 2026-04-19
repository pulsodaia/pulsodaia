/**
 * Pulso da IA — Client-side tracking library
 * GTM-first (GTM-MXGJBNFB) + GA4 (G-32GWZHPJGJ).
 * Pushes events to window.dataLayer. GTM triggers on event names.
 *
 * Events emitted:
 *   article_scroll_25 / _50 / _75 / _100
 *   article_time_30s / _60s / _180s
 *   newsletter_view / newsletter_form_start
 *   article_view_enriched
 *   outbound_click / resource_error / js_error / unhandled_rejection
 *   theme_switch / set_user_property
 *   web_vital_LCP / _CLS / _INP / _FCP / _TTFB
 *   + arbitrary names declared via data-gtm-event="..."
 */
(function () {
  'use strict';

  var HOST = 'pulsodaia.com.br';
  var DEBUG = (typeof window !== 'undefined' && window.PULSO_DEBUG === true);

  function log() {
    if (!DEBUG) return;
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[pulso-tracking]');
      console.log.apply(console, args);
    } catch (_) {}
  }

  function push(event, params) {
    if (!window.dataLayer || typeof window.dataLayer.push !== 'function') {
      log('dataLayer missing, dropping', event, params);
      return;
    }
    var payload = Object.assign({ event: event }, params || {});
    try {
      window.dataLayer.push(payload);
      log('push', payload);
    } catch (e) {
      log('push error', e);
    }
  }

  function truncate(val, max) {
    if (val == null) return '';
    var s = String(val);
    max = max || 500;
    return s.length > max ? s.slice(0, max) : s;
  }

  function camel(key) {
    return key.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  // ---------- 1. Scroll milestones ----------
  function initScroll() {
    var fired = { 25: false, 50: false, 75: false, 100: false };
    var ticking = false;

    function target() {
      return document.querySelector('article.post') || document.body;
    }

    function check() {
      ticking = false;
      var el = target();
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var total = el.scrollHeight || el.offsetHeight || 0;
      if (total <= 0) return;
      var viewport = window.innerHeight || document.documentElement.clientHeight;
      var scrolledInEl = Math.min(total, Math.max(0, -rect.top + viewport));
      var pct = Math.min(100, Math.round((scrolledInEl / total) * 100));
      [25, 50, 75, 100].forEach(function (m) {
        if (pct >= m && !fired[m]) {
          fired[m] = true;
          push('article_scroll_' + m, { scroll_percent: m });
        }
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(check);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    check();
  }

  // ---------- 2. Time on page milestones ----------
  function initTime() {
    var elapsed = 0;
    var lastTick = Date.now();
    var hidden = document.visibilityState === 'hidden';
    var fired = { 30: false, 60: false, 180: false };

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        elapsed += (Date.now() - lastTick) / 1000;
        hidden = true;
      } else {
        lastTick = Date.now();
        hidden = false;
      }
    });

    setInterval(function () {
      if (!hidden) {
        var now = Date.now();
        elapsed += (now - lastTick) / 1000;
        lastTick = now;
      }
      [30, 60, 180].forEach(function (m) {
        if (elapsed >= m && !fired[m]) {
          fired[m] = true;
          push('article_time_' + m + 's', { time_seconds: m });
        }
      });
    }, 1000);
  }

  // ---------- 3. Click tracking via data-gtm-event ----------
  function initClickTracking() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      while (el && el !== document.body) {
        if (el.getAttribute && el.getAttribute('data-gtm-event')) break;
        el = el.parentNode;
      }
      if (!el || el === document.body || !el.getAttribute) return;
      var name = el.getAttribute('data-gtm-event');
      if (!name) return;
      var params = {};
      var attrs = el.attributes;
      for (var i = 0; i < attrs.length; i++) {
        var a = attrs[i];
        if (!a.name || a.name.indexOf('data-gtm-') !== 0) continue;
        if (a.name === 'data-gtm-event') continue;
        var key = camel(a.name.replace('data-gtm-', ''));
        params[key] = a.value;
      }
      push(name, params);
    }, true);
  }

  // ---------- 4. Newsletter view (IntersectionObserver) ----------
  function initNewsletterView() {
    if (!('IntersectionObserver' in window)) return;
    var nodes = document.querySelectorAll('.newsletter-block, #newsletter-bottom, #newsletter');
    if (!nodes.length) return;
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!fired && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          fired = true;
          push('newsletter_view', { newsletter_id: entry.target.id || entry.target.className || 'unknown' });
          io.disconnect();
        }
      });
    }, { threshold: [0.5] });
    nodes.forEach(function (n) { io.observe(n); });
  }

  // ---------- 5. Newsletter form_start ----------
  function initNewsletterFormStart() {
    var fired = false;
    function detectSource(el) {
      if (el.closest && el.closest('#newsletter-bottom')) return 'homepage-footer';
      if (el.closest && el.closest('.inline-newsletter')) return 'article-inline';
      if (location.pathname.indexOf('/feed/') === 0) return 'portal';
      return 'page';
    }
    document.addEventListener('focusin', function (ev) {
      if (fired) return;
      var el = ev.target;
      if (!el || !el.closest) return;
      if (!el.closest('.newsletter-form, .newsletter-fields')) return;
      fired = true;
      push('newsletter_form_start', { newsletter_source: detectSource(el) });
    }, true);
  }

  // ---------- 6. Web Vitals ----------
  function initWebVitals() {
    import('https://unpkg.com/web-vitals@3/dist/web-vitals.js?module')
      .then(function (mod) {
        function handler(name) {
          return function (metric) {
            push('web_vital_' + name, {
              value: Math.round(metric.value || 0),
              rating: metric.rating || 'unknown',
              metric_id: metric.id
            });
          };
        }
        if (mod.onLCP) mod.onLCP(handler('LCP'));
        if (mod.onCLS) mod.onCLS(handler('CLS'));
        if (mod.onINP) mod.onINP(handler('INP'));
        if (mod.onFCP) mod.onFCP(handler('FCP'));
        if (mod.onTTFB) mod.onTTFB(handler('TTFB'));
      })
      .catch(function (e) { log('web-vitals load failed', e); });
  }

  // ---------- 7. Error tracking ----------
  function initErrors() {
    window.addEventListener('error', function (ev) {
      // Resource errors: ev.target is the failing element (no ev.message)
      var t = ev.target;
      if (t && t !== window && t.tagName && ['IMG', 'SCRIPT', 'LINK'].indexOf(t.tagName) >= 0) {
        push('resource_error', {
          resource_src: truncate(t.src || t.href || ''),
          resource_tag: t.tagName
        });
        return;
      }
      push('js_error', {
        error_message: truncate(ev.message),
        error_source: truncate(ev.filename),
        error_lineno: ev.lineno || 0,
        error_colno: ev.colno || 0
      });
    }, true);

    window.addEventListener('unhandledrejection', function (ev) {
      var reason = '';
      try { reason = ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason); }
      catch (_) { reason = 'unknown'; }
      push('unhandled_rejection', { error_reason: truncate(reason) });
    });
  }

  // ---------- 8. Theme switch ----------
  function initTheme() {
    if (!('MutationObserver' in window)) return;
    var root = document.documentElement;
    var current = root.getAttribute('data-theme');
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          var next = root.getAttribute('data-theme');
          if (next && next !== current) {
            current = next;
            push('theme_switch', { theme_to: next });
            push('set_user_property', {
              user_property_name: 'theme_preference',
              user_property_value: next
            });
          }
        }
      });
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ---------- 9. Article view enriched ----------
  function initArticleView() {
    var body = document.body;
    if (!body || !body.getAttribute('data-article-slug')) return;
    var params = {};
    var attrs = body.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (!a.name || a.name.indexOf('data-article-') !== 0) continue;
      var key = camel(a.name.replace('data-article-', ''));
      params[key] = a.value;
    }
    push('article_view_enriched', params);
  }

  // ---------- 10. Outbound link clicks ----------
  function initOutbound() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      while (el && el !== document.body && el.tagName !== 'A') {
        el = el.parentNode;
      }
      if (!el || el.tagName !== 'A') return;
      var href = el.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href)) return;
      var url;
      try { url = new URL(href); } catch (_) { return; }
      if (!url.hostname || url.hostname === HOST || url.hostname.indexOf('.' + HOST) >= 0 || url.hostname === 'www.' + HOST) return;
      push('outbound_click', {
        outbound_url: truncate(href),
        outbound_domain: url.hostname
      });
    }, true);
  }

  // ---------- Boot ----------
  function boot() {
    if (!window.dataLayer) {
      log('dataLayer not defined, noop');
      return;
    }
    try { initScroll(); } catch (e) { log('scroll fail', e); }
    try { initTime(); } catch (e) { log('time fail', e); }
    try { initClickTracking(); } catch (e) { log('click fail', e); }
    try { initNewsletterView(); } catch (e) { log('nlview fail', e); }
    try { initNewsletterFormStart(); } catch (e) { log('nlform fail', e); }
    try { initWebVitals(); } catch (e) { log('vitals fail', e); }
    try { initErrors(); } catch (e) { log('errors fail', e); }
    try { initTheme(); } catch (e) { log('theme fail', e); }
    try { initArticleView(); } catch (e) { log('artview fail', e); }
    try { initOutbound(); } catch (e) { log('outbound fail', e); }
    log('installed');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
