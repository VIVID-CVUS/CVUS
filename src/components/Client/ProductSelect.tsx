import React from 'react';
import sondesDataRaw from '../data/sonde.json';
import featuresDataRaw from '../data/feature.json';
import hardwareDataRaw from '../data/hardware.json';
import softwareDataRaw from '../data/connex.json';
import { DeviceData } from '../type/types';


interface Sonde {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  // Ajout d'index signature plus stricte
  [key: string]: string | boolean | undefined;
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: string | boolean | undefined;
}

interface Hardware {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: string | boolean | undefined;
}

interface Connex {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: string | boolean | undefined;
}



interface ProductSelectProps {
  selectedDevice: string;
  setSelectedDevice: (device: string) => void;
  updateDataStates: (data: DeviceData) => void;
}

const ProductSelect: React.FC<ProductSelectProps> = ({
  selectedDevice,
  setSelectedDevice,
  updateDataStates,
}) => {
    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const device = e.target.value;
      setSelectedDevice(device);

      const sondesRaw = (sondesDataRaw as unknown as Record<string, { sondes: Partial<Sonde>[] }>)[device]?.sondes || [];
      const deviceSondes: Sonde[] = sondesRaw.map((s) => ({
        id: String(s.id),
        name: s.name || '',
        description: s.description,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceFeatures = (featuresDataRaw as unknown as Record<string, { features : Partial<Feature>[] }>)[device]?.features || [];
      const deviceFeature : Feature [] = deviceFeatures.map((s) => ({
        id: String(s.id),
        name: s.name || '',
        description: s.description,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceHardwares = (hardwareDataRaw as unknown as Record<string, { hardware : Partial<Hardware>[] }>)[device]?.hardware || [];
      const deviceHardware : Hardware [] = deviceHardwares.map((s) => ({
        id: String(s.id),
        name: s.name || '',
        description: s.description,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceConnexs = (softwareDataRaw as unknown as Record<string, { accessories : Partial<Connex>[] }>)[device]?.accessories || [];
      const deviceConnex : Connex [] = deviceConnexs.map((s) => ({
        id: String(s.id),
        name: s.name || '',
        description: s.description,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceData: DeviceData = {
        sondes: deviceSondes,
        features: deviceFeature,
        hardware: deviceHardware,
        connex: deviceConnex,
      };

      updateDataStates(deviceData);
    };

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className="w-1/2 bg-purple-800 text-white font-bold p-3 rounded-l-lg text-center">
          Choix du produit :
        </div>
        <div className="w-1/2 bg-gray-100 p-3 rounded-r-lg flex items-center">
          <select
            value={selectedDevice}
            onChange={handleDeviceChange}
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">-- Sélectionner un produit --</option>
            <option value="Vivid Pioneer 4D">Vivid Pioneer 4D</option>
            <option value="Vivid Pioneer interventional">Vivid Pioneer interventional</option>
            <option value="Vivid Pioneer 2D">Vivid Pioneer 2D</option>
            <option value="Vivid E95">Vivid E95</option>
            <option value="Vivid E90">Vivid E90</option>
            <option value="Vivid S70N Dimension">Vivid S70N Dimension</option>
            <option value="Vivid S70N">Vivid S70N</option>
            <option value="Vivid S60N">Vivid S60N</option>
            <option value="Vivid iq">Vivid iq</option>
            <option value="Vivid T9">Vivid T9</option>
            <option value="Vivid T8">Vivid T8</option>
            <option value="Venue">Venue</option>
            <option value="Venue Go">Venue Go</option>
            <option value="Venue Fit">Venue Fit</option>
            <option value="Venue Sprint">Venue Sprint</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductSelect;
