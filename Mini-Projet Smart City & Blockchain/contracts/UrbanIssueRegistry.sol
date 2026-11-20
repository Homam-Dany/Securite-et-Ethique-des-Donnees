// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UrbanIssueRegistry
 * @dev Smart Contract pour la plateforme décentralisée de gestion des services urbains (Smart City).
 * Permet aux citoyens de signaler des dysfonctionnements urbains et aux services municipaux
 * d'assurer leur suivi, affectation et résolution avec une traçabilité complète sur la blockchain.
 */
contract UrbanIssueRegistry {
    enum Priority { Low, Medium, High, Critical }
    enum Status { Reported, Assigned, InProgress, Resolved, Closed }

    struct HistoryEntry {
        uint256 timestamp;
        Status status;
        string assignedTeam;
        string comment;
        address actor;
    }

    struct Issue {
        uint256 id;
        string customId;
        string issueType;
        string location;
        string description;
        Priority priority;
        Status status;
        string reportedByName;
        address reporter;
        string assignedTeam;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    struct IssueInput {
        string customId;
        string issueType;
        string location;
        string description;
        Priority priority;
        string reportedByName;
        string assignedTeam;
        Status initialStatus;
    }

    address public municipalAuthority;
    uint256 public nextIssueId = 1;

    mapping(uint256 => Issue) private _issues;
    mapping(uint256 => HistoryEntry[]) private _issueHistories;
    mapping(string => uint256) public customIdToIssueId;
    mapping(string => bool) public customIdExists;
    mapping(address => bool) public municipalAdmins;

    // Événements
    event IssueReported(
        uint256 indexed id,
        string customId,
        string issueType,
        string location,
        Priority priority,
        address indexed reporter,
        uint256 timestamp
    );

    event IssueAssigned(
        uint256 indexed id,
        string assignedTeam,
        address indexed actor,
        uint256 timestamp
    );

    event StatusUpdated(
        uint256 indexed id,
        Status oldStatus,
        Status newStatus,
        address indexed actor,
        string comment,
        uint256 timestamp
    );

    event InterventionLogged(
        uint256 indexed id,
        address indexed actor,
        string comment,
        uint256 timestamp
    );

    event MunicipalAdminUpdated(address indexed admin, bool isAuthorized);
    event MunicipalAuthorityTransferred(address indexed oldAuthority, address indexed newAuthority);

    modifier onlyMunicipality() {
        require(
            msg.sender == municipalAuthority || municipalAdmins[msg.sender],
            "UrbanIssueRegistry: Acces reserve aux autorites municipales"
        );
        _;
    }

    constructor() {
        municipalAuthority = msg.sender;
        municipalAdmins[msg.sender] = true;
    }

    /**
     * @dev Enregistre un nouveau signalement urbain
     */
    function reportIssue(
        string memory _customId,
        string memory _issueType,
        string memory _location,
        string memory _description,
        Priority _priority,
        string memory _reportedByName
    ) public returns (uint256) {
        require(bytes(_issueType).length > 0, "Type requis");
        require(bytes(_location).length > 0, "Localisation requise");
        require(bytes(_description).length > 0, "Description requise");

        uint256 issueId = nextIssueId++;

        // Si aucun identifiant personnalise n'est fourni, on le genere automatiquement
        string memory finalCustomId = _customId;
        if (bytes(finalCustomId).length == 0) {
            finalCustomId = string(abi.encodePacked("CITY-2026-", _uintToString(issueId)));
        } else {
            require(!customIdExists[finalCustomId], "Identifiant de signalement deja existant");
        }

        customIdExists[finalCustomId] = true;
        customIdToIssueId[finalCustomId] = issueId;

        Issue storage newIssue = _issues[issueId];
        newIssue.id = issueId;
        newIssue.customId = finalCustomId;
        newIssue.issueType = _issueType;
        newIssue.location = _location;
        newIssue.description = _description;
        newIssue.priority = _priority;
        newIssue.status = Status.Reported;
        newIssue.reportedByName = bytes(_reportedByName).length > 0 ? _reportedByName : "Citoyen Anonyme";
        newIssue.reporter = msg.sender;
        newIssue.assignedTeam = "";
        newIssue.createdAt = block.timestamp;
        newIssue.updatedAt = block.timestamp;
        newIssue.exists = true;

        // Ajouter a l'historique
        _issueHistories[issueId].push(HistoryEntry({
            timestamp: block.timestamp,
            status: Status.Reported,
            assignedTeam: "",
            comment: "Creation du signalement sur la blockchain",
            actor: msg.sender
        }));

        emit IssueReported(
            issueId,
            finalCustomId,
            _issueType,
            _location,
            _priority,
            msg.sender,
            block.timestamp
        );

        return issueId;
    }

    /**
     * @dev Enregistre plusieurs signalements en lot (utilise pour l'import Excel)
     */
    function batchReportIssues(IssueInput[] calldata inputs) external returns (uint256[] memory) {
        uint256 count = inputs.length;
        require(count > 0, "Aucun signalement a importer");
        uint256[] memory createdIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            IssueInput calldata input = inputs[i];
            require(bytes(input.issueType).length > 0, "Type requis");
            require(bytes(input.location).length > 0, "Localisation requise");
            require(bytes(input.description).length > 0, "Description requise");

            uint256 issueId = nextIssueId++;
            string memory finalCustomId = input.customId;
            if (bytes(finalCustomId).length == 0) {
                finalCustomId = string(abi.encodePacked("CITY-2026-", _uintToString(issueId)));
            } else if (customIdExists[finalCustomId]) {
                // Si l'identifiant existe deja sur la blockchain, on le rend unique avec le numero d'incident
                finalCustomId = string(abi.encodePacked(finalCustomId, "-", _uintToString(issueId)));
            }

            customIdExists[finalCustomId] = true;
            customIdToIssueId[finalCustomId] = issueId;

            Status initialStatus = input.initialStatus;
            string memory assignedTeam = input.assignedTeam;

            Issue storage newIssue = _issues[issueId];
            newIssue.id = issueId;
            newIssue.customId = finalCustomId;
            newIssue.issueType = input.issueType;
            newIssue.location = input.location;
            newIssue.description = input.description;
            newIssue.priority = input.priority;
            newIssue.status = initialStatus;
            newIssue.reportedByName = bytes(input.reportedByName).length > 0 ? input.reportedByName : "Import Excel";
            newIssue.reporter = msg.sender;
            newIssue.assignedTeam = assignedTeam;
            newIssue.createdAt = block.timestamp;
            newIssue.updatedAt = block.timestamp;
            newIssue.exists = true;

            // Historique initial
            _issueHistories[issueId].push(HistoryEntry({
                timestamp: block.timestamp,
                status: initialStatus,
                assignedTeam: assignedTeam,
                comment: "Importation du signalement",
                actor: msg.sender
            }));

            emit IssueReported(
                issueId,
                finalCustomId,
                input.issueType,
                input.location,
                input.priority,
                msg.sender,
                block.timestamp
            );

            createdIds[i] = issueId;
        }

        return createdIds;
    }

    /**
     * @dev Affecte une equipe d'intervention a un signalement
     */
    function assignTeam(
        uint256 _issueId,
        string calldata _team,
        string calldata _comment
    ) external onlyMunicipality {
        require(_issues[_issueId].exists, "Signalement inexistant");
        require(bytes(_team).length > 0, "Equipe requise");

        Issue storage issue = _issues[_issueId];
        issue.assignedTeam = _team;
        issue.updatedAt = block.timestamp;

        // Met automatiquement le statut a Assigned si le statut etait Reported
        if (issue.status == Status.Reported) {
            issue.status = Status.Assigned;
        }

        string memory actionComment = bytes(_comment).length > 0
            ? _comment
            : string(abi.encodePacked("Affectation a l'equipe: ", _team));

        _issueHistories[_issueId].push(HistoryEntry({
            timestamp: block.timestamp,
            status: issue.status,
            assignedTeam: _team,
            comment: actionComment,
            actor: msg.sender
        }));

        emit IssueAssigned(_issueId, _team, msg.sender, block.timestamp);
        emit StatusUpdated(_issueId, Status.Reported, issue.status, msg.sender, actionComment, block.timestamp);
    }

    /**
     * @dev Met a jour le statut d'un signalement
     */
    function updateStatus(
        uint256 _issueId,
        Status _newStatus,
        string calldata _comment
    ) external onlyMunicipality {
        require(_issues[_issueId].exists, "Signalement inexistant");
        Issue storage issue = _issues[_issueId];
        Status oldStatus = issue.status;

        issue.status = _newStatus;
        issue.updatedAt = block.timestamp;

        string memory logComment = bytes(_comment).length > 0 ? _comment : "Mise a jour du statut";

        _issueHistories[_issueId].push(HistoryEntry({
            timestamp: block.timestamp,
            status: _newStatus,
            assignedTeam: issue.assignedTeam,
            comment: logComment,
            actor: msg.sender
        }));

        emit StatusUpdated(_issueId, oldStatus, _newStatus, msg.sender, logComment, block.timestamp);
    }

    /**
     * @dev Ajoute un commentaire ou log d'intervention sans obligatoirement changer de statut
     */
    function addInterventionLog(
        uint256 _issueId,
        string calldata _comment
    ) external onlyMunicipality {
        require(_issues[_issueId].exists, "Signalement inexistant");
        require(bytes(_comment).length > 0, "Commentaire requis");

        Issue storage issue = _issues[_issueId];
        issue.updatedAt = block.timestamp;

        _issueHistories[_issueId].push(HistoryEntry({
            timestamp: block.timestamp,
            status: issue.status,
            assignedTeam: issue.assignedTeam,
            comment: _comment,
            actor: msg.sender
        }));

        emit InterventionLogged(_issueId, msg.sender, _comment, block.timestamp);
    }

    /**
     * @dev Consultation d'un signalement specifique
     */
    function getIssue(uint256 _issueId) external view returns (Issue memory) {
        require(_issues[_issueId].exists, "Signalement inexistant");
        return _issues[_issueId];
    }

    /**
     * @dev Consultation d'un signalement par son identifiant unique
     */
    function getIssueByCustomId(string calldata _customId) external view returns (Issue memory) {
        uint256 id = customIdToIssueId[_customId];
        require(id != 0 && _issues[id].exists, "Signalement non trouve");
        return _issues[id];
    }

    /**
     * @dev Consultation de l'historique complet d'un signalement
     */
    function getIssueHistory(uint256 _issueId) external view returns (HistoryEntry[] memory) {
        require(_issues[_issueId].exists, "Signalement inexistant");
        return _issueHistories[_issueId];
    }

    /**
     * @dev Retourne le nombre total de signalements
     */
    function getIssuesCount() external view returns (uint256) {
        return nextIssueId - 1;
    }

    /**
     * @dev Retourne tous les signalements pour faciliter l'affichage dans la DApp
     */
    function getAllIssues() external view returns (Issue[] memory) {
        uint256 total = nextIssueId - 1;
        Issue[] memory all = new Issue[](total);
        for (uint256 i = 1; i <= total; i++) {
            all[i - 1] = _issues[i];
        }
        return all;
    }

    /**
     * @dev Gestion des administrateurs municipaux
     */
    function setMunicipalAdmin(address _admin, bool _isAuthorized) external {
        require(msg.sender == municipalAuthority, "Seule l'autorite municipale peut modifier les roles");
        municipalAdmins[_admin] = _isAuthorized;
        emit MunicipalAdminUpdated(_admin, _isAuthorized);
    }

    /**
     * @dev Transfert de l'autorite municipale
     */
    function transferMunicipalAuthority(address _newAuthority) external {
        require(msg.sender == municipalAuthority, "Non autorise");
        require(_newAuthority != address(0), "Adresse invalide");
        address old = municipalAuthority;
        municipalAuthority = _newAuthority;
        municipalAdmins[_newAuthority] = true;
        emit MunicipalAuthorityTransferred(old, _newAuthority);
    }

    /**
     * @dev Utilitaire de conversion uint en string
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
