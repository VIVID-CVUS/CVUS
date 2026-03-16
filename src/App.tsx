// Modification du composant Product pour intégrer le EmailBodyEditor
import { ChangeEvent, JSX, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ActionButtons from './components/Actions/ActionButtons';
import Login from './components/Auth/Login';
import ClientInfo from './components/Client/ClientInfo';
import EmailBodyEditor from './components/Client/EmailBodyEditor.tsx';
import CommercialSelect from './components/Client/PeopleSelect';
import ProductSelect from './components/Client/ProductSelect';
import commerciaux from './components/data/commercials.json';
import ia from './components/data/ia.json';
import FormContainer from './components/Layout/FormContainer';
import TableWithComments from './components/Tables/TableWithComments';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MedecinsTable from './components/Client/MedecinsTable';

// Types définitions inchangées...
interface Sonde {
  id: string;
  name: string;
  description?: string;
  presented?: boolean;
  appreciated?: boolean;
  wanted?: boolean;
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

interface DeviceData {
  sondes: Sonde[];
  features: Feature[];
  hardware: Hardware[];
  connex: Connex[];
}

type EchoPage = {
  clientName: string;
  clientEmail: string;
  demoDate: string;
  lieuService: string;
  generalRemarks: string;
  selectedDevice: string;
  selectedSondes: Sonde[];
  selectedFeatures: Feature[];
  selectedHardware: Hardware[];
  selectedConnex: Connex[];
  sondesComments: string;
  featuresComments: string;
  hardwareComments: string;
  connexComments: string;
  promoteurNotes: string;
  detracteurNotes: string;
  indecisNotes: string;
};

const createEmptyEchoPage = (): EchoPage => ({
  clientName: '',
  clientEmail: '',
  demoDate: '',
  lieuService: '',
  generalRemarks: '',
  selectedDevice: '',
  selectedSondes: [],
  selectedFeatures: [],
  selectedHardware: [],
  selectedConnex: [],
  sondesComments: '',
  featuresComments: '',
  hardwareComments: '',
  connexComments: '',
  promoteurNotes: '',
  detracteurNotes: '',
  indecisNotes: '',
});

function Product(): JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);

  const [echoPages, setEchoPages] = useState<EchoPage[]>([createEmptyEchoPage()]);
  const [activeEchoIndex, setActiveEchoIndex] = useState<number>(0);

  // États pour les commerciaux et IAs
  const [selectedCommercialEmails, setSelectedCommercialEmails] = useState<string[]>([]);
  const [selectedIAEmails, setSelectedIAEmails] = useState<string[]>([]);

  // État pour le corps du mail
  const [emailBody, setEmailBody] = useState<string>(() =>
    `Bonjour,\n\nVeuillez trouver ci-joint le rapport de démonstration.`
  );

  const activeEcho = echoPages[activeEchoIndex] ?? createEmptyEchoPage();

  useEffect(() => {
    setEmailBody(`Bonjour,\n\nVeuillez trouver ci-joint le rapport de démonstration pour ${activeEcho.clientName}.`);
  }, [activeEcho.clientName]);

  const updateActiveEcho = (updater: (prev: EchoPage) => EchoPage): void => {
    setEchoPages((prev) => prev.map((page, idx) => (idx === activeEchoIndex ? updater(page) : page)));
  };

  const addEchographePage = (): void => {
    const newIndex = echoPages.length;
    setEchoPages([...echoPages, createEmptyEchoPage()]);
    setActiveEchoIndex(newIndex);
  };

  // Gérer le changement de case à cocher (reste inchangé)
  const handleCheckboxChange = (section: string, itemId: string, field: string, value: boolean | string): void => {
    const updateList = <T extends { id: string }>(list: T[]): T[] => (
      list.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );

    updateActiveEcho((prev) => {
      switch (section) {
        case 'sondes':
          return { ...prev, selectedSondes: updateList(prev.selectedSondes) };
        case 'features':
          return { ...prev, selectedFeatures: updateList(prev.selectedFeatures) };
        case 'hardware':
          return { ...prev, selectedHardware: updateList(prev.selectedHardware) };
        case 'connex':
          return { ...prev, selectedConnex: updateList(prev.selectedConnex) };
        default:
          return prev;
      }
    });
  };

  // Fonctions pour gérer le changement des commentaires
  const handleSondesCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    updateActiveEcho((prev) => ({ ...prev, sondesComments: e.target.value }));

  const handleFeaturesCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    updateActiveEcho((prev) => ({ ...prev, featuresComments: e.target.value }));

  const handleHardwareCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    updateActiveEcho((prev) => ({ ...prev, hardwareComments: e.target.value }));

  const handleConnexCommentsChange = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    updateActiveEcho((prev) => ({ ...prev, connexComments: e.target.value }));

  const buildPreparedDataList = async () => {
    const { prepareData } = await import('./services/dataService');

    return echoPages
      .filter((page) => page.selectedDevice)
      .map((page) =>
        prepareData({
          clientName: page.clientName,
          clientEmail: page.clientEmail,
          demoDate: page.demoDate,
          lieuService: page.lieuService,
          generalRemarks: page.generalRemarks,
          selectedDevice: page.selectedDevice,
          sondes: page.selectedSondes.map((sonde) => ({
            ...sonde,
            value: Boolean(sonde.value),
            presented: sonde.presented || false,
            appreciated: sonde.appreciated || false,
            wanted: sonde.wanted || false,
          })),
          sondesComments: page.sondesComments,
          features: page.selectedFeatures.map((feature) => ({
            ...feature,
            value: Boolean(feature.value),
            presented: feature.presented || false,
            appreciated: feature.appreciated || false,
            wanted: feature.wanted || false,
          })),
          featuresComments: page.featuresComments,
          hardware: page.selectedHardware.map((hardware) => ({
            ...hardware,
            value: Boolean(hardware.value),
            presented: hardware.presented || false,
            appreciated: hardware.appreciated || false,
            wanted: hardware.wanted || false,
          })),
          hardwareComments: page.hardwareComments,
          connex: page.selectedConnex.map((connex) => ({
            ...connex,
            value: Boolean(connex.value),
            presented: connex.presented || false,
            appreciated: connex.appreciated || false,
            wanted: connex.wanted || false,
          })),
          connexComments: page.connexComments,
          selectedCommercialEmails,
          commerciaux,
          selectedIAEmails,
          emailBody,
          medecins: {
            promoteur: page.promoteurNotes,
            detracteur: page.detracteurNotes,
            indecis: page.indecisNotes,
          },
        })
      );
  };

  // Fonctions pour les boutons d'action (restent inchangées)
  const sendExcelToCommercial = async (): Promise<void> => {
    const { exportMultipleToExcel } = await import('./services/dataService');
    const preparedDataList = await buildPreparedDataList();
    if (!preparedDataList.length) {
      alert('Veuillez sélectionner au moins un échographe avant le téléchargement.');
      return;
    }

    await exportMultipleToExcel(preparedDataList);
  };

  const sendPdfToCommercial = async (): Promise<void> => {
    const { exportMultipleToPDF } = await import('./services/dataService');

    // Implementation identique...
    if (!selectedCommercialEmails.length) {
      alert("Veuillez sélectionner un commercial avant d'envoyer le PDF.");
      return;
    }

    const preparedDataList = await buildPreparedDataList();
    if (!preparedDataList.length) {
      alert('Veuillez sélectionner au moins un échographe avant l\'envoi.');
      return;
    }

    if (formRef.current) {
      await exportMultipleToPDF(preparedDataList, formRef as React.RefObject<HTMLFormElement>);
    }
  };

  // Mettre à jour les états des données après la sélection du dispositif
  const updateDataStates = (deviceData: DeviceData): void => {
    updateActiveEcho((prev) => ({
      ...prev,
      selectedSondes: deviceData.sondes || [],
      selectedFeatures: deviceData.features || [],
      selectedHardware: deviceData.hardware || [],
      selectedConnex: deviceData.connex || [],
      sondesComments: '',
      featuresComments: '',
      hardwareComments: '',
      connexComments: '',
    }));
  };

  return (
    <FormContainer formRef={formRef}>
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {echoPages.map((_, index) => (
            <button
              key={`echo-page-${index}`}
              type="button"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeEchoIndex === index
                  ? 'bg-purple-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveEchoIndex(index)}
            >
              {`Échographe ${index + 1}`}
            </button>
          ))}
        </div>
      </div>

      <ClientInfo
        clientName={activeEcho.clientName}
        clientEmail={activeEcho.clientEmail}
        demoDate={activeEcho.demoDate}
        lieuService={activeEcho.lieuService}
        generalRemarks={activeEcho.generalRemarks}
        setClientName={(value) => updateActiveEcho((prev) => ({ ...prev, clientName: value }))}
        setClientEmail={(value) => updateActiveEcho((prev) => ({ ...prev, clientEmail: value }))}
        setDemoDate={(value) => updateActiveEcho((prev) => ({ ...prev, demoDate: value }))}
        setLieuService={(value) => updateActiveEcho((prev) => ({ ...prev, lieuService: value }))}
        setGeneralRemarks={(value) => updateActiveEcho((prev) => ({ ...prev, generalRemarks: value }))}
      />

      <MedecinsTable
        promoteur={activeEcho.promoteurNotes}
        setPromoteur={(v) => updateActiveEcho((prev) => ({ ...prev, promoteurNotes: v }))}
        detracteur={activeEcho.detracteurNotes}
        setDetracteur={(v) => updateActiveEcho((prev) => ({ ...prev, detracteurNotes: v }))}
        indecis={activeEcho.indecisNotes}
        setIndecis={(v) => updateActiveEcho((prev) => ({ ...prev, indecisNotes: v }))}
      />
      <ProductSelect
        selectedDevice={activeEcho.selectedDevice}
        setSelectedDevice={(device) => updateActiveEcho((prev) => ({ ...prev, selectedDevice: device }))}
        updateDataStates={updateDataStates}
      />

      {activeEcho.selectedDevice && (
        <div>
          <div className="flex flex-wrap -mx-2">
            {/* Colonne de gauche */}
            <div className="w-full md:w-1/2 px-2">
              <TableWithComments
                title="Sondes"
                data={activeEcho.selectedSondes}
                section="sondes"
                comments={activeEcho.sondesComments}
                handleCommentsChange={handleSondesCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
              <TableWithComments
                title="Option Software"
                data={activeEcho.selectedFeatures}
                section="features"
                comments={activeEcho.featuresComments}
                handleCommentsChange={handleFeaturesCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
            </div>

            {/* Colonne de droite */}
            <div className="w-full md:w-1/2 px-2">
              <TableWithComments
                title="Option Hardware"
                data={activeEcho.selectedHardware}
                section="hardware"
                comments={activeEcho.hardwareComments}
                handleCommentsChange={handleHardwareCommentsChange}
                handleCheckboxChange={handleCheckboxChange}
              />
              <TableWithComments
                title="Connectivité et imprimante"
                data={activeEcho.selectedConnex}
                section="connex"
                comments={activeEcho.connexComments}
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
                  title="Destinataire"
                  multiple={true}
                />
              </div>

              {/* IA select */}
              <div className="w-full">
                <CommercialSelect
                  selectedEmails={selectedIAEmails}
                  setSelectedEmails={setSelectedIAEmails}
                  commerciaux={ia}
                  title="Copie"
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
                selectedCommercial={!!selectedCommercialEmails.length}
                addEchographe={addEchographePage}
                downloadPdf={sendExcelToCommercial}
                sendPdfToCommercial={sendPdfToCommercial}
              />
            </div>
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
      <Router>
        <Routes>
          <Route path="/" element={<ProductWithAuth />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
