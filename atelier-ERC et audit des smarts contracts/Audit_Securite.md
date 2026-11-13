# Rapport d'Audit de Sécurité — Smart Contracts de Certification Académique

**Auteur :** Homam Dany  
**Formation :** Master Sécurité et Éthique des Données  
**Établissement :** Faculté des Sciences et Techniques de Tanger — Université Abdelmalek Essaâdi  
**Date d'évaluation :** Novembre 2026  
**Version du contrat audité :** CertificateNFT (v2.0 - ERC-721URIStorage)  

---

## 1. Périmètre de l'Audit

L'audit de sécurité a porté sur l'architecture du système de certification décentralisé, en particulier sur l'évolution du contrat vers le standard ERC-721 :

| Élément | Description |
|---|---|
| **Contrat principal** | `CertificateNFT.sol` (Hérite d'`ERC721URIStorage`, `AccessControl`, `ReentrancyGuard`) |
| **Norme de jeton** | ERC-721 Non-Fungible Token standard (EIP-721) avec métadonnées dynamiques on-chain |
| **Compilateur** | Solidity `^0.8.28` (Optimiseur activé, runs: 200, viaIR: true) |
| **Dépendances** | OpenZeppelin Contracts `v5.6.1` |
| **Fonctions auditées** | `mintCertificate`, `batchMintCertificates`, `revokeCertificate`, `getCertificate`, `isCertificateValid`, `_update` (Soulbound) |

---

## 2. Checklist d'Audit et Résultats

La checklist appliquée s'inspire des standards **Consensys Diligence** et de la méthodologie **Secureum** :

| Domaine de Sécurité | Risque Potentiel | Statut | Commentaire & Remédiation |
|---|---|---|---|
| **Contrôle d'accès (Access Control)** | Élévation de privilèges, émission arbitraire | **OK** | Gestion RBAC granulaire via OpenZeppelin `AccessControl`. Rôles `MINTER_ROLE` et `DEFAULT_ADMIN_ROLE` distincts. |
| **Réentrance (Reentrancy)** | Appel externe réentrant durant le mint | **OK** | Modificateur `nonReentrant` systématique sur toutes les fonctions d'écriture d'état. Pattern Checks-Effects-Interactions respecté. |
| **Dépassement d'entiers (Overflow/Underflow)** | Manipulation arithmétique | **OK** | Géré nativement par Solidity `>= 0.8.0` avec reversion automatique en cas d'overflow. |
| **Unicité des Identifiants (Logique Métier)** | Double certification pour un même CNE | **OK** | Mapping d'unicité `_registeredStudentIds[studentId]`. Rejet immédiat avec message explicite. |
| **Intransférabilité (Soulbound Token)** | Revente ou transmission frauduleuse de diplôme | **OK** | Surcharge de `_update()` bloquant tout transfert secondaire (`from != 0 && to != 0`). Un diplôme est strictement attaché à son titulaire. |
| **Validation des Entrées (Input Validation)** | Chaînes vides, tailles de tableaux incohérentes | **OK** | Vérification explicite sur tous les paramètres (`studentName`, `studentId`, `diplomaTitle`, synchronisation des longueurs de tableaux en batch). |
| **Déni de Service (DoS Gas Limit)** | Boucle non bornée dans `batchMint` | **OK** | Recommandation opérationnelle de limiter les lots à 15-20 diplômes pour respecter la limite de gas du bloc. |
| **Visibilité & Déclaration** | Fonctions de lecture sur-consommatrices | **OK** | Fonctions `getCertificate`, `isCertificateValid`, `isStudentRegistered` déclarées `external view` (aucun coût de gas pour les clients). |

---

## 3. Analyse Détaillée des Vulnérabilités Recherchées

### 3.1 Contrôle d'Accès et Gouvernance (SWC-105 / SWC-106)
- **Constat initial :** Dans le Devoir 1, la gestion s'appuyait sur un simple `onlyOwner` avec un mapping booléen basique.
- **Amélioration apportée :** Intégration d'`AccessControl` d'OpenZeppelin. Deux rôles distincts ont été définis :
  - `MINTER_ROLE` (`keccak256("MINTER_ROLE")`) : conféré au service de scolarité pour émettre les diplômes.
  - `DEFAULT_ADMIN_ROLE` : réservé à la direction pour révoquer ou assigner de nouveaux émetteurs.
- **Résultat :** Tout appel non autorisé est intercepté au niveau EVM avec l'erreur personnalisée `AccessControlUnauthorizedAccount`.

### 3.2 Prévention de la Réentrance (SWC-107)
- La fonction `_safeMint` de l'ERC-721 appelle `onERC721Received` si le destinataire est un smart contract. Cela introduit un risque de réentrance si l'état n'est pas mis à jour avant l'appel externe.
- **Solution :** L'état (`_certificates`, `_registeredStudentIds`, `studentIdToTokenId`) est mis à jour en local et le modificateur `nonReentrant` verrouille la fonction pendant l'exécution.

### 3.3 Protection Soulbound (Non-Transférabilité)
- Un diplôme universitaire est nominatif et ne doit en aucun cas pouvoir être transféré ou échangé sur une place de marché NFT (OpenSea, etc.).
- **Implémentation :** Surcharge de la fonction interne `_update(address to, uint256 tokenId, address auth)` :
  ```solidity
  address from = _ownerOf(tokenId);
  if (from != address(0) && to != address(0)) {
      revert("CertificateNFT: academic certificates are soulbound and non-transferable");
  }
  ```
  Les seuls transferts autorisés sont l'émission (`from == address(0)`) et la destruction éventuelle (`to == address(0)`).

---

## 4. Résultats des Tests Automatisés

La suite de tests automatisée (écrite en TypeScript avec Viem et Solidity natif) valide **26 tests sur 26** :

```text
  CertificateNFT (ERC-721 & Security Audit)
    1. Access Control & Role Governance
      ✔ Deployer should hold DEFAULT_ADMIN_ROLE and MINTER_ROLE
      ✔ Admin can grant MINTER_ROLE to an authorized operator
      ✔ Unauthorized account cannot mint (should revert)
      ✔ Non-admin account cannot revoke certificate (should revert)
    2. ERC-721 Minting & Metadata
      ✔ Should mint NFT, assign token to student and set on-chain metadata
      ✔ Should prevent duplicate studentId minting
    3. Batch Minting
      ✔ Should batch mint multiple ERC-721 certificates
      ✔ Should reject batch mint with mismatched array sizes
    4. Revocation Security
      ✔ Admin can revoke certificate and invalidate verification
      ✔ Reverts if attempting to revoke an already revoked certificate
    5. Soulbound Security (Non-Transferability)
      ✔ Should block secondary transfer of academic certificate NFT

  CertificateRegistry
    Deployment & Access Control (3 tests pass)
    Single Minting (3 tests pass)
    Batch Minting (2 tests pass)
    Revocation (3 tests pass)

  Solidity Tests (forge-std)
    4 tests pass

Total : 26 passing (100% de réussite)
```

---

## 5. Comparatif d'Architecture : ERC-721 vs ERC-1155

| Critère | ERC-721 (Choix Retenu) | ERC-1155 (Alternative Multi-Token) |
|---|---|---|
| **Granularité** | Chaque diplôme possède son propre identifiant (`tokenId`) unique et individuel. | Chaque identifiant représente un type/filière (ex: `ID 1 = Master Cyber`), avec une quantité d'exemplaires. |
| **Pertinence académique** | **Très forte** : le diplôme est nominatif, unique, daté et associé à un relevé spécifique. | Moyenne : les métadonnées individuelles (nom, CNE, note) doivent être gérées hors contrat ou via des sous-identifiants complexes. |
| **Coût en Gas (Batch)** | Légèrement plus élevé lors de l'émission par lot car chaque token a un ID propre. | Plus économique pour créer des tokens fongibles en série, mais peu d'avantage pour des attestations 100% personnalisées. |
| **Interopérabilité Portefeuilles** | Support natif complet dans MetaMask Mobile, Rainbow, Coinbase Wallet (affichage direct dans l'onglet NFTs). | Support variable selon les interfaces utilisateur de portefeuilles grand public. |

**Conclusion de conception :** Le standard **ERC-721 (avec extension URIStorage)** est le plus adapté pour certifier des réussites académiques nominatives, car chaque diplôme constitue un titre unique et infalsifiable.

---

## 6. Recommandations et Points d'Amélioration

1. **Décentralisation du stockage des médias :** Bien que les métadonnées JSON soient encodées dynamiquement on-chain en Base64, lier un scan PDF ou une maquette haute résolution via un hash IPFS (`ipfs://...`) est recommandé pour les audits externes.
2. **Gestion multisig des révocations :** Pour un déploiement en production à l'échelle universitaire, attribuer le `DEFAULT_ADMIN_ROLE` à un portefeuille multi-signatures (Gnosis Safe) nécessitant l'accord d'au moins 2 membres de la direction pour révoquer un titre.

