/* Écrans de l'application mobile (consultation) : accueil, clients, fiche famille, contrat, alertes, structurés, réglages.
   Toutes les valeurs viennent du moteur du poste (window.DC) ; rien n'est modifié ni enregistré. */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  M.esc = esc;
  const ICONES = {
    accueil: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    clients: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.3c2.3.1 4 1.6 4.6 4.2"/>',
    alertes: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    structures: '<path d="M4 19.5h16"/><path d="M5 16l4-5 3.5 3 6.5-8"/><path d="M15.5 6H19v3.5"/>',
    reglages: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    retour: '<path d="M14.5 5.5 8 12l6.5 6.5"/>', droite: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    recherche: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', cadenas: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    synchro: '<path d="M20 11.5A8 8 0 0 0 6.2 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 12.5a8 8 0 0 0 13.8 5.2L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
    tel: '<path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>', ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    calendrier: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>', document: '<path d="M7 3.5h7l4.5 4.5v12.5H7z"/><path d="M14 3.5V8h4.5"/><path d="M9.5 13h6M9.5 16.5h6"/>'
  };
  const ic = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONES[n] || ''}</svg>`;
  M.ic = ic;

  // ------------------------------------------------------------------ Aides (après chargement du moteur)
  const DCx = () => window.DC;
  const num = v => (v === null || v === undefined || v === '' || isNaN(+v)) ? 0 : +v;
  const keur = v => DCx().keur(v);
  const eur = v => (v === null || v === undefined || v === '') ? '·' : DCx().eurT(v);
  const date = s => (s ? DCx().date(s) : '');
  const pct = (v, d = 1) => DCx().pct(v, d);
  const sansAccent = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const chiffres = s => String(s || '').replace(/\D/g, '');
  const fn = n => typeof (DCx() || {})[n] === 'function';
  // adresse des fiches sans nom de client (clé opaque tirée du libellé de la famille)
  const cleF = id => { let h = 0x811c9dc5; for (const ch of String(id)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
  let PAR_CLE = null;
  const familleParCle = k => { if (!PAR_CLE) { PAR_CLE = new Map(); for (const f of DCx().familles.values()) PAR_CLE.set(cleF(f.id), f); } return PAR_CLE.get(k) || null; };
  const lienF = id => '#/f/' + cleF(id);
  const auj = () => DCx().iso(DCx().aujourdhui);
  const jusqua = (d) => { const n = DCx().jours(auj(), d); return n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : n > 1 ? `dans ${n} jours` : n === -1 ? 'hier' : `il y a ${-n} jours`; };
  const nomF = f => f ? (f.nomCourt || f.nom || f.id) : '';
  const moi = () => (DCx().reglages || {}).utilisateur || '';
  const pmvHtml = (pmv, base) => {
    if (pmv === null || pmv === undefined) return '<span class="note">·</span>';
    const t = base ? pmv / base : null; const cls = pmv > 0.5 ? 'plus' : pmv < -0.5 ? 'moins' : '';
    return `<span class="pv ${cls}">${pmv > 0.5 ? '+' : pmv < -0.5 ? '-' : ''}${eur(Math.abs(pmv))}${t !== null && Math.abs(pmv) > 0.5 ? ` <small>(${pmv > 0 ? '+' : '-'}${pct(Math.abs(t))})</small>` : ''}</span>`;
  };
  const vide = t => `<p class="vide">${esc(t)}</p>`;
  const carte = (titre, corps, o = {}) => `<section class="carte${o.cls ? ' ' + o.cls : ''}">${titre ? `<div class="carte-tete"><h2>${titre}</h2>${o.droite || ''}</div>` : ''}${corps}</section>`;
  const kpi = (lib, val, sous = '', cls = '') => `<div class="kpi ${cls}"><small>${esc(lib)}</small><b>${val}</b>${sous ? `<span>${sous}</span>` : ''}</div>`;
  const TON = { "Aujourd'hui": 'rouge', 'Cette semaine': 'orange', 'À surveiller': 'gris' };
  const NIV = [['jour', "Aujourd'hui"], ['semaine', 'Cette semaine'], ['surveiller', 'À surveiller']];

  // lien de l'application du poste vers l'écran mobile correspondant
  const lienMobile = (lien, famille) => {
    const s = String(lien || '');
    let m = /^#\/client\/([^?]+)/.exec(s); if (m && DCx().famille(decodeURIComponent(m[1]))) return lienF(decodeURIComponent(m[1]));
    m = /^#\/structure\/([^?]+)/.exec(s); if (m) return '#/s/' + m[1];
    if (/^#\/structures/.test(s)) return '#/structures';
    if (famille && DCx().famille(famille)) return lienF(famille);
    return '';
  };
  const alertesToutes = () => fn('alertes') ? DCx().alertes() : [];
  const alertesPerimetre = (cabinet) => { const u = moi(); return alertesToutes().filter(a => cabinet || !a.conseiller || a.conseiller === u || u === 'CAB'); };
  const carteAlerte = (a, o = {}) => {
    const f = a.famille && DCx().famille(a.famille); const href = lienMobile(a.lien, a.famille);
    const tag = href ? 'a' : 'div';
    return `<${tag} class="alerte t-${TON[a.niveau] || 'gris'}"${href ? ` href="${esc(href)}"` : ''}>
      <span class="meta"><span class="pastille p-${TON[a.niveau] || 'gris'}">${esc(a.type || a.niveau)}</span>${f && !o.sansFamille ? `<span>${esc(nomF(f))}</span>` : ''}${a.date ? `<span>${esc(date(a.date))}</span>` : ''}</span>
      <b>${esc(a.titre)}</b>${a.detail ? `<small>${esc(a.detail)}</small>` : ''}</${tag}>`;
  };
  const jourBloc = d => { const x = DCx().dt(d); return x ? `<div class="date-bloc"><b>${x.getDate()}</b><small>${DCx().MOIS[x.getMonth()]}</small></div>` : ''; };
  const ligne = (href, gauche, corps, droite) => `<${href ? 'a' : 'div'} class="ligne"${href ? ` href="${esc(href)}"` : ''}>${gauche || ''}<div class="corps">${corps}</div>${droite !== undefined ? `<div class="droite">${droite}</div>` : ''}${href ? ic('droite', 'ic chevron') : ''}</${href ? 'a' : 'div'}>`;
  const mono = f => `<span class="mono">${esc(f.mono || nomF(f).slice(0, 2).toUpperCase())}</span>`;

  // valeur d'un contrat (même règle que la fiche client du poste)
  const valeurContrat = c => (fn('pmvContrat') ? DCx().pmvContrat(c) : { valeur: c.encours > 0 ? num(c.encours) : num(c.valeurPositions), nominal: null, pmv: null, source: '' });
  const contratsVisibles = f => f.contrats.map((c, i) => ({ c, i, v: valeurContrat(c) })).filter(x => x.c.encours > 0 || x.c.valeurPositions > 0 || x.c.saisie).sort((a, b) => b.v.valeur - a.v.valeur);
  const dateValo = c => {
    const dv = c.derniere && c.derniere.date ? String(c.derniere.date).slice(0, 10) : '';
    const dp = c.datePositions || '';
    return c.encours > 0 ? dv || dp : dp || dv;
  };
  const sourceContrat = c => {
    const p = (c.positions || []).find(x => x.controle || x.releve);
    if (p && p.source === 'extranet') return p.origine === 'o2s' ? 'export O2S' : 'relevé de l\'extranet';
    if (c.derniere && c.derniere.commentaire) return String(c.derniere.commentaire).slice(0, 80);
    return c.positions && c.positions.length ? 'positions reprises' : '';
  };

  // ------------------------------------------------------------------ Index de recherche
  let INDEX = null;
  M.reindexer = () => { INDEX = null; PAR_CLE = null; };
  const index = () => INDEX || (INDEX = [...DCx().familles.values()].map(f => ({
    f, h: sansAccent([f.id, f.nomCourt, f.code, ...f.titulaires.map(t => t.nom), ...(f.entites || []).map(e => e.dossier)].join(' ')),
    n: f.contrats.map(c => chiffres(c.numero)).filter(x => x.length >= 4)
  })));
  const chercher = (q, filtre) => {
    const mots = sansAccent(q).split(/\s+/).filter(Boolean); const cq = chiffres(q);
    return index().filter(x => filtre(x.f) && (!mots.length || mots.every(m => x.h.includes(m)) || (cq.length >= 4 && x.n.some(n => n.includes(cq))))).map(x => x.f);
  };

  // ------------------------------------------------------------------ Écrans
  const V = {};
  V.accueil = () => {
    const DC = DCx(); const fams = [...DC.familles.values()];
    const clients = fams.filter(f => f.statut === 'Client');
    const al = alertesPerimetre(false);
    const jour = al.filter(a => a.niveau === "Aujourd'hui"), sem = al.filter(a => a.niveau === 'Cette semaine');
    const aFaire = (fn('grouperAlertesDossiers') ? DC.grouperAlertesDossiers([...jour, ...sem]) : [...jour, ...sem]).slice(0, 6);
    const a0 = auj(), d14 = DC.iso(DC.ajouterJours(DC.aujourdhui, 14));
    const rdv = fams.filter(f => f.prochainRdv && f.prochainRdv >= a0 && f.prochainRdv <= d14).sort((a, b) => a.prochainRdv.localeCompare(b.prochainRdv)).slice(0, 5);
    const cst = fn('constatations') ? DC.constatations(DC.aujourdhui, DC.ajouterJours(DC.aujourdhui, 30)).slice(0, 5) : [];
    const enc = fn('encoursTotal') ? DC.encoursTotal() : fams.reduce((s, f) => s + num(f.encours), 0);
    const resume = [jour.length ? `${jour.length} tâche${jour.length > 1 ? 's' : ''} pour aujourd'hui` : "rien d'urgent aujourd'hui", sem.length ? `${sem.length} cette semaine` : ''].filter(Boolean).join(', ');
    const prenom = fn('prenomUtilisateur') ? DC.prenomUtilisateur() : '';
    return { titre: 'Damarisse Conseils', grand: true, html: `
<section class="hero"><p class="surtitre">${esc((s => s.charAt(0).toUpperCase() + s.slice(1))(DC.aujourdhui.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })))}</p>
  <h1>Bonjour${prenom ? ' ' + esc(prenom) : ''}</h1><p class="chapo">${esc(resume.charAt(0).toUpperCase() + resume.slice(1))}.</p></section>
<a class="faux-champ" href="#/clients?focus=1">${ic('recherche')}<span>Rechercher un client ou un contrat</span></a>
<div class="kpis">
  ${kpi('Encours suivis', keur(enc), `${clients.length} familles clientes`, 'accent')}
  <a class="kpi-lien" href="#/alertes?n=jour">${kpi("Aujourd'hui", jour.length, `${sem.length} cette semaine`, jour.length ? 'k-rouge' : 'k-vert')}</a>
</div>
${carte('À faire <em>en priorité</em>', aFaire.length ? `<div class="liste-alertes">${aFaire.map(a => carteAlerte(a)).join('')}</div>` : `<div class="vide-joli">${ic('ok')}<b>Tout est à jour.</b><span>Aucune tâche urgente pour vos familles.</span></div>`, { droite: '<a class="lien-fleche" href="#/alertes">Tout voir</a>' })}
${rdv.length ? carte('Rendez-vous', rdv.map(f => ligne(lienF(f.id), jourBloc(f.prochainRdv), `<b>${esc(nomF(f))}</b><small>${esc(jusqua(f.prochainRdv))} · ${esc(DC.nomConseiller(f.conseiller))}</small>`)).join('')) : ''}
${carte('Constatations à venir', cst.length ? cst.map(c => ligne('#/s/' + encodeURIComponent(c.fonds), jourBloc(c.date), `<b>${esc(c.fonds)}</b><small>${esc(c.evenement || 'Constatation')} · ${c.detenteurs.length} famille${c.detenteurs.length > 1 ? 's' : ''}</small>`, `<b>${keur(c.nominalDet)}</b>`)).join('') : vide('Aucune constatation dans les 30 jours.'), { droite: '<a class="lien-fleche" href="#/structures">Structurés</a>' })}
${M.piedDonnees()}` };
  };

  V.clients = q => {
    const DC = DCx(); const seg = q.seg || 'clients'; const mien = q.mien === '1';
    const filtre = f => (seg === 'tous' || (seg === 'clients' ? f.statut === 'Client' : f.statut === 'Prospect')) && (!mien || f.conseiller === moi());
    const n = s => [...DC.familles.values()].filter(f => s === 'tous' || (s === 'clients' ? f.statut === 'Client' : f.statut === 'Prospect')).filter(f => !mien || f.conseiller === moi()).length;
    const lien = o => '#/clients?' + new URLSearchParams(Object.assign({ seg, mien: mien ? '1' : '' }, o)).toString();
    return { titre: 'Clients', grand: true, html: `
<div class="champ-recherche">${ic('recherche')}<input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Nom, code famille, n° de contrat" value="${esc(M.recherche || '')}"></div>
<div class="segments" role="tablist">${[['clients', 'Clients'], ['prospects', 'Prospects'], ['tous', 'Tous']].map(([k, l]) => `<a role="tab" href="${esc(lien({ seg: k }))}" class="${seg === k ? 'actif' : ''}" aria-selected="${seg === k}">${l} <span>${n(k)}</span></a>`).join('')}</div>
<div class="puces"><a href="${esc(lien({ mien: mien ? '' : '1' }))}" class="puce${mien ? ' actif' : ''}">${mien ? ic('ok') : ''}Mes familles</a></div>
<p class="note" id="total"></p><div class="liste" id="res"></div>`,
      apres: (racine) => {
        const inp = racine.querySelector('#q'), res = racine.querySelector('#res'), tot = racine.querySelector('#total');
        const maj = () => {
          const l = chercher(inp.value, filtre); const somme = l.reduce((s, f) => s + num(f.encours), 0);
          tot.textContent = `${l.length} famille${l.length > 1 ? 's' : ''} · ${keur(somme).replace(/ | /g, ' ')} d'encours`;
          res.innerHTML = l.slice(0, 250).map(f => ligne(lienF(f.id), mono(f), `<b>${esc(nomF(f))}</b><small>${esc([f.code !== f.id ? f.code : '', DC.nomConseiller(f.conseiller), f.segment && f.segment !== '·' ? 'segment ' + f.segment : f.statut].filter(Boolean).join(' · '))}</small>`, `<b>${keur(f.encours)}</b>`)).join('') || vide('Aucune famille ne correspond.');
          M.recherche = inp.value;
        };
        inp.addEventListener('input', maj); inp.addEventListener('search', maj); maj();
        if (q.focus) setTimeout(() => inp.focus(), 60);
      } };
  };

  V.famille = (q, k) => {
    const DC = DCx(); const f = familleParCle(k);
    if (!f) return { titre: 'Famille', retour: '#/clients', html: vide('Famille introuvable dans les données de l\'iPhone.') };
    const cs = contratsVisibles(f);
    const connus = cs.filter(x => x.v.pmv !== null);
    const total = cs.reduce((s, x) => s + x.v.valeur, 0), pmv = connus.reduce((s, x) => s + x.v.pmv, 0), nominal = connus.reduce((s, x) => s + num(x.v.nominal), 0);
    const al = alertesToutes().filter(a => a.famille === f.id);
    const ops = (fn('toutesOps') ? DC.toutesOps() : f.ops).filter(o => o.famille === f.id).sort((a, b) => String(b.date || '9999').localeCompare(String(a.date || '9999'))).slice(0, 8);
    const crs = fn('comptesRendus') ? DC.comptesRendus(f).slice(0, 6) : [];
    const structs = [...(DC.grouper ? DC.grouper(f.ops.filter(o => num(o.nominal_vivant) > 0), 'fonds') : new Map())].map(([nom, l]) => ({ nom, nominal: l.reduce((s, o) => s + num(o.nominal_vivant), 0) })).sort((a, b) => b.nominal - a.nominal);
    const c = f.conf || {};
    const infos = [
      ['Statut', f.statut], ['Conseiller', DC.nomConseiller(f.conseiller)], ['Profil', f.profil], DC.droits && DC.droits.peut('lcbft') ? ['Vigilance', f.vigilance] : null,
      ['Client depuis', f.entree ? date(f.entree) : ''], ['Dernier rendez-vous', f.dernierRdv ? date(f.dernierRdv) : ''], ['Prochain rendez-vous', f.prochainRdv ? date(f.prochainRdv) : ''],
      ['Prochaine échéance', c['Prochaine échéance'] ? date(c['Prochaine échéance']) : ''], ['Dossier réglementaire', f.avancement ? pct(f.avancement, 0) : ''], ['Suivi annuel', c['Suivi annuel'] || '']
    ].filter(x => x && x[1]);
    const titulaire = t => {
      const tel = t.tel || t.telephone || t.portable || ''; const mail = t.email || '';
      const sous = [t.type === 'Personne morale' ? 'Société' : '', t.age ? `${t.age} ans` : '', t.ville || '', t.encours ? keur(t.encours) : ''].filter(Boolean).join(' · ');
      return `<div class="titulaire"><div class="corps"><b>${esc(t.nom)}</b>${sous ? `<small>${esc(sous)}</small>` : ''}</div><div class="actions-rondes">${tel ? `<a class="rond" href="tel:${esc(String(tel).replace(/[^\d+]/g, ''))}" aria-label="Appeler">${ic('tel')}</a>` : ''}${mail ? `<a class="rond" href="mailto:${esc(mail)}" aria-label="Écrire">${ic('mail')}</a>` : ''}</div></div>`;
    };
    return { titre: nomF(f), retour: '#/clients', html: `
<section class="fiche-tete">${mono(f)}<div><h1>${esc(nomF(f))}</h1><p>${esc([f.code !== f.id ? f.code : '', f.statut, f.segment && f.segment !== '·' ? 'segment ' + f.segment : ''].filter(Boolean).join(' · '))}</p></div></section>
<div class="kpis">
  ${kpi('Encours', keur(f.encours), `${cs.length} contrat${cs.length > 1 ? 's' : ''} actif${cs.length > 1 ? 's' : ''}`, 'accent')}
  ${connus.length ? kpi('Plus-values', pmvHtml(pmv, nominal), connus.length < cs.length ? `sur ${connus.length} des ${cs.length} contrats (${keur(connus.reduce((s, x) => s + x.v.valeur, 0))})` : `sur ${keur(connus.reduce((s, x) => s + x.v.valeur, 0))}`, pmv < -0.5 ? 'k-rouge' : 'k-vert') : kpi('Contrats', cs.length, 'plus-values non calculées')}
</div>
${al.length ? carte(`À faire <span class="compte">${al.length}</span>`, `<div class="liste-alertes">${al.slice(0, 8).map(a => carteAlerte(a, { sansFamille: true })).join('')}</div>`) : ''}
${carte(`Contrats <span class="compte">${keur(total)}</span>`, cs.length ? cs.map(x => ligne(`${lienF(f.id)}/c/${x.i}`, '', `<b>${esc([x.c.partenaire, x.c.produit].filter(Boolean).join(' · '))}</b><small>${esc([x.c.titulaire, x.c.numero ? 'n° ' + x.c.numero : '', dateValo(x.c) ? 'au ' + date(dateValo(x.c)) : ''].filter(Boolean).join(' · '))}</small>`, `<b>${eur(x.v.valeur)}</b>${x.v.pmv !== null ? `<small>${pmvHtml(x.v.pmv, x.v.nominal)}</small>` : ''}`)).join('') : vide('Aucun contrat en cours.'))}
${structs.length ? carte('Structurés détenus', structs.map(s => { const m = DC.marcheParFonds && DC.marcheParFonds.get(s.nom); return ligne('#/s/' + encodeURIComponent(s.nom), '', `<b>${esc(s.nom)}</b><small>${m && m.niveau != null ? `niveau ${pct(m.niveau)}${m.next ? ' · prochaine date ' + date(m.next) : ''}` : esc((DC.fonds.get(s.nom) || {}).statut || '')}</small>`, `<b>${keur(s.nominal)}</b>`); }).join('')) : ''}
${carte('Titulaires', f.titulaires.map(titulaire).join('') || vide('Aucun titulaire.'))}
${carte('Dossier', `<dl class="faits">${infos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`)}
${ops.length ? carte('Dernières opérations', ops.map(o => ligne('', '', `<b>${esc(o.type || '')}</b><small>${esc([o.date ? date(o.date) : 'à venir', [o.partenaire, o.produit].filter(Boolean).join(' · '), o.statut].filter(Boolean).join(' · '))}</small>`, `<b>${eur(o.montant ?? o.collecte ?? '')}</b>`)).join('')) : ''}
${crs.length ? carte('Comptes rendus', crs.map(x => { const t = x.cr && x.cr.texte; return t ? `<details class="cr"><summary>${ligne('', `<span class="rond doux">${ic('document')}</span>`, `<b>${esc(x.objet || 'Compte rendu')}</b><small>${esc(date(x.date))} · ${esc(x.source)}</small>`)}</summary><div class="texte">${esc(t)}</div></details>` : ligne('', `<span class="rond doux">${ic('document')}</span>`, `<b>${esc(x.objet || 'Compte rendu')}</b><small>${esc(date(x.date))} · ${esc(x.source)}</small>`); }).join('')) : ''}
` };
  };

  V.contrat = (q, k, i) => {
    const DC = DCx(); const f = familleParCle(k); const c = f && f.contrats[+i];
    if (!c) return { titre: 'Contrat', retour: f ? lienF(f.id) : '#/clients', html: vide('Contrat introuvable.') };
    const v = valeurContrat(c); const tot = (c.positions || []).reduce((s, p) => s + num(p.valeur), 0) || 1;
    const pos = (c.positions || []).filter(p => num(p.valeur) !== 0).sort((a, b) => num(b.valeur) - num(a.valeur));
    const pvP = p => (p.pv !== undefined && p.pv !== null && p.pv !== '') ? num(p.pv) : (num(p.pma) > 0 && num(p.parts) > 0 ? num(p.valeur) - num(p.pma) * num(p.parts) : null);
    const ops = (c.ops || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 12);
    const src = sourceContrat(c);
    const avecPv = pos.filter(p => pvP(p) !== null); const pvPart = avecPv.reduce((s, p) => s + pvP(p), 0), basePart = avecPv.reduce((s, p) => s + num(p.valeur), 0) - pvPart;
    return { titre: c.partenaire || 'Contrat', retour: lienF(f.id), html: `
<section class="fiche-tete simple"><div><p class="surtitre">${esc(nomF(f))}</p><h1>${esc([c.partenaire, c.produit].filter(Boolean).join(' · '))}</h1><p>${esc([c.titulaire, c.numero ? 'n° ' + c.numero : ''].filter(Boolean).join(' · '))}</p></div></section>
<div class="kpis">
  ${kpi('Valeur', eur(v.valeur), dateValo(c) ? 'au ' + date(dateValo(c)) : '', 'accent')}
  ${v.pmv !== null ? kpi('Plus-value', pmvHtml(v.pmv, v.nominal), v.source ? 'd\'après les ' + v.source : '', v.pmv < -0.5 ? 'k-rouge' : 'k-vert') : avecPv.length ? kpi('Plus-value', pmvHtml(pvPart, basePart), `sur ${avecPv.length} des ${pos.length} supports`, pvPart < -0.5 ? 'k-rouge' : 'k-vert') : kpi('Supports', pos.length, 'plus-value non calculée')}
</div>
${num(c.flux) || (c.encours > 0 && c.valeurPositions > 0) || src ? `<dl class="faits carte">${[num(c.flux) ? ['Versements nets', eur(c.flux)] : null, c.encours > 0 && c.valeurPositions > 0 ? ['Valeur des supports', eur(c.valeurPositions) + (c.datePositions ? ' au ' + date(c.datePositions) : '')] : null, src ? ['Source', src] : null].filter(Boolean).map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>` : ''}
${carte(`Supports <span class="compte">${pos.length}</span>`, pos.length ? pos.map(p => { const pv = pvP(p); return `<div class="ligne support"><div class="corps"><b>${esc(p.support || p.isin || 'Support')}</b><small>${esc([p.isin, p.classe || p.categorie, p.sri ? 'SRI ' + p.sri : ''].filter(Boolean).join(' · '))}</small><div class="barre-poids"><i style="width:${Math.max(1, Math.min(100, num(p.valeur) / tot * 100)).toFixed(1)}%"></i></div></div><div class="droite"><b>${eur(p.valeur)}</b><small>${pct(num(p.valeur) / tot)}${pv !== null ? ' · ' + pmvHtml(pv, num(p.valeur) - pv) : ''}</small></div></div>`; }).join('') : vide('Pas de détail par support pour ce contrat.'))}
${ops.length ? carte('Opérations', ops.map(o => ligne('', '', `<b>${esc(o.type || '')}</b><small>${esc([o.date ? date(o.date) : 'à venir', o.statut, o.fonds].filter(Boolean).join(' · '))}</small>`, `<b>${eur(o.montant ?? o.flux ?? '')}</b>`)).join('')) : ''}
` };
  };

  V.alertes = q => {
    const cab = q.p === 'cabinet'; const n = q.n || 'jour';
    const al = alertesPerimetre(cab); const niv = (NIV.find(x => x[0] === n) || NIV[0])[1];
    const l = al.filter(a => a.niveau === niv);
    const lien = o => '#/alertes?' + new URLSearchParams(Object.assign({ n, p: cab ? 'cabinet' : '' }, o)).toString();
    const groupes = new Map(); for (const a of l) { const k = a.famille || ''; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(a); }
    return { titre: 'Alertes', grand: true, html: `
<div class="segments" role="tablist">${NIV.map(([k, lib]) => `<a role="tab" href="${esc(lien({ n: k }))}" class="${n === k ? 'actif' : ''}" aria-selected="${n === k}">${esc(lib)} <span>${al.filter(a => a.niveau === lib).length}</span></a>`).join('')}</div>
<div class="puces"><a href="${esc(lien({ p: '' }))}" class="puce${cab ? '' : ' actif'}">Mes familles</a><a href="${esc(lien({ p: 'cabinet' }))}" class="puce${cab ? ' actif' : ''}">Tout le cabinet</a></div>
${l.length ? [...groupes].map(([fid, as]) => carte(fid ? `<a href="${esc(lienF(fid))}">${esc(nomF(DCx().famille(fid)) || fid)}</a>` : 'Cabinet', `<div class="liste-alertes">${as.map(a => carteAlerte(a, { sansFamille: !!fid })).join('')}</div>`, { cls: 'groupe' })).join('') : `<div class="vide-joli">${ic('ok')}<b>Rien à signaler.</b><span>Aucune alerte « ${esc(niv.toLowerCase())} ».</span></div>`}
<p class="note centre">Les alertes se traitent dans l'application du cabinet (traitée, reportée, non applicable).</p>` };
  };

  // structurés : fonds vivants détenus, niveau du sous-jacent, barrières et prochaines dates
  const fondsVivants = () => {
    const DC = DCx();
    return [...DC.fonds.values()].filter(f => !['Remboursé', 'Échu', 'Hors suivi'].includes(f.statut)).map(f => {
      const det = DC.detenteurs(f.nom).filter(x => x.nominal > 0);
      return { f, m: DC.marcheParFonds.get(f.nom), det, nominal: det.reduce((s, x) => s + x.nominal, 0) };
    }).filter(x => x.nominal > 0).sort((a, b) => b.nominal - a.nominal);
  };
  const etatNiveau = m => { if (!m || m.niveau == null) return 'gris'; const n = num(m.niveau); if (m.barcap && n < num(m.barcap)) return 'rouge'; if (m.barcpn && n < num(m.barcpn)) return 'orange'; return 'vert'; };
  const jauge = m => {
    if (!m || m.niveau == null) return '';
    const n = num(m.niveau); const max = Math.max(1.3, n * 1.08, num(m.nivrappel) * 1.08); const x = v => Math.max(0, Math.min(100, v / max * 100)).toFixed(1);
    const rep = [[m.barcap, 'cap', 'Capital'], [m.barcpn, 'cpn', 'Coupon'], [m.nivrappel, 'rap', 'Rappel']].filter(r => r[0]);
    return `<div class="jauge-niv" role="img" aria-label="Niveau ${esc(pct(n))}">${rep.map(([v, k]) => `<i class="rep r-${k}" style="left:${x(num(v))}%"></i>`).join('')}<b class="pt p-${etatNiveau(m)}" style="left:${x(n)}%"></b></div>
      <div class="jauge-leg">${rep.map(([v, k, l]) => `<span class="l-${k}">${l} ${pct(num(v), 0)}</span>`).join('')}</div>`;
  };
  V.structures = () => {
    const DC = DCx(); const L = fondsVivants(); const tot = L.reduce((s, x) => s + x.nominal, 0);
    const cst = fn('constatations') ? DC.constatations(DC.aujourdhui, DC.ajouterJours(DC.aujourdhui, 30)) : [];
    const sous = L.filter(x => etatNiveau(x.m) !== 'vert' && etatNiveau(x.m) !== 'gris').length;
    const dm = (DC.marcheMaj && DC.marcheMaj.date) || L.map(x => x.m && x.m.dateprix || '').sort().pop() || '';
    return { titre: 'Structurés', grand: true, html: `
<div class="kpis">${kpi('Nominal vivant', keur(tot), `${L.length} fonds détenus`, 'accent')}${kpi('Sous une barrière', sous, `coupon ou capital${dm ? ' · cours du ' + date(dm) : ''}`, sous ? 'k-orange' : 'k-vert')}</div>
${cst.length ? carte('Constatations à 30 jours', cst.slice(0, 8).map(c => ligne('#/s/' + encodeURIComponent(c.fonds), jourBloc(c.date), `<b>${esc(c.fonds)}</b><small>${esc(c.evenement || 'Constatation')} · ${c.detenteurs.length} famille${c.detenteurs.length > 1 ? 's' : ''}</small>`, `<b>${keur(c.nominalDet)}</b>`)).join('')) : ''}
${carte('Fonds détenus', L.map(x => `<a class="fonds" href="#/s/${encodeURIComponent(x.f.nom)}"><div class="fonds-tete"><div class="corps"><b>${esc(x.f.nom)}</b><small>${esc([x.m && x.m.type || x.f.famille_produit, x.f.groupe || x.f.emetteur].filter(Boolean).join(' · '))}</small></div><div class="droite"><b>${keur(x.nominal)}</b><small>${x.m && x.m.niveau != null ? 'niveau ' + pct(x.m.niveau) : esc(x.f.statut || '')}</small></div></div>${jauge(x.m)}</a>`).join('') || vide('Aucun fonds structuré vivant.'))}` };
  };
  V.structure = (q, nom) => {
    const DC = DCx(); const n = decodeURIComponent(nom); const f = DC.fonds.get(n);
    if (!f) return { titre: 'Structuré', retour: '#/structures', html: vide('Fonds introuvable.') };
    const m = DC.marcheParFonds.get(n); const det = DC.detenteurs(n).filter(x => x.nominal > 0 || x.prevu > 0);
    const cal = (DC.calParFonds.get(n) || []).filter(c => c.date >= auj()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
    const faits = [['Statut', f.statut], ['Émetteur', f.emetteur], ['Sous-jacent', f.sous_jacent], ['Mécanisme', f.mecanisme], ['Coupon', f.cpn_annuel ? pct(f.cpn_annuel, 2) + ' par an' + (f.memoire === 'Oui' ? ' (mémoire)' : '') : ''],
      ['Barrière de capital', f.barriere_capital ? pct(f.barriere_capital, 0) : ''], ['Échéance', f.echeance ? date(f.echeance) : ''], ['Prix', m && m.prix ? pct(m.prix, 2) + (m.dateprix ? ' au ' + date(m.dateprix) : '') : '']].filter(x => x[1]);
    return { titre: n, retour: '#/structures', html: `
<section class="fiche-tete simple"><div><p class="surtitre">${esc([m && m.type || f.famille_produit, f.groupe].filter(Boolean).join(' · '))}</p><h1>${esc(n)}</h1><p>${esc(f.isin || '')}</p></div></section>
${m && m.niveau != null ? carte('Niveau du sous-jacent', `<p class="grand-chiffre t-${etatNiveau(m)}">${pct(m.niveau)}</p>${jauge(m)}${m.next ? `<p class="note">Prochaine date ${esc(date(m.next))}${m.nextrappel && m.nextrappel !== m.next ? ` · prochain rappel possible ${esc(date(m.nextrappel))}` : ''}</p>` : ''}`) : ''}
${carte('Caractéristiques', `<dl class="faits">${faits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${f.clair ? `<details class="en-clair"><summary>En clair</summary><p>${esc(f.clair)}</p></details>` : ''}`)}
${cal.length ? carte('Prochaines dates', cal.map(c => ligne('', jourBloc(c.date), `<b>${esc(c.evenement || 'Constatation')}</b><small>${esc(c.condition || '')}</small>`)).join('')) : ''}
${carte(`Détenteurs <span class="compte">${det.length}</span>`, det.map(x => ligne(DC.famille(x.famille) ? lienF(x.famille) : '', '', `<b>${esc(nomF(DC.famille(x.famille)) || x.famille)}</b><small>${esc([x.titulaire, x.partenaire, x.depuis ? 'depuis ' + date(x.depuis) : ''].filter(Boolean).join(' · '))}</small>`, `<b>${keur(x.nominal || x.prevu)}</b>${x.prevu ? '<small>prévu</small>' : ''}`)).join('') || vide('Aucun détenteur.'))}` };
  };

  V.reglages = () => {
    const DC = DCx(); const R = M.etat; const mod = M.moteur;
    const minutes = M.verrouMinutes();
    return { titre: 'Réglages', grand: true, html: `
${carte('Session', `<dl class="faits"><div><dt>Compte</dt><dd>${esc(M.coffre.compte ? M.coffre.compte.nom : '')}${M.coffre.compte ? ` (${M.coffre.compte.role === 'associe' ? 'associé' : 'assistante'})` : ''}</dd></div><div><dt>Verrouillage automatique</dt><dd><select id="verrou-min">${[2, 5, 10, 15, 30].map(n => `<option value="${n}" ${n === minutes ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></dd></div></dl>
  <button class="btn" type="button" data-action="verrouiller">${ic('cadenas')} Verrouiller maintenant</button>`)}
${carte('Données', `<dl class="faits"><div><dt>Données du cabinet</dt><dd>${esc(date(DC.dateDonnees))}</dd></div><div><dt>Synchronisées</dt><dd>${esc(M.libSynchro())}</dd></div><div><dt>Sur cet iPhone</dt><dd>${esc(R.nbFichiers || 0)} fichiers · ${esc(M.taille(R.octets || 0))}</dd></div></dl>
  <p class="note" id="etat-synchro">${esc(R.messageSynchro || '')}</p>
  <button class="btn btn-primaire" type="button" data-action="synchroniser">${ic('synchro')} Synchroniser maintenant</button>`)}
${carte('Microsoft 365', `<dl class="faits"><div><dt>Compte</dt><dd>${esc(M.auth.nom || (M.auth.configuree ? 'non connecté' : 'connexion non configurée'))}</dd></div></dl>
  ${M.auth.configuree ? (M.auth.compte ? '<button class="btn" type="button" data-action="oublier-ms">Oublier la connexion sur cet iPhone</button>' : '<button class="btn" type="button" data-action="connecter">Se connecter</button>') : ''}`)}
${carte('Moteur du cabinet', `<dl class="faits"><div><dt>Version</dt><dd>${esc(DC.VERSION || '')}${DC.VERSION_DATE ? ' du ' + esc(date(DC.VERSION_DATE)) : ''}</dd></div><div><dt>Modules</dt><dd>${mod.modules.length} chargés en ${(mod.duree / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s</dd></div><div><dt>Anomalies</dt><dd>${mod.erreurs.length ? mod.erreurs.length : 'aucune'}</dd></div></dl>
  ${mod.erreurs.length ? `<details class="en-clair"><summary>Détail</summary><ul class="petit">${mod.erreurs.slice(0, 30).map(e => `<li><b>${esc(e.module || '·')}</b> ${esc(e.message)}</li>`).join('')}</ul></details>` : ''}`)}
${carte('Cet iPhone', `<p class="note">Les fichiers sont gardés chiffrés sur l'iPhone pour une consultation hors connexion. Les effacer oblige à une nouvelle synchronisation.</p><button class="btn btn-danger" type="button" data-action="effacer">Effacer les données de cet iPhone</button>`)}
<p class="note centre">Damarisse Conseils mobile ${esc(M.VERSION)} · consultation seule</p>`,
      apres: racine => { const s = racine.querySelector('#verrou-min'); if (s) s.addEventListener('change', () => { M.reglerVerrou(+s.value); }); } };
  };

  // ------------------------------------------------------------------ Routeur
  const ROUTES = [
    [/^\/?$/, V.accueil, 'accueil'], [/^\/clients$/, V.clients, 'clients'], [/^\/f\/([^/]+)$/, V.famille, 'clients'], [/^\/f\/([^/]+)\/c\/(\d+)$/, V.contrat, 'clients'],
    [/^\/alertes$/, V.alertes, 'alertes'], [/^\/structures$/, V.structures, 'structures'], [/^\/s\/([^/]+)$/, V.structure, 'structures'], [/^\/reglages$/, V.reglages, 'reglages']
  ];
  const ONGLETS = [['accueil', 'Accueil', '#/'], ['clients', 'Clients', '#/clients'], ['alertes', 'Alertes', '#/alertes'], ['structures', 'Structurés', '#/structures'], ['reglages', 'Réglages', '#/reglages']];
  const positions = new Map();
  M.vues = {
    coquille() {
      document.getElementById('app').innerHTML = `<header class="barre" id="barre"><a class="retour" id="retour" hidden>${ic('retour')}<span>Retour</span></a><h1 class="titre" id="titre"></h1><span class="barre-droite"></span></header>
<main class="vue" id="vue" tabindex="-1"></main>
<nav class="onglets" aria-label="Navigation">${ONGLETS.map(([k, l, h]) => `<a href="${h}" data-onglet="${k}">${ic(k)}<span>${l}</span>${k === 'alertes' ? '<i class="pastille-n" id="n-alertes" hidden></i>' : ''}</a>`).join('')}</nav>`;
      window.addEventListener('hashchange', () => this.rendre());
      document.getElementById('vue').addEventListener('click', e => { const b = e.target.closest('[data-action]'); if (b && M.actions[b.dataset.action]) { e.preventDefault(); M.actions[b.dataset.action](b); } });
      window.addEventListener('scroll', () => { positions.set(location.hash || '#/', window.scrollY); document.getElementById('barre').classList.toggle('defile', window.scrollY > 72); }, { passive: true });
    },
    rendre() {
      const h = location.hash || '#/'; const [p, qs] = h.slice(1).split('?'); const q = Object.fromEntries(new URLSearchParams(qs || ''));
      let r = null, onglet = 'accueil';
      for (const [re, f, o] of ROUTES) { const m = re.exec(p || '/'); if (m) { onglet = o; try { r = f(q, ...m.slice(1)); } catch (e) { console.error(e); r = { titre: 'Erreur', html: vide('Affichage impossible : ' + (e.message || e)) }; } break; } }
      if (!r) { r = V.accueil(q); onglet = 'accueil'; }
      const vue = document.getElementById('vue'); vue.innerHTML = r.html;
      vue.classList.toggle('grand', !!r.grand);
      document.getElementById('titre').textContent = r.titre || '';
      const barre = document.getElementById('barre'); barre.classList.toggle('avec-retour', !!r.retour);
      barre.classList.toggle('titre-defile', !!r.retour && /fiche-tete/.test(r.html)); barre.classList.remove('defile');
      const rt = document.getElementById('retour'); rt.hidden = !r.retour; if (r.retour) rt.setAttribute('href', r.retour);
      for (const a of document.querySelectorAll('.onglets a')) { const ok = a.dataset.onglet === onglet; a.classList.toggle('actif', ok); if (ok) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
      const nj = alertesPerimetre(false).filter(a => a.niveau === "Aujourd'hui").length; const b = document.getElementById('n-alertes'); if (b) { b.hidden = !nj; b.textContent = nj > 99 ? '99+' : String(nj); }
      if (r.apres) r.apres(vue);
      window.scrollTo(0, positions.get(h) || 0);
    }
  };
  M.actions = M.actions || {};
})();
