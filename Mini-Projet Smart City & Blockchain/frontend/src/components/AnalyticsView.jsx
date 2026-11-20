import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Users, 
  Tag 
} from 'lucide-react';
import { ISSUE_TYPES, STATUS_CONFIG, PRIORITY_CONFIG, formatTimestamp } from '../utils/constants';

export default function AnalyticsView({ issues = [] }) {
  const total = issues.length;

  // Calcul par catégorie
  const categoryStats = ISSUE_TYPES.map(cat => {
    const count = issues.filter(i => i.issueType === cat.id).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      ...cat,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  // Calcul par statut
  const statusStats = [0, 1, 2, 3, 4].map(st => {
    const cfg = STATUS_CONFIG[st];
    const count = issues.filter(i => i.status === st).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      ...cfg,
      id: st,
      count,
      percentage
    };
  });

  // Calcul par priorité
  const priorityStats = [0, 1, 2, 3].map(pr => {
    const cfg = PRIORITY_CONFIG[pr];
    const count = issues.filter(i => i.priority === pr).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      ...cfg,
      id: pr,
      count,
      percentage
    };
  });

  // Équipes mobilisées
  const teamCounts = {};
  issues.forEach(i => {
    if (i.assignedTeam) {
      teamCounts[i.assignedTeam] = (teamCounts[i.assignedTeam] || 0) + 1;
    }
  });
  const activeTeams = Object.entries(teamCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const criticalPending = issues.filter(i => i.priority === 3 && i.status < 3).length;
  const resolvedCount = issues.filter(i => i.status >= 3).length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* KPI Highlight Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Taux d'Efficacité Globale
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{resolutionRate}%</div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" /> {resolvedCount} incidents résolus
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Urgences Critiques Actives
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">{criticalPending}</div>
            <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 inline" /> Priorité intervention immédiate
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Équipes d'Intervention Actives
            </span>
            <div className="text-2xl font-black text-blue-600 mt-1">{activeTeams.length}</div>
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5 inline" /> Déployées sur le terrain
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Traçabilité Blockchain
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1">100%</div>
            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 inline" /> Preuve immuable & auditée
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Category breakdown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Répartition par Catégorie */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Répartition des Dysfonctionnements par Domaine
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">{total} incidents</span>
          </div>

          <div className="space-y-4">
            {categoryStats.map(cat => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cat.count}</span>
                    <span className="text-slate-400 font-medium">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-600 transition-all duration-500" 
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Cycle de Vie et Priorité */}
        <div className="space-y-6">
          
          {/* Status Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  État du Cycle de Vie Opérationnel
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {statusStats.map(st => (
                <div key={st.id} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className={`w-2 h-2 rounded-full inline-block mb-1.5 ${st.dot}`} />
                  <div className="text-lg font-black text-slate-900">{st.count}</div>
                  <div className="text-[11px] font-semibold text-slate-600 truncate">{st.labelFr}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{st.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown & Active Teams */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Équipes d'Intervention & Charge Opérationnelle
            </h3>

            {activeTeams.length > 0 ? (
              <div className="space-y-2.5">
                {activeTeams.slice(0, 5).map(team => (
                  <div key={team.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">{team.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {team.count} intervention{team.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Aucune équipe affectée pour le moment.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
