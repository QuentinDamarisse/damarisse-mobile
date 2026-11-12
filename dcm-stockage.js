/* Stockage local de l'iPhone (IndexedDB) : copie des fichiers de l'application telle que lue sur SharePoint.
   Les fichiers de données restent chiffrés (DC1) : rien n'est écrit en clair, la clé n'est jamais conservée. */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const NOM = 'dcm', VERSION = 1;
  let base = null;
  const ouvrir = () => base || (base = new Promise((ok, ko) => {
    const r = indexedDB.open(NOM, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('fichiers')) db.createObjectStore('fichiers', { keyPath: 'chemin' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => { base = null; ko(r.error); };
  }));
  const req = (r) => new Promise((ok, ko) => { r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  M.stock = {
    async fichier(chemin) { const db = await ouvrir(); return req(db.transaction('fichiers').objectStore('fichiers').get(chemin)); },
    async fichiers() { const db = await ouvrir(); return req(db.transaction('fichiers').objectStore('fichiers').getAll()); },
    // résumé sans contenu (réglages, synchronisation)
    async resume() { return (await this.fichiers()).map(f => ({ chemin: f.chemin, etag: f.etag, taille: f.taille, maj: f.maj, lu_le: f.lu_le })); },
    // écriture groupée : tous les fichiers d'une synchronisation ou aucun
    async ecrireTous(liste, retirer = []) {
      const db = await ouvrir();
      return new Promise((ok, ko) => {
        const t = db.transaction('fichiers', 'readwrite'); const s = t.objectStore('fichiers');
        for (const f of liste) s.put(f);
        for (const c of retirer) s.delete(c);
        t.oncomplete = () => ok(true); t.onerror = () => ko(t.error); t.onabort = () => ko(t.error || new Error('Écriture interrompue'));
      });
    },
    async meta(cle) { const db = await ouvrir(); return req(db.transaction('meta').objectStore('meta').get(cle)); },
    async ecrireMeta(cle, v) { const db = await ouvrir(); const t = db.transaction('meta', 'readwrite'); t.objectStore('meta').put(v, cle); return new Promise((ok, ko) => { t.oncomplete = () => ok(true); t.onerror = () => ko(t.error); }); },
    async vider() {
      const db = await ouvrir();
      return new Promise((ok, ko) => { const t = db.transaction(['fichiers', 'meta'], 'readwrite'); t.objectStore('fichiers').clear(); t.objectStore('meta').clear(); t.oncomplete = () => ok(true); t.onerror = () => ko(t.error); });
    },
    // demande au navigateur de ne pas effacer ces fichiers en cas de manque de place (sans effet si refusé)
    async persister() { try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) { /* */ } return false; }
  };
})();
