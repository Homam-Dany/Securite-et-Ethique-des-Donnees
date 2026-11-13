// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title CertificateNFT
 * @author Homam Dany
 * @notice Smart Contract standard ERC-721 pour la certification académique infalsifiable.
 * Conforme aux spécifications du Devoir 2 (OpenZeppelin v5, AccessControl, ERC721URIStorage, Soulbound).
 */
contract CertificateNFT is ERC721URIStorage, AccessControl, ReentrancyGuard {
    using Strings for uint256;

    // Définition des rôles cryptographiques
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
        bool revoked;
    }

    // Compteur d'identifiant unique de NFT (commence à 1)
    uint256 private _nextTokenId;

    // Enregistrement des certificats par tokenId
    mapping(uint256 => Certificate) private _certificates;

    // Registre anti-doublon d'étudiants (CNE => bool)
    mapping(string => bool) private _registeredStudentIds;

    // Indexation inverse CNE => tokenId
    mapping(string => uint256) public studentIdToTokenId;

    // Événements indexés pour supervision et indexation
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string studentId,
        string studentName,
        string diplomaTitle
    );

    event CertificateRevoked(uint256 indexed tokenId);

    /**
     * @notice Constructeur initialisant le token ERC-721 et attribuant les rôles d'administration
     */
    constructor() ERC721("Academic Certificate NFT", "ACERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @notice Émission d'un certificat unitaire sous forme de NFT ERC-721
     * @param to Adresse du destinataire (si address(0), assigné au contrat par sécurité)
     * @param studentName Nom complet du titulaire
     * @param studentId Identifiant académique unique (CNE)
     * @param diplomaTitle Intitulé de la formation
     * @param issueDate Date officielle d'obtention
     * @param grade Mention obtenue
     * @param uri URI des métadonnées (IPFS ou vide pour métadonnées dynamiques on-chain)
     * @return tokenId Identifiant du token émis
     */
    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade,
        string calldata uri
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256 tokenId) {
        return _mintInternal(to, studentName, studentId, diplomaTitle, issueDate, grade, uri);
    }

    /**
     * @notice Émission groupée de certificats (batch mint) pour promotions entières
     */
    function batchMintCertificates(
        address[] calldata recipients,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades,
        string[] calldata uris
    ) public onlyRole(MINTER_ROLE) nonReentrant {
        uint256 total = recipients.length;
        require(
            studentNames.length == total &&
            studentIds.length == total &&
            diplomaTitles.length == total &&
            issueDates.length == total &&
            grades.length == total &&
            uris.length == total,
            "CertificateNFT: array lengths must match"
        );
        require(total > 0, "CertificateNFT: empty batch");

        for (uint256 i = 0; i < total; i++) {
            _mintInternal(
                recipients[i],
                studentNames[i],
                studentIds[i],
                diplomaTitles[i],
                issueDates[i],
                grades[i],
                uris[i]
            );
        }
    }

    /**
     * @notice Alias de compatibilité Devoir 1 pour batchMint (sans paramètre d'URI personnalisé)
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        uint256 total = recipients.length;
        require(
            studentNames.length == total &&
            studentIds.length == total &&
            diplomaTitles.length == total &&
            issueDates.length == total &&
            grades.length == total,
            "CertificateNFT: array lengths must match"
        );
        require(total > 0, "CertificateNFT: empty batch");

        for (uint256 i = 0; i < total; i++) {
            _mintInternal(
                recipients[i],
                studentNames[i],
                studentIds[i],
                diplomaTitles[i],
                issueDates[i],
                grades[i],
                ""
            );
        }
    }

    /**
     * @dev Logique interne d'émission, validation et génération des métadonnées
     */
    function _mintInternal(
        address to,
        string memory studentName,
        string memory studentId,
        string memory diplomaTitle,
        string memory issueDate,
        string memory grade,
        string memory uri
    ) internal returns (uint256 tokenId) {
        require(bytes(studentName).length > 0, "CertificateNFT: empty studentName");
        require(bytes(studentId).length > 0, "CertificateNFT: empty studentId");
        require(bytes(diplomaTitle).length > 0, "CertificateNFT: empty diplomaTitle");
        require(!_registeredStudentIds[studentId], "CertificateNFT: studentId already registered");

        // Si aucune adresse valide n'est passée, on mint au bénéfice de l'émetteur
        address recipient = to == address(0) ? msg.sender : to;

        _nextTokenId++;
        tokenId = _nextTokenId;

        _safeMint(recipient, tokenId);

        _certificates[tokenId] = Certificate({
            studentName: studentName,
            studentId: studentId,
            diplomaTitle: diplomaTitle,
            issueDate: issueDate,
            grade: grade,
            recipient: recipient,
            revoked: false
        });

        _registeredStudentIds[studentId] = true;
        studentIdToTokenId[studentId] = tokenId;

        // Définition de l'URI des métadonnées
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        } else {
            string memory generatedUri = _generateOnChainMetadata(tokenId);
            _setTokenURI(tokenId, generatedUri);
        }

        emit CertificateMinted(tokenId, recipient, studentId, studentName, diplomaTitle);
    }

    /**
     * @notice Révocation d'un certificat académique (action réservée à DEFAULT_ADMIN_ROLE)
     * @param tokenId Identifiant du token NFT à révoquer
     */
    function revokeCertificate(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        _requireOwned(tokenId);
        Certificate storage cert = _certificates[tokenId];
        require(!cert.revoked, "CertificateNFT: certificate already revoked");

        cert.revoked = true;

        // Mise à jour de l'URI pour refléter le statut révoqué
        string memory updatedUri = _generateOnChainMetadata(tokenId);
        _setTokenURI(tokenId, updatedUri);

        emit CertificateRevoked(tokenId);
    }

    /**
     * @notice Génération dynamique on-chain du JSON de métadonnées ERC-721 standard
     */
    function _generateOnChainMetadata(uint256 tokenId) internal view returns (string memory) {
        Certificate memory cert = _certificates[tokenId];

        string memory statusStr = cert.revoked ? "Revoque" : "Authentique et Valide";

        bytes memory json = abi.encodePacked(
            '{"name":"Certificat #', tokenId.toString(), ' - ', cert.studentName, '",',
            '"description":"Certificat academique officiel delivre par l Universite Abdelmalek Essaadi (FST de Tanger) ancre sur la blockchain Ethereum.",',
            '"attributes":[',
                '{"trait_type":"Etudiant","value":"', cert.studentName, '"},',
                '{"trait_type":"CNE","value":"', cert.studentId, '"},',
                '{"trait_type":"Diplome","value":"', cert.diplomaTitle, '"},',
                '{"trait_type":"Date d obtention","value":"', cert.issueDate, '"},',
                '{"trait_type":"Mention","value":"', cert.grade, '"},',
                '{"trait_type":"Statut","value":"', statusStr, '"}',
            ']}'
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    /**
     * @notice Consultation structurée d'un certificat (gratuit view)
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        _requireOwned(tokenId);
        return _certificates[tokenId];
    }

    /**
     * @notice Vérification publique rapide de la validité d'un diplôme
     */
    function isCertificateValid(uint256 tokenId) external view returns (bool) {
        if (tokenId == 0 || tokenId > _nextTokenId) {
            return false;
        }
        return !_certificates[tokenId].revoked;
    }

    /**
     * @notice Vérifie si un identifiant étudiant (CNE) a déjà reçu un certificat
     */
    function isStudentRegistered(string calldata studentId) external view returns (bool) {
        return _registeredStudentIds[studentId];
    }

    /**
     * @notice Nombre total de certificats émis
     */
    function getTotalCertificates() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Propriété Soulbound : un diplôme académique est strictement nominatif et intransférable.
     * Les transferts secondaires entre portefeuilles sont bloqués. Seuls le mint et le burn sont permis.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("CertificateNFT: academic certificates are soulbound and non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Résolution des conflits d'héritage pour supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Résolution des conflits d'héritage pour tokenURI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}

