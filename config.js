/* Réglages de l'application mobile Damarisse Conseils (consultation).
   Aucune donnée client ni aucun secret : l'identifiant d'application Microsoft Entra est public par nature (application
   monopage), les données restent chiffrées sur SharePoint et ne sont déchiffrées que sur l'iPhone, avec le mot de passe de
   l'application du cabinet. */
window.DCM_CONFIG = {
  // identifiant d'application (client) de l'inscription « Damarisse Conseils Mobile » dans Microsoft Entra
  clientId: 'c78ce4ab-4f8b-426e-9142-d8b009f25617',
  autorite: 'https://login.microsoftonline.com/damarisse-conseils.fr',
  portees: ['Files.Read.All'],
  // bibliothèque SharePoint du cabinet et dossier de l'application (mêmes fichiers que l'application du poste)
  drive: 'b!ckmFmQv2UECP0DFHKjnR8c1V_mBHSbZLrIdBMvJ5wF9Jt0mvvRA8TJfD6vgCUrII',
  racine: 'Outil DAMARISSE CONSEILS/_Cabinet/09 Application CGP/Damarisse',
  // verrouillage automatique (minutes d'inactivité) et délai en arrière-plan avant verrouillage (secondes)
  verrouMinutes: 5,
  verrouArrierePlan: 60
};
