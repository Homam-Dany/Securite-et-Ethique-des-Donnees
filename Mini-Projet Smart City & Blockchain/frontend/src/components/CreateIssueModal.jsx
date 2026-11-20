import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ISSUE_TYPES, PRIORITY_CONFIG } from '../utils/constants';

export default function CreateIssueModal({ isOpen, onClose, onSubmit, submitting }) {
  const [formData, setFormData] = useState({
    customId: '',
    issueType: 'StreetLight',
    location: '',
    description: '',
    priority: 1,
    reportedByName: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.location.trim()) {
      setError('Veuillez renseigner la localisation du problème.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Veuillez fournir une description.');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la transaction blockchain.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Signaler un incident urbain</h2>
            <p className="text-xs text-gray-500">Enregistrement vérifié sur la blockchain</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Identifiant personnalisé (Optionnel)
              </label>
              <input
                type="text"
                name="customId"
                value={formData.customId}
                onChange={handleChange}
                placeholder="Ex: CITY-2026-009"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Votre nom ou pseudonyme
              </label>
              <input
                type="text"
                name="reportedByName"
                value={formData.reportedByName}
                onChange={handleChange}
                placeholder="Ex: Citoyen01"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Catégorie de l'incident
            </label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
            >
              {ISSUE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Localisation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Ex: Avenue Mohammed V, Rabat"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Description concise du problème..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1.5">
              Niveau d'urgence
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((level) => {
                const p = PRIORITY_CONFIG[level];
                const isSelected = formData.priority === level;
                return (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setFormData(prev => ({ ...prev, priority: level }))}
                    className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p.labelFr}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validation...</span>
                </>
              ) : (
                <span>Enregistrer</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
