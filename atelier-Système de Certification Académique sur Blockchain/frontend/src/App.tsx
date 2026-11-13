import { useState, useEffect, useCallback } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  type PublicClient,
  type WalletClient,
  type GetContractReturnType,
  type Address,
} from "viem";
import { hardhat } from "viem/chains";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { CERTIFICATE_NFT_ABI } from "./contracts/CertificateNFTABI";
import { DEFAULT_CONTRACT_ADDRESS } from "./contracts/config";
import "./index.css";

/* ---------------- Interfaces ---------------- */

interface Certificate {
  studentName: string;
  studentId: string;
  diplomaTitle: string;
  issueDate: string;
  grade: string;
  recipient: Address;
  revoked: boolean;
}

interface CertWithId extends Certificate {
  certId: bigint;
  tokenURI?: string;
  qrCodeUrl?: string;
}

interface StudentRow {
  studentName: string;
  studentId: string;
  diplomaTitle: string;
  issueDate: string;
  grade: string;
  recipientAddress: string;
  tokenURI?: string;
}

type TabType = "verify" | "mint" | "batch" | "registry";

function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function parseBlockchainError(err: any): string {
  const msg = err?.shortMessage || err?.message || String(err);
  if (msg.includes("AccessControlUnauthorizedAccount")) {
    return "Action refusée par le contrôle d'accès : votre compte ne dispose pas du rôle requis (MINTER_ROLE ou DEFAULT_ADMIN_ROLE).";
  }
  if (msg.includes("returned no data") || msg.includes('("0x")')) {
    return "Le smart contract n'est pas déployé à cette adresse sur le réseau actif dans MetaMask. Assurez-vous d'avoir exécuté 'npx hardhat run --network localhost scripts/deploy.ts'.";
  }
  if (msg.includes("academic certificates are soulbound and non-transferable")) {
    return "Sécurité Soulbound : les certificats académiques sont strictement nominatifs et ne peuvent pas être transférés.";
  }
  return msg;
}

export default function App() {
  /* Wallet & Blockchain State */
  const [account, setAccount] = useState<Address | null>(null);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [contract, setContract] = useState<GetContractReturnType | null>(null);
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);

  /* Governance & Roles (AccessControl ERC-721) */
  const [hasAdminRole, setHasAdminRole] = useState<boolean>(false);
  const [hasMinterRole, setHasMinterRole] = useState<boolean>(false);
  const [totalCertificates, setTotalCertificates] = useState<bigint>(0n);

  /* Navigation & Feedback State */
  const [activeTab, setActiveTab] = useState<TabType>("verify");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
    txHash?: string;
  } | null>(null);

  /* Formulaire Émission Unitaire */
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [diplomaTitle, setDiplomaTitle] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [grade, setGrade] = useState("Mention Très Bien");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [customUri, setCustomUri] = useState("");

  /* Import Batch */
  const [batchRows, setBatchRows] = useState<StudentRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState("");

  /* Zone Vérification Publique */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CertWithId | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showMetadataRaw, setShowMetadataRaw] = useState(false);

  /* Registre Global */
  const [registryRecords, setRegistryRecords] = useState<CertWithId[]>([]);

  /* Initialisation du provider wallet */
  const connectWallet = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setNotification({
        type: "error",
        message: "Portefeuille Ethereum non détecté. Veuillez installer MetaMask pour interagir avec le registre.",
      });
      return;
    }

    try {
      const accounts: Address[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const wc = createWalletClient({
        account: accounts[0],
        chain: hardhat,
        transport: custom(ethereum),
      });

      const pc = createPublicClient({
        chain: hardhat,
        transport: custom(ethereum),
      });

      setAccount(accounts[0]);
      setWalletClient(wc);
      setPublicClient(pc);

      setNotification({
        type: "success",
        message: `Session initialisée avec le compte ${formatAddress(accounts[0])}`,
      });
    } catch {
      setNotification({
        type: "error",
        message: "La connexion au portefeuille a été annulée par l'opérateur.",
      });
    }
  }, []);

  /* Instanciation du contrat */
  useEffect(() => {
    if (!publicClient || !walletClient) return;

    try {
      const instance = getContract({
        address: contractAddress as Address,
        abi: CERTIFICATE_NFT_ABI,
        client: { public: publicClient, wallet: walletClient },
      });
      setContract(instance);
    } catch (err: any) {
      console.error("Erreur d'instanciation du contrat:", err);
    }
  }, [publicClient, walletClient, contractAddress]);

  /* Synchronisation de l'état du contrat et des rôles AccessControl */
  const refreshContractState = useCallback(async () => {
    if (!contract) return;
    try {
      // Lecture du total de certificats
      let count = 0n;
      try {
        count = await (contract as any).read.getTotalCertificates();
      } catch {
        count = await (contract as any).read.getCertificateCount();
      }
      setTotalCertificates(count);

      // Vérification des rôles AccessControl
      if (account) {
        try {
          const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
          const isAdmin = await (contract as any).read.hasRole([DEFAULT_ADMIN_ROLE, account]);
          setHasAdminRole(isAdmin);

          const MINTER_ROLE = await (contract as any).read.MINTER_ROLE();
          const isMinter = await (contract as any).read.hasRole([MINTER_ROLE, account]);
          setHasMinterRole(isMinter);
        } catch {
          // Mode compatibilité Devoir 1
          const ownerAddr: string = await (contract as any).read.owner();
          const isOwn = ownerAddr.toLowerCase() === account.toLowerCase();
          setHasAdminRole(isOwn);
          setHasMinterRole(isOwn);
        }
      }
    } catch (err) {
      console.warn("Synchronisation du registre:", err);
    }
  }, [contract, account]);

  useEffect(() => {
    refreshContractState();
  }, [refreshContractState]);

  /* Émission d'un certificat ERC-721 unitaire */
  const handleSingleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !publicClient) return;

    if (!studentName.trim() || !studentId.trim() || !diplomaTitle.trim()) {
      setNotification({
        type: "error",
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      // Vérification d'unicité préalable
      const isRegistered = await (contract as any).read.isStudentRegistered([studentId.trim()]);
      if (isRegistered) {
        setNotification({
          type: "error",
          message: `L'identifiant étudiant (CNE) "${studentId}" possède déjà une certification on-chain.`,
        });
        setIsLoading(false);
        return;
      }

      const targetAddress = (recipientAddress.trim() || "0x0000000000000000000000000000000000000000") as Address;

      // Appel de mintCertificate ERC-721 avec support URI
      const hash = await (contract as any).write.mintCertificate([
        targetAddress,
        studentName.trim(),
        studentId.trim(),
        diplomaTitle.trim(),
        issueDate,
        grade,
        customUri.trim(),
      ]);

      await publicClient.waitForTransactionReceipt({ hash });
      await refreshContractState();

      setNotification({
        type: "success",
        message: `Certificat NFT ERC-721 émis avec succès pour ${studentName}.`,
        txHash: hash,
      });

      // Réinitialisation du formulaire
      setStudentName("");
      setStudentId("");
      setDiplomaTitle("");
      setRecipientAddress("");
      setCustomUri("");
    } catch (err: any) {
      setNotification({
        type: "error",
        message: parseBlockchainError(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* Gestion de l'import Excel / CSV */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let workbook: XLSX.WorkBook;
        if (file.name.toLowerCase().endsWith(".csv")) {
          const text = typeof data === "string" ? data : new TextDecoder("utf-8").decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: "string", raw: true });
        } else {
          workbook = XLSX.read(data, { type: "binary" });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<StudentRow>(sheet);

        if (!rows || rows.length === 0) {
          setNotification({
            type: "error",
            message: "Le fichier importé ne contient aucun enregistrement valide.",
          });
          return;
        }

        setBatchRows(rows);
        setSelectedIndices(rows.map((_, idx) => idx));
        setNotification({
          type: "info",
          message: `${rows.length} étudiants chargés depuis "${file.name}".`,
        });
      } catch (error) {
        setNotification({
          type: "error",
          message: "Erreur lors du traitement du fichier. Veuillez vérifier la structure du tableau.",
        });
      }
    };

    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file, "utf-8");
    } else {
      reader.readAsBinaryString(file);
    }
  };

  /* Émission groupée ERC-721 */
  const handleBatchMint = async () => {
    if (!contract || !publicClient || selectedIndices.length === 0) return;

    setIsLoading(true);
    setNotification(null);

    try {
      const recordsToMint = selectedIndices.map((i) => batchRows[i]);

      // Vérification préalable des doublons de CNE dans le registre
      for (const record of recordsToMint) {
        try {
          const isRegistered = await (contract as any).read.isStudentRegistered([record.studentId.trim()]);
          if (isRegistered) {
            setNotification({
              type: "error",
              message: `L'étudiant "${record.studentName}" (CNE: ${record.studentId}) est déjà enregistré sur la blockchain. Veuillez décocher sa ligne pour continuer le batch.`,
            });
            setIsLoading(false);
            return;
          }
        } catch {
          // Si la méthode n'est pas accessible, on continue
        }
      }

      const recipients = recordsToMint.map(
        (r) => (r.recipientAddress?.trim() || "0x0000000000000000000000000000000000000000") as Address
      );
      const names = recordsToMint.map((r) => r.studentName.trim());
      const ids = recordsToMint.map((r) => r.studentId.trim());
      const titles = recordsToMint.map((r) => r.diplomaTitle.trim());
      const dates = recordsToMint.map((r) => r.issueDate);
      const grades = recordsToMint.map((r) => r.grade || "Mention Très Bien");
      const uris = recordsToMint.map((r) => r.tokenURI || "");

      let hash: Address;
      if (typeof (contract as any).write.batchMintCertificates === "function") {
        hash = await (contract as any).write.batchMintCertificates([
          recipients,
          names,
          ids,
          titles,
          dates,
          grades,
          uris,
        ]);
      } else {
        hash = await (contract as any).write.batchMint([
          recipients,
          names,
          ids,
          titles,
          dates,
          grades,
        ]);
      }

      await publicClient.waitForTransactionReceipt({ hash });
      await refreshContractState();

      setNotification({
        type: "success",
        message: `${recordsToMint.length} diplômes NFT ERC-721 enregistrés avec succès on-chain.`,
        txHash: hash,
      });

      setBatchRows([]);
      setSelectedIndices([]);
      setUploadedFileName("");
    } catch (err: any) {
      setNotification({
        type: "error",
        message: parseBlockchainError(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* Vérification d'un certificat avec QR Code et TokenURI */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setNotification(null);
    setSearchResult(null);
    setHasSearched(true);
    setShowMetadataRaw(false);

    try {
      const eth = (window as any).ethereum;
      const pc =
        publicClient ||
        createPublicClient({
          chain: hardhat,
          transport: eth ? custom(eth) : custom(eth),
        });

      const tempContract =
        contract ||
        getContract({
          address: contractAddress as Address,
          abi: CERTIFICATE_NFT_ABI,
          client: { public: pc },
        });

      let targetId: bigint | null = null;
      const parsedId = Number(searchQuery.trim());

      if (!isNaN(parsedId) && parsedId > 0) {
        targetId = BigInt(parsedId);
      } else {
        let idFromCne: bigint = 0n;
        try {
          idFromCne = await (tempContract as any).read.studentIdToTokenId([searchQuery.trim()]);
        } catch {
          idFromCne = await (tempContract as any).read.studentIdToCertId([searchQuery.trim()]);
        }
        if (idFromCne && idFromCne > 0n) {
          targetId = idFromCne;
        }
      }

      if (!targetId || targetId === 0n) {
        setSearchResult(null);
        setNotification({
          type: "error",
          message: "Aucun diplôme correspondant à cet identifiant n'a été trouvé dans le registre.",
        });
        setIsLoading(false);
        return;
      }

      const cert: Certificate = await (tempContract as any).read.getCertificate([targetId]);

      // Récupération du tokenURI ERC-721
      let uri = "";
      try {
        uri = await (tempContract as any).read.tokenURI([targetId]);
      } catch {
        uri = "";
      }

      // Génération du QR Code de vérification
      const verifyUrl = `${window.location.origin}/?verify=${targetId.toString()}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: "#78350f",
          light: "#fffdf7",
        },
      });

      setSearchResult({
        ...cert,
        certId: targetId,
        tokenURI: uri,
        qrCodeUrl: qrDataUrl,
      });
    } catch (err: any) {
      setSearchResult(null);
      setNotification({
        type: "error",
        message: parseBlockchainError(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* Chargement complet du registre */
  const loadRegistry = useCallback(async () => {
    if (!contract) return;
    setIsLoading(true);

    try {
      let count: bigint = 0n;
      try {
        count = await (contract as any).read.getTotalCertificates();
      } catch {
        count = await (contract as any).read.getCertificateCount();
      }
      setTotalCertificates(count);

      const items: CertWithId[] = [];
      for (let i = 1n; i <= count; i++) {
        try {
          const c: Certificate = await (contract as any).read.getCertificate([i]);
          let uri = "";
          try {
            uri = await (contract as any).read.tokenURI([i]);
          } catch {
            uri = "";
          }
          items.push({ ...c, certId: i, tokenURI: uri });
        } catch {
          // Token inexistant ou brûlé
        }
      }

      setRegistryRecords(items);
    } catch (err: any) {
      console.error("Erreur lors du chargement du registre:", err);
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  /* Révocation administrative d'un certificat */
  const handleRevokeCertificate = async (id: bigint) => {
    if (!contract || !publicClient) return;

    if (!window.confirm(`Confirmez-vous la révocation du diplôme #${id} ? Cette action sera gravée sur la blockchain.`)) {
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      let hash: Address;
      try {
        hash = await (contract as any).write.revokeCertificate([id]);
      } catch {
        hash = await (contract as any).write.revoke([id]);
      }

      await publicClient.waitForTransactionReceipt({ hash });

      setNotification({
        type: "success",
        message: `Le diplôme #${id} a été officiellement révoqué.`,
        txHash: hash,
      });

      await loadRegistry();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: parseBlockchainError(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "registry" && contract) {
      loadRegistry();
    }
  }, [activeTab, contract, loadRegistry]);

  const toggleSelectRow = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === batchRows.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(batchRows.map((_, idx) => idx));
    }
  };

  return (
    <div className="app-layout">
      {/* En-tête Institutionnel */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div className="header-text">
            <h1>Registre des Certifications Académiques (ERC-721 Soulbound)</h1>
            <p>Université Abdelmalek Essaâdi — Faculté des Sciences et Techniques de Tanger</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="stat-badge" title="Smart Contract déployé">
            <span className="dot"></span>
            <span>NFT Registry :</span>
            <span className="addr-text">{formatAddress(contractAddress)}</span>
            <span>({totalCertificates.toString()} délivrés)</span>
          </div>

          {account ? (
            <button className="wallet-btn wallet-btn--active" onClick={connectWallet} title="Portefeuille connecté">
              <span className="indicator"></span>
              <span className="mono">{formatAddress(account)}</span>
              {hasMinterRole && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--blue-600)" }}>[Minter]</span>}
              {hasAdminRole && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--amber-800)" }}>[Admin]</span>}
            </button>
          ) : (
            <button className="wallet-btn wallet-btn--connect" onClick={connectWallet}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Connexion Portefeuille</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifications */}
      {notification && (
        <div className={`alert alert--${notification.type}`}>
          <div className="alert-icon">
            {notification.type === "success" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === "error" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.type === "info" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <div>{notification.message}</div>
            {notification.txHash && (
              <div style={{ fontSize: "0.78rem", marginTop: "4px", fontFamily: "monospace" }}>
                Preuve cryptographique de la transaction : {notification.txHash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onglets */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === "verify" ? "nav-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("verify");
            setNotification(null);
          }}
        >
          Vérification Publique
        </button>

        <button
          className={`nav-tab ${activeTab === "mint" ? "nav-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("mint");
            setNotification(null);
          }}
        >
          Émission Unitaire (ERC-721)
        </button>

        <button
          className={`nav-tab ${activeTab === "batch" ? "nav-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("batch");
            setNotification(null);
          }}
        >
          Importation par Lot (Excel)
        </button>

        <button
          className={`nav-tab ${activeTab === "registry" ? "nav-tab--active" : ""}`}
          onClick={() => {
            setActiveTab("registry");
            setNotification(null);
          }}
        >
          Registre des Diplômes
        </button>
      </nav>

      {/* ONGLET 1: VÉRIFICATION PUBLIQUE */}
      {activeTab === "verify" && (
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-icon card-icon--blue">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Authentification d'un Diplôme ou Titre Académique</h2>
                <p className="card-subtitle">
                  Vérifiez l'authenticité d'un diplôme NFT via son Token ID ou le CNE de l'étudiant.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="field" style={{ flex: 1, minWidth: "260px" }}>
                  <label className="field-label">Token ID (#ID) ou CNE Étudiant</label>
                  <input
                    className="input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Exemple : 1 ou 2023-INF-001"
                    required
                  />
                </div>
                <button className="btn btn--primary" type="submit" disabled={isLoading || !searchQuery.trim()}>
                  {isLoading ? "Vérification en cours..." : "Rechercher et Authentifier"}
                </button>
              </div>
            </form>
          </div>

          {/* Rendu du diplôme officiel */}
          {searchResult && (
            <div className="diploma">
              <div className="diploma-status">
                <span className={`status ${searchResult.revoked ? "status--revoked" : "status--valid"}`}>
                  <span className="status-dot"></span>
                  {searchResult.revoked ? "Diplôme Révoqué" : "Certificat Authentique & Valide (ERC-721)"}
                </span>
              </div>

              <div className="diploma-institution">Université Abdelmalek Essaâdi</div>
              <div className="diploma-faculty">Faculté des Sciences et Techniques de Tanger</div>
              <div className="diploma-tagline">Royaume du Maroc — Registre Décentralisé</div>

              <div className="diploma-ornament"></div>

              <div className="diploma-label">Vu les procès-verbaux des délibérations, le présent diplôme est conféré à</div>
              <div className="diploma-name">{searchResult.studentName}</div>
              <div className="diploma-id">Code National de l'Étudiant (CNE) : {searchResult.studentId}</div>

              <div className="diploma-completion">au titre de la réussite aux épreuves du programme de</div>
              <div className="diploma-title">{searchResult.diplomaTitle}</div>

              {searchResult.grade && <div className="diploma-grade">{searchResult.grade}</div>}

              {/* Métadonnées ERC-721 */}
              {searchResult.tokenURI && (
                <div style={{ marginTop: "20px", fontSize: "0.78rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowMetadataRaw(!showMetadataRaw)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--blue-600)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "inherit",
                    }}
                  >
                    {showMetadataRaw ? "Masquer les métadonnées ERC-721" : "Afficher les métadonnées TokenURI (JSON On-Chain)"}
                  </button>
                  {showMetadataRaw && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        background: "#f1f5f9",
                        borderRadius: "8px",
                        textAlign: "left",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    >
                      {searchResult.tokenURI}
                    </div>
                  )}
                </div>
              )}

              <div className="diploma-footer">
                <div className="diploma-meta">
                  <div>Date de délivrance : {searchResult.issueDate}</div>
                  <div>Token ID : #{searchResult.certId.toString()} (ERC-721 Soulbound)</div>
                  <div>Titulaire : {searchResult.recipient !== "0x0000000000000000000000000000000000000000" ? formatAddress(searchResult.recipient) : "Non assigné"}</div>
                  <div>Contrat : {formatAddress(contractAddress)}</div>
                </div>

                {/* QR Code de vérification publique */}
                {searchResult.qrCodeUrl && (
                  <div style={{ textAlign: "center" }} title="Scannez pour vérifier en ligne">
                    <img
                      src={searchResult.qrCodeUrl}
                      alt="QR Code de Vérification"
                      style={{ width: "90px", height: "90px", borderRadius: "6px", border: "1px solid #d6d3d1" }}
                    />
                    <div style={{ fontSize: "0.65rem", color: "var(--slate-500)", marginTop: "2px" }}>
                      Vérification QR
                    </div>
                  </div>
                )}

                <div className="diploma-seal">
                  <svg className="diploma-seal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>SCEAU</span>
                  <span>OFFICIEL</span>
                </div>
              </div>
            </div>
          )}

          {hasSearched && !searchResult && !isLoading && (
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Aucun diplôme correspondant n'a été répertorié dans ce registre blockchain.</p>
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2: ÉMISSION UNITAIRE ERC-721 */}
      {activeTab === "mint" && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon card-icon--emerald">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="card-title">Émission d'un Diplôme NFT (ERC-721)</h2>
              <p className="card-subtitle">
                Délivrez un jeton non transférable (Soulbound) certifiant la réussite de l'étudiant.
              </p>
            </div>
          </div>

          {account && !hasMinterRole && (
            <div className="alert alert--error" style={{ marginBottom: "20px" }}>
              <div className="alert-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <strong>Accès Restreint :</strong> Le compte connecté ({formatAddress(account)}) ne dispose pas du rôle <code>MINTER_ROLE</code>. Seuls les comptes autorisés peuvent émettre de nouveaux diplômes.
              </div>
            </div>
          )}

          <form onSubmit={handleSingleMint}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label">
                  Nom et Prénom de l'Étudiant <span className="required">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ex : Homam Dany"
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">
                  Code National de l'Étudiant (CNE / ID) <span className="required">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Ex : 2023-INF-001"
                  required
                />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label className="field-label">
                  Intitulé Officiel du Diplôme <span className="required">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  value={diplomaTitle}
                  onChange={(e) => setDiplomaTitle(e.target.value)}
                  placeholder="Ex : Master Cybersécurité et Sécurité des Systèmes d'Information"
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">Date de Délivrance</label>
                <input
                  className="input"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">Mention Obtenue</label>
                <select
                  className="input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option value="Mention Très Bien">Mention Très Bien</option>
                  <option value="Mention Bien">Mention Bien</option>
                  <option value="Mention Assez Bien">Mention Assez Bien</option>
                  <option value="Passable">Passable</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Adresse Ethereum du Destinataire (Optionnel)</label>
                <input
                  className="input"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x... (laisser vide si non assigné)"
                />
              </div>

              <div className="field">
                <label className="field-label">URI Personnalisé / IPFS (Optionnel)</label>
                <input
                  className="input"
                  type="text"
                  value={customUri}
                  onChange={(e) => setCustomUri(e.target.value)}
                  placeholder="ipfs://... (laisser vide pour JSON on-chain automatique)"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading || !account || (account ? !hasMinterRole : false)}
              >
                {isLoading ? "Émission NFT en cours..." : "Certifier et Émettre le NFT ERC-721"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ONGLET 3: IMPORTATION BATCH (EXCEL / CSV) */}
      {activeTab === "batch" && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon card-icon--amber">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="card-title">Traitement et Émission Groupée (Batch ERC-721)</h2>
              <p className="card-subtitle">
                Importez votre promotion d'étudiants (.xlsx, .csv) pour forger l'ensemble des NFTs en une transaction.
              </p>
            </div>
          </div>

          <div
            className={`upload-zone ${uploadedFileName ? "upload-zone--loaded" : ""}`}
            onClick={() => document.getElementById("file-upload-input")?.click()}
          >
            <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="upload-label">
              {uploadedFileName
                ? `Fichier sélectionné : ${uploadedFileName} (${batchRows.length} étudiants)`
                : "Cliquez pour téléverser votre fichier d'étudiants (.xlsx, .csv)"}
            </div>
            <div className="upload-hint">
              Colonnes requises : studentName, studentId, diplomaTitle, issueDate, grade, recipientAddress
            </div>
            <input
              id="file-upload-input"
              type="file"
              accept=".xlsx,.csv,.xls"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </div>

          {batchRows.length > 0 && (
            <div>
              <div className="flex-between mb-4">
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--slate-700)" }}>
                  {selectedIndices.length} sur {batchRows.length} étudiants sélectionnés
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn--secondary btn--sm" onClick={toggleSelectAll}>
                    {selectedIndices.length === batchRows.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isLoading || !account || selectedIndices.length === 0 || !hasMinterRole}
                    onClick={handleBatchMint}
                  >
                    {isLoading ? "Émission On-Chain..." : `Émettre ${selectedIndices.length} Diplômes NFT`}
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>Sélection</th>
                      <th>#</th>
                      <th>Nom & Prénom</th>
                      <th>CNE</th>
                      <th>Diplôme</th>
                      <th>Date</th>
                      <th>Mention</th>
                      <th>Adresse Destinataire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIndices.includes(idx)}
                            onChange={() => toggleSelectRow(idx)}
                          />
                        </td>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.studentName}</td>
                        <td className="mono">{row.studentId}</td>
                        <td>{row.diplomaTitle}</td>
                        <td>{row.issueDate}</td>
                        <td>{row.grade}</td>
                        <td className="mono">{formatAddress(row.recipientAddress)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ONGLET 4: REGISTRE GLOBAL */}
      {activeTab === "registry" && (
        <div className="card">
          <div className="flex-between mb-4">
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div className="card-icon card-icon--blue">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Registre Consolidé des Diplômes NFT ({totalCertificates.toString()})</h2>
                <p className="card-subtitle">Historique des tokens ERC-721 enregistrés sur le smart contract.</p>
              </div>
            </div>

            <button className="btn btn--secondary btn--sm" onClick={loadRegistry} disabled={isLoading}>
              Actualiser le Registre
            </button>
          </div>

          {registryRecords.length === 0 ? (
            <div className="empty-state">
              <p>Aucun diplôme NFT n'est consigné pour le moment dans ce registre.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token ID</th>
                    <th>Titulaire</th>
                    <th>CNE</th>
                    <th>Diplôme Obtenu</th>
                    <th>Date</th>
                    <th>Mention</th>
                    <th>Statut</th>
                    {hasAdminRole && <th>Administration</th>}
                  </tr>
                </thead>
                <tbody>
                  {registryRecords.map((item) => (
                    <tr key={item.certId.toString()}>
                      <td className="mono">#{item.certId.toString()}</td>
                      <td style={{ fontWeight: 600 }}>{item.studentName}</td>
                      <td className="mono">{item.studentId}</td>
                      <td>{item.diplomaTitle}</td>
                      <td>{item.issueDate}</td>
                      <td>{item.grade}</td>
                      <td>
                        <span className={`status ${item.revoked ? "status--revoked" : "status--valid"}`}>
                          <span className="status-dot"></span>
                          {item.revoked ? "Révoqué" : "Actif"}
                        </span>
                      </td>
                      {hasAdminRole && (
                        <td>
                          {!item.revoked ? (
                            <button
                              className="btn btn--danger btn--sm"
                              disabled={isLoading}
                              onClick={() => handleRevokeCertificate(item.certId)}
                            >
                              Révoquer
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "var(--slate-400)" }}>Révocation actée</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
