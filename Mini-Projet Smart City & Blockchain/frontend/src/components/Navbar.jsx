import React from 'react';
import { 
  Building2, 
  Wallet, 
  Plus, 
  FileSpreadsheet, 
  RefreshCw, 
  ShieldCheck, 
  User 
} from 'lucide-react';
import { formatAddress } from '../utils/constants';

export default function Navbar({ 
  account, 
  isMunicipalAdmin, 
  onConnect, 
  onDisconnect, 
  activeTab, 
  setActiveTab, 
  onOpenCreate, 
  onOpenImport, 
  onRefresh, 
  loading 
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base text-gray-900 tracking-tight">
                SmartCity <span className="text-gray-500 font-normal">| Registre Urbain</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-gray-200 pl-6">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'explore'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Signalements
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>Espace Municipalité</span>
                {isMunicipalAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                )}
              </button>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Actualiser les données"
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gray-900' : ''}`} />
            </button>

            <button
              onClick={onOpenImport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
              <span>Importer Excel</span>
            </button>

            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau signalement</span>
            </button>

            {/* Wallet Connect */}
            {account ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-medium text-gray-800">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={onDisconnect}
                  title="Déconnecter"
                  className="p-1 rounded text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-gray-500" />
                <span>Connecter</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
