const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UrbanIssueRegistry Smart Contract", function () {
  let UrbanIssueRegistry;
  let registry;
  let owner; // Municipal Authority
  let admin1;
  let citizen1;
  let citizen2;

  beforeEach(async function () {
    [owner, admin1, citizen1, citizen2] = await ethers.getSigners();
    UrbanIssueRegistry = await ethers.getContractFactory("UrbanIssueRegistry");
    registry = await UrbanIssueRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Déploiement et Initialisation", function () {
    it("Doit définir le déployeur comme autorité municipale", async function () {
      expect(await registry.municipalAuthority()).to.equal(owner.address);
      expect(await registry.municipalAdmins(owner.address)).to.be.true;
    });

    it("Le compteur initial de signalements doit être à 0", async function () {
      expect(await registry.getIssuesCount()).to.equal(0);
    });
  });

  describe("Création de Signalements (Citizen Reporting)", function () {
    it("Permet à un citoyen d'enregistrer un signalement avec identifiant personnalisé", async function () {
      const tx = await registry.connect(citizen1).reportIssue(
        "CITY-2026-001",
        "StreetLight",
        "Avenue Mohammed V, Rabat",
        "Lampadaire éteint la nuit",
        2, // High priority
        "Citizen01"
      );
      await tx.wait();

      expect(await registry.getIssuesCount()).to.equal(1);

      const issue = await registry.getIssue(1);
      expect(issue.customId).to.equal("CITY-2026-001");
      expect(issue.issueType).to.equal("StreetLight");
      expect(issue.location).to.equal("Avenue Mohammed V, Rabat");
      expect(issue.priority).to.equal(2);
      expect(issue.status).to.equal(0); // Reported
      expect(issue.reporter).to.equal(citizen1.address);
      expect(issue.reportedByName).to.equal("Citizen01");
    });

    it("Génère automatiquement un identifiant si aucun n'est fourni", async function () {
      await registry.connect(citizen2).reportIssue(
        "",
        "Pothole",
        "Rue Hassan II",
        "Nid-de-poule dangereux",
        3, // Critical
        "Citizen02"
      );

      const issue = await registry.getIssue(1);
      expect(issue.customId).to.equal("CITY-2026-1");
    });

    it("Rejette un signalement avec un identifiant personnalisé déjà existant", async function () {
      await registry.connect(citizen1).reportIssue(
        "CITY-2026-001",
        "StreetLight",
        "Rue A",
        "Description 1",
        1,
        "Citoyen 1"
      );

      await expect(
        registry.connect(citizen2).reportIssue(
          "CITY-2026-001",
          "WaterLeak",
          "Rue B",
          "Description 2",
          2,
          "Citoyen 2"
        )
      ).to.be.revertedWith("Identifiant de signalement deja existant");
    });

    it("Émet l'événement IssueReported lors de la création", async function () {
      await expect(
        registry.connect(citizen1).reportIssue(
          "CITY-2026-002",
          "WasteManagement",
          "Quartier Agdal",
          "Poubelle débordante",
          1,
          "Citoyen Vert"
        )
      ).to.emit(registry, "IssueReported");
    });
  });

  describe("Import par lot (Batch Import - Excel/CSV)", function () {
    it("Permet l'enregistrement de plusieurs signalements en une transaction", async function () {
      const inputs = [
        {
          customId: "CITY-2026-101",
          issueType: "StreetLight",
          location: "Place Pietri",
          description: "Ampoule cassée",
          priority: 1,
          reportedByName: "Citoyen A",
          assignedTeam: "",
          initialStatus: 0
        },
        {
          customId: "CITY-2026-102",
          issueType: "WaterLeak",
          location: "Bab Boujloud",
          description: "Tuyau percé sur la chaussée",
          priority: 3,
          reportedByName: "Citoyen B",
          assignedTeam: "WaterTeam",
          initialStatus: 1
        }
      ];

      await registry.batchReportIssues(inputs);

      expect(await registry.getIssuesCount()).to.equal(2);
      const issue1 = await registry.getIssueByCustomId("CITY-2026-101");
      const issue2 = await registry.getIssueByCustomId("CITY-2026-102");

      expect(issue1.issueType).to.equal("StreetLight");
      expect(issue2.status).to.equal(1); // Assigned
      expect(issue2.assignedTeam).to.equal("WaterTeam");
    });
  });

  describe("Gestion par la Municipalité (Affectation, Statuts & Traçabilité)", function () {
    beforeEach(async function () {
      await registry.connect(citizen1).reportIssue(
        "CITY-2026-001",
        "StreetLight",
        "Avenue Mohammed V",
        "Panne éclairage",
        2,
        "Citizen01"
      );
    });

    it("Permet à l'autorité municipale d'affecter une équipe", async function () {
      await registry.connect(owner).assignTeam(1, "UrbanTeam01", "Équipe envoyée en camion nacelle");
      const issue = await registry.getIssue(1);
      expect(issue.assignedTeam).to.equal("UrbanTeam01");
      expect(issue.status).to.equal(1); // Assigned
    });

    it("Permet de faire progresser le statut : InProgress -> Resolved -> Closed", async function () {
      await registry.connect(owner).assignTeam(1, "UrbanTeam01", "Affectation");
      
      // InProgress = 2
      await registry.connect(owner).updateStatus(1, 2, "Intervention en cours sur place");
      let issue = await registry.getIssue(1);
      expect(issue.status).to.equal(2);

      // Resolved = 3
      await registry.connect(owner).updateStatus(1, 3, "Ampoule LED remplacée et testée");
      issue = await registry.getIssue(1);
      expect(issue.status).to.equal(3);

      // Closed = 4
      await registry.connect(owner).updateStatus(1, 4, "Contrôle qualité validé par superviseur");
      issue = await registry.getIssue(1);
      expect(issue.status).to.equal(4);
    });

    it("Refuse les modifications par un citoyen non autorisé", async function () {
      await expect(
        registry.connect(citizen2).assignTeam(1, "FakeTeam", "Tentative non autorisée")
      ).to.be.revertedWith("UrbanIssueRegistry: Acces reserve aux autorites municipales");

      await expect(
        registry.connect(citizen2).updateStatus(1, 2, "Tentative pirate")
      ).to.be.revertedWith("UrbanIssueRegistry: Acces reserve aux autorites municipales");
    });

    it("Conserve l'historique complet et vérifiable des étapes (Traçabilité)", async function () {
      await registry.connect(owner).assignTeam(1, "UrbanTeam01", "Dépêchement d'équipe");
      await registry.connect(owner).updateStatus(1, 2, "Début des travaux");
      await registry.connect(owner).addInterventionLog(1, "Remplacement du câble souterrain");
      await registry.connect(owner).updateStatus(1, 3, "Travaux terminés avec succès");

      const history = await registry.getIssueHistory(1);
      // Étape 1 : Création
      // Étape 2 : Affectation
      // Étape 3 : InProgress
      // Étape 4 : Log commentaire
      // Étape 5 : Resolved
      expect(history.length).to.equal(5);

      expect(history[0].comment).to.include("Creation");
      expect(history[0].actor).to.equal(citizen1.address);

      expect(history[1].assignedTeam).to.equal("UrbanTeam01");
      expect(history[1].actor).to.equal(owner.address);

      expect(history[4].status).to.equal(3); // Resolved
      expect(history[4].comment).to.equal("Travaux terminés avec succès");
      expect(history[4].actor).to.equal(owner.address);
    });
  });

  describe("Gestion des Rôles Municipaux", function () {
    it("Permet à l'autorité municipale d'ajouter un administrateur délégué", async function () {
      await registry.connect(owner).setMunicipalAdmin(admin1.address, true);
      expect(await registry.municipalAdmins(admin1.address)).to.be.true;

      await registry.connect(citizen1).reportIssue(
        "CITY-2026-001",
        "StreetLight",
        "Avenue Mohammed V",
        "Panne",
        2,
        "Citizen01"
      );

      // admin1 peut maintenant mettre à jour le signalement
      await expect(
        registry.connect(admin1).assignTeam(1, "EquipeSecours", "Prise en charge par admin1")
      ).to.not.be.reverted;
    });

    it("Permet le transfert d'autorité municipale", async function () {
      await registry.connect(owner).transferMunicipalAuthority(admin1.address);
      expect(await registry.municipalAuthority()).to.equal(admin1.address);
    });
  });

  describe("Consultation Publique", function () {
    it("getAllIssues retourne l'ensemble des signalements", async function () {
      await registry.connect(citizen1).reportIssue("ID-1", "Type1", "Loc1", "Desc1", 1, "User1");
      await registry.connect(citizen2).reportIssue("ID-2", "Type2", "Loc2", "Desc2", 2, "User2");

      const all = await registry.getAllIssues();
      expect(all.length).to.equal(2);
      expect(all[0].customId).to.equal("ID-1");
      expect(all[1].customId).to.equal("ID-2");
    });
  });
});
