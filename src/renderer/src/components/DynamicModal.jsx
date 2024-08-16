import React, { useState } from 'react';
import { Modal, Box, Button } from '@mui/material';
import { openDB } from 'idb';
import FormField from './dynamicModalComponent/FormField';
import SelectorModal from './dynamicModalComponent/SelectorModal';

const DynamicModal = ({ config, onSave }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentField, setCurrentField] = useState(null);

  const handleOpen = () => {
    setFormData({});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log('Form Data:', formData);
    await saveToIndexedDB(formData);
    handleClose();
    onSave(formData);
  };

  const saveToIndexedDB = async (data) => {
    const dbConfig = config.find(item => item.database && item.objectStore);
    if (!dbConfig) {
      console.error('Database configuration not found');
      return;
    }
  
    const db = await openDB(dbConfig.database, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(dbConfig.objectStore)) {
          db.createObjectStore(dbConfig.objectStore, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  
    const tx = db.transaction(dbConfig.objectStore, 'readwrite');
    const store = tx.objectStore(dbConfig.objectStore);
  
    // Buscar el ID más alto existente en la base de datos
    const allRecords = await store.getAll();
    const maxId = allRecords.reduce((max, record) => (record.id > max ? record.id : max), 0);
  
    // Asignar el siguiente ID disponible si no existe
    if (!data.id) {
      data.id = maxId + 1;
    }
  
    // Agregar el registro a la base de datos
    await store.add(data);
    await tx.done;
  };
  

  const handleSelectorOpen = (field) => {
    setCurrentField(field);
    setSelectorOpen(true);
  };

  const handleSelectorClose = () => {
    setSelectorOpen(false);
  };

  return (
    <div>
      <Button onClick={handleOpen} variant='contained' sx={{ float: 'right', }}>Añadir Acciones y atajos</Button>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-title">
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <h2 id="modal-title">Añadir acciones</h2>
          {config.filter(field => field.type).map((field) => (
            <FormField key={field.name} field={field} formData={formData} handleChange={handleChange} handleSelectorOpen={handleSelectorOpen} />
          ))}
          <Button variant="contained" onClick={handleSubmit} fullWidth>
            Submit
          </Button>
        </Box>
      </Modal>
      {selectorOpen && currentField && (
        <SelectorModal field={currentField} formData={formData} setFormData={setFormData} onClose={handleSelectorClose} />
      )}
    </div>
  );
};

export default DynamicModal;
