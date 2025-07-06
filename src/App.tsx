// Modification du composant Product pour intégrer le EmailBodyEditor
import { useState, useRef, ChangeEvent, JSX, useEffect } from 'react';
import FormContainer from './components/Layout/FormContainer';
import ProductSelect from './components/Client/ProductSelect';
import ClientInfo from './components/Client/ClientInfo';
import TableWithComments from './components/Tables/TableWithComments';
import CommercialSelect from './components/Client/PeopleSelect';
import EmailBodyEditor from './components/Client/EmailBodyEditor.tsx';
import ActionButtons from './components/Actions/ActionButtons';
import { prepareData } from './services/dataService';
import { exportToExcel, exportToPDF } from './services/dataService';
import commerciaux from './components/data/commercials.json';
import ia from './components/data/ia.json';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';

// Types définitions inchangées...
interface Sonde {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: any;
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: any;
}

interface Hardware {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: any;
}

interface Connex {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
  [key: string]: any;
}

interface DeviceData {
  sondes: Sonde[];
  features: Feature[];
  hardware: Hardware[];
  connex: Connex[];
}

function Product(): JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  
  // Information client
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [demoDate, setDemoDate] = useState<string>('');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');

  // États pour les dispositifs
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const setSondes = useState<Sonde[]>([])[1];
  const [softwareFeatures, setSoftwareFeatures] = useState<Feature[]>([]);
  const [hardwareOptions, setHardwareOptions] = useState<Hardware[]>([]);
  const [connexOptions, setConnexOptions] = useState<Connex[]>([]);

  const [selectedSondes, setSelectedSondes] = useState<Sonde[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<Hardware[]>([]);
  const [selectedConnex, setSelectedConnex] = useState<Connex[]>([]);

  // États pour les commentaires
  const [sondesComments, setSondesComments] = useState<string>('');
  const [featuresComments, setFeaturesComments] = useState<string>('');
  const [hardwareComments, setHardwareComments] = useState<string>('');
  const [connexComments, setConnexComments] = useState<string>('');

  // États pour les commerciaux et IAs
  const [selectedCommercialEmails, setSelectedCommercialEmails] = useState<string[]>([]);
  const [selectedIAEmails, setSelectedIAEmails] = useState<string[]>([]);
  
  // État pour le corps du mail
  const [emailBody, setEmailBody] = useState<string>(() => 
    `Bonjour,\n\nVeuillez trouver ci-joint le rapport de démonstration.`
  );

  useEffect(() => {
    setEmailBody(`Bonjour,\n\nVeuillez trouver ci-joint le rapport de démonstration pour ${clientName}.`);
  }, [clientName]);

  // Gérer le changement de case à cocher (reste inchangé)
  const handleCheckboxChange = (section: string, itemId: string, field: string, value: boolean | string): void => {
    // Implémentation identique...
    switch (section) {
      case 'sondes':
        setSondes(prevSondes => {
          const updatedSondes = prevSondes.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          );
          setSelectedSondes(updatedSondes);
          return updatedSondes;
        });
        break;
      case 'features':
        setSoftwareFeatures(prevFeatures => {
          const updatedFeatures = prevFeatures.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          );
          setSelectedFeatures(updatedFeatures);
          return updatedFeatures;
        });
        break;
      case 'hardware':
        setHardwareOptions(prevHardware => {
          const updatedHardware = prevHardware.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          );
          setSelectedHardware(updatedHardware);
          return updatedHardware;
        });
        break;
      case 'connex':
        setConnexOptions(prevConnex => {
          const updatedConnex = prevConnex.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          );
          setSelectedConnex(updatedConnex);
          return updatedConnex;
        });
        break;
      default:
        break;
    }
  };

  // Fonctions pour gérer le changement des commentaires
  const handleSondesCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    setSondesComments(e.target.value);

  const handleFeaturesCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    setFeaturesComments(e.target.value);

  const handleHardwareCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    setHardwareComments(e.target.value);

  const handleConnexCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    setConnexComments(e.target.value);

  // Fonctions pour les boutons d'action (restent inchangées)
  const sendExcelToCommercial = (): void => {
    // Implementation identique...
    if (!selectedCommercialEmails.length) {
      alert("Veuillez sélectionner un commercial avant d'envoyer l'Excel.");
      return;
    }

    const data = prepareData({
      clientName,
      clientEmail,
      demoDate,
      generalRemarks,
      selectedDevice,
      sondes: selectedSondes.map(sonde => ({
        ...sonde,
        value: sonde.value || '', 
        presented: sonde.presented || false,
        appreciated: sonde.appreciated || false,
        wanted: sonde.wanted || false,
      })),
      sondesComments,
      features: softwareFeatures.map(feature => ({
        ...feature,
        value: feature.value || '', 
        presented: feature.presented || false,
        appreciated: feature.appreciated || false,
        wanted: feature.wanted || false,
      })),
      featuresComments,
      hardware: hardwareOptions.map(hardware => ({
        ...hardware,
        value: hardware.value || '', 
        presented: hardware.presented || false,
        appreciated: hardware.appreciated || false,
        wanted: hardware.wanted || false,
      })),
      hardwareComments,
      connex: connexOptions.map(connex => ({
        ...connex,
        value: connex.value || '', 
        presented: connex.presented || false,
        appreciated: connex.appreciated || false,
        wanted: connex.wanted || false,
      })),
      connexComments,
      selectedCommercialEmails,
      commerciaux,
      selectedIAEmails,
      emailBody
    });

    exportToExcel(data);
  };

  const sendPdfToCommercial = (): void => {
    // Implementation identique...
    if (!selectedCommercialEmails.length) {
      alert("Veuillez sélectionner un commercial avant d'envoyer le PDF.");
      return;
    }

    const data = prepareData({
      clientName,
      clientEmail,
      demoDate,
      generalRemarks,
      selectedDevice,
      sondes: selectedSondes.map(sonde => ({
        ...sonde,
        value: sonde.value || '',
        presented: sonde.presented || false,
        appreciated: sonde.appreciated || false,
        wanted: sonde.wanted || false,
      })),
      sondesComments,
      features: softwareFeatures.map(feature => ({
        ...feature,
        value: feature.value || '',
        presented: feature.presented || false,
        appreciated: feature.appreciated || false,
        wanted: feature.wanted || false,
      })),
      featuresComments,
      hardware: hardwareOptions.map(hardware => ({
        ...hardware,
        value: hardware.value || '',
        presented: hardware.presented || false,
        appreciated: hardware.appreciated || false,
        wanted: hardware.wanted || false,
      })),
      hardwareComments,
      connex: connexOptions.map(connex => ({
        ...connex,
        value: connex.value || '',
        presented: connex.presented || false,
        appreciated: connex.appreciated || false,
        wanted: connex.wanted || false,
      })),
      connexComments,
      selectedCommercialEmails,
      commerciaux,
      selectedIAEmails,
      emailBody
    });

    if (formRef.current) {
      exportToPDF(data, formRef as React.RefObject<HTMLFormElement>);
    }
  };

  // Mettre à jour les états des données après la sélection du dispositif
  const updateDataStates = (deviceData: DeviceData): void => {
    // Implementation identique...
    // Sondes
    if (deviceData.sondes) {
      setSondes(deviceData.sondes);
      setSelectedSondes(deviceData.sondes);
    } else {
      setSondes([]);
      setSelectedSondes([]);
    }

    // Features
    if (deviceData.features) {
      setSoftwareFeatures(deviceData.features);
      setSelectedFeatures(deviceData.features);
    } else {
      setSoftwareFeatures([]);
      setSelectedFeatures([]);
    }

    // Hardware
    if (deviceData.hardware) {
      setHardwareOptions(deviceData.hardware);
      setSelectedHardware(deviceData.hardware);
    } else {
      setHardwareOptions([]);
      setSelectedHardware([]);
    }

    // Connex
    if (deviceData.connex) {
      setConnexOptions(deviceData.connex);
      setSelectedConnex(deviceData.connex);
    } else {
      setConnexOptions([]);
      setSelectedConnex([]);
    }

    // Réinitialiser les commentaires
    setSondesComments('');
    setFeaturesComments('');
    setHardwareComments('');
    setConnexComments('');
  };

  return (
    <FormContainer formRef={formRef}>
      <ClientInfo
        clientName={clientName}
        clientEmail={clientEmail}
        demoDate={demoDate}
        generalRemarks={generalRemarks}
        setClientName={setClientName}
        setClientEmail={setClientEmail}
        setDemoDate={setDemoDate}
        setGeneralRemarks={setGeneralRemarks}
      />

      <ProductSelect
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        updateDataStates={updateDataStates}
      />

      {selectedDevice && (
        <div>
          <div className="flex flex-wrap -mx-2">
            {/* Colonne de gauche */}
            <div className="w-full md:w-1/2 px-2">
              <TableWithComments
                title="Sondes"
                data={selectedSondes}
                section="sondes"
                comments={sondesComments}
                handleCommentsChange={handleSondesCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
              <TableWithComments
                title="Options Sofwares"
                data={selectedFeatures}
                section="features"
                comments={featuresComments}
                handleCommentsChange={handleFeaturesCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
            </div>

            {/* Colonne de droite */}
            <div className="w-full md:w-1/2 px-2">
              <TableWithComments
                title="Options Hardwares"
                data={selectedHardware}
                section="hardware"
                comments={hardwareComments}
                handleCommentsChange={handleHardwareCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
              <TableWithComments
                title="Connectivités et imprimantes"
                data={selectedConnex}
                section="connex"
                comments={connexComments}
                handleCommentsChange={handleConnexCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
            </div>
          </div>

          {/* Section des sélecteurs */}
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Commercial select */}
              <div className="w-full">
                <CommercialSelect
                  selectedEmails={selectedCommercialEmails}
                  setSelectedEmails={setSelectedCommercialEmails}
                  commerciaux={commerciaux}
                  title="Commercial"
                  multiple={true}
                />
              </div>

              {/* IA select */}
              <div className="w-full">
                <CommercialSelect
                  selectedEmails={selectedIAEmails}
                  setSelectedEmails={setSelectedIAEmails}
                  commerciaux={ia}
                  title="IAs en copie"
                  multiple={true}
                />
              </div>
            </div>

            {/* Corps du mail */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <EmailBodyEditor 
                emailBody={emailBody}
                setEmailBody={setEmailBody}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4">
              <ActionButtons
                selectedCommercial={true}
                downloadPdf={sendExcelToCommercial}
                sendPdfToCommercial={sendPdfToCommercial}
              />
            </div>
          </div>

          {/* Button pour la soumission du formulaire */}
          <div className="mt-8 pb-8 flex justify-center">
            <button
              className="bg-purple-800 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg flex items-center text-lg"
              onClick={sendPdfToCommercial}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </FormContainer>
  );
}

function ProductWithAuth(): JSX.Element {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={(password) => {
      if (!login(password)) {
        alert('Mot de passe incorrect');
      }
    }} />;
  }

  return <Product />;
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <ProductWithAuth />
    </AuthProvider>
  );
}
