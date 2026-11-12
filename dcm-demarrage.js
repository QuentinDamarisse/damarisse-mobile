/* Démarrage : connexion Microsoft (retour de redirection), synchronisation, écran de déverrouillage, verrouillage
   automatique (inactivité, passage en arrière-plan) et actions des réglages. */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const CFG = window.DCM_CONFIG || {};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  M.VERSION = '1.0';
  M.etat = { nbFichiers: 0, octets: 0, synchro: null, messageSynchro: '', synchroEnCours: null };
  const app = () => document.getElementById('app');
  const lireLS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const ecrireLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* */ } };

  // ------------------------------------------------------------------ Aides partagées
  M.taille = o => o >= 1048576 ? (o / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Mo' : Math.max(1, Math.round(o / 1024)) + ' ko';
  const horodatage = iso => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; const j = new Date(); const memeJour = d.toDateString() === j.toDateString(); return (memeJour ? "aujourd'hui" : 'le ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  M.libSynchro = () => (M.etat.synchro && M.etat.synchro.le ? horodatage(M.etat.synchro.le) : 'jamais');
  M.piedDonnees = () => { const DC = window.DC; return `<p class="pied">Données du ${esc(DC && DC.dateDonnees ? DC.date(DC.dateDonnees) : '·')} · synchronisées ${esc(M.libSynchro())}</p>`; };
  M.verrouMinutes = () => { const n = +lireLS('dcm:verrou', CFG.verrouMinutes || 5); return n > 0 ? n : 5; };
  M.reglerVerrou = n => { ecrireLS('dcm:verrou', String(n)); armerVerrou(); };
  const chargerEtat = async () => {
    const l = await M.stock.resume();
    M.etat.nbFichiers = l.length; M.etat.octets = l.reduce((s, f) => s + (f.taille || 0), 0);
    M.etat.synchro = await M.stock.meta('synchro');
    M.etat.complet = ['cles.js', 'donnees.js', 'app/securite.js'].every(p => l.some(f => f.chemin === p));
    return l;
  };
  // fenêtre de confirmation (pas de boîte de dialogue du navigateur)
  M.confirmer = (texte, bouton = 'Continuer', danger = false) => new Promise(ok => {
    const f = document.createElement('div'); f.className = 'modale';
    f.innerHTML = `<div class="modale-boite" role="dialog" aria-modal="true"><p>${esc(texte)}</p><div class="modale-actions"><button type="button" class="btn" data-r="0">Annuler</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primaire'}" data-r="1">${esc(bouton)}</button></div></div>`;
    f.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === f) { f.remove(); ok(!!(b && b.dataset.r === '1')); } });
    document.body.appendChild(f);
  });

  // ------------------------------------------------------------------ Synchronisation
  const libProgres = p => p.etape === 'liste' ? 'Recherche de nouvelles données…' : p.etape === 'telechargement' ? (p.n ? `Téléchargement ${p.fait} / ${p.n} · ${M.taille(p.octets)} sur ${M.taille(p.total)}` : 'Vérification…') : p.etape === 'fin' ? (p.lus ? `${p.lus} fichier${p.lus > 1 ? 's' : ''} mis à jour` : 'Données à jour') : '';
  M.lancerSynchro = (afficher = () => {}) => {
    if (M.etat.synchroEnCours) return M.etat.synchroEnCours;
    M.etat.dejaSynchro = true;
    const p = (async () => {
      if (!navigator.onLine) { M.etat.messageSynchro = 'Hors connexion : données gardées sur l\'iPhone.'; afficher(M.etat.messageSynchro, 'info'); return { horsLigne: true }; }
      try {
        const r = await M.synchroniser(x => { M.etat.messageSynchro = libProgres(x); afficher(M.etat.messageSynchro, 'cours', x); });
        await chargerEtat();
        M.etat.messageSynchro = r.lus ? `${r.lus} fichier${r.lus > 1 ? 's' : ''} mis à jour ${horodatage(r.le)}` : `Données à jour (vérifié ${horodatage(r.le)})`;
        afficher(M.etat.messageSynchro, 'ok', r); return r;
      } catch (e) {
        M.etat.messageSynchro = e.connexion ? 'Connexion Microsoft 365 nécessaire pour actualiser.' : 'Synchronisation impossible : ' + (e.message || e);
        afficher(M.etat.messageSynchro, e.connexion ? 'connexion' : 'erreur', e); return { erreur: e };
      } finally { M.etat.synchroEnCours = null; }
    })();
    M.etat.synchroEnCours = p; return p;
  };

  // ------------------------------------------------------------------ Écrans avant déverrouillage
  const entete = sous => `<img class="logo" src="apple-touch-icon.png" alt=""><h1 class="marque">Damarisse Conseils</h1>${sous ? `<p class="note">${sous}</p>` : ''}`;
  const etatLigne = (txt, ton) => { const z = document.getElementById('etat'); if (!z) return; z.className = 'etat t-' + (ton || 'info'); z.innerHTML = ton === 'connexion' ? `${esc(txt)} <button type="button" class="lien" id="se-connecter">Se connecter</button>` : esc(txt); const b = document.getElementById('se-connecter'); if (b) b.onclick = () => M.auth.connecter('synchro'); };
  function ecranPremiereFois(erreur = '') {
    const conf = M.auth.configuree;
    app().innerHTML = `<div class="ecran-centre">${entete('Consultation des dossiers du cabinet')}
      <div class="boite">${conf ? (M.auth.compte ? `<p>Chargement des données chiffrées du cabinet depuis SharePoint…</p><div class="progression"><i id="prog"></i></div><p class="etat" id="etat"></p>`
        : `<p>Première ouverture sur cet iPhone : connectez-vous à Microsoft 365 pour charger les données chiffrées du cabinet (environ 20 Mo, à faire de préférence en Wi-Fi).</p><button type="button" class="btn btn-primaire large" id="connexion">Se connecter à Microsoft 365</button>`)
        : `<p>Connexion Microsoft non configurée : l'identifiant de l'application (Microsoft Entra) est à renseigner dans config.js.</p>`}
      ${erreur ? `<p class="erreur">${esc(erreur)}</p>` : ''}</div></div>`;
    const b = document.getElementById('connexion'); if (b) b.onclick = () => { b.disabled = true; b.textContent = 'Ouverture de Microsoft 365…'; M.auth.connecter('premiere').catch(e => ecranPremiereFois(e.message || String(e))); };
    if (conf && M.auth.compte) M.lancerSynchro((txt, ton, x) => {
      etatLigne(txt, ton);
      const pr = document.getElementById('prog'); if (pr && x && x.total) pr.style.width = Math.round(x.octets / x.total * 100) + '%';
      if (ton === 'ok') chargerEtat().then(() => (M.etat.complet ? ecranVerrou() : ecranPremiereFois('Fichiers incomplets : réessayez.')));
    });
  }

  function ecranVerrou(erreur = '') {
    const comptes = M.coffre.comptes(); const dernier = lireLS('dcm:compte', 'principal'); const secours = !!M._secours;
    const motif = (() => { try { const m = sessionStorage.getItem('dcm:motif'); sessionStorage.removeItem('dcm:motif'); return m; } catch (e) { return ''; } })();
    const choix = comptes.length > 1 && !secours ? `<label>Utilisateur<select id="compte">${comptes.map(c => { const v = c.principal ? 'principal' : c.code; return `<option value="${esc(v)}" ${v === dernier ? 'selected' : ''}>${esc(c.nom)} · ${c.role === 'associe' ? 'associé' : 'assistante'}</option>`; }).join('')}</select></label>` : '';
    const s = M.etat.synchro;
    app().innerHTML = `<div class="ecran-centre">${entete('')}
      <form id="verrou" class="boite" autocomplete="on">
        <input type="text" name="username" id="identifiant" autocomplete="username" class="masque" tabindex="-1" aria-hidden="true" value="${esc(dernier)}">
        ${choix}
        <label>${secours ? 'Code de secours' : 'Mot de passe de l\'application'}<input id="secret" name="password" type="password" autocomplete="${secours ? 'off' : 'current-password'}" enterkeyhint="go" required></label>
        ${motif ? `<p class="note">${esc(motif === 'inactivite' ? 'Verrouillée après une période d\'inactivité.' : motif === 'arriere-plan' ? 'Verrouillée pendant que l\'application était en arrière-plan.' : 'Application verrouillée.')}</p>` : ''}
        ${erreur ? `<p class="erreur">${esc(erreur)}</p>` : ''}
        <button class="btn btn-primaire large" id="ouvrir">Déverrouiller</button>
        <button type="button" class="lien" id="bascule">${secours ? 'Utiliser le mot de passe' : 'Mot de passe oublié : code de secours'}</button>
      </form>
      <p class="etat" id="etat"></p>
      <p class="note petit">${s && s.le ? `Données synchronisées ${esc(horodatage(s.le))}` : ''}${M.coffre.cles ? ` · clé ${esc(M.coffre.cles.empreinte || '')}` : ''}</p></div>`;
    const f = document.getElementById('verrou');
    const sel = document.getElementById('compte'); if (sel) sel.onchange = () => { document.getElementById('identifiant').value = sel.value; };
    document.getElementById('bascule').onclick = () => { M._secours = !M._secours; ecranVerrou(); };
    f.onsubmit = async e => {
      e.preventDefault();
      const secret = document.getElementById('secret').value; if (!secret) return;
      const btn = document.getElementById('ouvrir'); btn.disabled = true;
      if (M.etat.synchroEnCours) { btn.textContent = 'Synchronisation en cours…'; await M.etat.synchroEnCours; await chargerEtat(); }
      btn.textContent = 'Vérification…';
      const cles = await M.stock.fichier('cles.js'); M.coffre.charger(cles && cles.contenu);
      if (!M.coffre.cles) return ecranVerrou('Clés de l\'application absentes : synchronisez les données.');
      const code = sel ? sel.value : 'principal';
      if (!(await M.coffre.deverrouiller(secret, secours, code))) return ecranVerrou(secours ? 'Code de secours incorrect.' : 'Mot de passe incorrect.');
      ecrireLS('dcm:compte', code);
      await ouvrirApplication();
    };
    if (!erreur) setTimeout(() => { const i = document.getElementById('secret'); if (i && matchMedia('(hover: hover)').matches) i.focus(); }, 50);
    // actualisation en arrière-plan pendant la saisie du mot de passe
    if (M.auth.compte && !M.etat.synchroEnCours && !M.etat.dejaSynchro) M.lancerSynchro(etatLigne);
    else if (M.etat.messageSynchro) etatLigne(M.etat.messageSynchro, /impossible/.test(M.etat.messageSynchro) ? 'erreur' : /nécessaire/.test(M.etat.messageSynchro) ? 'connexion' : 'ok');
    else if (M.auth.configuree && !M.auth.compte) etatLigne('Connexion Microsoft 365 nécessaire pour actualiser.', 'connexion');
    if (M.auth.erreur && M.auth.erreur.errorCode && !/interaction_required|no_tokens|login_required|consent_required/.test(M.auth.erreur.errorCode)) etatLigne('Microsoft 365 : ' + (M.auth.erreur.errorMessage || M.auth.erreur.message || M.auth.erreur.errorCode).slice(0, 180), 'erreur');
  }

  async function ouvrirApplication() {
    app().innerHTML = `<div class="ecran-centre">${entete('')}<div class="boite"><p id="etape">Déchiffrement des données…</p><div class="progression indet"><i></i></div></div></div>`;
    try {
      await M.moteur.demarrer(t => { const z = document.getElementById('etape'); if (z) z.textContent = t; });
    } catch (e) { console.error(e); M.coffre.privee = null; return ecranVerrou('Ouverture impossible : ' + (e.message || e)); }
    M.reindexer();
    M.vues.coquille();
    if (!location.hash || /^#(code|state|error)=/.test(location.hash)) history.replaceState(null, '', '#/');
    M.vues.rendre();
    armerVerrou();
  }

  // ------------------------------------------------------------------ Verrouillage
  let minuterie = null, cache = null;
  M.verrouiller = motif => { try { sessionStorage.setItem('dcm:motif', motif || 'manuel'); } catch (e) { /* */ } M.coffre.privee = null; document.body.classList.add('masque-tout'); location.reload(); };
  function armerVerrou() {
    clearTimeout(minuterie);
    if (!M.coffre.privee) return;
    minuterie = setTimeout(() => M.verrouiller('inactivite'), M.verrouMinutes() * 60000);
  }
  ['touchstart', 'click', 'keydown', 'scroll'].forEach(ev => window.addEventListener(ev, () => { if (M.coffre.privee) armerVerrou(); }, { passive: true }));
  // capture de l'écran par le sélecteur d'applications : contenu masqué dès le passage en arrière-plan
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { cache = Date.now(); if (M.coffre.privee) document.body.classList.add('masque-tout'); }
    else {
      const absent = cache ? (Date.now() - cache) / 1000 : 0; cache = null;
      if (M.coffre.privee && absent > (CFG.verrouArrierePlan ?? 60)) return M.verrouiller('arriere-plan');
      document.body.classList.remove('masque-tout'); armerVerrou();
    }
  });
  window.addEventListener('pagehide', () => { if (M.coffre.privee) document.body.classList.add('masque-tout'); });

  // ------------------------------------------------------------------ Actions des réglages
  M.actions = Object.assign(M.actions || {}, {
    verrouiller: () => M.verrouiller('manuel'),
    synchroniser: async b => {
      const z = document.getElementById('etat-synchro'); const dire = (t, ton) => { if (z) { z.textContent = t; z.className = 'note t-' + (ton || 'info'); } };
      if (!M.auth.configuree) return dire('Connexion Microsoft non configurée.', 'erreur');
      if (!navigator.onLine) return dire('Hors connexion : les données gardées sur l\'iPhone restent consultables.', 'info');
      if (!M.auth.compte || !(await M.auth.jeton())) {
        if (await M.confirmer('La connexion à Microsoft 365 recharge l\'application : votre mot de passe sera redemandé. Continuer ?', 'Se connecter')) M.auth.connecter('synchro');
        return;
      }
      b.disabled = true;
      const r = await M.lancerSynchro(dire);
      if (r && r.lus) {
        dire('Mise à jour du calcul…', 'cours');
        try { await M.moteur.demarrer(); M.reindexer(); M.vues.rendre(); dire(M.etat.messageSynchro, 'ok'); } catch (e) { dire('Données téléchargées ; verrouillez puis rouvrez l\'application pour les afficher.', 'erreur'); }
      }
      b.disabled = false;
    },
    connecter: async () => { if (await M.confirmer('La connexion à Microsoft 365 recharge l\'application : votre mot de passe sera redemandé. Continuer ?', 'Se connecter')) M.auth.connecter('reglages'); },
    'oublier-ms': async () => { if (await M.confirmer('Oublier la connexion Microsoft 365 sur cet iPhone ? Les données déjà synchronisées restent consultables.', 'Oublier')) { await M.auth.oublier(); M.vues.rendre(); } },
    effacer: async () => {
      if (!(await M.confirmer('Effacer de cet iPhone les données du cabinet et la connexion Microsoft 365 ? Une nouvelle synchronisation sera nécessaire.', 'Effacer', true))) return;
      await M.stock.vider(); await M.auth.oublier();
      try { for (const k of Object.keys(localStorage)) if (/^(dcm?:)/.test(k)) localStorage.removeItem(k); } catch (e) { /* */ }
      M.verrouiller('manuel');
    }
  });

  // ------------------------------------------------------------------ Lancement
  async function lancer() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
    try { await M.auth.init(); } catch (e) { M.auth.erreur = e; }
    try { sessionStorage.removeItem('dcm:apres-connexion'); } catch (e) { /* */ }
    await chargerEtat();
    M.stock.persister();
    if (/^#(code|state|error)=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (!M.etat.complet) return ecranPremiereFois(M.auth.erreur && M.auth.erreur.errorMessage ? 'Microsoft 365 : ' + M.auth.erreur.errorMessage.slice(0, 200) : '');
    const cles = await M.stock.fichier('cles.js'); M.coffre.charger(cles && cles.contenu);
    ecranVerrou();
  }
  window.addEventListener('online', () => { if (!M.coffre.privee && M.auth.compte && document.getElementById('verrou')) M.lancerSynchro(etatLigne); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
})();
