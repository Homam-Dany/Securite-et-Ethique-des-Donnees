import { ethers } from "ethers";
import contractDeployment from "../contracts/UrbanIssueRegistry.json";

const CONTRACT_ADDRESS = contractDeployment?.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = contractDeployment?.abi || [];

/**
 * Fournit une instance de provider (MetaMask ou RPC local de secours)
 */
export async function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback vers le noeud Hardhat local si MetaMask n'est pas installé
  return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
}

/**
 * Connexion du Wallet de l'utilisateur (MetaMask)
 */
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask n'est pas détecté. Veuillez installer l'extension MetaMask.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("Aucun compte sélectionné.");
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: network.chainId.toString()
  };
}

/**
 * Basculer vers le réseau local Hardhat ou Sepolia
 */
export async function switchNetwork(targetChainIdHex = "0x7a69") { // 0x7a69 = 31337 (Hardhat)
  if (typeof window === "undefined" || !window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainIdHex }],
    });
  } catch (switchError) {
    // Si la chaîne n'a pas encore été ajoutée dans MetaMask
    if (switchError.code === 4902 && targetChainIdHex === "0x7a69") {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69",
            chainName: "Hardhat Localhost",
            nativeCurrency: { name: "GO", symbol: "ETH", decimals: 18 },
            rpcUrls: ["http://127.0.0.1:8545"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Obtient une instance du contrat (en lecture ou écriture)
 */
export async function getContract(signerOrProvider) {
  let target = signerOrProvider;
  if (!target) {
    target = await getProvider();
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, target);
}

/**
 * Récupère tous les signalements stockés sur la blockchain
 */
export async function fetchAllIssues(signerOrProvider) {
  try {
    const contract = await getContract(signerOrProvider);
    const rawIssues = await contract.getAllIssues();
    
    return rawIssues.map((item) => ({
      id: Number(item.id),
      customId: item.customId,
      issueType: item.issueType,
      location: item.location,
      description: item.description,
      priority: Number(item.priority),
      status: Number(item.status),
      reportedByName: item.reportedByName,
      reporter: item.reporter,
      assignedTeam: item.assignedTeam,
      createdAt: Number(item.createdAt),
      updatedAt: Number(item.updatedAt),
      exists: item.exists
    })).reverse(); // Afficher les plus récents en premier
  } catch (error) {
    console.error("Erreur lors de la récupération des signalements:", error);
    return [];
  }
}

/**
 * Récupère l'historique de traçabilité complet d'un signalement
 */
export async function fetchIssueHistory(issueId, signerOrProvider) {
  try {
    const contract = await getContract(signerOrProvider);
    const history = await contract.getIssueHistory(issueId);
    
    return history.map((h) => ({
      timestamp: Number(h.timestamp),
      status: Number(h.status),
      assignedTeam: h.assignedTeam,
      comment: h.comment,
      actor: h.actor
    }));
  } catch (error) {
    console.error(`Erreur historique signalement ${issueId}:`, error);
    return [];
  }
}

/**
 * Vérifie si une adresse est l'autorité municipale ou un admin municipal
 */
export async function checkMunicipalityRole(userAddress, signerOrProvider) {
  if (!userAddress) return false;
  try {
    const contract = await getContract(signerOrProvider);
    const authority = await contract.municipalAuthority();
    if (authority.toLowerCase() === userAddress.toLowerCase()) return true;
    const isAdmin = await contract.municipalAdmins(userAddress);
    return isAdmin;
  } catch (error) {
    console.warn("Impossible de vérifier les privilèges municipaux:", error);
    return false;
  }
}
