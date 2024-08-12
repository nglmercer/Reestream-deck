import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import GridComponent from './components/GridComponent';
import Modalconfig from './modalconfig';
import socketManager from './utils/socket';
const DB_NAME = 'myCustomDatabase';
const STORE_NAME = 'customFormData';

const Gridcontent = () => {
  const [items, setItems] = useState([]);
  const [editorMode, setEditorMode] = useState(false);

  useEffect(() => {
    socketManager.onMessage('keypressed', (data) => {
      console.log('Keypressed:', data);
    });
    async function loadItemsFromDB() {
      try {
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
          },
        });
  
        const dbItems = await db.getAll(STORE_NAME);
        console.log('Items cargados de IndexedDB:', dbItems);
        
        const dbItemsCopy = JSON.parse(JSON.stringify(dbItems));
        
        const mappedItems = mapItemsManually(dbItemsCopy);
        setItems(mappedItems);
      } catch (error) {
        console.error('Error loading items from IndexedDB:', error);
      }
    }
    loadItemsFromDB();
  }, [items.length]); // Añadimos items.length como dependencia

  const mapItemsManually = (dbItems) => {
    console.log(dbItems);
    return dbItems.map((item) => ({
      id: item.id,
      content: item.nombre,
      value: item.keyvalue,
      position: item.position ? { ...item.position } : { x: 0, y: 0 },
    }));
  };

  const handleReorder = (newOrder) => {
    setItems(newOrder);
    console.log('Nuevo orden:', newOrder);
  };

  const handleDelete = async (id) => {
    console.log('Eliminando elemento con ID:', id);
    if (id === null) {
      setItems([]);
      try {
        const db = await openDB(DB_NAME, 1);
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.store.clear();
        await tx.done;
      } catch (error) {
        console.error('Error clearing IndexedDB:', error);
      }
    } else {
      try {
        const db = await openDB(DB_NAME, 1);
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.store.delete(id);
        await tx.done;
        
        // Actualizar el estado local después de eliminar de IndexedDB
        // setItems(prevItems => prevItems.filter(item => item.id !== id));
        
        console.log('Elemento eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting item from IndexedDB:', error);
      }
    }
  };
  function handleCallback(data) {
    console.log('callback 1234124124', data, data.value);
  
    if (data.value.length > 0) {
      const keysToPress = data.value.map(item => Number(item.value));
  
      // Enviar todas las teclas a la vez
      socketManager.emitMessage('presskey', keysToPress);
    }
  }
  
  return (
    <div>
      <h1>React Grid Layout con Modo Editor y Papelera</h1>
      <Modalconfig />
      <button className='btn btn-primary' onClick={() => setEditorMode(!editorMode)}>
        {editorMode ? 'Desactivar Modo Editor' : 'Activar Modo Editor'}
      </button>
      <GridComponent
        items={items}
        onReorder={handleReorder}
        onDelete={handleDelete}
        editorMode={editorMode}
        callback={handleCallback}
      />
    </div>
  );
};
export default Gridcontent;