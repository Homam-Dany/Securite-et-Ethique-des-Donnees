const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Déploiement du Smart Contract UrbanIssueRegistry ===");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Déployeur (Autorité Municipale) :", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Solde du compte :", hre.ethers.formatEther(balance), "ETH");

  const UrbanIssueRegistry = await hre.ethers.getContractFactory("UrbanIssueRegistry");
  const registry = await UrbanIssueRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("-> UrbanIssueRegistry déployé à l'adresse :", contractAddress);

  // Initialisation avec des données de test réalistes
  console.log("Création de signalements de test initiaux...");
  
  const tx1 = await registry.reportIssue(
    "CITY-2026-001",
    "StreetLight",
    "Avenue Mohammed V, Rabat",
    "Lampadaire clignotant et éteint la nuit au niveau du croisement central.",
    2, // High
    "Citizen01"
  );
  await tx1.wait();

  const tx2 = await registry.reportIssue(
    "CITY-2026-002",
    "Pothole",
    "Boulevard Hassan II, Casablanca",
    "Nid-de-poule profond sur la chaussée droite causant des ralentissements.",
    3, // Critical
    "Citizen02"
  );
  await tx2.wait();

  // Affectation et avancement
  const txAssign = await registry.assignTeam(2, "UrbanTeam01", "Équipe d'intervention voirie mobilisée");
  await txAssign.wait();

  const txProgress = await registry.updateStatus(2, 2, "Travaux de rebouchage en cours de réalisation"); // InProgress = 2
  await txProgress.wait();

  const tx3 = await registry.reportIssue(
    "CITY-2026-003",
    "WasteManagement",
    "Rue Ibn Batouta, Fès",
    "Conteneur d'ordures ménagères endommagé et débordant.",
    1, // Medium
    "Citizen03"
  );
  await tx3.wait();

  console.log("Signalements initiaux créés avec succès !");

  // Exportation des artefacts vers le frontend
  const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("UrbanIssueRegistry");
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    municipalAuthority: deployer.address,
    abi: contractArtifact.abi,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "UrbanIssueRegistry.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../deployed-address.json"),
    JSON.stringify({ address: contractAddress, deployedAt: new Date().toISOString() }, null, 2)
  );

  console.log("Déploiement terminé et configuration sauvegardée dans frontend/src/contracts/UrbanIssueRegistry.json");
}

main().catch((error) => {
  console.error("Erreur lors du déploiement :", error);
  process.exitCode = 1;
});
