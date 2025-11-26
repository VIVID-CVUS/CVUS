
export default function MedecinsTable() {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-bold text-purple-800 mb-4">
        Avis des médecins
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Titres */}
        <div className="bg-purple-800 text-white font-semibold p-3 rounded text-center">
          Médecin promoteur
        </div>
        <div className="bg-purple-800 text-white font-semibold p-3 rounded text-center">
          Médecin détracteur
        </div>
        <div className="bg-purple-800 text-white font-semibold p-3 rounded text-center">
          Médecin indécis
        </div>

        {/* Champs libres */}
        <textarea
          className="border border-gray-300 p-3 rounded w-full h-24 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          placeholder="Commentaires promoteur..."
        ></textarea>

        <textarea
          className="border border-gray-300 p-3 rounded w-full h-24 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          placeholder="Commentaires détracteur..."
        ></textarea>

        <textarea
          className="border border-gray-300 p-3 rounded w-full h-24 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          placeholder="Commentaires indécis..."
        ></textarea>
      </div>
    </div>
  );
}
