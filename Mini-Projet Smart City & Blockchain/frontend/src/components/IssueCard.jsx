import React from 'react';
import { MapPin, Users, ArrowRight } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatTimestamp, formatAddress } from '../utils/constants';

export default function IssueCard({ issue, onSelect, onManage, isMunicipalAdmin }) {
  const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG[0];
  const priorityCfg = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG[1];

  return (
    <div className="card-clean p-5 flex flex-col justify-between hover:border-gray-300 transition-colors">
      
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {issue.customId}
          </span>

          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded border ${priorityCfg.badge}`}>
              {priorityCfg.labelFr}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.labelFr}
            </span>
          </div>
        </div>

        {/* Category & Title */}
        <div className="text-xs text-gray-500 font-medium mb-1">
          {issue.issueType}
        </div>
        <div className="text-sm font-semibold text-gray-900 mb-2 flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{issue.location}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
          {issue.description}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-100 text-xs">
        <div className="flex items-center justify-between text-gray-500 mb-3">
          <span className="truncate max-w-[140px]">{issue.reportedByName || formatAddress(issue.reporter)}</span>
          <span>{formatTimestamp(issue.createdAt)}</span>
        </div>

        {issue.assignedTeam && (
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 border border-blue-100 rounded-lg px-2.5 py-1 mb-3">
            <Users className="w-3.5 h-3.5" />
            <span className="truncate font-medium">Équipe : {issue.assignedTeam}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(issue)}
            className="flex-1 py-1.5 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors text-center"
          >
            Détails & historique
          </button>

          {isMunicipalAdmin && (
            <button
              onClick={() => onManage(issue)}
              className="py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition-colors"
            >
              Gérer
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
