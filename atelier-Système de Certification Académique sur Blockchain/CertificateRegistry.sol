// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CertificateRegistry
 * @dev Système de certification académique sur blockchain (Devoir 1).
 * Permet l'enregistrement, l'émission unitaire ou par lot (batch),
 * la révocation et la vérification publique de certificats académiques.
 */
contract CertificateRegistry {
    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
        bool revoked;
    }

    // Propriétaire du contrat
    address public owner;

    // Mapping des administrateurs autorisés
    mapping(address => bool) public admins;

    // Compteur d'identifiants de certificats (commence à 1)
    uint256 public certificateCount;

    // Stockage des certificats par identifiant (certId => Certificate)
    mapping(uint256 => Certificate) private _certificates;

    // Empêcher le double enregistrement d'un même studentId (studentId => bool)
    mapping(string => bool) private _registeredStudentIds;

    // Association studentId => certId pour recherche directe
    mapping(string => uint256) public studentIdToCertId;

    // Événements
    event CertificateMinted(
        uint256 indexed certId,
        address indexed recipient,
        string studentId,
        string studentName,
        string diplomaTitle
    );

    event CertificateRevoked(uint256 indexed certId);

    event AdminStatusChanged(address indexed account, bool isAdmin);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modificateurs d'accès
    modifier onlyOwner() {
        require(msg.sender == owner, "CertificateRegistry: caller is not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || admins[msg.sender],
            "CertificateRegistry: caller is not authorized (admin or owner)"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        emit AdminStatusChanged(msg.sender, true);
    }

    /**
     * @dev Gestion des administrateurs (par le propriétaire uniquement)
     */
    function setAdmin(address account, bool authorized) external onlyOwner {
        require(account != address(0), "CertificateRegistry: invalid admin address");
        admins[account] = authorized;
        emit AdminStatusChanged(account, authorized);
    }

    /**
     * @dev Transfert de propriété
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CertificateRegistry: invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @dev Émission d'un certificat unique
     * @param to Adresse du destinataire (peut être address(0) si l'étudiant n'a pas encore de wallet)
     * @param studentName Nom complet de l'étudiant
     * @param studentId Identifiant unique de l'étudiant (ex: CNE)
     * @param diplomaTitle Intitulé du diplôme ou de l'attestation
     * @param issueDate Date d'émission (format ISO YYYY-MM-DD)
     * @param grade Mention ou note
     * @return certId L'identifiant généré pour le certificat
     */
    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade
    ) external onlyAuthorized returns (uint256 certId) {
        return _mint(to, studentName, studentId, diplomaTitle, issueDate, grade);
    }

    /**
     * @dev Émission par lot (batch mint)
     * Pour optimiser le gas, recommandé par lots de 5 à 15 certificats.
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades
    ) external onlyAuthorized {
        uint256 total = recipients.length;
        require(
            studentNames.length == total &&
            studentIds.length == total &&
            diplomaTitles.length == total &&
            issueDates.length == total &&
            grades.length == total,
            "CertificateRegistry: array lengths must match"
        );
        require(total > 0, "CertificateRegistry: empty batch");

        for (uint256 i = 0; i < total; i++) {
            _mint(
                recipients[i],
                studentNames[i],
                studentIds[i],
                diplomaTitles[i],
                issueDates[i],
                grades[i]
            );
        }
    }

    /**
     * @dev Logique interne de minting
     */
    function _mint(
        address to,
        string memory studentName,
        string memory studentId,
        string memory diplomaTitle,
        string memory issueDate,
        string memory grade
    ) internal returns (uint256 certId) {
        require(bytes(studentName).length > 0, "CertificateRegistry: empty studentName");
        require(bytes(studentId).length > 0, "CertificateRegistry: empty studentId");
        require(bytes(diplomaTitle).length > 0, "CertificateRegistry: empty diplomaTitle");
        require(!_registeredStudentIds[studentId], "CertificateRegistry: studentId already registered");

        certificateCount++;
        certId = certificateCount;

        _certificates[certId] = Certificate({
            studentName: studentName,
            studentId: studentId,
            diplomaTitle: diplomaTitle,
            issueDate: issueDate,
            grade: grade,
            recipient: to,
            revoked: false
        });

        _registeredStudentIds[studentId] = true;
        studentIdToCertId[studentId] = certId;

        emit CertificateMinted(certId, to, studentId, studentName, diplomaTitle);
    }

    /**
     * @dev Révocation d'un certificat (optionnel mais requis par les spécifications)
     * @param certId Identifiant du certificat à révoquer
     */
    function revoke(uint256 certId) external onlyAuthorized {
        require(certId > 0 && certId <= certificateCount, "CertificateRegistry: certificate does not exist");
        Certificate storage cert = _certificates[certId];
        require(!cert.revoked, "CertificateRegistry: certificate already revoked");

        cert.revoked = true;
        emit CertificateRevoked(certId);
    }

    /**
     * @dev Consultation d'un certificat par son certId (lecture gratuite view)
     */
    function getCertificate(uint256 certId) external view returns (Certificate memory) {
        require(certId > 0 && certId <= certificateCount, "CertificateRegistry: certificate does not exist");
        return _certificates[certId];
    }

    /**
     * @dev Vérification publique de la validité d'un certificat
     * Retourne true si le certificat existe et n'est pas révoqué
     */
    function isCertificateValid(uint256 certId) external view returns (bool) {
        if (certId == 0 || certId > certificateCount) {
            return false;
        }
        return !_certificates[certId].revoked;
    }

    /**
     * @dev Vérifie si un identifiant étudiant a déjà été enregistré
     */
    function isStudentRegistered(string calldata studentId) external view returns (bool) {
        return _registeredStudentIds[studentId];
    }

    /**
     * @dev Nombre total de certificats émis
     */
    function getCertificateCount() external view returns (uint256) {
        return certificateCount;
    }
}

