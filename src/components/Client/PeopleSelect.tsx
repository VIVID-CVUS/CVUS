import { useState, useEffect } from 'react';

interface Person {
  name: string;
  email: string;
  [key: string]: string | undefined;
}

interface PeopleSelectProps {
  selectedEmails: string[];
  setSelectedEmails: React.Dispatch<React.SetStateAction<string[]>>;
  commerciaux: Person[];
  title: string;
  multiple?: boolean;
}

const PeopleSelect: React.FC<PeopleSelectProps> = ({
  selectedEmails,
  setSelectedEmails,
  commerciaux,
  title,
  multiple = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>(commerciaux);
  
  // Filtrer les commerciaux basés sur le terme de recherche
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPeople(commerciaux);
    } else {
      const filtered = commerciaux.filter(
        (person) =>
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPeople(filtered);
    }
  }, [searchTerm, commerciaux]);

  const handleSelect = (email: string) => {
    if (multiple) {
      // Pour la sélection multiple, basculer l'état de sélection
      if (selectedEmails.includes(email)) {
        setSelectedEmails(selectedEmails.filter((e) => e !== email));
      } else {
        setSelectedEmails([...selectedEmails, email]);
      }
    } else {
      // Pour la sélection unique, remplacer la sélection actuelle
      setSelectedEmails([email]);
      setIsDropdownOpen(false);
    }
  };

  // Obtenir les noms des personnes sélectionnées
  const getSelectedNames = () => {
    return commerciaux
      .filter(person => selectedEmails.includes(person.email))
      .map(person => person.name)
      .join(', ');
  };

  return (
    <div className="relative">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {title} {multiple && "(sélection multiple)"}
      </label>
      
      {/* Champ d'affichage et de recherche */}
      <div 
        className="w-full flex items-center justify-between p-3 border rounded-lg bg-white cursor-pointer hover:bg-gray-50"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex-grow truncate">
          {selectedEmails.length > 0 ? (
            <span className="text-gray-800">{getSelectedNames()}</span>
          ) : (
            <span className="text-gray-400">Sélectionner {title.toLowerCase()}</span>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform duration-300 ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>

      {/* Dropdown pour la sélection */}
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Champ de recherche */}
          <div className="p-2 border-b sticky top-0 bg-white">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Liste des personnes */}
          <div>
            {filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <div
                  key={person.email}
                  className={`p-3 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                    selectedEmails.includes(person.email) ? 'bg-purple-100' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(person.email);
                  }}
                >
                  <div>
                    <div className="font-medium">{person.name}</div>
                    <div className="text-sm text-gray-500">{person.email}</div>
                  </div>
                  {selectedEmails.includes(person.email) && (
                    <svg
                      className="h-5 w-5 text-purple-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">Aucun résultat trouvé</div>
            )}
          </div>
        </div>
      )}
      
      {/* Badges pour les sélections multiples */}
      {multiple && selectedEmails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedEmails.map((email) => {
            const person = commerciaux.find((p) => p.email === email);
            return person ? (
              <div
                key={email}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center text-sm"
              >
                {person.name}
                <button
                  className="ml-2 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(email);
                  }}
                >
                  <svg
                    className="h-4 w-4 text-purple-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default PeopleSelect;