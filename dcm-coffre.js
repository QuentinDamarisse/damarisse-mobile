/* Déverrouillage et déchiffrement, identiques à l'application du poste (app/securite.js) : la clé privée RSA-OAEP 3072 bits,
   enveloppée par une clé dérivée du mot de passe (PBKDF2-SHA-256, 600 000 itérations), est rouverte en mémoire, non
   extractible ; chaque fichier DC1 porte sa clé AES-256-GCM enveloppée par la clé publique. Le coffre des associés (DC1C)
   n'est jamais ouvert sur l'iPhone : son contenu n'y est pas lu. Lecture seule : aucune fonction de chiffrement. */
(() => {
  'use strict';
  const M = window.DCM = window.DCM || {};
  const ITER = 600000;
  const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
  const enc = new TextEncoder(), dec = new TextDecoder();
  const de64 = s => { const t = atob(s); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; };
  const subtle = () => { if (!window.crypto || !crypto.subtle) throw new Error('Chiffrement indisponible : ouvrez l\'application en https dans Safari.'); return crypto.subtle; };
  const normCode = s => String(s ?? '').replace(/[\s-]/g, '').toUpperCase();
  const COFFRE_CLES = ['tracfin', 'cartographie'];

  // affectation « window.NOM = {…}; » d'un fichier .js du poste (en-tête en commentaire)
  const lireAffectation = (texte, nom) => {
    const t = String(texte || ''); const m = new RegExp('window\\.' + nom + '\\s*=\\s*\\{').exec(t); if (!m) return null;
    const a = m.index + m[0].length - 1, b = t.lastIndexOf('}'); if (b < a) return null;
    return JSON.parse(t.slice(a, b + 1));
  };
  const estChiffre = x => !!(x && typeof x === 'object' && x.chiffre === 'DC1' && x.k && x.d);
  const estCoffre = x => !!(x && typeof x === 'object' && x.chiffre === 'DC1C' && x.k && x.d);

  const deriver = async (secret, sel, iter = ITER) => {
    const base = await subtle().importKey('raw', enc.encode(String(secret).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
    return subtle().deriveKey({ name: 'PBKDF2', salt: sel, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  };
  const ouvrirEnveloppe = async (env, secret) => {
    const k = await deriver(secret, de64(env.sel), env.iter || ITER);
    return subtle().unwrapKey('pkcs8', de64(env.cle), k, { name: 'AES-GCM', iv: de64(env.iv) }, RSA, false, ['decrypt', 'unwrapKey']);
  };
  const dechiffrerAvec = async (priv, env) => {
    const k = await subtle().unwrapKey('raw', de64(env.k), priv, RSA, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return dec.decode(await subtle().decrypt({ name: 'AES-GCM', iv: de64(env.iv) }, k, de64(env.d)));
  };

  M.coffre = {
    lireAffectation, estChiffre, estCoffre, normCode, COFFRE_CLES,
    cles: null, privee: null, compte: null, depuisSecours: false,
    charger(texteCles) { const c = lireAffectation(texteCles, 'DC_CLES'); this.cles = c && c.publique ? c : null; return this.cles; },
    // comptes ouvrables : le compte principal (enveloppe mdp) puis les comptes ajoutés (même liste que sur le poste)
    comptes() {
      const c = this.cles; if (!c) return [];
      const p = c.principal || {};
      return [{ code: p.code || '', nom: p.nom || 'Compte principal', role: 'associe', principal: true },
        ...(c.comptes || []).map(x => ({ code: x.code, nom: x.nom || x.code, role: x.role === 'associe' ? 'associe' : 'assistante', principal: false }))];
    },
    envDe(code) { if (!code || code === 'principal') return this.cles.mdp; const x = (this.cles.comptes || []).find(k => k.code === code); return x ? x.env : null; },
    async deverrouiller(secret, secours = false, code = 'principal') {
      const env = secours ? this.cles.secours : this.envDe(code);
      if (!env || !secret) return false;
      try { this.privee = await ouvrirEnveloppe(env, secours ? normCode(secret) : secret); }
      catch (e) { this.privee = null; return false; }
      const liste = this.comptes();
      const c = secours ? liste[0] : (liste.find(x => (x.principal ? 'principal' : x.code) === (code || 'principal')) || liste[0]);
      this.compte = { code: c.code, nom: c.nom, role: c.role, principal: !!c.principal };
      this.depuisSecours = !!secours;
      return true;
    },
    async dechiffrer(env) { if (!this.privee) throw new Error('Application verrouillée'); return dechiffrerAvec(this.privee, env); },
    // fichier .js de données : chiffré (window.NOM_CHIFFRE) ou en clair (window.NOM)
    async lireDonnees(texte, nom) {
      const env = lireAffectation(texte, nom + '_CHIFFRE');
      if (env) return JSON.parse(await this.dechiffrer(env));
      return lireAffectation(texte, nom);
    },
    // saisies partagées (donnees/saisies-application.json) : déchiffrées ; le coffre des associés reste fermé et rien de ce
    // qui en relève n'est gardé en clair
    async lireSaisies(texte) {
      if (!texte) return null;
      const o = JSON.parse(texte);
      const s = estChiffre(o) ? JSON.parse(await this.dechiffrer(o)) : o;
      if (s && typeof s === 'object') for (const k of COFFRE_CLES) delete s[k];
      return s;
    },
    // objet attendu par l'application du poste (window.DC_SECURITE) : lecture seule, coffre fermé
    interfacePoste() {
      const C = this;
      const coffreExiste = !!(C.cles && C.cles.coffre && C.cles.coffre.publique);
      return {
        cles: C.cles, privee: C.privee, publique: null, compte: C.compte, depuisSecours: C.depuisSecours, aChiffrer: false, mobile: true, COFFRE_CLES,
        get actif() { return true; },
        get coffreExiste() { return coffreExiste; },
        get coffreEtat() { return coffreExiste ? 'ferme' : 'absent'; },
        get coffreOuvert() { return false; },
        get coffreFerme() { return coffreExiste; },
        comptes: () => C.comptes(),
        compteParCode: code => C.comptes().find(x => (x.principal ? 'principal' : x.code) === code) || null,
        codeCourant: () => (!C.compte || C.compte.principal ? 'principal' : C.compte.code),
        estChiffre, estCoffre,
        dechiffrer: env => C.dechiffrer(env),
        chiffrer: async () => { throw new Error('Application mobile en lecture seule'); },
        ouvrirCoffre: async s => { if (s && typeof s === 'object') for (const k of COFFRE_CLES) delete s[k]; return s; },
        fermerCoffre: async s => s,
        retirerClairs: s => { if (s && typeof s === 'object') for (const k of COFFRE_CLES) delete s[k]; return s; },
        texteScelle: v => (v === undefined || v === null ? '' : typeof v === 'string' ? v : estCoffre(v) ? null : String(v)),
        verifier: async () => false,
        verrouiller: () => M.verrouiller && M.verrouiller()
      };
    }
  };
})();
