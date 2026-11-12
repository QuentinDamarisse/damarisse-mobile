# Damarisse Conseils mobile

Application iPhone de consultation des dossiers du cabinet Damarisse Conseils : recherche d'un client, encours, contrats et
supports, alertes et tâches, fonds structurés. Lecture seule.

## Sécurité

- Ce dépôt ne contient ni donnée client ni secret : seulement le code de l'application et la bibliothèque Microsoft
  MSAL (licence MIT, `msal-browser-LICENSE.txt`).
- Connexion avec le compte Microsoft 365 du cabinet (Microsoft Entra, application monopage, permission déléguée
  `Files.Read.All` en lecture). Les fichiers sont lus sur SharePoint avec les droits de la personne connectée.
- Les données restent chiffrées (RSA-OAEP 3072 bits et AES-256-GCM) sur SharePoint et sur l'iPhone. Elles ne sont
  déchiffrées qu'en mémoire, avec le mot de passe de l'application du cabinet, et effacées au verrouillage (inactivité,
  passage en arrière-plan, bouton Verrouiller).
- Les calculs (familles, contrats, encours, alertes, structurés) sont ceux de l'application du poste : ses modules sont
  lus sur SharePoint et exécutés sur l'iPhone, sans aucune écriture.

## Mise en service

1. Microsoft Entra › Inscriptions d'applications › Nouvelle inscription : « Damarisse Conseils Mobile », comptes de cet
   annuaire uniquement, plateforme « Application monopage (SPA) », adresse de retour = adresse de publication de ce dépôt
   (par exemple `https://<compte>.github.io/<depot>/`).
2. Autorisations d'API › Microsoft Graph › Autorisations déléguées › `Files.Read.All`, puis consentement de
   l'administrateur pour le cabinet.
3. Identifiant d'application (client) reporté dans `config.js` (`clientId`).
4. Publication : Settings › Pages › Deploy from a branch › `main` / racine.
5. Sur l'iPhone : ouvrir l'adresse dans Safari › Partager › « Sur l'écran d'accueil ».

iOS 16.4 ou plus récent.
