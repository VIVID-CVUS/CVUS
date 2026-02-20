// src/components/Client/ClientInfo.tsx
import React from 'react';

type Props = {
  clientName: string;
  clientEmail: string;
  demoDate: string;
  lieuService: string;
  generalRemarks: string;
  setClientName: (value: string) => void;
  setClientEmail: (value: string) => void;
  setDemoDate: (value: string) => void;
  setLieuService: (value: string) => void;
  setGeneralRemarks: (value: string) => void;
};

const ClientInfo: React.FC<Props> = ({
  clientName,
  clientEmail,
  demoDate,
  lieuService,
  generalRemarks,
  setClientName,
  setClientEmail,
  setDemoDate,
  setLieuService,
  setGeneralRemarks
}) => {
  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-3 text-purple-800">Informations Client</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientName">
            Nom du client
          </label>
          <input
            id="clientName"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientEmail">
            Adresse Mail de contact
          </label>
          <input
            id="clientEmail"
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="demoDate">
            Date de démonstration
          </label>
          <input
            id="demoDate"
            type="date"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={demoDate}
            onChange={(e) => setDemoDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lieuService">
            Lieu/Service
          </label>
          <input
            id="lieuService"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={lieuService}
            onChange={(e) => setLieuService(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="generalRemarks">
            Remarque générale
          </label>
          <textarea
            id="generalRemarks"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={generalRemarks}
            onChange={(e) => setGeneralRemarks(e.target.value)}
            rows={2}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default ClientInfo;
