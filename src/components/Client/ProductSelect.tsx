import React from 'react';
import sondesDataRaw from '../data/sonde.json';
import featuresDataRaw from '../data/feature.json';
import hardwareDataRaw from '../data/hardware.json';
import softwareDataRaw from '../data/connex.json';
import { ECHOGRAPHES } from '../data/echographes';
import { DeviceData } from '../type/types';

type RawDeviceItem = {
  id: number;
  name: string;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
};

type RawByDevice<TSection extends string> = Record<string, Record<TSection, RawDeviceItem[]>>;

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

      const sondesRaw = ((sondesDataRaw as unknown) as RawByDevice<'sondes'>)[device]?.sondes || [];
      const deviceSondes: Sonde[] = sondesRaw.map((s) => ({
        id: String(s.id),
        name: s.name,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceFeatures = ((featuresDataRaw as unknown) as RawByDevice<'features'>)[device]?.features || [];
      const deviceFeature : Feature [] = deviceFeatures.map((s) => ({
        id: String(s.id),
        name: s.name,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceHardwares = ((hardwareDataRaw as unknown) as RawByDevice<'hardware'>)[device]?.hardware || [];
      const deviceHardware : Hardware [] = deviceHardwares.map((s) => ({
        id: String(s.id),
        name: s.name,
        presented: s.presented,
        appreciated: s.appreciated,
        wanted: s.wanted,
      }));

      const deviceConnexs = ((softwareDataRaw as unknown) as RawByDevice<'accessories'>)[device]?.accessories || [];
      const deviceConnex : Connex [] = deviceConnexs.map((s) => ({
        id: String(s.id),
        name: s.name,
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
      <div className="w-full flex flex-col md:flex-row items-stretch rounded-lg overflow-hidden border border-gray-200">
        <div className="w-full md:w-1/2 bg-purple-800 text-white font-bold p-3 text-center flex items-center justify-center">
          Choix du produit :
        </div>
        <div className="w-full md:w-1/2 bg-gray-100 p-3 flex items-center">
          <select
            value={selectedDevice}
            onChange={handleDeviceChange}
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">-- Sélectionner un produit --</option>
            {ECHOGRAPHES.map((device) => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductSelect;
