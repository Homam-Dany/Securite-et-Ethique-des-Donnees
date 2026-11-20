import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import IssueList from './components/IssueList';
import AdminDashboard from './components/AdminDashboard';
import CreateIssueModal from './components/CreateIssueModal';
import IssueDetailModal from './components/IssueDetailModal';
import ExcelImportModal from './components/ExcelImportModal';
import { 
  connectWallet, 
  getProvider, 
  getContract, 
  fetchAllIssues, 
  checkMunicipalityRole 
} from './utils/ethereum';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isMunicipalAdmin, setIsMunicipalAdmin] = useState(false);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'admin'

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadBlockchainData = useCallback(async (currentSignerOrProvider) => {
    setLoading(true);
    try {
      const activeProvider = currentSignerOrProvider || await getProvider();
      const loadedIssues = await fetchAllIssues(activeProvider);
      setIssues(loadedIssues);

      if (selectedIssue) {
        const updated = loadedIssues.find(i => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      showToast('error', 'Erreur de connexion au nœud blockchain.');
    } finally {
      setLoading(false);
    }
  }, [selectedIssue]);

  useEffect(() => {
    const init = async () => {
      try {
        const prov = await getProvider();
        setProvider(prov);
        await loadBlockchainData(prov);

        if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            handleWalletConnection();
          }

          window.ethereum.on('accountsChanged', (accs) => {
            if (accs.length === 0) {
              setAccount('');
              setSigner(null);
              setIsMunicipalAdmin(false);
            } else {
              handleWalletConnection();
            }
          });

          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        }
      } catch (err) {
        console.warn('Initialisation provider:', err);
      }
    };

    init();
  }, []);

  const handleWalletConnection = async () => {
    try {
      const conn = await connectWallet();
      setAccount(conn.address);
      setSigner(conn.signer);
      setProvider(conn.provider);

      const isAdmin = await checkMunicipalityRole(conn.address, conn.signer);
      setIsMunicipalAdmin(isAdmin);

      showToast('success', 'Portefeuille connecté');
      await loadBlockchainData(conn.signer);
    } catch (err) {
      console.error(err);
      showToast('error', err?.message || 'Échec de connexion au portefeuille.');
    }
  };

  const handleDisconnect = () => {
    setAccount('');
    setSigner(null);
    setIsMunicipalAdmin(false);
    showToast('info', 'Portefeuille déconnecté');
  };

  const handleCreateIssue = async (formData) => {
    if (!signer) {
      showToast('error', 'Veuillez connecter votre portefeuille MetaMask.');
      throw new Error('Wallet non connecté');
    }

    setActionLoading(true);
    try {
      const contract = await getContract(signer);
      const tx = await contract.reportIssue(
        formData.customId || '',
        formData.issueType,
        formData.location,
        formData.description,
        formData.priority,
        formData.reportedByName || 'Citoyen'
      );

      showToast('info', 'Transaction en cours de validation...');
      await tx.wait();
      showToast('success', 'Signalement enregistré sur la blockchain.');
      await loadBlockchainData(signer);
    } catch (err) {
      console.error(err);
      showToast('error', err?.reason || err?.message || 'Erreur lors du signalement.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchImport = async (validatedItems) => {
    if (!signer) {
      showToast('error', 'Veuillez connecter votre portefeuille.');
      throw new Error('Wallet non connecté');
    }

    setActionLoading(true);
    try {
      const contract = await getContract(signer);

      const formattedInputs = validatedItems.map(item => ({
        customId: item.customId || '',
        issueType: item.issueType,
        location: item.location,
        description: item.description,
        priority: item.priority,
        reportedByName: item.reportedByName,
        assignedTeam: item.assignedTeam || '',
        initialStatus: item.initialStatus || 0
      }));

      const tx = await contract.batchReportIssues(formattedInputs);
      showToast('info', `Importation de ${formattedInputs.length} signalements...`);
      await tx.wait();
      showToast('success', `${formattedInputs.length} signalements enregistrés.`);
      await loadBlockchainData(signer);
    } catch (err) {
      console.error(err);
      showToast('error', err?.reason || err?.message || 'Erreur lors de l\'import.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTeam = async (issueId, team, comment) => {
    if (!signer) {
      showToast('error', 'Connexion requise.');
      return;
    }
    setActionLoading(true);
    try {
      const contract = await getContract(signer);
      const tx = await contract.assignTeam(issueId, team, comment);
      showToast('info', 'Affectation en cours...');
      await tx.wait();
      showToast('success', `Équipe ${team} affectée.`);
      await loadBlockchainData(signer);
    } catch (err) {
      console.error(err);
      showToast('error', err?.reason || err?.message || 'Erreur lors de l\'affectation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus, comment) => {
    if (!signer) {
      showToast('error', 'Connexion requise.');
      return;
    }
    setActionLoading(true);
    try {
      const contract = await getContract(signer);
      const tx = await contract.updateStatus(issueId, newStatus, comment);
      showToast('info', 'Mise à jour en cours...');
      await tx.wait();
      showToast('success', 'Statut mis à jour sur la blockchain.');
      await loadBlockchainData(signer);
    } catch (err) {
      console.error(err);
      showToast('error', err?.reason || err?.message || 'Erreur lors du changement de statut.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg shadow-lg border border-gray-200 bg-white text-xs font-medium text-gray-800">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        account={account}
        isMunicipalAdmin={isMunicipalAdmin}
        onConnect={handleWalletConnection}
        onDisconnect={handleDisconnect}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onRefresh={() => loadBlockchainData(signer || provider)}
        loading={loading || actionLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Simple Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {activeTab === 'explore' ? 'Registre des Signalements Urbains' : 'Gestion Municipale & Interventions'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Traçabilité et cycle de vie des interventions urbaines certifiées sur Ethereum.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-600 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Hardhat Local (EVM)</span>
            </span>
          </div>
        </div>

        {/* Global Key Metrics Overview */}
        <StatsOverview issues={issues} />

        {/* Views */}
        {activeTab === 'explore' ? (
          <IssueList
            issues={issues}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onManageIssue={(issue) => setSelectedIssue(issue)}
            isMunicipalAdmin={isMunicipalAdmin}
          />
        ) : (
          <AdminDashboard
            issues={issues}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onQuickAssign={handleAssignTeam}
            onQuickStatusChange={handleUpdateStatus}
            account={account}
          />
        )}

      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-gray-200 bg-white py-5 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart City & Blockchain — Registre Décentralisé</span>
          <span>Solidity ^0.8.20 • Ethers.js v6 • React</span>
        </div>
      </footer>

      {/* Modals */}
      <CreateIssueModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateIssue}
        submitting={actionLoading}
      />

      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onBatchImport={handleBatchImport}
        importing={actionLoading}
      />

      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        isMunicipalAdmin={isMunicipalAdmin}
        onAssignTeam={handleAssignTeam}
        onUpdateStatus={handleUpdateStatus}
        signer={signer || provider}
      />

    </div>
  );
}
