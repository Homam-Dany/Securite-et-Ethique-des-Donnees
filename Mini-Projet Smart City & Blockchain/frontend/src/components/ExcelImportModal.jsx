import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { X, FileSpreadsheet, CheckSquare, Square, Download, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { parsePriority, parseStatus, STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/constants';

export default function ExcelImportModal({ isOpen, onClose, onBatchImport, importing, existingIssues = [] }) {
  const [file, setFile] = useState(null);
  const [dataRows, setDataRows] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Ensemble des identifiants déjà présents sur la blockchain
  const existingIds = useMemo(() => {
    return new Set(existingIssues.map(i => i.customId?.toLowerCase().trim()).filter(Boolean));
  }, [existingIssues]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const timestampSuffix = Math.floor(Date.now() / 1000).toString().slice(-3);
    const sampleData = [
      {
        issueId: `CITY-2026-1${timestampSuffix}`,
        issueType: "StreetLight",
        location: "Avenue Mohammed V, Rabat",
        description: "Lampadaire clignotant et éteint la nuit près du carrefour",
        reportDate: "2026-11-19",
        priority: "High",
        reportedBy: "Citizen01",
        assignedTo: "UrbanTeam01",
        status: "Reported"
      },
      {
        issueId: `CITY-2026-2${timestampSuffix}`,
        issueType: "Pothole",
        location: "Boulevard Hassan II, Casablanca",
        description: "Nid-de-poule dangereux sur la voie de droite",
        reportDate: "2026-11-20",
        priority: "Critical",
        reportedBy: "Citizen02",
        assignedTo: "VoirieRapide",
        status: "Reported"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UrbanIssues");
    XLSX.writeFile(workbook, "modele_urban_issues.xlsx");
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setError('');
    setSuccessMsg('');
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!json || json.length === 0) {
          setError('Le fichier Excel est vide.');
          setDataRows([]);
          return;
        }

        const validated = json.map((row, idx) => {
          const customId = String(row.issueId || row.customId || '').trim();
          const issueType = String(row.issueType || row.type || 'Other').trim();
          const location = String(row.location || '').trim();
          const description = String(row.description || '').trim();
          const reportDate = String(row.reportDate || '').trim();
          const priorityRaw = row.priority;
          const reportedBy = String(row.reportedBy || '').trim();
          const assignedTo = String(row.assignedTo || '').trim();
          const statusRaw = row.status;

          const priority = parsePriority(priorityRaw);
          const initialStatus = parseStatus(statusRaw);

          const missingFields = [];
          if (!issueType) missingFields.push('issueType');
          if (!location) missingFields.push('location');
          if (!description) missingFields.push('description');

          const isAlreadyOnChain = customId ? existingIds.has(customId.toLowerCase()) : false;

          return {
            rowIdx: idx,
            customId,
            issueType,
            location,
            description,
            reportDate,
            priority,
            reportedByName: reportedBy || 'Import Excel',
            assignedTeam: assignedTo,
            initialStatus,
            isAlreadyOnChain,
            isValid: missingFields.length === 0,
            missingFields
          };
        });

        setDataRows(validated);

        // Sélectionner par défaut toutes les lignes valides
        const validIndices = new Set(
          validated.filter(r => r.isValid).map(r => r.rowIdx)
        );
        setSelectedIndices(validIndices);

      } catch (err) {
        console.error('Erreur lecture Excel:', err);
        setError('Impossible de lire le fichier. Veuillez fournir un fichier .xlsx ou .csv valide.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const toggleSelectAll = () => {
    const validRows = dataRows.filter(r => r.isValid);
    if (selectedIndices.size === validRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(validRows.map(r => r.rowIdx)));
    }
  };

  const toggleRow = (idx) => {
    const updated = new Set(selectedIndices);
    if (updated.has(idx)) {
      updated.delete(idx);
    } else {
      updated.add(idx);
    }
    setSelectedIndices(updated);
  };

  const handleImportSelected = async () => {
    if (selectedIndices.size === 0) {
      setError('Veuillez sélectionner au moins un signalement valide à importer.');
      return;
    }

    const itemsToImport = dataRows.filter(r => selectedIndices.has(r.rowIdx) && r.isValid);
    try {
      setError('');
      await onBatchImport(itemsToImport);
      setSuccessMsg(`${itemsToImport.length} signalement(s) importé(s) avec succès !`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      const friendlyMsg = err?.reason || (err?.message?.includes('deja existant') ? 'Certains identifiants existent déjà sur la blockchain.' : 'Erreur lors de la transaction blockchain.');
      setError(friendlyMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl border border-gray-200 shadow-xl flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import de données Excel / CSV</h2>
            <p className="text-gray-500 text-xs">Validation côté client et enregistrement sur la blockchain</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Modèle Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              {successMsg}
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="border border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-6 text-center bg-gray-50/50">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <FileUp className="w-6 h-6 text-gray-500" />
              <span className="font-semibold text-gray-800">
                {file ? file.name : "Sélectionner un fichier Excel (.xlsx, .csv)"}
              </span>
              <span className="text-gray-400 text-[11px]">
                Format attendu : issueId, issueType, location, description, reportDate, priority, reportedBy, assignedTo, status
              </span>
            </label>
          </div>

          {/* Table Preview */}
          {dataRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 font-medium text-gray-700 hover:text-black"
                >
                  {selectedIndices.size === dataRows.filter(r => r.isValid).length ? (
                    <CheckSquare className="w-4 h-4 text-gray-900" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span>Sélectionner tout ({selectedIndices.size}/{dataRows.length})</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-left text-gray-700">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-medium border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Localisation</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Priorité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {dataRows.map((row) => (
                      <tr key={row.rowIdx} className="hover:bg-gray-50">
                        <td className="p-2.5">
                          {row.isValid ? (
                            <button onClick={() => toggleRow(row.rowIdx)}>
                              {selectedIndices.has(row.rowIdx) ? (
                                <CheckSquare className="w-3.5 h-3.5 text-gray-900" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-red-500 font-bold">✕</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <span>{row.customId || 'Auto'}</span>
                            {row.isAlreadyOnChain && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Cet ID est déjà enregistré sur la blockchain">
                                existant
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5">{row.issueType}</td>
                        <td className="p-2.5 truncate max-w-[150px]">{row.location}</td>
                        <td className="p-2.5 truncate max-w-[200px] text-gray-500">{row.description}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded border text-[10px] ${PRIORITY_CONFIG[row.priority].badge}`}>
                            {PRIORITY_CONFIG[row.priority].labelFr}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-500">
            {selectedIndices.size} élément(s) prêt(s) pour enregistrement
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
            >
              Annuler
            </button>

            <button
              onClick={handleImportSelected}
              disabled={importing || selectedIndices.size === 0}
              className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer ({selectedIndices.size})</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
