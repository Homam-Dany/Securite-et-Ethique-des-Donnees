# RAPPORT TECHNIQUE DE PROJET
## Système Décentralisé de Certification Académique sur Blockchain Ethereum
### Du Registre Fonctionnel aux Standards ERC-721 Soulbound et Audit de Sécurité

---

### Informations Académiques

* **Établissement :** Université Abdelmalek Essaâdi (UAE) — Faculté des Sciences et Techniques de Tanger (FSTT)
* **Département :** Génie Informatique
* **Formation :** Master Ingénierie des Données et Intelligence Artificielle(IDIA)
* **Module :** Sécurité et éthique des données
* **Réalisé par :** Homam Dany
* **Encadrée par :** Pr.Ikram Benabdelouahab
* **Année Universitaire :** 2026 – 2027
* **Dépôt GitHub :** [https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees](https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees)
* **Démonstration Vidéo - Volet 1 (Système Fonctionnel) :** [Google Drive - Démonstration Volet 1](https://drive.google.com/drive/u/0/folders/16F9BGrxT5dbZguz7ScOJqO4Rv3v46irY)
* **Démonstration Vidéo - Volet 2 (ERC-721 SBT & Audit) :** [Google Drive - Démonstration Volet 2](https://drive.google.com/drive/u/0/folders/1Ti_6F6s-YN4d2RzB1eoQlgBxNfF8EGmm)

---

## Sommaire

1. [Introduction et Contexte du Projet](#1-introduction-et-contexte-du-projet)
2. [Volet 1 : Registre Fonctionnel de Certification Académique](#2-volet-1--registre-fonctionnel-de-certification-académique)
   * 2.1. Objectifs et Spécifications Fonctionnelles
   * 2.2. Architecture du Contrat `CertificateRegistry.sol`
   * 2.3. Gestion du Cycle de Vie et Mécanismes Anti-Doublons
3. [Volet 2 : Standardisation ERC-721 Soulbound et Métadonnées On-Chain](#3-volet-2--standardisation-erc-721-soulbound-et-métadonnées-on-chain)
   * 3.1. Justification du Passage au Standard ERC-721
   * 3.2. Mécanisme Soulbound Token (SBT) : Garantie d'Inaliénabilité
   * 3.3. Métadonnées Dynamiques 100% On-Chain (SVG et JSON Base64)
   * 3.4. Gestion Décentralisée des Privilèges (`AccessControl`)
4. [Volet 3 : Audit de Sécurité et Analyse des Risques](#4-volet-3--audit-de-sécurité-et-analyse-des-risques)
   * 4.1. Référentiel Méthodologique (SWC, ConsenSys, Secureum)
   * 4.2. Matrice d'Analyse des Vulnérabilités Critiques
   * 4.3. Analyse Comparative : Registre Brut vs ERC-721 SBT vs ERC-1155
5. [Volet 4 : Validation Expérimentale et Couverture des Tests](#5-volet-4--validation-expérimentale-et-couverture-des-tests)
   * 5.1. Stratégie de Test Hybride
   * 5.2. Synthèse d'Exécution de la Suite de Tests
6. [Volet 5 : Application Décentralisée (DApp) Institutionnelle](#6-volet-5--application-décentralisée-dapp-institutionnelle)
   * 6.1. Architecture Client et Intégration Web3
   * 6.2. Émission Unitaire et Import Massif (Excel et CSV)
   * 6.3. Vérification Décentralisée et Génération de Preuve Cryptographique
7. [Procédure de Déploiement et Reproductibilité](#7-procédure-de-déploiement-et-reproductibilité)
8. [Conclusion et Perspectives](#8-conclusion-et-perspectives)

---

## 1. Introduction et Contexte du Projet

La falsification documentaire dans l'enseignement supérieur représente une menace croissante pour la crédibilité des institutions et l'équité des processus de recrutement. Les systèmes traditionnels d'attestation papier ou de certificats numériques centralisés (signatures PDF, serveurs de validation universitaires) présentent des vulnérabilités structurelles : dépendance à une autorité centrale unique, risque de perte ou d'altération des bases de données en cas de sinistre, et indisponibilité des services de vérification lors de cessations d'activité institutionnelle.

Ce projet apporte une réponse concrète en s'appuyant sur la technologie blockchain Ethereum pour déployer une infrastructure de certification décentralisée, immuable et vérifiable sans intermédiaire.

Le projet a été conduit en deux étapes d'ingénierie successives :
* **Volet 1 : Registre Fonctionnel (`CertificateRegistry.sol`) :** Modélisation d'un registre de référence liant l'identité cryptographique des lauréats à leur matricule académique (CNE), avec prise en charge des émissions unitaires, des traitements par lots et des révocations administratives.
* **Volet 2 : Standardisation ERC-721 Soulbound et Audit (`CertificateNFT.sol`) :** Évolution vers un jeton non-fongible non-transférable (*Soulbound Token*), génération de métadonnées SVG/JSON intégralement hébergées on-chain sans dépendance externe, répartition granulaire des droits administratifs (*Role-Based Access Control*), et conduite d'un audit de sécurité formel.

L'ensemble est exploitable au travers d'une interface web institutionnelle dédiée à la Faculté des Sciences et Techniques de Tanger.

---

## 2. Volet 1 : Registre Fonctionnel de Certification Académique

### 2.1. Objectifs et Spécifications Fonctionnelles

Le premier volet formalise les règles de gestion institutionnelles régissant la délivrance d'un diplôme :
* **Authentification de l'émetteur :** Seule l'autorité administrative autorisée peut enregistrer un certificat sur le registre.
* **Unicité académique :** Un étudiant donné, identifié par son adresse publique Ethereum et son Code National de l'Étudiant (CNE), ne peut se voir délivrer deux fois le même diplôme.
* **Transparence et consultation publique :** Tout tiers (employeur, ambassade, université partenaire) doit pouvoir consulter en lecture seule la validité d'une attestation sans frais de gaz.
* **Révocabilité contrôlée :** En cas d'erreur matérielle ou de sanction disciplinaire, l'autorité émettrice doit pouvoir révoquer l'attestation tout en préservant la traçabilité de l'historique sur la blockchain.

### 2.2. Architecture du Contrat `CertificateRegistry.sol`

Le contrat repose sur une structure de données typée et des tables de hachage associatives (`mapping`) garantissant un coût d'accès en lecture constant en $O(1)$ :

```solidity
struct Certificate {
    string studentName;
    string cne;
    string degreeName;
    string mention;
    uint256 issueDate;
    bool isValid;
}

mapping(address => Certificate) public certificates;
mapping(string => bool) private registeredCNEs;
mapping(address => bool) private hasCertificate;
```

#### Règles Métier Clés
1. **Contrôle d'accès propriétaire (`onlyOwner`) :** Le constructeur enregistre l'adresse de déploiement en tant que gestionnaire exclusif des écritures.
2. **Contrôle d'intégrité anti-doublon :** Lors de l'émission, le contrat s'assure par assertions `require` que l'adresse étudiante n'a pas déjà reçu de diplôme (`!hasCertificate[student]`) et que le matricule n'a jamais été enregistré (`!registeredCNEs[cne]`).
3. **Traitement par lots (`batchMint`) :** Une fonction itérative optimisée permet d'enregistrer une promotion complète d'étudiants en une seule transaction réseau, réduisant les coûts opérationnels et la surcharge administrative.

### 2.3. Gestion du Cycle de Vie et Mécanismes Anti-Doublons

* **Émission :** L'émission consigne l'horodatage décentralisé du bloc (`block.timestamp`) pour figer la date officielle de délivrance. Le booléen `isValid` est initialisé à `true` et un événement indexé `CertificateIssued(address indexed student, string cne, string degreeName)` est émis.
* **Révocation :** La révocation ne supprime pas l'enregistrement (ce qui violerait le principe d'immuabilité et d'auditabilité), mais commute l'état `isValid` à `false` et émet l'événement `CertificateRevoked(address indexed student)`. Tout tiers interrogeant le contrat est instantanément notifié de l'invalidité du diplôme.

---

## 3. Volet 2 : Standardisation ERC-721 Soulbound et Métadonnées On-Chain

### 3.1. Justification du Passage au Standard ERC-721

Bien que robuste, le registre fonctionnel initial reposait sur une interface propriétaire non interopérable avec l'écosystème Web3 étendu (portefeuilles MetaMask, explorateurs Etherscan, indexeurs de jetons).

Le second volet modernise cette architecture en intégrant le standard universel **ERC-721** (NFT) via les bibliothèques certifiées d'**OpenZeppelin v5.2.0** :
* `ERC721` : Implémentation de référence du standard de jeton non-fongible.
* `ERC721URIStorage` : Gestion standardisée des identifiants de métadonnées (`tokenURI`).
* `AccessControl` : Gestion décentralisée des permissions par rôles cryptographiques (`bytes32`).
* `ReentrancyGuard` : Protection contre les attaques de réentrance.

### 3.2. Mécanisme Soulbound Token (SBT) : Garantie d'Inaliénabilité

Par nature, un jeton ERC-721 standard est transférable entre comptes via les fonctions `transferFrom` ou `safeTransferFrom`. Dans le cadre d'un diplôme académique nominatif, cette transférabilité constitue une faille conceptuelle critique : un étudiant pourrait vendre ou céder son diplôme à un tiers.

Pour rendre le certificat inaliénable, nous avons implémenté le modèle des **Soulbound Tokens (SBT)**. Dans la version 5 d'OpenZeppelin, toutes les opérations modifiant la détention d'un jeton transitent obligatoirement par la méthode interne `_update(address to, uint256 tokenId, address auth)`.

En surchargeant ce hook unique, nous autorisons l'émission initiale (où l'adresse source `from` est nulle) tout en interdisant tout transfert ultérieur entre comptes utilisateurs :

```solidity
function _update(
    address to,
    uint256 tokenId,
    address auth
) internal virtual override returns (address) {
    address from = _ownerOf(tokenId);
    
    if (from != address(0)) {
        revert("Soulbound: Les diplomes academiques ne sont pas transmissibles");
    }
    
    return super._update(to, tokenId, auth);
}
```

Ce verrouillage cryptographique assure mathématiquement que le diplôme reste rattaché à l'adresse de son lauréat à perpétuité.

### 3.3. Métadonnées Dynamiques 100% On-Chain (SVG et JSON Base64)

Dans les architectures NFT classiques, les métadonnées pointent vers des serveurs web HTTP ou des passerelles IPFS. Cette approche introduit une fragilité majeure : si le serveur devient inaccessible ou si les passerelles IPFS cessent d'épingler le contenu, le diplôme perd ses données descriptives.

Pour assurer la souveraineté et la pérennité séculaire des attestations de l'Université Abdelmalek Essaâdi, nous avons développé un générateur de métadonnées **intégralement on-chain** :
1. Le smart contract génère dynamiquement à la volée une image vectorielle **SVG institutionnelle** reprenant l'identité visuelle de la FSTT, le nom du lauréat, la filière, la mention et la date d'émission.
2. Il assemble un document **JSON** conforme au standard ERC-721 Metadata.
3. Il encode le JSON et le SVG en chaîne **Base64** native pour retourner une Data-URI standard (`data:application/json;base64,...`).

Le diplôme est ainsi totalement autonome, auto-descriptif et indépendant de tout service tiers.

### 3.4. Gestion Décentralisée des Privilèges (`AccessControl`)

Pour supprimer le point de défaillance unique lié à la possession d'une clé d'administration unique (`Ownable`), le contrat distribue les responsabilités via le module `AccessControl` d'OpenZeppelin :
* `DEFAULT_ADMIN_ROLE` : Rôle d'administration suprême (Doyen ou Direction de l'établissement), habilité à déléguer ou révoquer les privilèges opérationnels.
* `MINTER_ROLE` : Rôle réservé au service de la scolarité pour l'émission des diplômes unitaires ou en lot.
* `REVOKER_ROLE` : Rôle assigné à la commission disciplinaire pour l'invalidation d'attestations en cas de fraude constatée.

---

## 4. Volet 3 : Audit de Sécurité et Analyse des Risques

### 4.1. Référentiel Méthodologique

La sécurité des contrats intelligents a été éprouvée selon les méthodologies d'audit de référence :
* Le registre de vulnérabilités **SWC (Smart Contract Weakness Classification)**.
* Le référentiel de bonnes pratiques de développement **ConsenSys Diligence**.
* La checklist d'audit de sécurité des smart contracts **Secureum**.

### 4.2. Matrice d'Analyse des Vulnérabilités Critiques

| Référence SWC | Risque Identifié | Impact | Mesure de Remédiation Appliquée |
| :--- | :--- | :--- | :--- |
| **SWC-107** | Attaque par Réentrance | Critique | Modificateur `nonReentrant` d'OpenZeppelin appliqué sur toutes les fonctions d'état ; application stricte du patron architectural *Checks-Effects-Interactions*. |
| **SWC-105** | Contrôle d'accès défaillant | Élevé | Remplacement de `onlyOwner` par `AccessControl` avec rôles granulaires (`MINTER_ROLE`, `REVOKER_ROLE`). Utilisation d'erreurs personnalisées OpenZeppelin v5. |
| **SWC-128** | Déni de Service (DoS) par limite de gaz | Moyen | Vérification de cohérence sur les tailles des tableaux en entrée de `batchMint` ; recommandation opérationnelle d'émissions par tranches de 50 à 100 enregistrements. |
| **SWC-101** | Débordement d'entiers (*Overflow / Underflow*) | Faible | Utilisation du compilateur Solidity `0.8.28` intégrant les vérifications arithmétiques natives au niveau bytecode sans surcoût de bibliothèque. |
| **SWC-104** | Adresses nulles non contrôlées | Moyen | Validation systématique `require(student != address(0))` et assainissement cryptographique EIP-55 au niveau client. |
| **SWC-115** | Dépendance temporelle du bloc | Négligeable | L'usage de `block.timestamp` est restreint à l'archivage informatif de la date de délivrance, sans conditionnement logique ou financier. |

### 4.3. Analyse Comparative : Registre Brut vs ERC-721 SBT vs ERC-1155

| Dimension d'Évaluation | Registre Fonctionnel (Volet 1) | ERC-721 Soulbound (Volet 2) | ERC-1155 Multi-Token |
| :--- | :--- | :--- | :--- |
| **Interopérabilité Web3** | Nulle (spécification sur mesure) | Maximale (standard EIP-721) | Élevée (standard EIP-1155) |
| **Individualisation du Titre** | Par adresse étudiante | Par identifiant unique (`tokenId`) | Partagée par classe d'émission |
| **Inaliénabilité (SBT)** | Native (non modélisé en jeton) | Verrouillée par hook `_update` | Requiert un hook sur mesure |
| **Autonomie des Métadonnées** | Données brutes on-chain | JSON + SVG 100% on-chain Base64 | Dépendance externe d'URI |
| **Coût d'Émission (Gaz)** | Très faible | Modéré | Très faible pour les gros volumes |
| **Gouvernance des Droits** | Propriétaire unique (`Ownable`) | Rôles multiples RBAC | Rôles multiples RBAC |

*Synthèse :* L'ERC-721 Soulbound s'impose comme la solution de référence pour des attestations académiques d'enseignement supérieur. Il allie l'individualisation stricte de chaque diplôme, la reconnaissance immédiate par les outils Web3 du marché et l'absence totale de dépendance vis-à-vis d'hébergeurs externes.

---

## 5. Volet 4 : Validation Expérimentale et Couverture des Tests

### 5.1. Stratégie de Test Hybride

Pour garantir une couverture logicielle intégrale, la suite de validation combine deux environnements complémentaires :
1. **Tests unitaires Solidity (`forge-std` sous Hardhat 3) :** Exécutés au niveau le plus proche de la Machine Virtuelle Ethereum (EVM) pour valider les préconditions, les réversions, les accès non autorisés et l'émission des événements.
2. **Tests d'intégration TypeScript (`Viem`) :** Simulant les interactions réelles des utilisateurs finaux, les tentatives de transfert illégitime de jetons Soulbound, la manipulation des rôles administratifs et les opérations massives en lot.

### 5.2. Synthèse d'Exécution de la Suite de Tests

La suite complète regroupe **26 tests automatisés validés à 100%** (`npx hardhat test`) :

* **Suite `CertificateRegistry` (15 tests : 4 Solidity + 11 TypeScript) :**
  * Vérification de l'attribution initiale du propriétaire du contrat.
  * Validation du cycle d'émission unitaire et de la cohérence des données stockées.
  * Rejet strict d'une seconde émission vers une adresse déjà certifiée.
  * Rejet strict de la réutilisation d'un matricule CNE déjà enregistré.
  * Validation du traitement par lot `batchMint` avec tableaux synchronisés.
  * Blocage immédiat des tentatives d'émission émanant de comptes non autorisés.
  * Bascule d'état et émission d'événement lors de la révocation administrative.

* **Suite `CertificateNFT` (11 tests TypeScript) :**
  * Initialisation conforme des rôles d'administration (`DEFAULT_ADMIN_ROLE`).
  * Émission d'un jeton Soulbound et vérification de la complétude du format TokenURI.
  * **Test d'inaliénabilité Soulbound :** Rejet systématique de toute tentative d'exécution de `transferFrom` ou `safeTransferFrom` entre comptes étudiants.
  * Révocation d'un diplôme NFT par un détenteur du rôle `REVOKER_ROLE` et rejet des tiers non habilités.
  * Émission groupée `batchMintCertificates` avec validation de l'incrémentation ordonnée des identifiants `tokenId`.

```
  26 passing (4.2s)
```

---

## 6. Volet 5 : Application Décentralisée (DApp) Institutionnelle

### 6.1. Architecture Client et Intégration Web3

L'interface utilisateur a été conçue avec **React 18**, **TypeScript**, **Vite** et **Tailwind CSS**. Elle intègre :
* La bibliothèque **Viem** pour l'interaction directe avec les nœuds RPC de la blockchain.
* Un module de détection automatique des privilèges administratifs : l'application adapte dynamiquement ses composants selon que l'adresse connectée détient les rôles `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, ou correspond à un simple visiteur.
* Un module d'assainissement d'adresses conforme à la norme **EIP-55** avec validation de somme de contrôle (*checksum*), éliminant les erreurs de saisie manuelle.

### 6.2. Émission Unitaire et Import Massif (Excel et CSV)

L'application répond aux contraintes de gestion des scolarités universitaires grâce à deux flux de travail :
1. **Formulaire d'Émission Unitaire :** Contrôle en temps réel de la validité de l'adresse Ethereum, du nom du lauréat, du CNE, de la filière et de la mention décernée.
2. **Module d'Importation Massive :** Prise en charge des fichiers de promotions sous format Excel (`.xlsx`) et `.csv` via le parseur `xlsx`. Le module extrait les enregistrements, vérifie la syntaxe de chaque adresse, prévient les rejets on-chain et déclenche l'exécution groupée `batchMint` en une signature de transaction unique dans MetaMask.

### 6.3. Vérification Décentralisée et Génération de Preuve Cryptographique

Le module de vérification offre une accessibilité universelle et gratuite :
* Recherche directe par adresse publique d'étudiant ou par identifiant numérique de jeton (*Token ID*).
* Interrogation en temps réel de l'état on-chain du diplôme (actif ou révoqué).
* Rendu visuel instantané du diplôme généré par le smart contract à partir de son code SVG on-chain.
* Génération automatique d'un **QR Code cryptographique** embarquant l'identifiant et l'adresse de vérification, facilitant l'authentification rapide sur support mobile par les recruteurs.

---

## 7. Procédure de Déploiement et Reproductibilité

Le projet est entièrement reproductible en local ou sur un réseau de test Ethereum public (Sepolia, Holesky).

### Étape 1 : Installation des Dépendances
```bash
git clone https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees.git
cd Securite-et-Ethique-des-Donnees
npm install
```

### Étape 2 : Compilation des Smart Contracts
```bash
npx hardhat compile
```

### Étape 3 : Exécution de la Suite de Tests
```bash
npx hardhat test
```

### Étape 4 : Démarrage du Nœud Local Ethereum
Dans un premier terminal :
```bash
npx hardhat node
```

### Étape 5 : Déploiement des Contrats
Dans un second terminal :
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
*Le script déploie les deux contrats et exporte automatiquement les adresses et ABIs vers le frontend.*

### Étape 6 : Lancement de la DApp
```bash
cd frontend
npm install
npm run dev
```
L'application est accessible à l'adresse locale `http://localhost:5173`.

---

## 8. Conclusion et Perspectives

Ce travail d'ingénierie a permis de concevoir une chaîne de certification académique complète, robuste et alignée sur l'état de l'art technologique. Le passage d'un registre propriétaire initial au standard **ERC-721 Soulbound Token** apporte des garanties de premier plan :
1. **Inviolabilité et Inaliénabilité :** Le verrouillage des transferts au niveau bytecode élimine le risque d'usurpation ou de revente de titres universitaires.
2. **Souveraineté Numérique :** La génération de métadonnées et de visuels vectoriels 100% on-chain immunise l'institution contre toute obsolescence technique ou rupture d'hébergeur externe.
3. **Auditabilité et Sécurité :** La couverture complète par 26 tests automatisés et l'application stricte des règles SWC garantissent la résilience des contrats contre les vecteurs d'attaque classiques de l'écosystème EVM.

### Perspectives d'Évolution
* **Preuves à Divulgation Nulle de Connaissance (ZK-SNARKs) :** Intégration de circuits cryptographiques permettant à un diplômé de certifier l'obtention de son diplôme ou d'une mention minimale sans révéler son CNE ou sa moyenne générale à un recruteur.
* **Gouvernance Multi-Signatures (Safe) :** Migration des prérogatives du rôle `DEFAULT_ADMIN_ROLE` vers un compte multi-signatures exigeant la validation conjointe de la Direction de l'établissement et du Responsable de la scolarité.
