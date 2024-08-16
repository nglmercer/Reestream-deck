import React, { useState } from 'react';
import { openDB } from 'idb';

const ExportDatabase = ({ databases, onExportComplete }) => {
  const [exportFormat, setExportFormat] = useState('file');
  const [exportedData, setExportedData] = useState('');

  const exportDatabase = async (dbName) => {
    const db = await openDB(dbName);
    const data = {};

    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const allRecords = await store.getAll();
      data[storeName] = allRecords;
    }

    const jsonData = JSON.stringify(data);

    if (exportFormat === 'file') {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dbName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (exportFormat === 'string') {
      setExportedData(jsonData);
    }

    onExportComplete();
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">Export Options</h3>
      <label className="mr-2">
        <input
          type="radio"
          name="exportFormat"
          value="file"
          checked={exportFormat === 'file'}
          onChange={() => setExportFormat('file')}
        />
        Export as File
      </label>
      <label className="ml-4">
        <input
          type="radio"
          name="exportFormat"
          value="string"
          checked={exportFormat === 'string'}
          onChange={() => setExportFormat('string')}
        />
        Export as String
      </label>

      {exportFormat === 'string' && (
        <div className="mt-4">
          <textarea
            value={exportedData}
            readOnly
            className="w-full p-2 border border-gray-400 rounded mb-2"
            rows="6"
            placeholder="Exported JSON will appear here..."
          />
          <button
            onClick={() => navigator.clipboard.writeText(exportedData)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      <ul className="mb-4">
        {databases.map(db => (
          <li key={db} className="mb-2">
            {db}
            <button
              onClick={() => exportDatabase(db)}
              className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
            >
              Export
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExportDatabase;
