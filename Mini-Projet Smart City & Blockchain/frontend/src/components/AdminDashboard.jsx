import React, { useState } from 'react';
import { ShieldCheck, Users, MapPin } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatTimestamp, formatAddress } from '../utils/constants';

export default function AdminDashboard({ 
  issues = [], 
  onSelectIssue, 
  onQuickAssign, 
  onQuickStatusChange, 
  account 
}) {
  const [selectedIssueForAssign, setSelectedIssueForAssign] = useState(null);
  const [teamInput, setTeamInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportedCol = issues.filter(i => i.status === 0);
  const assignedCol = issues.filter(i => i.status === 1);
  const inProgressCol = issues.filter(i => i.status === 2);
  const completedCol = issues.filter(i => i.status === 3 || i.status === 4);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIssueForAssign || !teamInput.trim()) return;
    setSubmitting(true);
    try {
      await onQuickAssign(selectedIssueForAssign.id, teamInput, commentInput || 'Affectation équipe municipale');
      setTeamInput('');
      setCommentInput('');
      setSelectedIssueForAssign(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span>Espace Gestion Municipale</span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Autorité connectée
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tableau de suivi des interventions techniques et certification d'avancement sur la blockchain.
          </p>
        </div>

        <div className="text-xs text-gray-500 font-mono bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          Compte : <span className="text-gray-900 font-semibold">{formatAddress(account)}</span>
        </div>
      </div>

      {/* 4-Column Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Column 1 */}
        <div className="bg-gray-100/70 rounded-xl p-3 border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
            <span>1. À affecter</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-gray-600 text-[11px] border border-gray-200">
              {reportedCol.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {reportedCol.map(issue => {
              const priorityCfg = PRIORITY_CONFIG[issue.priority];
              return (
                <div key={issue.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-gray-700 font-medium">{issue.customId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityCfg.badge}`}>
                      {priorityCfg.labelFr}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-gray-900 mb-1">{issue.issueType}</div>
                  <div className="text-xs text-gray-500 line-clamp-1 mb-2.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{issue.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedIssueForAssign(issue)}
                      className="flex-1 py-1 px-2 rounded bg-gray-900 hover:bg-black text-white text-xs font-medium transition-colors"
                    >
                      Affecter
                    </button>
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="py-1 px-2 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              );
            })}
            {reportedCol.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">Aucun incident en attente</div>
            )}
          </div>
        </div>

        {/* Column 2 */}
        <div className="bg-gray-100/70 rounded-xl p-3 border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
            <span>2. Équipes mobilisées</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-gray-600 text-[11px] border border-gray-200">
              {assignedCol.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {assignedCol.map(issue => {
              const priorityCfg = PRIORITY_CONFIG[issue.priority];
              return (
                <div key={issue.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-gray-700 font-medium">{issue.customId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityCfg.badge}`}>
                      {priorityCfg.labelFr}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-gray-900 mb-1">{issue.issueType}</div>
                  <div className="text-xs text-blue-700 bg-blue-50/70 border border-blue-100 rounded px-2 py-0.5 mb-2.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span className="truncate">{issue.assignedTeam}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onQuickStatusChange(issue.id, 2, "Début officiel des travaux")}
                      className="flex-1 py-1 px-2 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium transition-colors"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="py-1 px-2 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              );
            })}
            {assignedCol.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">Aucun incident affecté</div>
            )}
          </div>
        </div>

        {/* Column 3 */}
        <div className="bg-gray-100/70 rounded-xl p-3 border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
            <span>3. En travaux</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-gray-600 text-[11px] border border-gray-200">
              {inProgressCol.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {inProgressCol.map(issue => {
              const priorityCfg = PRIORITY_CONFIG[issue.priority];
              return (
                <div key={issue.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-gray-700 font-medium">{issue.customId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityCfg.badge}`}>
                      {priorityCfg.labelFr}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-gray-900 mb-1">{issue.issueType}</div>
                  <div className="text-xs text-gray-600 mb-2.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{issue.assignedTeam}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onQuickStatusChange(issue.id, 3, "Travaux terminés avec succès")}
                      className="flex-1 py-1 px-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors"
                    >
                      Résoudre
                    </button>
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="py-1 px-2 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              );
            })}
            {inProgressCol.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">Aucun chantier en cours</div>
            )}
          </div>
        </div>

        {/* Column 4 */}
        <div className="bg-gray-100/70 rounded-xl p-3 border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
            <span>4. Résolus & Clôturés</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-gray-600 text-[11px] border border-gray-200">
              {completedCol.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
            {completedCol.map(issue => {
              const statusCfg = STATUS_CONFIG[issue.status];
              return (
                <div key={issue.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] text-gray-700 font-medium">{issue.customId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusCfg.badge}`}>
                      {statusCfg.labelFr}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-gray-900 mb-1">{issue.issueType}</div>
                  <div className="text-xs text-gray-500 line-clamp-1 mb-2.5">{issue.location}</div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    {issue.status === 3 ? (
                      <button
                        onClick={() => onQuickStatusChange(issue.id, 4, "Contrôle qualité validé")}
                        className="flex-1 py-1 px-2 rounded bg-gray-800 hover:bg-black text-white text-xs font-medium transition-colors"
                      >
                        Clôturer
                      </button>
                    ) : (
                      <span className="flex-1 text-[11px] text-gray-500 font-medium text-center py-0.5">
                        Dossier clos
                      </span>
                    )}
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="py-1 px-2 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              );
            })}
            {completedCol.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">Aucun incident résolu</div>
            )}
          </div>
        </div>

      </div>

      {/* Quick assign modal */}
      {selectedIssueForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Affecter une équipe à {selectedIssueForAssign.customId}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{selectedIssueForAssign.location}</p>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l'équipe</label>
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  placeholder="Ex: UrbanTeam01"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Commentaire</label>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Instruction pour l'équipe"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForAssign(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !teamInput.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium disabled:opacity-50"
                >
                  {submitting ? 'Validation...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
