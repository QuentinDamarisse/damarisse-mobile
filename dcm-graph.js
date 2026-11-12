/* Connexion Microsoft 365 (MSAL, flux par redirection : seul flux fiable dans une application installée sur l'écran
   d'accueil de l'iPhone) et lecture des fichiers de l'application sur SharePoint (Microsoft Graph, lecture seule).
   Seuls les fichiers modifiés depuis la dernière synchronisation sont téléchargés (étiquette de contenu cTag). */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const CFG = window.DCM_CONFIG || {};
  const G = 'https://graph.microsoft.com/v1.0';
  M.urlApp = new URL('./', location.href).href;

  // ------------------------------------------------------------------ Connexion
  M.auth = {
    pca: null, compte: null, erreur: null,
    get configuree() { return !!(CFG.clientId && window.msal); },
    async init() {
      if (!this.configuree) return null;
      const msal = window.msal;
      this.pca = new msal.PublicClientApplication({
        auth: { clientId: CFG.clientId, authority: CFG.autorite, redirectUri: M.urlApp, postLogoutRedirectUri: M.urlApp, navigateToLoginRequestUrl: false },
        cache: { cacheLocation: 'localStorage' },
        system: { loggerOptions: { logLevel: msal.LogLevel ? msal.LogLevel.Warning : 1, piiLoggingEnabled: false } }
      });
      await this.pca.initialize();
      let r = null;
      try { r = await this.pca.handleRedirectPromise(); } catch (e) { this.erreur = e; }
      if (r && r.account) this.pca.setActiveAccount(r.account);
      this.compte = this.pca.getActiveAccount() || this.pca.getAllAccounts()[0] || null;
      if (this.compte && !this.pca.getActiveAccount()) this.pca.setActiveAccount(this.compte);
      return r;
    },
    get nom() { return this.compte ? (this.compte.username || this.compte.name || '') : ''; },
    // jeton d'accès sans interaction ; null si une connexion est nécessaire
    async jeton() {
      if (!this.pca || !this.compte) return null;
      try { return (await this.pca.acquireTokenSilent({ scopes: CFG.portees, account: this.compte })).accessToken; }
      catch (e) { this.erreur = e; return null; }
    },
    // connexion par redirection : l'application est rechargée au retour (le mot de passe est redemandé)
    async connecter(motif = 'synchro') {
      if (!this.pca) throw new Error('Connexion Microsoft non configurée (identifiant d\'application manquant dans config.js).');
      try { sessionStorage.setItem('dcm:apres-connexion', motif); } catch (e) { /* */ }
      const req = { scopes: CFG.portees, redirectUri: M.urlApp };
      if (this.compte) await this.pca.acquireTokenRedirect({ ...req, account: this.compte });
      else await this.pca.loginRedirect({ ...req, prompt: 'select_account' });
    },
    // oubli de la session Microsoft sur cet iPhone seulement (pas de déconnexion des autres appareils)
    async oublier() {
      if (!this.pca) return;
      try { await this.pca.clearCache({ account: this.compte || undefined }); } catch (e) { /* */ }
      try { for (const k of Object.keys(localStorage)) if (/^msal\.|login\.windows\.net|login\.microsoftonline\.com/i.test(k)) localStorage.removeItem(k); } catch (e) { /* */ }
      this.compte = null;
    }
  };

  // ------------------------------------------------------------------ Microsoft Graph
  const chemin = p => p.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const erreurHttp = async (r, quoi) => { let m = ''; try { const j = await r.json(); m = j.error && (j.error.message || j.error.code) || ''; } catch (e) { /* */ } const e = new Error(`${quoi} : ${r.status}${m ? ' ' + m : ''}`); e.status = r.status; return e; };
  const gget = async (url, jeton, quoi) => {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + jeton }, cache: 'no-store' });
    if (!r.ok) throw await erreurHttp(r, quoi || 'Microsoft Graph');
    return r.json();
  };
  const base = () => `${G}/drives/${encodeURIComponent(CFG.drive)}`;
  const enfants = async (rel, jeton) => {
    let url = `${base()}/root:/${chemin(CFG.racine + (rel ? '/' + rel : ''))}:/children?$top=200`;
    const out = [];
    while (url) { const j = await gget(url, jeton, 'Dossier ' + (rel || 'de l\'application')); out.push(...(j.value || [])); url = j['@odata.nextLink'] || null; }
    return out;
  };
  const element = async (rel, jeton) => {
    try { return await gget(`${base()}/root:/${chemin(CFG.racine + '/' + rel)}`, jeton, rel); }
    catch (e) { if (e.status === 404) return null; throw e; }
  };
  const lienTelechargement = async (it, jeton) => it['@microsoft.graph.downloadUrl'] || (await gget(`${base()}/items/${encodeURIComponent(it.id)}`, jeton, it.name))['@microsoft.graph.downloadUrl'];
  const etiquette = it => it.cTag || it.eTag || it.lastModifiedDateTime || '';

  // modules de l'application du poste, dans l'ordre de chargement du poste (liste lue dans app/securite.js)
  const SANS_MOBILE = new Set(['univers.js', 'contexte.js', 'contrats.js']);
  M.listeModules = texte => {
    const m = /const APP = \[([\s\S]*?)\];/.exec(String(texte || '')); if (!m) return [];
    return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).filter(x => /^app\/[\w.-]+\.js$/.test(x) && !SANS_MOBILE.has(x));
  };
  M.FICHIERS = { requis: ['cles.js', 'donnees.js', 'app/securite.js'], facultatifs: ['valorisations-extranets.js', 'positions-extranets.js', 'donnees/saisies-application.json', 'donnees/marche-structures.json'] };

  // synchronisation : liste des fichiers sur SharePoint, téléchargement des fichiers modifiés, écriture groupée
  M.synchroniser = async (progres = () => {}) => {
    const jeton = await M.auth.jeton();
    if (!jeton) { const e = new Error('Connexion Microsoft 365 nécessaire'); e.connexion = true; throw e; }
    progres({ etape: 'liste' });
    const cache = new Map((await M.stock.resume()).map(f => [f.chemin, f]));
    const items = new Map();
    const [racine, app] = await Promise.all([enfants('', jeton), enfants('app', jeton)]);
    for (const it of racine) if (it.file) items.set(it.name, it);
    for (const it of app) if (it.file) items.set('app/' + it.name, it);
    for (const p of M.FICHIERS.facultatifs.filter(p => p.includes('/'))) { const it = await element(p, jeton); if (it && it.file) items.set(p, it); }
    for (const p of M.FICHIERS.requis) if (!items.has(p)) throw new Error(`Fichier introuvable sur SharePoint : ${p}`);
    const lus = new Map();
    const telecharger = async p => {
      const it = items.get(p); const url = await lienTelechargement(it, jeton);
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw await erreurHttp(r, p);
      const contenu = await r.text();
      lus.set(p, { chemin: p, etag: etiquette(it), taille: it.size || contenu.length, maj: it.lastModifiedDateTime || '', lu_le: new Date().toISOString(), contenu });
      return contenu;
    };
    const aJour = p => cache.has(p) && cache.get(p).etag === etiquette(items.get(p));
    // liste des modules : app/securite.js du poste (relu s'il a changé)
    const sec = aJour('app/securite.js') ? (await M.stock.fichier('app/securite.js')).contenu : await telecharger('app/securite.js');
    const modules = M.listeModules(sec);
    if (!modules.includes('app/core.js')) throw new Error('Liste des modules illisible dans app/securite.js');
    const voulus = [...new Set([...M.FICHIERS.requis, ...M.FICHIERS.facultatifs, ...modules])].filter(p => items.has(p));
    const aLire = voulus.filter(p => !lus.has(p) && !aJour(p));
    const total = aLire.reduce((s, p) => s + (items.get(p).size || 0), 0);
    let fait = 0, octets = 0;
    progres({ etape: 'telechargement', fait, n: aLire.length, octets, total });
    const file = aLire.slice().sort((a, b) => (items.get(b).size || 0) - (items.get(a).size || 0));
    const travail = async () => { while (file.length) { const p = file.shift(); await telecharger(p); fait++; octets += items.get(p).size || 0; progres({ etape: 'telechargement', fait, n: aLire.length, octets, total, fichier: p }); } };
    await Promise.all([travail(), travail(), travail(), travail()]);
    // fichiers retirés de SharePoint ou de la liste des modules : retirés de l'iPhone
    const retirer = [...cache.keys()].filter(p => !voulus.includes(p));
    await M.stock.ecrireTous([...lus.values()], retirer);
    const bilan = { le: new Date().toISOString(), lus: lus.size, octets, modules: modules.length, retires: retirer.length, compte: M.auth.nom };
    await M.stock.ecrireMeta('synchro', bilan);
    progres({ etape: 'fin', ...bilan });
    return bilan;
  };
})();
