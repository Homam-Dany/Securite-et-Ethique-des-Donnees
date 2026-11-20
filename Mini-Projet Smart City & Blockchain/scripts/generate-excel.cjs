const XLSX = require("xlsx");
const path = require("path");

const issuesData = [
  {
    issueId: "CITY-2026-004",
    issueType: "StreetLight",
    location: "Avenue Mohammed V, Rabat",
    description: "Lampadaire clignotant et éteint la nuit au carrefour",
    reportDate: "2026-11-19",
    priority: "High",
    reportedBy: "Citizen04",
    assignedTo: "UrbanTeam01",
    status: "Reported"
  },
  {
    issueId: "CITY-2026-005",
    issueType: "WaterLeak",
    location: "Boulevard Zerktouni, Casablanca",
    description: "Fuite d'eau importante sur la voie publique près de la station",
    reportDate: "2026-11-20",
    priority: "Critical",
    reportedBy: "Citizen05",
    assignedTo: "LydecRapidTeam",
    status: "Reported"
  },
  {
    issueId: "CITY-2026-006",
    issueType: "TrafficLight",
    location: "Carrefour Allal Ben Abdellah, Rabat",
    description: "Feux tricolores en panne causant un blocage de circulation",
    reportDate: "2026-11-20",
    priority: "High",
    reportedBy: "Citizen06",
    assignedTo: "TrafficControl02",
    status: "Reported"
  },
  {
    issueId: "CITY-2026-007",
    issueType: "Pothole",
    location: "Route de Targa, Marrakech",
    description: "Nid-de-poule dangereux à proximité d'une école primaire",
    reportDate: "2026-11-18",
    priority: "Medium",
    reportedBy: "Citizen07",
    assignedTo: "MarrakechVoirie",
    status: "Reported"
  },
  {
    issueId: "CITY-2026-008",
    issueType: "WasteManagement",
    location: "Quartier Malabata, Tanger",
    description: "Dépôt sauvage de gravats et déchets sur le trottoir",
    reportDate: "2026-11-19",
    priority: "Low",
    reportedBy: "Citizen08",
    assignedTo: "CleanCityTanger",
    status: "Reported"
  },
  {
    issueId: "CITY-2026-009",
    issueType: "PublicGreenery",
    location: "Jardin Murdoch, Casablanca",
    description: "Arbre fragilisé menaçant de s'abattre sur les passants",
    reportDate: "2026-11-20",
    priority: "High",
    reportedBy: "Citizen09",
    assignedTo: "EspacesVerts01",
    status: "Reported"
  }
];

const worksheet = XLSX.utils.json_to_sheet(issuesData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "UrbanIssues");

const outputPath = path.join(__dirname, "../urban_issues.xlsx");
XLSX.writeFile(workbook, outputPath);
console.log(`Fichier Excel régénéré avec succès : ${outputPath}`);
