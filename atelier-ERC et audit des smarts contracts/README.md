# ERC et Audit des Smart Contracts (Devoir 2)

Évolution du système de certification académique vers le standard **ERC-721 Soulbound** avec contrôle d'accès granulaire (**AccessControl**), métadonnées dynamiques on-chain et rapport d'audit de sécurité complet.

Projet réalisé pour l'**Université Abdelmalek Essaâdi — Faculté des Sciences et Techniques de Tanger**.

---

## Vidéo Démonstrative
Lien de la vidéo de démonstration de l'application (Devoir 2) :
- [ERC et audit des smarts contracts - Google Drive](https://drive.google.com/drive/u/0/folders/1Ti_6F6s-YN4d2RzB1eoQlgBxNfF8EGmm)

---

## Contenu du Dossier

- **`Devoir2_ERC_et_Audit.pdf`** : Énoncé officiel du Devoir 2.
- **`CertificateNFT.sol`** : Smart contract Solidity conforme au standard ERC-721 Soulbound d'OpenZeppelin v5.
- **`Audit_Securite.md`** : Rapport d'audit de sécurité complet (méthodologie Secureum / Consensys Diligence, analyse de réentrance, contrôle d'accès, et comparatif ERC-721 vs ERC-1155).
- **`frontend/`** : Application web adaptée avec support des Token IDs, métadonnées `tokenURI`, détection automatique des rôles (`MINTER_ROLE`) et génération de QR Code de vérification.
- **`etudiants.xlsx`** & **`etudiants.csv`** : Fichiers d'exemple structurés avec adresses normalisées EIP-55.

---

## Spécifications du Smart Contract (`CertificateNFT.sol`)

### 1. Héritage OpenZeppelin v5
- `ERC721URIStorage` : Chaque diplôme est un jeton NFT unique possédant son propre identifiant (`tokenId`) et son URI de métadonnées.
- `AccessControl` :
  - `MINTER_ROLE` (`keccak256("MINTER_ROLE")`) : conféré aux opérateurs autorisés pour émettre des diplômes.
  - `DEFAULT_ADMIN_ROLE` : réservé à la direction pour révoquer ou assigner des droits.
- `ReentrancyGuard` : modificateur `nonReentrant` sur toutes les fonctions d'écriture d'état.

### 2. Propriété Soulbound (Intransférabilité)
Un diplôme universitaire est strictement nominatif et ne peut faire l'objet de revente ou de cession. La fonction interne `_update()` a été surchargée pour bloquer systématiquement tout transfert secondaire entre étudiants :
```solidity
address from = _ownerOf(tokenId);
if (from != address(0) && to != address(0)) {
    revert("CertificateNFT: academic certificates are soulbound and non-transferable");
}
```

### 3. Métadonnées Dynamiques On-Chain
Le contrat génère automatiquement un JSON conforme au standard EIP-721 encodé en Base64 on-chain (`data:application/json;base64,...`), garantissant l'indépendance vis-à-vis de serveurs centralisés. Le contrat supporte également les liens décentralisés IPFS (`ipfs://...`).

---

## Rapport d'Audit de Sécurité

Le document [`Audit_Securite.md`](./Audit_Securite.md) détaille :
1. **Le périmètre audité** et les bibliothèques OpenZeppelin utilisées.
2. **La checklist de sécurité** : réentrance (SWC-107), contrôle d'accès (SWC-105/106), débordement d'entiers, déni de service (DoS gas limit) et validation des entrées.
3. **Le comparatif ERC-721 vs ERC-1155** : analyse de pertinence pour la certification académique.
4. **Les résultats des tests automatisés** : 26 tests validés avec succès.

---

## Lancement du Frontend

1. Naviguer dans le dossier du frontend :
```bash
cd frontend
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer l'application web :
```bash
npm run dev
```

4. Ouvrir `http://localhost:5173` avec MetaMask connecté sur le réseau **Localhost 8545** (Chain ID: `31337`).

---

## Auteur
**Homam Dany** — 2026/2027  
Master en Informatique / Sécurité et Éthique des Données  
Faculté des Sciences et Techniques de Tanger — Université Abdelmalek Essaâdi
