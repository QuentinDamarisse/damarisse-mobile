/* Moteur : les modules de l'application du poste (lus sur SharePoint, dans l'ordre de app/securite.js) sont exécutés sur
   l'iPhone après le déverrouillage, sans leur affichage (DC.demarrer n'est jamais appelé). Familles, contrats, encours,
   alertes et structurés sont ainsi calculés exactement comme au cabinet ; l'iPhone n'en fait que l'affichage.
   Lecture seule : toute écriture (saisies, dossier, téléchargements, mémoire locale) est neutralisée. */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const C = () => M.coffre;

  const executer = (code, nom) => new Promise(ok => {
    const url = URL.createObjectURL(new Blob([code + '\n//# sourceURL=dcm/' + nom], { type: 'text/javascript' }));
    const s = document.createElement('script'); s.src = url; s.dataset.module = nom;
    s.onload = () => { URL.revokeObjectURL(url); ok(true); };
    s.onerror = () => { URL.revokeObjectURL(url); ok(false); };
    document.head.appendChild(s);
  });

  // écritures neutralisées (appelée après core.js puis après le dernier module)
  const lectureSeule = () => {
    const DC = window.DC; if (!DC) return;
    const refus = async () => ({ lectureSeule: true });
    DC.enregistrer = refus; DC.memoSaisies = async () => {}; DC.corpsSaisies = async () => '';
    DC.deposer = async () => { throw new Error('Application mobile en lecture seule'); };
    DC.telecharger = async () => false; DC.ouvrirFichier = () => false;
    if (DC.memo) DC.memo.ecrire = () => {};
    // dossier du cabinet : pas d'accès aux fichiers sur l'iPhone (fonctions asynchrones neutralisées, aides de chemin gardées)
    if (DC.ged) { for (const k of Object.keys(DC.ged)) if (typeof DC.ged[k] === 'function' && DC.ged[k].constructor && DC.ged[k].constructor.name === 'AsyncFunction') DC.ged[k] = async () => null; DC.ged.racine = null; DC.ged.etat = 'absent'; }
    DC.toast = () => {}; DC.rendre = () => {}; DC.rafraichir = () => {}; DC.coquille = () => {};
    DC.lancerTachesDemarrage = async () => {}; DC.auDemarrage = [];
  };

  // cours des structurés (relevé quotidien) : fusion identique au poste (maj-donnees.js), sinon fusion locale
  const fusionnerMarche = j => {
    if (!j || !Array.isArray(j.lignes)) return null;
    const DC = window.DC, meta = { source: j.source || '', date: j.date || '', releve_le: j.releve_le || '' };
    if (DC && typeof DC.fusionnerMarche === 'function') return DC.fusionnerMarche(j.lignes, meta);
    return null;
  };

  M.moteur = {
    erreurs: [], modules: [], duree: 0, pret: false, marche: null,
    async demarrer(etape = () => {}) {
      const t0 = performance.now();
      const F = new Map((await M.stock.fichiers()).map(f => [f.chemin, f]));
      const texte = p => (F.get(p) || {}).contenu || null;
      const erreurs = this.erreurs = [];
      // données (déchiffrées en mémoire, jamais réécrites)
      etape('Déchiffrement des données…');
      const D = await C().lireDonnees(texte('donnees.js'), 'DC_DATA');
      if (!D) throw new Error('Données illisibles (donnees.js).');
      window.DC_DATA = D;
      for (const [fic, nom] of [['valorisations-extranets.js', 'DC_VALOS_EXT'], ['positions-extranets.js', 'DC_POS_EXT']]) {
        if (!texte(fic)) continue;
        try { window[nom] = await C().lireDonnees(texte(fic), nom); } catch (e) { erreurs.push({ module: fic, message: 'déchiffrement impossible' }); }
      }
      let saisies = null;
      try { saisies = await C().lireSaisies(texte('donnees/saisies-application.json')); } catch (e) { erreurs.push({ module: 'saisies-application.json', message: 'lecture impossible' }); }
      window.DC_SAISIES_LOCALES = saisies || {};
      window.DC_UTILISATEUR = { ...C().compte, secours: C().depuisSecours };
      window.DC_SECURITE = C().interfacePoste();
      // modules du poste
      const liste = M.listeModules(texte('app/securite.js'));
      this.modules = [];
      let courant = '';
      const capter = ev => { erreurs.push({ module: courant, message: String(ev.message || ev.error || 'erreur').slice(0, 300) }); };
      window.addEventListener('error', capter);
      try {
        for (let i = 0; i < liste.length; i++) {
          const nom = liste[i]; const code = texte(nom);
          if (i % 12 === 0) etape(`Calculs du cabinet… ${Math.round(i / liste.length * 100)} %`);
          if (!code) { erreurs.push({ module: nom, message: 'absent de l\'iPhone' }); continue; }
          courant = nom;
          const ok = await executer(code, nom);
          if (!ok) erreurs.push({ module: nom, message: 'chargement impossible' });
          else this.modules.push(nom);
          if (nom === 'app/core.js') { if (!window.DC || !window.DC.familles) throw new Error('Moteur du cabinet illisible (app/core.js).'); lectureSeule(); }
        }
      } finally { window.removeEventListener('error', capter); courant = ''; }
      if (!window.DC || !window.DC.familles) throw new Error('Moteur du cabinet absent (app/core.js).');
      lectureSeule();
      etape('Intégration des saisies…');
      window.DC.integrerSaisies();
      try { const t = texte('donnees/marche-structures.json'); this.marche = t ? fusionnerMarche(JSON.parse(t)) : null; } catch (e) { erreurs.push({ module: 'marche-structures.json', message: 'cours illisibles' }); }
      window.DC._alertes = null;
      this.duree = Math.round(performance.now() - t0);
      this.pret = true;
      return window.DC;
    }
  };
})();
