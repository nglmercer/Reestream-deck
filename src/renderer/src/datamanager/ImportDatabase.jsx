import React, { useState, useEffect } from 'react';
import { openDB, deleteDB } from 'idb';

const ImportDatabase = ({ onImportComplete }) => {
  const [importFormat, setImportFormat] = useState('file');
  const [importedData, setImportedData] = useState('');
  const [dbNames, setDbNames] = useState([]);
  const [selectedDbName, setSelectedDbName] = useState('');
  const [newDbName, setNewDbName] = useState('');

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const dbList = await indexedDB.databases();
      setDbNames(dbList.map(db => db.name));
    } catch (error) {
      console.error('Failed to load databases', error);
      alert('Failed to load databases.');
    }
  };

  const importDatabaseFromFile = async (e) => {
    try {
      const file = e.target.files[0];
      if (file.type !== "application/json") {
        alert("Please upload a valid JSON file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const dbName = selectedDbName || file.name.replace('.json', '');
          await importDatabaseFromData(data, dbName);
        } catch (error) {
          alert('Invalid JSON file.');
        }
      };

      reader.readAsText(file);
    } catch (error) {
      alert('Failed to read the file.');
    }
  };

  const importDatabaseFromData = async (data, dbName) => {
    try {
      await deleteDB(dbName);
      const db = await openDB(dbName, 1, {
        upgrade(db) {
          for (const storeName in data) {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
          }
        },
      });

      for (const storeName in data) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const record of data[storeName]) {
          await store.add(record);
        }
        await tx.done;
      }

      onImportComplete();
      alert('Database imported successfully');
    } catch (error) {
      alert('Failed to import the database.');
    }
  };

  const importDatabaseFromString = async () => {
    try {
      const data = JSON.parse(importedData);
      const dbName = selectedDbName || newDbName;

      if (dbName) {
        await importDatabaseFromData(data, dbName);
      }
    } catch (error) {
      alert('Invalid JSON string.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    importDatabaseFromFile({ target: { files: e.dataTransfer.files } });
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">Import Options</h3>

      <label className="mr-2">
        <input
          type="radio"
          name="importFormat"
          value="file"
          checked={importFormat === 'file'}
          onChange={() => setImportFormat('file')}
        />
        Import from File
      </label>

      <label className="ml-4">
        <input
          type="radio"
          name="importFormat"
          value="string"
          checked={importFormat === 'string'}
          onChange={() => setImportFormat('string')}
        />
        Import from String
      </label>

      <div className="mt-4">
        <h4 className="text-md font-semibold">Select or Create Database</h4>
        <select
          value={selectedDbName}
          onChange={(e) => setSelectedDbName(e.target.value)}
          className="mb-2 p-2 border border-gray-400 rounded"
        >
          <option value="">Select Existing Database</option>
          {dbNames.map((dbName) => (
            <option key={dbName} value={dbName}>
              {dbName}
            </option>
          ))}
        </select>
      </div>

      {importFormat === 'file' && (
        <div className="mt-4">
          <input
            type="file"
            onChange={importDatabaseFromFile}
            className="mb-2"
          />
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-400 p-4 text-center"
          >
            Drag and drop a JSON file here to import a database
          </div>
        </div>
      )}

      {importFormat === 'string' && (
        <div className="mt-4">
          <textarea
            value={importedData}
            onChange={(e) => setImportedData(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded mb-2"
            rows="6"
            placeholder="Paste JSON here..."
          />
          <button
            onClick={importDatabaseFromString}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Import
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportDatabase;
