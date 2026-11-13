# RAPPORT DE PROJET BLOCKCHAIN
## Système Décentralisé de Certification Académique sur Blockchain Ethereum : Du Registre Fonctionnel aux Standards ERC-721 Soulbound & Audit de Sécurité

---

### Informations Générales & Académiques

* **Établissement :** Université Abdelmalek Essaâdi (UAE) — Faculté des Sciences et Techniques de Tanger (FSTT)
* **Département :** Génie Informatique
* **Formation :** Master Ingénierie des Données et Intelligence Artificielle(IDIA)
* **Module :** Sécurité et éthique des données
* **Auteur :** Homam DANY
* **Encadrante:** Pr.Ikram BENABDEOUAHAB
* **Année Universitaire :** 2026 – 2027
* **Dépôt GitHub du Projet :** [https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees](https://github.com/Homam-Dany/Securite-et-Ethique-des-Donnees)
* **Démonstration Vidéo - Volet 1 (Système Fonctionnel) :** [Lien Google Drive - Démonstration Volet 1](https://drive.google.com/drive/u/0/folders/16F9BGrxT5dbZguz7ScOJqO4Rv3v46irY)
* **Démonstration Vidéo - Volet 2 (ERC-721 SBT & Audit) :** [Lien Google Drive - Démonstration Volet 2](https://drive.google.com/drive/u/0/folders/1Ti_6F6s-YN4d2RzB1eoQlgBxNfF8EGmm)

---

```
                       UNIVERSITÉ ABDELMALEK ESSAÂDI
                 FACULTÉ DES SCIENCES ET TECHNIQUES DE TANGER
                    MASTER SÉCURITÉ ET ÉTHIQUE DES DONNÉES

   +-----------------------------------------------------------------------+
   |                                                                       |
   |              PROJET D'INGÉNIERIE SMART CONTRACTS & DAPP               |
   |                                                                       |
   |     SYSTÈME DÉCENTRALISÉ DE CERTIFICATION ACADÉMIQUE SUR ETHEREUM     |
   |                                                                       |
   |     Volet 1 : Registre Fonctionnel et Déploiement Initial             |
   |     Volet 2 : Standardisation ERC-721 Soulbound, Métadonnées          |
   |               On-Chain Dynamiques et Audit Formel de Sécurité         |
   |                                                                       |
   +-----------------------------------------------------------------------+

   Réalisé par : Dany Homam
   Supervision : Équipe Pédagogique MSED - FST Tanger
   Session     : Novembre 2026
```

---

## Sommaire

1. [Introduction & Contexte du Projet](#1-introduction--contexte-du-projet)
2. [Volet 1 : Registre Fonctionnel de Certification (Devoir 1)](#2-volet-1--registre-fonctionnel-de-certification-devoir-1)
   * 2.1. Problématique et Objectifs Fonctionnels
   * 2.2. Architecture du Contrat `CertificateRegistry.sol`
   * 2.3. Gestion du Cycle de Vie et Sécurisation des Données
3. [Volet 2 : Standardisation ERC-721 Soulbound & Métadonnées On-Chain (Devoir 2)](#3-volet-2--standardisation-erc-721-soulbound--m%C3%A9tadonn%C3%A9es-on-chain-devoir-2)
   * 3.1. Du Registre Brut au Standard ERC-721
   * 3.2. Mécanisme Soulbound Token (SBT) non-transférable
   * 3.3. Métadonnées Dynamiques 100% On-Chain (SVG & JSON Base64)
   * 3.4. Gestion Décentralisée des Privilèges (`AccessControl`)
4. [Volet 3 : Audit de Sécurité et Analyse des Risques](#4-volet-3--audit-de-s%C3%A9curit%C3%A9-et-analyse-des-risques)
   * 4.1. Référentiel et Méthodologie d'Audit
   * 4.2. Analyse Détaillée des Vulnérabilités (SWC / Secureum)
   * 4.3. Étude Comparative : Registre Brut vs ERC-721 SBT vs ERC-1155
5. [Volet 4 : Validation Expérimentale & Suite de Tests](#5-volet-4--validation-exp%C3%A9rimentale--suite-de-tests)
   * 5.1. Stratégie de Test Hybride (Solidity & TypeScript)
   * 5.2. Résultats d'Exécution et Couverture des Cas d'Usage
6. [Volet 5 : Application Décentralisée (DApp) Institutionnelle](#6-volet-5--application-d%C3%A9centralis%C3%A9e-dapp-institutionnelle)
   * 6.1. Architecture Frontend et Intégration Web3
   * 6.2. Émission Unitaire et Traitement par Lots (CSV / Excel)
   * 6.3. Vérification Publique Instantanée et Génération de QR Code
7. [Guide de Déploiement et Reproductibilité](#7-guide-de-d%C3%A9ploiement-et-reproductibilit%C3%A9)
8. [Conclusion & Perspectives](#8-conclusion--perspectives)
9. [Annexe : Nomenclature des Captures d'Écran](#9-annexe--nomenclature-des-captures-d%C3%A9cran)

---

## Table des Figures et Emplacements Illustratifs

* **Figure 1 :** [Architecture globale du système décentralisé](#figure-1--architecture-globale-du-système)
* **Figure 2 :** [Compilation des contrats intelligents avec Hardhat](#figure-2--compilation-des-contrats-intelligents)
* **Figure 3 :** [Exécution de la suite de tests automatisés (26 tests validés)](#figure-3--exécution-des-tests-automatisés)
* **Figure 4 :** [Déploiement des contrats sur le réseau de test local](#figure-4--déploiement-des-contrats)
* **Figure 5 :** [Interface institutionnelle FSTT et connexion du portefeuille](#figure-5--interface-daccueil-et-connexion-web3)
* **Figure 6 :** [Formulaire d'émission unitaire d'attestation](#figure-6--émission-unitaire-dattestation)
* **Figure 7 :** [Import groupé par fichier Excel/CSV et validation EIP-55](#figure-7--importation-groupée-via-fichier)
* **Figure 8 :** [Validation et signature de la transaction par lot dans MetaMask](#figure-8--signature-de-transaction-dans-metamask)
* **Figure 9 :** [Module de consultation publique et affichage du diplôme certifié](#figure-9--consultation-publique-du-diplôme)
* **Figure 10 :** [Génération dynamique du QR Code et inspection du TokenURI](#figure-10--génération-du-qr-code-et-tokenuri)

---

## 1. Introduction & Contexte du Projet

La falsification des diplômes universitaires et des attestations professionnelles constitue un défi critique pour les institutions d'enseignement supérieur et les recruteurs à l'échelle internationale. Les formats traditionnels (supports papier signés, fichiers PDF certifiés par signature électronique centralisée) souffrent d'une vulnérabilité intrinsèque : ils dépendent d'autorités centrales de validation vulnérables aux indisponibilités techniques, aux compromissions de clés ou à la fermeture des services de vérification.

Ce projet d'ingénierie, réalisé dans le cadre du Master **Sécurité et Éthique des Données (MSED)** à la **Faculté des Sciences et Techniques de Tanger**, implémente une infrastructure complète, transparente et infalsifiable d'émission et de vérification d'attestations académiques adossée à la blockchain Ethereum.

Le projet a été développé en deux étapes progressives :
1. **Volet 1 (Conception Fonctionnelle) :** Élaboration d'un contrat intelligent registre (`CertificateRegistry.sol`) gérant l'identité cryptographique des étudiants, l'unicité des matricules académiques (CNE), la délivrance unitaire et en lot, ainsi que la révocabilité administrative.
2. **Volet 2 (Standardisation, SBT, Sécurité & Audit) :** Évolution vers le standard officiel **ERC-721 Soulbound Token (SBT)** (`CertificateNFT.sol`), garantissant la non-transférabilité des diplômes, le stockage dynamique des métadonnées SVG et JSON 100% on-chain, un contrôle d'accès granulaire fondé sur les rôles OpenZeppelin (`AccessControl`), et un audit complet des vulnérabilités critiques.

L'ensemble de ces couches contractuelles est piloté par une interface Web3 réactive conçue aux couleurs institutionnelles de l'Université Abdelmalek Essaâdi.

---

## 2. Volet 1 : Registre Fonctionnel de Certification (Devoir 1)

### 2.1. Problématique et Objectifs Fonctionnels

Le premier volet consistait à concevoir un registre de confiance décentralisé permettant à l'administration universitaire :
* D'attribuer un certificat officiel à l'adresse publique Ethereum d'un étudiant.
* D'empêcher strictement la double certification d'un même étudiant pour un même cycle via son Code National de l'Étudiant (CNE).
* De permettre à des tiers (employeurs, institutions partenaires) de vérifier instantanément et gratuitement l'authenticité d'un diplôme sans intermédiaire.
* De révoquer un certificat en cas d'erreur administrative ou de fraude académique constatée.

### 2.2. Architecture du Contrat `CertificateRegistry.sol`

Le contrat repose sur une structure de données typée et un ensemble de tables de hachage associatives (`mapping`) garantissant un temps d'accès constant en lecture $O(1)$ :

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

#### Principes Clés d'Implémentation
1. **Contrôle d'accès propriétaire (`OnlyOwner`) :** Seule l'adresse désignée lors du déploiement (`owner`) possède l'autorisation d'émettre ou de révoquer des attestations.
2. **Prévention des doublons :** Avant tout enregistrement, le contrat vérifie que `hasCertificate[studentAddress]` est faux et que le CNE n'est pas répertorié dans `registeredCNEs[cne]`.
3. **Émission unitaire et émission en lot (`batchMint`) :** Une fonction itérative sécurisée permet à l'administration d'enregistrer une promotion complète d'étudiants en une seule transaction réseau, réduisant les frictions opérationnelles.

```
+-----------------------------------------------------------------------------------+
|                        CertificateRegistry (Devoir 1)                             |
+-----------------------------------------------------------------------------------+
| - owner: address                                                                  |
| - certificates: mapping(address => Certificate)                                   |
| - registeredCNEs: mapping(string => bool)                                         |
+-----------------------------------------------------------------------------------+
| + mintCertificate(student, name, cne, degree, mention)                            |
| + batchMint(students[], names[], cnes[], degrees[], mentions[])                   |
| + revokeCertificate(student)                                                      |
| + getCertificate(student): Certificate                                            |
| + isStudentRegistered(cne): bool                                                  |
+-----------------------------------------------------------------------------------+
```

### 2.3. Gestion du Cycle de Vie et Sécurisation des Données

* **Émission :** L'émission capture l'horodatage décentralisé du bloc (`block.timestamp`) pour figer la date officielle d'obtention. L'état `isValid` est initialisé à `true`.
* **Révocation :** La révocation ne supprime pas l'historique du diplôme de la blockchain, mais commute le champ booléen `isValid` à `false` tout en émettant un événement public `CertificateRevoked(address indexed student)`. Cette approche préserve la traçabilité d'audit tout en invalidant immédiatement le document pour les validateurs externes.

---

## 3. Volet 2 : Standardisation ERC-721 Soulbound & Métadonnées On-Chain (Devoir 2)

### 3.1. Du Registre Brut au Standard ERC-721

Bien que fonctionnel, le registre initial présentait une limitation : il n'était pas interopérable avec l'écosystème Ethereum universel (portefeuilles Web3, explorateurs de blocs Etherscan, indexeurs de jetons).

Le second volet a modernisé l'architecture en migrant vers le standard **ERC-721** au travers du contrat `CertificateNFT.sol`, exploitant les bibliothèques certifiées d'**OpenZeppelin v5.2.0** :
* `ERC721` : Implémentation du standard de jeton non-fongible.
* `ERC721URIStorage` : Gestion des identifiants de ressources de jetons.
* `AccessControl` : Gestion des autorisations basée sur des rôles cryptographiques (`bytes32`).
* `ReentrancyGuard` : Bouclier contre les attaques par réentrance.

### 3.2. Mécanisme Soulbound Token (SBT) non-transférable

Un diplôme académique est strictement personnel et inaliénable. Dans un contrat ERC-721 standard, un étudiant pourrait vendre ou transférer son diplôme à une tierce personne via la méthode `transferFrom` ou `safeTransferFrom`.

Pour résoudre cette faille sémantique, nous avons implémenté le paradigme **Soulbound Token (SBT)**, théorisé par Vitalik Buterin. Dans l'architecture OpenZeppelin v5, tous les transferts (y compris le mint et le burn) transitent obligatoirement par le hook centralisé interne `_update(address to, uint256 tokenId, address auth)`.

Nous avons surchargé cette méthode pour interdire formellement tout mouvement de jeton dès lors que l'adresse source `from` est différente de l'adresse zéro (`address(0)`) :

```solidity
function _update(
    address to,
    uint256 tokenId,
    address auth
) internal virtual override returns (address) {
    address from = _ownerOf(tokenId);
    
    // Si 'from' n'est pas address(0), il s'agit d'une tentative de transfert entre pairs
    if (from != address(0)) {
        revert("Soulbound: Les diplomes académiques ne sont pas transmissibles");
    }
    
    return super._update(to, tokenId, auth);
}
```

Ce verrouillage garantit que l'attestation reste définitivement liée au portefeuille académique du lauréat dès son émission.

### 3.3. Métadonnées Dynamiques 100% On-Chain (SVG & JSON Base64)

La majorité des projets NFT stockent leurs métadonnées et images sur des serveurs centralisés HTTP ou sur IPFS. Si la passerelle IPFS s'éteint ou si le serveur web expire, le certificat devient une coquille vide sans valeur juridique.

Pour garantir la pérennité séculaire des diplômes de l'Université Abdelmalek Essaâdi, nous avons développé un générateur de métadonnées **100% on-chain**. Le contrat synthétise dynamiquement :
1. Un visuel vectoriel **SVG institutionnel** reprenant l'en-tête de la FSTT, le nom du lauréat, la filière, la mention et la date d'émission.
2. Un descripteur **JSON** conforme au schéma officiel OpenSea/EIP-721, incluant les attributs académiques.
3. L'ensemble est encodé en **Base64** via les primitives natives Solidity pour former une URI standard `data:application/json;base64,...`.

```solidity
function generateSVG(uint256 tokenId) public view returns (string memory) {
    CertificateData memory cert = _certificates[tokenId];
    return string(
        abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">',
            '<rect width="600" height="400" fill="#0f172a" stroke="#1e3a8a" stroke-width="8"/>',
            '<text x="300" y="70" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">FACULTE DES SCIENCES ET TECHNIQUES TANGER</text>',
            '<text x="300" y="110" font-size="14" fill="#94a3b8" text-anchor="middle">ATTESTATION OFFICIELLE DE REUSSITE</text>',
            '<text x="300" y="180" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">', cert.studentName, '</text>',
            '<text x="300" y="220" font-size="16" fill="#38bdf8" text-anchor="middle">', cert.degreeName, '</text>',
            '<text x="300" y="260" font-size="14" fill="#cbd5e1" text-anchor="middle">Mention : ', cert.mention, ' | CNE : ', cert.cne, '</text>',
            '</svg>'
        )
    );
}
```

### 3.4. Gestion Décentralisée des Privilèges (`AccessControl`)

Au lieu d'un unique compte administrateur centralisé (`Ownable`), le contrat distribue les permissions par hachages cryptographiques (`keccak256`) via le standard OpenZeppelin `AccessControl` :
* `DEFAULT_ADMIN_ROLE` : Attribué au Doyen ou à la Direction de l'établissement (peut accorder ou révoquer les privilèges).
* `MINTER_ROLE` : Attribué au service de la scolarité pour l'émission des attestations de réussite.
* `REVOKER_ROLE` : Attribué à la commission disciplinaire pour la gestion des invalidations.

---

## 4. Volet 3 : Audit de Sécurité et Analyse des Risques

### 4.1. Référentiel et Méthodologie d'Audit

La sécurité des smart contracts a été éprouvée selon les standards d'audit de l'industrie (registre de vulnérabilités **SWC - Smart Contract Weakness Classification**, directives de sécurité **ConsenSys Best Practices** et checklist **Secureum**).

### 4.2. Analyse Détaillée des Vulnérabilités

| Référence SWC | Description de la Vulnérabilité | Statut | Mesure de Remédiation Appliquée dans le Projet |
| :--- | :--- | :--- | :--- |
| **SWC-107** | Attaque par Réentrance (*Reentrancy*) | **Éliminé** | Utilisation du modificateur `nonReentrant` d'OpenZeppelin sur toutes les fonctions d'état critiques et respect strict du patron *Checks-Effects-Interactions*. |
| **SWC-105** | Contrôle d'accès défaillant (*Unprotected Ether/State*) | **Éliminé** | Remplacement des contrôles simples par `AccessControl` (`onlyRole(MINTER_ROLE)`). Les comptes non autorisés sont rejetés avec des erreurs personnalisées. |
| **SWC-128** | Déni de service par épuisement de gaz (*Block Gas Limit DoS*) | **Éliminé** | Sur la méthode `batchMint`, validation stricte de l'alignement des tableaux et découpage recommandé par lots de 50 à 100 enregistrements maximum. |
| **SWC-101** | Débordement d'entiers arithmétiques (*Integer Overflow/Underflow*) | **Éliminé** | Utilisation du compilateur Solidity version `0.8.28` intégrant les vérifications arithmétiques natives au niveau bytecode. |
| **SWC-104** | Entrées d'adresses non assainies (*Zero Address Validation*) | **Éliminé** | Validation systématique `require(student != address(0))` et normalisation cryptographique EIP-55 avant toute interaction. |
| **SWC-115** | Dépendance temporelle (*Timestamp Dependence*) | **Accepté / Maîtrisé** | `block.timestamp` est utilisé exclusivement pour archiver la date de délivrance, sans impacter la logique transactionnelle ou financière. |

### 4.3. Étude Comparative : Registre Brut vs ERC-721 SBT vs ERC-1155

```
+---------------------------+-----------------------+-----------------------+-----------------------+
| Critère d'Évaluation      | Registre Brut (Dev. 1)| ERC-721 SBT (Dev. 2)  | ERC-1155 Multi-Token  |
+---------------------------+-----------------------+-----------------------+-----------------------+
| Interopérabilité Web3     | Nulle (ad-hoc)        | Maximale (Standard)   | Élevée (Standard)     |
| Unicité du Diplôme        | Manuelle (via CNE)    | Intrinsèque (TokenId) | Partagée par classe   |
| Non-transférabilité       | Native (non-jeton)    | Garantie par hook SBT | Requiert hook custom  |
| Coût en gaz (Émission)    | Très faible           | Modéré à optimisé     | Très faible pour lots |
| Autonomie des Métadonnées | Stockage chaîne brut  | SVG/JSON On-chain     | Liens d'URI externes  |
| Granularité des Droits    | Propriétaire unique   | Rôles multiples RBAC  | Rôles multiples RBAC  |
+---------------------------+-----------------------+-----------------------+-----------------------+
```

*Conclusion comparative :* L'ERC-721 en configuration Soulbound Token avec métadonnées on-chain représente l'équilibre idéal pour des attestations académiques nominatives, combinant une interopérabilité universelle sans dépendance externe.

---

## 5. Volet 4 : Validation Expérimentale & Suite de Tests

### 5.1. Stratégie de Test Hybride (Solidity & TypeScript)

Afin de garantir une fiabilité maximale, la couverture logicielle s'articule autour de deux couches complémentaires :
1. **Tests unitaires Solidity (`forge-std` sous Hardhat 3) :** Exécutés au plus près de la Machine Virtuelle Ethereum (EVM) pour valider les préconditions, les révocations et les événements.
2. **Tests d'intégration TypeScript (`Viem`) :** Simulant le comportement réel des utilisateurs, des administrateurs et des attaquants potentiels tentant d'outrepasser les droits d'accès ou de transférer des SBTs.

### 5.2. Résultats d'Exécution et Couverture des Cas d'Usage

L'ensemble des **26 tests automatisés** a été exécuté avec succès via la commande `npx hardhat test` :

* **Suite `CertificateRegistry` (11 tests TypeScript + 4 tests Solidity) :**
  * Validation de l'assignation de l'administrateur initial.
  * Émission unitaire réussie et conformité des données retournées.
  * Rejet immédiat de l'émission sur une adresse déjà certifiée.
  * Rejet de l'utilisation d'un même CNE pour deux adresses distinctes.
  * Validation du fonctionnement de `batchMint` avec alignement des listes.
  * Rejet des émissions par des tiers non autorisés.
  * Invalidation et bascule d'état lors d'une révocation.

* **Suite `CertificateNFT` (11 tests TypeScript) :**
  * Déploiement et assignation des rôles par défaut.
  * Émission d'un SBT avec génération d'URI on-chain valide.
  * **Test critique d'inviolabilité :** Échec systématique de toute tentative de transfert (`transferFrom`) d'un compte étudiant vers un autre.
  * Révocation d'un NFT par un membre du rôle `REVOKER_ROLE` et rejet pour les non-détenteurs du rôle.
  * Émission groupée `batchMintCertificates` et validation des tokenIds successifs.

```
  26 passing (4.2s)
```

---

#### Emplacements des Captures d'Écran - Validation Logicielle

##### Figure 2 : Compilation des contrats intelligents
*Description : Sortie du compilateur Solidity 0.8.28 sous Hardhat confirmant l'absence d'erreurs et l'activation du pipeline d'optimisation viaIR.*
![Figure 2 : Compilation Hardhat](images/01_hardhat_compile.png)

##### Figure 3 : Exécution des tests automatisés
*Description : Terminal affichant l'exécution victorieuse des 26 tests unitaires et d'intégration (Solidity forge-std et Viem).*
![Figure 3 : Résultat des tests unitaires et intégration](images/02_test_results.png)

##### Figure 4 : Déploiement des contrats
*Description : Trace console du script `scripts/deploy.ts` attestant le déploiement de CertificateRegistry et CertificateNFT sur le nœud local.*
![Figure 4 : Déploiement local des smart contracts](images/03_deploy_contracts.png)

---

## 6. Volet 5 : Application Décentralisée (DApp) Institutionnelle

### 6.1. Architecture Frontend et Intégration Web3

L'application web client a été développée avec **React 18**, **TypeScript**, **Vite** et **Tailwind CSS**. Elle intègre :
* La bibliothèque **Viem** pour les communications RPC et l'encodage des transactions.
* Un module de détection automatique des rôles (`DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `REVOKER_ROLE`) pour adapter dynamiquement l'interface selon que l'utilisateur est un simple visiteur, un étudiant ou un gestionnaire de scolarité.
* Un système de gestion d'adresses conforme à la spécification **EIP-55** avec contrôle de somme de contrôle (*checksum*).

```
+-----------------------------------------------------------------------------------+
|                        Architecture Client Web3 (DApp)                            |
+-----------------------------------------------------------------------------------+
|  Navigateur Client (React + Vite + Tailwind)                                      |
|    |                                                                              |
|    |---> [MetaMask / EIP-1193 Provider] ---> Signature des transactions          |
|    |                                                                              |
|    |---> [Viem Client RPC (Port 8545)]                                           |
|            |                                                                      |
|            +---> CertificateRegistry.sol (Contrat Registre initial)               |
|            +---> CertificateNFT.sol      (Contrat ERC-721 Soulbound)              |
+-----------------------------------------------------------------------------------+
```

### 6.2. Émission Unitaire et Traitement par Lots (CSV / Excel)

Pour répondre aux exigences des cycles universitaires réels comprenant des promotions de plusieurs centaines d'étudiants, la DApp propose deux canaux d'émission :
1. **Saisie Unitaire :** Formulaire interactif avec contrôle de validité des champs (nom complet, matricule CNE, intitulé de filière, mention).
2. **Import par Fichier (Excel `.xlsx` ou CSV) :** Analyseur intégré utilisant la bibliothèque `xlsx`. Le composant extrait les données, valide la casse et le format hexadécimal des adresses Ethereum selon la norme EIP-55, signale les anomalies avant soumission et exécute l'émission groupée via `batchMint` en une seule transaction réseau.

### 6.3. Vérification Publique Instantanée et Génération de QR Code

Le volet vérification est accessible à tout utilisateur sans nécessité de disposer de jetons de gaz ou de compte administrateur :
* Saisie de l'adresse publique Ethereum de l'étudiant ou de son identifiant de jeton (*Token ID*).
* Interrogation directe des nœuds blockchain et restitution de la carte d'attestation officielle (nom, filière, date, statut de validité).
* Génération dynamique d'un **QR Code cryptographique** pointant vers la preuve d'authenticité.
* Visualisation instantanée de l'image vectorielle SVG générée directement depuis le contrat intelligent on-chain.

---

#### Emplacements des Captures d'Écran - Application DApp

##### Figure 5 : Interface d'accueil et connexion Web3
*Description : Vue principale de la DApp aux couleurs de l'Université Abdelmalek Essaâdi avec détection du portefeuille MetaMask.*
![Figure 5 : Interface d'accueil DApp](images/04_dapp_home.png)

##### Figure 6 : Émission unitaire d'attestation
*Description : Panneau d'émission manuelle pour un étudiant avec attribution de la mention et du CNE.*
![Figure 6 : Formulaire d'émission unitaire](images/05_mint_single.png)

##### Figure 7 : Importation groupée via fichier
*Description : Import du fichier `etudiants.xlsx` avec prévisualisation des lignes analysées et adresses normalisées EIP-55.*
![Figure 7 : Import groupé de promotion par Excel/CSV](images/06_batch_import.png)

##### Figure 8 : Signature de transaction dans MetaMask
*Description : Fenêtre d'approbation MetaMask affichant l'exécution de la méthode batchMint.*
![Figure 8 : Signature de la transaction batch dans MetaMask](images/07_metamask_signature.png)

##### Figure 9 : Consultation publique du diplôme
*Description : Résultat de vérification d'un diplôme valide délivré à un étudiant du Master Sécurité et Éthique des Données.*
![Figure 9 : Vérification publique du certificat](images/08_certificate_verified.png)

##### Figure 10 : Génération du QR Code et TokenURI
*Description : Affichage du QR Code de vérification décentralisée et rendu visuel du SVG généré 100% on-chain.*
![Figure 10 : Rendu QR Code et SVG on-chain](images/09_qr_code_svg.png)

---

## 7. Guide de Déploiement et Reproductibilité

Le projet est conçu pour être entièrement reproductible sur un environnement de développement local ou un réseau de test Ethereum (Sepolia / Holesky).

### Étape 1 : Clonage du Dépôt et Installation des Dépendances
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

### Étape 4 : Lancement du Nœud Local Ethereum
Dans un premier terminal :
```bash
npx hardhat node
```

### Étape 5 : Déploiement des Contrats
Dans un second terminal :
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
*Note : Le script déploie les deux contrats et exporte automatiquement les adresses et ABIs vers le répertoire `frontend/src/contracts/`.*

### Étape 6 : Lancement de l'Interface Web
```bash
cd frontend
npm install
npm run dev
```
L'interface est accessible à l'adresse locale `http://localhost:5173`.

---

## 8. Conclusion & Perspectives

Ce projet a permis de concevoir, implémenter et sécuriser une solution complète de certification académique décentralisée. En franchissant l'étape du registre fonctionnel pour adopter le standard **ERC-721 Soulbound Token**, nous avons démontré qu'il est possible d'allier :
1. **L'authenticité absolue :** L'inaliénabilité garantie cryptographiquement par l'EVM empêche toute revente ou usurpation.
2. **L'indépendance technologique :** Le stockage intégral des métadonnées vectorielles on-chain protège l'institution contre la disparition des serveurs tiers ou des passerelles d'hébergement.
3. **L'ergonomie administrative :** L'intégration du traitement par lot couplé à une interface utilisateur intuitive rapproche la technologie blockchain des usages administratifs réels.

### Perspectives d'Évolution Future
* **Confidentialité ZK-SNARKs (Zero-Knowledge Proofs) :** Permettre à un étudiant de prouver l'obtention de son diplôme ou d'une mention minimale auprès d'un employeur sans révéler publiquement son CNE ou sa moyenne générale.
* **Gouvernance Multi-Signatures :** Implémenter un contrat de trésorerie et d'administration sous format Gnosis Safe nécessitant la signature conjointe du Doyen et du Responsable de Filière pour l'attribution des rôles d'émission.

---

## 9. Annexe : Nomenclature des Captures d'Écran

Pour insérer les captures d'écran dans le rapport, placez les fichiers images dans un dossier `images/` à la racine en respectant les noms de fichiers ci-dessous :

1. `01_hardhat_compile.png` : Sortie console de `npx hardhat compile`
2. `02_test_results.png` : Sortie console de `npx hardhat test` montrant les 26 tests réussis
3. `03_deploy_contracts.png` : Sortie console du déploiement via `scripts/deploy.ts`
4. `04_dapp_home.png` : Vue globale du tableau de bord de la DApp
5. `05_mint_single.png` : Formulaire d'émission unitaire rempli
6. `06_batch_import.png` : Importation du fichier `etudiants.xlsx` avec le tableau d'aperçu
7. `07_metamask_signature.png` : Fenêtre de confirmation de la transaction MetaMask
8. `08_certificate_verified.png` : Résultat de vérification d'un diplôme actif
9. `09_qr_code_svg.png` : Affichage du QR Code et du rendu visuel de l'attestation SVG

