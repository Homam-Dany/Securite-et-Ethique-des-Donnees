import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, Table as TableIcon, X, MapPin } from 'lucide-react';
import IssueCard from './IssueCard';
import { ISSUE_TYPES, STATUS_CONFIG, PRIORITY_CONFIG, formatTimestamp } from '../utils/constants';

export default function IssueList({ issues = [], onSelectIssue, onManageIssue, isMunicipalAdmin }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCustomId = issue.customId?.toLowerCase().includes(q);
        const matchLocation = issue.location?.toLowerCase().includes(q);
        const matchDesc = issue.description?.toLowerCase().includes(q);
        const matchType = issue.issueType?.toLowerCase().includes(q);
        const matchReporter = issue.reportedByName?.toLowerCase().includes(q);
        const matchTeam = issue.assignedTeam?.toLowerCase().includes(q);
        if (!matchCustomId && !matchLocation && !matchDesc && !matchType && !matchReporter && !matchTeam) {
          return false;
        }
      }

      if (filterStatus !== 'ALL') {
        if (issue.status !== Number(filterStatus)) return false;
      }

      if (filterPriority !== 'ALL') {
        if (issue.priority !== Number(filterPriority)) return false;
      }

      if (filterType !== 'ALL') {
        if (issue.issueType !== filterType) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'priority') return b.priority - a.priority;
      if (sortBy === 'status') return a.status - b.status;
      return 0;
    });
  }, [issues, search, filterStatus, filterPriority, filterType, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterType('ALL');
  };

  const hasActiveFilters = search || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterType !== 'ALL';

  return (
    <div className="space-y-4">
      
      {/* Search & Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par identifiant, rue, équipe..."
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status select */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-gray-400"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="0">Signalé</option>
            <option value="1">Affecté</option>
            <option value="2">En cours</option>
            <option value="3">Résolu</option>
            <option value="4">Clôturé</option>
          </select>

          {/* Category select */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-gray-400"
          >
            <option value="ALL">Toutes catégories</option>
            {ISSUE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Priority select */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-gray-400"
          >
            <option value="ALL">Toutes priorités</option>
            <option value="0">Faible</option>
            <option value="1">Moyenne</option>
            <option value="2">Haute</option>
            <option value="3">Critique</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-800 text-xs underline px-1"
            >
              Effacer
            </button>
          )}

          {/* Grid / Table toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vue Tableau"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Issues Display */}
      {filteredIssues.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onSelect={onSelectIssue}
                onManage={onManageIssue}
                isMunicipalAdmin={isMunicipalAdmin}
              />
            ))}
          </div>
        ) : (
          /* Clean Table */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Identifiant</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Localisation</th>
                    <th className="py-3 px-4">Priorité</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Équipe</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIssues.map((issue) => {
                    const statusCfg = STATUS_CONFIG[issue.status];
                    const priorityCfg = PRIORITY_CONFIG[issue.priority];

                    return (
                      <tr key={issue.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-gray-900">{issue.customId}</td>
                        <td className="py-3 px-4 text-gray-700">{issue.issueType}</td>
                        <td className="py-3 px-4 text-gray-900 max-w-[220px] truncate" title={issue.location}>
                          {issue.location}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[11px] ${priorityCfg.badge}`}>
                            {priorityCfg.labelFr}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.labelFr}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {issue.assignedTeam || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {formatTimestamp(issue.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onSelectIssue(issue)}
                            className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-medium"
                          >
                            Consulter
                          </button>
                          {isMunicipalAdmin && (
                            <button
                              onClick={() => onManageIssue(issue)}
                              className="px-2.5 py-1 rounded bg-gray-900 hover:bg-black text-white text-xs font-medium"
                            >
                              Gérer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500">
          Aucun signalement ne correspond à votre recherche.
        </div>
      )}

    </div>
  );
}
