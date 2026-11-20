import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Users, Calendar, User, ShieldCheck } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatTimestamp, formatAddress } from '../utils/constants';
import HistoryTimeline from './HistoryTimeline';
import { fetchIssueHistory } from '../utils/ethereum';

export default function IssueDetailModal({ 
  issue, 
  isOpen, 
  onClose, 
  isMunicipalAdmin, 
  onAssignTeam, 
  onUpdateStatus, 
  signer 
}) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [assignTeamName, setAssignTeamName] = useState('');
  const [assignComment, setAssignComment] = useState('');
  const [newStatus, setNewStatus] = useState(issue?.status || 0);
  const [statusComment, setStatusComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('traceability'); // 'traceability' | 'actions'

  useEffect(() => {
    if (isOpen && issue?.id) {
      loadHistory();
      setNewStatus(issue.status);
      setAssignTeamName(issue.assignedTeam || '');
    }
  }, [isOpen, issue?.id]);

  const loadHistory = async () => {
    if (!issue?.id) return;
    setLoadingHistory(true);
    try {
      const logs = await fetchIssueHistory(issue.id, signer);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !issue) return null;

  const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG[0];
  const priorityCfg = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG[1];

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTeamName.trim()) return;
    setActionLoading(true);
    try {
      await onAssignTeam(issue.id, assignTeamName, assignComment);
      setAssignComment('');
      await loadHistory();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await onUpdateStatus(issue.id, Number(newStatus), statusComment);
      setStatusComment('');
      await loadHistory();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl border border-gray-200 shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
              {issue.customId}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.labelFr}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded border ${priorityCfg.badge}`}>
              {priorityCfg.labelFr}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* Main Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-gray-500 font-medium">
              <span>{issue.issueType}</span>
              <span>{formatTimestamp(issue.createdAt)}</span>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{issue.location}</span>
            </h3>

            <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed font-normal">
              {issue.description}
            </p>

            <div className="flex items-center justify-between pt-1 text-gray-500 border-t border-gray-200/60 text-[11px]">
              <span>Déclarant : <strong className="text-gray-800">{issue.reportedByName || 'Anonyme'}</strong></span>
              <span>Équipe : <strong className="text-gray-800">{issue.assignedTeam || 'Non affectée'}</strong></span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab('traceability')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'traceability'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Historique blockchain ({history.length})
            </button>

            {isMunicipalAdmin && (
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'actions'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Gérer l'intervention
              </button>
            )}
          </div>

          {/* Traceability Tab */}
          {activeTab === 'traceability' && (
            <div>
              {loadingHistory ? (
                <div className="py-6 flex justify-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <HistoryTimeline history={history} />
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && isMunicipalAdmin && (
            <div className="space-y-4">
              
              {/* Form 1: Assign team */}
              <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-semibold text-gray-900">Affecter une équipe</h4>
                <form onSubmit={handleAssign} className="space-y-2.5">
                  <input
                    type="text"
                    value={assignTeamName}
                    onChange={(e) => setAssignTeamName(e.target.value)}
                    placeholder="Nom de l'équipe (ex: UrbanTeam01)"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
                  />
                  <input
                    type="text"
                    value={assignComment}
                    onChange={(e) => setAssignComment(e.target.value)}
                    placeholder="Instruction / commentaire"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !assignTeamName.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Enregistrement...' : 'Confirmer l\'affectation'}
                  </button>
                </form>
              </div>

              {/* Form 2: Change status */}
              <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-semibold text-gray-900">Mettre à jour le statut</h4>
                <form onSubmit={handleStatusChange} className="space-y-2.5">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
                  >
                    <option value={0}>Signalé (Reported)</option>
                    <option value={1}>Affecté (Assigned)</option>
                    <option value={2}>En cours (InProgress)</option>
                    <option value={3}>Résolu (Resolved)</option>
                    <option value={4}>Clôturé (Closed)</option>
                  </select>

                  <textarea
                    rows={2}
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Rapport ou note d'intervention..."
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Mise à jour...' : 'Valider le changement de statut'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
