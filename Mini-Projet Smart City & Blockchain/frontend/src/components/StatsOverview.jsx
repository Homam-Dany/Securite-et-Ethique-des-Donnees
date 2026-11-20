import React from 'react';

export default function StatsOverview({ issues = [] }) {
  const total = issues.length;
  const reported = issues.filter(i => i.status === 0).length;
  const inProgress = issues.filter(i => i.status === 1 || i.status === 2).length;
  const completed = issues.filter(i => i.status === 3 || i.status === 4).length;
  const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    { label: 'Total des signalements', value: total },
    { label: 'En attente d\'affectation', value: reported },
    { label: 'Interventions en cours', value: inProgress },
    { label: 'Incidents résolus', value: completed },
    { label: 'Taux de résolution', value: `${resolutionRate}%` }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs"
        >
          <div className="text-xs font-medium text-gray-500 mb-1">{stat.label}</div>
          <div className="text-2xl font-semibold text-gray-900 tracking-tight">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
