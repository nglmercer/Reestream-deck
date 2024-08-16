import React, { useState, useEffect } from 'react';
import ImportDatabase from './ImportDatabase';
import ExportDatabase from './ExportDatabase';

const IndexedDBManager = () => {
  const [databases, setDatabases] = useState([]);

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    const dbs = await indexedDB.databases();
    setDatabases(dbs.map(db => db.name));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">IndexedDB Manager</h2>

      <ImportDatabase onImportComplete={loadDatabases} />
      <ExportDatabase databases={databases} onExportComplete={loadDatabases} />
    </div>
  );
};

export default IndexedDBManager;
