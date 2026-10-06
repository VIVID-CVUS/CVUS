import React from 'react';
import rawSondesData from '../data/sonde.json';
import featuresDatas from '../data/feature.json';
import hardwareDatas from '../data/hardware.json';
import softwareDatas from '../data/connex.json';
import { ECHOGRAPHES } from '../data/echographes';

interface HardwareData {
  id: number;
  name: string;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
}

interface DeviceHardware {
  hardware : HardwareData[];
}

type Hardware = {
  [deviceName: string]: DeviceHardware;
};

const hardwareData= hardwareDatas as Hardware;

interface SoftwareData {
  id: number;
  name: string;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
}

interface DeviceSoftware {
  accessories : SoftwareData[];
}

type Software = {
  [deviceName: string]: DeviceSoftware;
};


const softwareData =  softwareDatas as Software;


interface FeaturesData {
  id: number;
  name: string;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
}

interface DeviceFeatures {
  features : FeaturesData[];
}

type Features = {
  [features : string] : DeviceFeatures;
};


const featuresData = featuresDatas as Features;

interface Sonde {
  id: number;
  name: string;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
}

interface DeviceSondes {
  sondes: Sonde[];
}

type SondesData = {
  [deviceName: string]: DeviceSondes;
};

const sondesData = rawSondesData as SondesData;

interface DeviceData {
  sondes: Sonde[] | undefined;
  features: FeaturesData[] | undefined;
  hardware: HardwareData[] | undefined;
  connex: SoftwareData[] | undefined;
}

interface ProductSelectProps {
  selectedDevice: string;
  setSelectedDevice: (device: string) => void;
  updateDataStates: (data: DeviceData) => void;
}

const ProductSelect: React.FC<ProductSelectProps> = ({
  selectedDevice,
  setSelectedDevice,
  updateDataStates
}) => {
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value;
    setSelectedDevice(device);

    // Récupérer les données des fichiers JSON en fonction du dispositif
    const deviceData: DeviceData = {
      sondes: sondesData[device]?.sondes,
      features: featuresData[device]?.features,
      hardware: hardwareData[device]?.hardware,
      connex: softwareData[device]?.accessories
    };

    updateDataStates(deviceData);
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className="w-1/3 bg-purple-800 text-white font-bold p-3 rounded-l-lg text-center">
          Choix du produit :
        </div>
        <div className="w-2/3 bg-gray-100 p-3 rounded-r-lg flex items-center">
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
