# Système de Certification Académique sur Blockchain (Devoir 1)

Application décentralisée (DApp) permettant l'enregistrement, l'émission unitaire ou par lot (Excel/CSV) et la vérification publique et infalsifiable de diplômes académiques pour l'**Université Abdelmalek Essaâdi — Faculté des Sciences et Techniques de Tanger**.

---

## Vidéo Démonstrative
Lien de la vidéo de démonstration de l'application (Devoir 1) :
- [Système de Certification Académique sur Blockchain - Google Drive](https://drive.google.com/drive/u/0/folders/16F9BGrxT5dbZguz7ScOJqO4Rv3v46irY)

---

## Contenu du Dossier

- **`Devoir1_Certification_Fonctionnelle.pdf`** : Énoncé officiel du Devoir 1.
- **`CertificateRegistry.sol`** : Smart contract Solidity pour la gestion du registre de certificats.
- **`frontend/`** : Interface web développée avec React, TypeScript, Vite et Viem.
- **`etudiants.xlsx`** & **`etudiants.csv`** : Fichiers d'exemple structurés pour l'émission en batch.

---

## Fonctionnalités du Smart Contract (`CertificateRegistry.sol`)

- **Structure de données** :
  - `studentName` : Nom complet de l'étudiant
  - `studentId` : Code National de l'Étudiant (CNE)
  - `diplomaTitle` : Intitulé de la formation
  - `issueDate` : Date de délivrance
  - `grade` : Mention obtenue
  - `recipient` : Adresse Ethereum du destinataire
  - `revoked` : Statut de validité
- **Émission unitaire** (`mintCertificate`) : réservée à l'administrateur / propriétaire.
- **Émission groupée** (`batchMint`) : forger plusieurs diplômes en une seule transaction.
- **Protection anti-doublon** : empêche d'enregistrer deux fois le même identifiant étudiant (`studentId`).
- **Révocation** (`revoke`) : invalidation administrative d'un certificat.
- **Consultation publique gratuite** (`getCertificate`, `isCertificateValid`, `isStudentRegistered`) : fonctions déclarées `view`.

---

## Interface Web (`frontend/`)

1. **Vérification Publique** : consultation accessible à tous sans portefeuille, par numéro de certificat (#ID) ou par CNE, avec rendu officiel de diplôme de l'Université Abdelmalek Essaâdi.
2. **Émission Unitaire** : formulaire administratif de délivrance.
3. **Importation par Lot (Excel / CSV)** : parsing côté client avec SheetJS, sélection des étudiants et émission groupée.
4. **Registre des Diplômes** : supervision globale et révocation administrative.

---

## Lancement du Projet

1. Naviguer dans le dossier du frontend :
```bash
cd frontend
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer le serveur local :
```bash
npm run dev
```

4. Ouvrir `http://localhost:5173` dans votre navigateur avec MetaMask connecté sur le réseau **Localhost 8545** (Chain ID: `31337`).

---

## Auteur
**Homam Dany** — 2026/2027  
Master en ingénierie des données et intelligence artificielle / Sécurité et Éthique des Données  
Faculté des Sciences et Techniques de Tanger — Université Abdelmalek Essaâdi
