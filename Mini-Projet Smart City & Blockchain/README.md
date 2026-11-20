# Mini-Projet : Smart City & Blockchain
## Plateforme Décentralisée de Gestion des Services Urbains

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Ethers](https://img.shields.io/badge/Ethers.js-v6-purple.svg)](https://docs.ethers.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

### 🎓 Informations Académiques
- **Établissement :** Faculté des Sciences et Techniques de Tanger (FSTT) — Université Abdelmalek Essaâdi (UAE)
- **Module :** Sécurité et Éthique des Données
- **Réalisé par :** **Homam Dany**
- **Encadré par :** **Mme. Ikram Benabdelouahab**
- **Année Universitaire :** 2026 – 2027

---

### 🔗 Liens Importants
- 📹 **Démonstration Vidéo (Google Drive) :** [Dossier Google Drive de la Démonstration](https://drive.google.com/drive/u/1/folders/198ZK9E4waxVuCqASUDesGqoxp-_jRpSy)
- 📂 **Dépôt GitHub :** [Homam-Dany / Securite-et-Ethique-des-Donnees](https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees/tree/main)
- 📄 **Rapport Académique Complet :** [Consulter le fichier RAPPORT.md](RAPPORT.md)

---

## 📋 Présentation du Projet

**SmartCityChain** est une application décentralisée (DApp) permettant de gérer en toute transparence le cycle de vie des incidents dans l'espace public (éclairage en panne, nids-de-poule, fuites d'eau, déchets, signalisation).

Grâce à un Smart Contract développé en **Solidity (`UrbanIssueRegistry`)**, chaque opération (déclaration, affectation d'équipe, intervention sur le terrain, résolution) est consignée sur la **Blockchain Ethereum** de façon immuable, horodatée et vérifiable par tous.

### 🌟 Fonctionnalités Clés :
1. **Signalement Citoyen Direct :** Déclaration géolocalisée avec niveau d'urgence sans intermédiaire.
2. **Traçabilité Immuable (Audit Trail) :** Historique inaltérable avec horodatage et adresse publique de l'intervenant (`msg.sender`).
3. **Espace de Gestion Municipale :** Tableau de dispatching opérationnel réservé aux autorités (`onlyMunicipality`).
4. **Importation Massive Excel (SheetJS) :** Import et validation de fichiers `.xlsx` avec enregistrement groupé en une seule transaction blockchain (`batchReportIssues`).

---

## 🔄 Cycle de Vie d'un Signalement

```text
[Reported] ──▶ [Assigned] ──▶ [InProgress] ──▶ [Resolved] ──▶ [Closed]
(Signalé)     (Affecté)       (En cours)      (Résolu)       (Clôturé)
```

---

## 🚀 Guide d'Installation & Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Extension [MetaMask](https://metamask.io/) installée dans le navigateur

### 1. Démarrer la Blockchain Locale (Terminal 1)
```powershell
npm run node
```
*Le simulateur Ethereum Hardhat démarre sur `http://127.0.0.1:8545` (Chain ID : `31337`).*

### 2. Déployer le Smart Contract (Terminal 2)
```powershell
npm run deploy
```
*Déploie le contrat `UrbanIssueRegistry` et initialise des signalements de test.*  
*Adresse déployée : `0x5FbDB2315678afecb367f032d93F642f64180aa3`*

### 3. Lancer l'Application Web React (Terminal 3)
```powershell
cd frontend
npm run dev
```
Ouvrez ensuite votre navigateur sur **`http://localhost:5173`**.

---

## 🦊 Configuration de MetaMask

1. **Ajouter le réseau Hardhat dans MetaMask :**
   - **Nom du réseau :** `Hardhat Localhost`
   - **URL de RPC :** `http://127.0.0.1:8545`
   - **ID de chaîne :** `31337`
   - **Symbole :** `ETH`

2. **Importer le compte de l'Autorité Municipale :**
   - Clé privée Compte #0 :  
     `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Adresse associée : `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
   *(Ce compte a les privilèges municipaux pour affecter des équipes et changer les statuts).*

---

## 🧪 Tests Unitaires Automatisés

Pour lancer la suite de **14 tests unitaires** :
```powershell
npm run test
```
*Tous les tests sont validés avec 100% de réussite (création, droits d'accès, événements, traçabilité et import).*

---

## 📁 Structure du Projet

```text
Mini-Projet  Smart City & Blockchain/
├── contracts/
│   └── UrbanIssueRegistry.sol          # Smart Contract Solidity ^0.8.20
├── scripts/
│   ├── deploy.cjs                      # Script de déploiement Hardhat
│   └── generate-excel.cjs              # Générateur du fichier urban_issues.xlsx
├── test/
│   └── UrbanIssueRegistry.test.cjs     # 14 tests unitaires automatisés
├── frontend/                           # Application Web React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/                 # Composants d'interface (Navbar, List, Modals...)
│   │   ├── contracts/                  # ABI et adresse synchronisées
│   │   └── utils/                      # Fonctions Ethers.js et constantes
│   └── package.json
├── images/                             # Emplacement des captures pour le rapport
├── urban_issues.xlsx                   # Fichier Excel conforme au sujet
├── hardhat.config.cjs                  # Configuration Hardhat
├── package.json                        # Scripts et dépendances
├── README.md                           # Documentation générale
└── RAPPORT.md                          # Rapport académique complet (Word/LaTeX style)
```
