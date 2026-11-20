import React from 'react';
import { STATUS_CONFIG, formatTimestamp, formatAddress } from '../utils/constants';

export default function HistoryTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-xs">
        Aucun historique d'intervention enregistré.
      </div>
    );
  }

  return (
    <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
      {history.map((step, idx) => {
        const statusCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG[0];

        return (
          <div key={idx} className="relative text-xs">
            {/* Timeline bullet */}
            <div className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusCfg.dot} ring-2 ring-gray-100`} />

            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${statusCfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.labelFr}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {formatTimestamp(step.timestamp)}
                </span>
              </div>

              {step.comment && (
                <p className="text-gray-700 my-1.5 font-normal leading-relaxed">
                  {step.comment}
                </p>
              )}

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px] text-gray-500">
                {step.assignedTeam ? (
                  <span>Équipe : <strong className="text-gray-800">{step.assignedTeam}</strong></span>
                ) : (
                  <span />
                )}
                <span className="font-mono text-gray-500">Acteur : {formatAddress(step.actor)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
