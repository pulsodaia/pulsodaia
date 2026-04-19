// Consent Mode v2 + Banner LGPD - Pulso da IA
// Carrega ANTES do GTM para garantir que gtag('consent', 'default') dispara primeiro.
// Gerencia localStorage pra persistir escolha.
// Dispara gtag('consent', 'update') quando user decide.

(function () {
  'use strict';

  var LS_KEY = 'pulso_consent_v1';
  var POLICY_VERSION = 1;

  // Inicializa gtag function shim (caso GTM ainda nao tenha carregado)
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // 1. Default consent: DENIED pra tudo sensivel (LGPD compliant)
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    'wait_for_update': 2000
  });

  // 2. Recupera escolha anterior do usuario
  function loadStored() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.version !== POLICY_VERSION) return null; // policy mudou, re-pedir
      return parsed;
    } catch (e) { return null; }
  }

  function save(decision) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        version: POLICY_VERSION,
        decision: decision,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {}
  }

  // 3. Aplica consentimento
  function applyConsent(grants) {
    gtag('consent', 'update', grants);
    (window.dataLayer = window.dataLayer || []).push({
      event: 'consent_updated',
      consent_ad_storage: grants.ad_storage,
      consent_analytics_storage: grants.analytics_storage,
      consent_decision: grants._decision || 'unknown'
    });
  }

  var stored = loadStored();
  if (stored) {
    // Usuario ja decidiu antes, aplicar
    applyConsent(stored.decision === 'accept_all' ? ACCEPT_ALL : stored.decision === 'essential' ? ESSENTIAL_ONLY : stored.decision);
    return; // nao mostra banner
  }

  var ACCEPT_ALL = {
    'ad_storage': 'granted',
    'ad_user_data': 'granted',
    'ad_personalization': 'granted',
    'analytics_storage': 'granted',
    'functionality_storage': 'granted',
    'personalization_storage': 'granted',
    'security_storage': 'granted',
    '_decision': 'accept_all'
  };

  var ESSENTIAL_ONLY = {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    '_decision': 'essential'
  };

  // 4. Renderiza banner
  function renderBanner() {
    if (document.getElementById('pulso-consent-banner')) return;
    var div = document.createElement('div');
    div.id = 'pulso-consent-banner';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-label', 'Consentimento de cookies');
    div.innerHTML =
      '<div class="pcb-inner">' +
        '<div class="pcb-text">' +
          '<strong>Cookies e privacidade.</strong> ' +
          'A gente usa cookies pra analytics e melhorar a experiencia. ' +
          'Voce escolhe: aceitar tudo, so essenciais, ou ' +
          '<a href="/politica-privacidade/" target="_blank" rel="noopener">ler a politica</a>.' +
        '</div>' +
        '<div class="pcb-actions">' +
          '<button type="button" data-consent="essential" class="pcb-btn pcb-secondary">So essenciais</button>' +
          '<button type="button" data-consent="accept_all" class="pcb-btn pcb-primary">Aceitar tudo</button>' +
        '</div>' +
      '</div>';
    var style = document.createElement('style');
    style.textContent =
      '#pulso-consent-banner{position:fixed;bottom:16px;left:16px;right:16px;max-width:720px;margin:0 auto;background:#0E0E0E;color:#FAFAFA;border:1px solid rgba(255,94,31,0.35);border-radius:14px;padding:18px 22px;box-shadow:0 12px 40px rgba(0,0,0,0.55);z-index:9999;font-family:Inter,system-ui,sans-serif;animation:pcbIn .25s ease}' +
      '@keyframes pcbIn{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}' +
      '.pcb-inner{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}' +
      '.pcb-text{flex:1 1 280px;font-size:13.5px;line-height:1.55;color:rgba(250,250,250,0.85)}' +
      '.pcb-text strong{color:#FAFAFA;display:block;margin-bottom:4px;font-weight:600}' +
      '.pcb-text a{color:#FF5E1F;text-decoration:underline;text-underline-offset:2px}' +
      '.pcb-actions{display:flex;gap:8px;flex-shrink:0}' +
      '.pcb-btn{padding:9px 18px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;transition:all .15s ease}' +
      '.pcb-primary{background:#FF5E1F;color:#FFFFFF}' +
      '.pcb-primary:hover{background:#E5501A}' +
      '.pcb-secondary{background:transparent;color:#FAFAFA;border-color:rgba(255,255,255,0.25)}' +
      '.pcb-secondary:hover{border-color:#FF5E1F;color:#FF5E1F}' +
      '@media (max-width:560px){#pulso-consent-banner{left:8px;right:8px;padding:16px}.pcb-inner{flex-direction:column;align-items:stretch}.pcb-actions{justify-content:stretch}.pcb-actions .pcb-btn{flex:1}}';
    document.head.appendChild(style);
    document.body.appendChild(div);

    div.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var decision = btn.getAttribute('data-consent');
      var grants = decision === 'accept_all' ? ACCEPT_ALL : ESSENTIAL_ONLY;
      save(decision);
      applyConsent(grants);
      div.remove();
    });
  }

  // Banner aparece apos DOMContentLoaded (ou imediatamente se ja carregou)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBanner);
  } else {
    renderBanner();
  }
})();
