// src/components/Actions/ActionButtons.tsx
import React from 'react';

type Props = {
  selectedCommercial: boolean;
  addEchographe: () => void;
  downloadPdf: () => void;
  sendPdfToCommercial: () => void;
};

const ActionButtons: React.FC<Props> = ({
  selectedCommercial,
  addEchographe,
  downloadPdf,
  sendPdfToCommercial,
}) => {
  return (
    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 justify-center items-center mt-4 p-4">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          addEchographe();
        }}
        className="bg-purple-800 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-md flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
             className="h-5 w-5 mr-2"
             viewBox="0 0 20 20"
             fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Ajouter échographe
      </button>

      {/* Télécharger le PDF */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          downloadPdf();
        }}
        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
             className="h-5 w-5 mr-2"
             viewBox="0 0 20 20"
             fill="currentColor">
          <path d="M3 14a1 1 0 011-1h4v-7a1 1 0 112 0v7h4a1 1 0 011 1v2H3v-2z" />
          <path d="M9 2a1 1 0 012 0v6h-2V2z" />
        </svg>
        Télécharger le PDF
      </button>

      {/* Envoyer le PDF */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          sendPdfToCommercial();
        }}
        disabled={!selectedCommercial}
        className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
             className="h-5 w-5 mr-2"
             viewBox="0 0 20 20"
             fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Envoyer le PDF
      </button>
    </div>
  );
};

export default ActionButtons;
