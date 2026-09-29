import React, { useState } from 'react';

export type AppMode = 'demo' | 'parc' | 'comparateur' | 'audit' | 'evaluation';

interface LoginProps {
  onLogin: (password: string, mode: AppMode) => void;
}

const MODES: { key: AppMode; label: string; description: string }[] = [
  { key: 'demo', label: 'Démo', description: 'Rapport de démonstration' },
  { key: 'parc', label: 'Gestion de Parc', description: 'Rapport de gestion de parc' },
  { key: 'comparateur', label: 'Comparateur', description: 'Comparer les modèles' },
  { key: 'audit', label: 'Audit', description: 'Créer un rapport d’audit PDF' },
  { key: 'evaluation', label: 'Fiche d’évaluation', description: 'Créer une fiche d’évaluation' },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AppMode>('demo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password, mode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-[420px]">
        <h2 className="text-xl font-bold mb-6 text-center text-purple-800">
          GE Healthcare
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Sélection du mode */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choisir le module
            </label>
            <div className="flex flex-col gap-2">
              {MODES.map(({ key, label, description }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    mode === key
                      ? 'border-purple-700 bg-purple-50 text-purple-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-semibold text-sm ${mode === key ? 'text-purple-800' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">{description}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-800 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
