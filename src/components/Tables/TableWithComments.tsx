// src/components/Tables/TableWithComments.tsx
import React from 'react';

type Item = {
  id : string;
  name: string;
  presented?: boolean; // optional
  appreciated?: boolean; // optional
  wanted?: boolean; // optional
  value?: string | number | boolean | undefined;
};

type Props = {
  title: string;
  data: Item[];
  section: string;
  comments: string;
  handleCommentsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleCheckboxChange: (
    section: string,
    key: string,
    field: 'presented' | 'appreciated' | 'wanted',
    value: boolean
  ) => void;
};
const TableWithComments: React.FC<Props> = ({
  title,
  data,
  section,
  comments,
  handleCommentsChange,
  handleCheckboxChange
}) => {
  const isEuroData = (value: unknown): boolean => String(value ?? '').includes('€');
  const hasCopiedPresentedSelection =
    data.length > 0 &&
    data.every((item) => Boolean(item.appreciated) === Boolean(item.presented)) &&
    data.some((item) => Boolean(item.appreciated));
  const hasInversePresentedSelection =
    data.length > 0 &&
    data.every(
      (item) => Boolean(item.wanted) === (Boolean(item.presented) && !Boolean(item.appreciated))
    ) &&
    data.some((item) => Boolean(item.wanted));

  return (
    <div className="w-full mb-6 bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-3 text-purple-800">{title}</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="bg-purple-800 text-white font-bold p-2 text-center border border-gray-300">{title}</th>
            <th className="bg-purple-800 text-white font-bold p-2 text-center border border-gray-300">
              <div className="flex flex-col items-center gap-1">
                <span>Présenté</span>
                <button
                  type="button"
                  className="text-xs bg-white text-purple-800 px-2 py-0.5 rounded font-semibold hover:bg-gray-100"
                  onClick={() => {
                    const areAllPresented = data.length > 0 && data.every((item) => !!item.presented);
                    data.forEach((item) => {
                      handleCheckboxChange(section, item.id, 'presented', !areAllPresented);
                    });
                  }}
                >
                  Tout
                </button>
              </div>
            </th>
            <th className="bg-purple-800 text-white font-bold p-2 text-center border border-gray-300">
              <div className="flex flex-col items-center gap-1">
                <span>Souhaité par le client</span>
                <button
                  type="button"
                  className="text-xs bg-white text-purple-800 px-2 py-0.5 rounded font-semibold hover:bg-gray-100"
                  onClick={() => {
                    data.forEach((item) => {
                      handleCheckboxChange(
                        section,
                        item.id,
                        'appreciated',
                        hasCopiedPresentedSelection ? false : Boolean(item.presented)
                      );
                    });
                  }}
                >
                  Copie
                </button>
              </div>
            </th>
            <th className="bg-purple-800 text-white font-bold p-2 text-center border border-gray-300">
              <div className="flex flex-col items-center gap-1">
                <span>Non Souhaité par le client</span>
                <button
                  type="button"
                  className="text-xs bg-white text-purple-800 px-2 py-0.5 rounded font-semibold hover:bg-gray-100"
                  onClick={() => {
                    data.forEach((item) => {
                      handleCheckboxChange(
                        section,
                        item.id,
                        'wanted',
                        hasInversePresentedSelection
                          ? false
                          : Boolean(item.presented) && !Boolean(item.appreciated)
                      );
                    });
                  }}
                >
                  Inverse
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item) => (
              <tr
                key={item.id}
                className={item.value || item.presented ? 'bg-white' : 'bg-gray-200'}
              >
                <td
                  className={`border border-gray-300 p-2 text-center ${
                    isEuroData(item.name) ? 'font-bold text-purple-700' : ''
                  }`}
                >
                  {item.name}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <input
                    type="checkbox"
                    checked={item.presented}
                    onChange={(e) =>
                      handleCheckboxChange(
                        section,
                        item.id,
                        'presented',
                        e.target.checked
                      )
                    }
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <input
                    type="checkbox"
                    checked={item.appreciated}
                    onChange={(e) =>
                      handleCheckboxChange(
                        section,
                        item.id,
                        'appreciated',
                        e.target.checked
                      )
                    }
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <input
                    type="checkbox"
                    checked={item.wanted}
                    onChange={(e) =>
                      handleCheckboxChange(
                        section,
                        item.id,
                        'wanted',
                        e.target.checked
                      )
                    }
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center text-gray-500 p-4">
                Aucun élément disponible pour ce produit.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Zone de commentaires sous le tableau */}
      <div className="mt-3">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Commentaires sur {title.toLowerCase()}</h3>
        <textarea
          className="w-full p-2 border border-gray-300 rounded min-h-20 focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={comments}
          onChange={handleCommentsChange}
          placeholder={`Commentaires concernant les ${title.toLowerCase()}...`}
        ></textarea>
      </div>
    </div>
  );
};

export default TableWithComments;