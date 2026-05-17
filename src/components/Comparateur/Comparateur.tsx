import React, { useState, useMemo } from 'react';
import { AppMode } from '../Auth/Login';
import featuresDataRaw from '../data/feature.json';
import sondesDataRaw from '../data/sonde.json';
import hardwareDataRaw from '../data/hardware.json';
import connexDataRaw from '../data/connex.json';

type RawItem = { id: number; name: string };
type RawSection<K extends string> = Record<string, Record<K, RawItem[]>>;
type SondeCategory =
  | 'Linéaire'
  | 'Convexe'
  | 'Endocavitaire'
  | 'ETO'
  | 'Sectorielle'
  | 'Portable'
  | 'Crayon'
  | 'Non classée';

type TableRow =
  | { kind: 'category'; label: SondeCategory }
  | { kind: 'item'; name: string; category: SondeCategory };

const allDevices = Object.keys(featuresDataRaw as RawSection<'features'>);

type SectionKey = 'Sondes' | 'Options Software' | 'Hardware' | 'Connectivité';

const SECTIONS: SectionKey[] = ['Sondes', 'Options Software', 'Hardware', 'Connectivité'];

const ETO_SONDES = new Set(['6TC-RS', '9T-RS', '10T-D', '6VT-D', '9T', '9VT-D', '9VT']);
const CRAYON_SONDES = new Set(['P2D', 'P6D']);
const SECTORIELLE_FORCE = new Set(['4VC-D', '6VC-D']);
const CATEGORY_ORDER: SondeCategory[] = [
  'Sectorielle',
  'ETO',
  'Convexe',
  'Linéaire',
  'Portable',
  'Crayon',
  'Endocavitaire',
  'Non classée',
];

function categorizeSonde(name: string): SondeCategory {
  const normalized = name.toUpperCase().replace(/\s+/g, ' ').trim();
  const base = normalized.replace(/\(.*?\)/g, '').trim();

  if (base.includes('VSCAN')) return 'Portable';

  if (CRAYON_SONDES.has(base)) return 'Crayon';

  if (ETO_SONDES.has(base)) return 'ETO';

  if (
    base.startsWith('IC')
    || base.includes('IC5')
    || base.includes('IC- CORD')
    || base.includes('ICE CORD')
  ) {
    return 'Endocavitaire';
  }

  if (
    SECTORIELLE_FORCE.has(base)
    ||
    base.includes('4VC')
    || base.includes('6VC')
    || base.includes('SC')
    || /(^|[^A-Z])S\d/.test(base)
    || /\dS-/.test(base)
    || base.includes('S-RS')
  ) {
    return 'Sectorielle';
  }

  if (
    base.startsWith('C')
    || /(^|[^A-Z])C\d/.test(base)
    || base.includes('C-RS')
    || /-C($|-)/.test(base)
  ) {
    return 'Convexe';
  }

  if (base.includes('L')) return 'Linéaire';

  return 'Non classée';
}

function getItemsForDevice(device: string, section: SectionKey): string[] {
  if (!device) return [];
  switch (section) {
    case 'Sondes':
      return ((sondesDataRaw as RawSection<'sondes'>)[device]?.sondes ?? []).map((i) => i.name);
    case 'Options Software':
      return ((featuresDataRaw as RawSection<'features'>)[device]?.features ?? []).map((i) => i.name);
    case 'Hardware':
      return ((hardwareDataRaw as RawSection<'hardware'>)[device]?.hardware ?? []).map((i) => i.name);
    case 'Connectivité':
      return ((connexDataRaw as unknown as RawSection<'accessories'>)[device]?.accessories ?? []).map((i) => i.name);
    default:
      return [];
  }
}

const APP_MODES: { key: AppMode; label: string }[] = [
  { key: 'demo', label: 'Démo' },
  { key: 'parc', label: 'Gestion de Parc' },
  { key: 'comparateur', label: 'Comparateur' },
];

interface ComparateurProps {
  onLogout: () => void;
  onSwitchModule: (mode: AppMode) => void;
}

const MAX_DEVICES = allDevices.length;

const Comparateur: React.FC<ComparateurProps> = ({ onSwitchModule }) => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['', '']);
  const [activeSection, setActiveSection] = useState<SectionKey>('Sondes');
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);

  const setDevice = (index: number, value: string) => {
    setSelectedDevices((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const addSlot = () => {
    if (selectedDevices.length < MAX_DEVICES) {
      setSelectedDevices((prev) => [...prev, '']);
    }
  };

  const removeSlot = (index: number) => {
    setSelectedDevices((prev) => prev.filter((_, i) => i !== index));
  };

  const activeDevices = selectedDevices.filter(Boolean);

  const allItems = useMemo(() => {
    const itemSet = new Set<string>();
    selectedDevices.forEach((device) => {
      if (device) {
        getItemsForDevice(device, activeSection).forEach((name) => itemSet.add(name));
      }
    });
    return Array.from(itemSet).sort();
  }, [selectedDevices, activeSection]);

  const deviceItems = useMemo(() => {
    return selectedDevices.map((device) =>
      device ? new Set(getItemsForDevice(device, activeSection)) : new Set<string>()
    );
  }, [selectedDevices, activeSection]);

  const tableRows = useMemo<TableRow[]>(() => {
    if (activeSection !== 'Sondes') {
      return allItems.map((name) => ({ kind: 'item', name, category: 'Non classée' }));
    }

    const grouped = new Map<SondeCategory, string[]>();
    CATEGORY_ORDER.forEach((category) => grouped.set(category, []));

    allItems.forEach((name) => {
      const category = categorizeSonde(name);
      grouped.get(category)?.push(name);
    });

    const rows: TableRow[] = [];
    CATEGORY_ORDER.forEach((category) => {
      const names = (grouped.get(category) ?? []).sort((a, b) => a.localeCompare(b, 'fr'));
      if (!names.length) return;
      rows.push({ kind: 'category', label: category });
      names.forEach((name) => rows.push({ kind: 'item', name, category }));
    });

    return rows;
  }, [allItems, activeSection]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-purple-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModuleMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div>
              <h1 className="text-xl font-bold text-left">GE Healthcare</h1>
              <p className="text-purple-200 text-sm flex items-center gap-1">
                Comparateur d'échographes <span className="text-purple-300">▾</span>
              </p>
            </div>
          </button>
          {isModuleMenuOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
              {APP_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onSwitchModule(key); setIsModuleMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    key === 'comparateur' ? 'font-semibold text-purple-800 bg-purple-50' : 'text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sélecteurs de modèles */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Sélectionner les modèles à comparer</h2>
            <button
              type="button"
              onClick={addSlot}
              disabled={selectedDevices.length >= MAX_DEVICES}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Ajouter un modèle
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedDevices.map((device, i) => (
              <div key={i} className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Modèle {i + 1}
                </label>
                <div className="flex gap-1">
                  <select
                    value={device}
                    onChange={(e) => setDevice(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                  >
                    <option value="">-- Choisir --</option>
                    {allDevices.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {selectedDevices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="px-2 py-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200 text-lg leading-none transition-colors"
                      title="Supprimer ce slot"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeDevices.length === 0 && (
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
            <p className="text-lg">Sélectionnez au moins un modèle pour démarrer la comparaison.</p>
          </div>
        )}

        {activeDevices.length > 0 && (
          <>
            {/* Onglets de section */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {SECTIONS.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === section
                      ? 'bg-purple-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>

            {/* Tableau comparatif */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-800 text-white">
                    <th className="text-left px-4 py-3 font-semibold w-1/3">{activeSection}</th>
                    {selectedDevices.map((device, i) =>
                      device ? (
                        <th key={i} className="text-center px-4 py-3 font-semibold">
                          {device}
                        </th>
                      ) : null
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allItems.length === 0 ? (
                    <tr>
                      <td colSpan={activeDevices.length + 1} className="text-center py-8 text-gray-400">
                        Aucune donnée disponible pour cette section.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, rowIdx) => {
                      if (row.kind === 'category') {
                        return (
                          <tr key={`category-${row.label}-${rowIdx}`} className="bg-purple-50 border-y border-purple-100">
                            <td colSpan={activeDevices.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
                              {row.label}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={row.name}
                          className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-4 py-2 text-gray-700 font-medium">{row.name}</td>
                          {selectedDevices.map((device, colIdx) =>
                            device ? (
                              <td key={colIdx} className="text-center px-4 py-2">
                                {deviceItems[colIdx].has(row.name) ? (
                                  <span className="inline-block w-5 h-5 bg-green-500 rounded-full" title="Disponible" />
                                ) : (
                                  <span className="inline-block w-5 h-5 bg-red-500 rounded-full" title="Non disponible" />
                                )}
                              </td>
                            ) : null
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Légende */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full" /> Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full" /> Non disponible
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comparateur;
