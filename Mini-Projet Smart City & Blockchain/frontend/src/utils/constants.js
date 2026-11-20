export const STATUS_LABELS = {
  0: 'Reported',
  1: 'Assigned',
  2: 'InProgress',
  3: 'Resolved',
  4: 'Closed'
};

export const STATUS_CONFIG = {
  0: {
    label: 'Reported',
    labelFr: 'Signalé',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500'
  },
  1: {
    label: 'Assigned',
    labelFr: 'Affecté',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-600'
  },
  2: {
    label: 'InProgress',
    labelFr: 'En cours',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-600'
  },
  3: {
    label: 'Resolved',
    labelFr: 'Résolu',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-600'
  },
  4: {
    label: 'Closed',
    labelFr: 'Clôturé',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-500'
  }
};

export const PRIORITY_CONFIG = {
  0: { 
    label: 'Low', 
    labelFr: 'Faible', 
    badge: 'bg-gray-50 text-gray-600 border-gray-200'
  },
  1: { 
    label: 'Medium', 
    labelFr: 'Moyenne', 
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  2: { 
    label: 'High', 
    labelFr: 'Haute', 
    badge: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  3: { 
    label: 'Critical', 
    labelFr: 'Critique', 
    badge: 'bg-red-50 text-red-700 border-red-200 font-semibold'
  }
};

export const ISSUE_TYPES = [
  { id: 'StreetLight', label: 'Éclairage public' },
  { id: 'Pothole', label: 'Voirie & chaussée' },
  { id: 'WaterLeak', label: 'Eau & assainissement' },
  { id: 'WasteManagement', label: 'Gestion des déchets' },
  { id: 'TrafficLight', label: 'Signalisation & feux' },
  { id: 'PublicGreenery', label: 'Espaces verts' },
  { id: 'Other', label: 'Autre incident' }
];

export const parsePriority = (priorityStr) => {
  if (typeof priorityStr === 'number') return priorityStr;
  const p = String(priorityStr).toLowerCase().trim();
  if (p === 'low' || p === 'faible' || p === '0') return 0;
  if (p === 'medium' || p === 'moyenne' || p === '1') return 1;
  if (p === 'high' || p === 'haute' || p === '2') return 2;
  if (p === 'critical' || p === 'critique' || p === 'urgent' || p === '3') return 3;
  return 1;
};

export const parseStatus = (statusStr) => {
  if (typeof statusStr === 'number') return statusStr;
  const s = String(statusStr).toLowerCase().trim();
  if (s === 'reported' || s === 'signale' || s === 'signalé' || s === '0') return 0;
  if (s === 'assigned' || s === 'affecte' || s === 'affecté' || s === '1') return 1;
  if (s === 'inprogress' || s === 'en cours' || s === '2') return 2;
  if (s === 'resolved' || s === 'resolu' || s === 'résolu' || s === '3') return 3;
  if (s === 'closed' || s === 'cloture' || s === 'clôturé' || s === '4') return 4;
  return 0;
};

export const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

export const formatTimestamp = (ts) => {
  if (!ts) return '';
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
