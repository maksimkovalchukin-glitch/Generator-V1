/* ======================================================
   CATALOG — Завантаження каталогів SES і UZE
   Зберігаються в n8n Static Data, кешуються в localStorage
====================================================== */

(function () {

  const BASE            = 'https://n8n.rayton.net/webhook';
  const SES_CATALOG_URL = BASE + '/ses-catalog';
  const UZE_CATALOG_URL = BASE + '/uze-catalog';
  const SES_STORAGE     = 'rayton_ses_catalog';
  const UZE_STORAGE     = 'rayton_uze_catalog';

  window.SES_CATALOG = null;
  window.UZE_CATALOG = null;
  window.CATALOG     = null; // backward compat — alias SES_CATALOG

  // ── Завантаження SES каталогу ───────────────────────
  async function loadSES() {
    try {
      const res  = await fetch(SES_CATALOG_URL, { cache: 'no-store' });
      const data = await res.json();
      if (data.catalog) {
        window.SES_CATALOG = data.catalog;
        window.CATALOG     = data.catalog;
        localStorage.setItem(SES_STORAGE, JSON.stringify(data.catalog));
        return;
      }
    } catch { /* fallback */ }

    const stored = localStorage.getItem(SES_STORAGE);
    if (stored) {
      try {
        window.SES_CATALOG = JSON.parse(stored);
        window.CATALOG     = window.SES_CATALOG;
      } catch { }
    }

    // Fallback — статичні дані з ses-catalog-data.js
    if (!window.SES_CATALOG && window.SES_CATALOG_DATA) {
      window.SES_CATALOG = window.SES_CATALOG_DATA;
      window.CATALOG     = window.SES_CATALOG_DATA;
    }
  }

  // ── Завантаження UZE каталогу ───────────────────────
  async function loadUZE() {
    try {
      const res  = await fetch(UZE_CATALOG_URL, { cache: 'no-store' });
      const data = await res.json();
      if (data.catalog) {
        window.UZE_CATALOG = data.catalog;
        localStorage.setItem(UZE_STORAGE, JSON.stringify(data.catalog));
        return;
      }
    } catch { /* fallback */ }

    const stored = localStorage.getItem(UZE_STORAGE);
    if (stored) {
      try { window.UZE_CATALOG = JSON.parse(stored); } catch { }
    }

    // Fallback — статичні дані з Excel (ses-catalog-data.js + uze-catalog-data.js)
    if (!window.UZE_CATALOG && window.UZE_CATALOG_DATA) {
      window.UZE_CATALOG = window.UZE_CATALOG_DATA;
    }
  }

  // ── Завантажити обидва ──────────────────────────────
  async function loadAll() {
    await Promise.all([loadSES(), loadUZE()]);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadAll();
    window.dispatchEvent(new CustomEvent('catalogReady', {
      detail: { ses: window.SES_CATALOG, uze: window.UZE_CATALOG }
    }));
  });

  // ── Публічний API ───────────────────────────────────
  window.CatalogAPI = {

    load:    loadAll,
    loadSES: loadSES,
    loadUZE: loadUZE,

    async saveSES(catalog) {
      window.SES_CATALOG = catalog;
      window.CATALOG     = catalog;
      localStorage.setItem(SES_STORAGE, JSON.stringify(catalog));
      await fetch(SES_CATALOG_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ catalog })
      });
    },

    async saveUZE(catalog) {
      window.UZE_CATALOG = catalog;
      localStorage.setItem(UZE_STORAGE, JSON.stringify(catalog));
      await fetch(UZE_CATALOG_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ catalog })
      });
    },

    // backward compat
    async save(catalog) { return this.saveSES(catalog); }
  };

})();
