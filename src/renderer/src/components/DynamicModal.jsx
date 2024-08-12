import React, { useState } from 'react';
import { Modal, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Paper, Typography, Checkbox, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { openDB } from 'idb';

const DynamicModal = ({ config, onSave }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [tempSelection, setTempSelection] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpen = () => setOpen(true);
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

    await db.put(dbConfig.objectStore, data);
  };

  const handleOptionToggle = (option) => {
    const currentIndex = tempSelection.findIndex(item => item.value === option.value);
    const newSelection = [...tempSelection];

    if (currentIndex === -1) {
      newSelection.push(option);
    } else {
      newSelection.splice(currentIndex, 1);
    }

    setTempSelection(newSelection);
  };

  const handleSelectorClose = () => {
    setSelectorOpen(false);
    setTempSelection([]);
    setSearchQuery('');
  };

  const handleSelectorOpen = (field) => {
    setCurrentField(field);
    setTempSelection(formData[field.name] || []);
    setSelectorOpen(true);
  };

  const handleSelectionConfirm = () => {
    setFormData((prevData) => ({
      ...prevData,
      [currentField.name]: currentField.type === 'objectSelect' ? tempSelection[0] : tempSelection,
    }));
    handleSelectorClose();
  };

  const filteredOptions = currentField?.options?.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderField = (field) => {
    switch (field.type) {
      case 'input':
        return (
          <TextField
            key={field.name}
            label={field.label}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type={field.inputType || 'text'}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth margin="normal" key={field.name}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
            >
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'objectSelect':
      case 'multiSelect':
        return (
          <FormControl fullWidth margin="normal" key={field.name}>
            <Typography className='text-gray-700'>{field.label}</Typography>
            <Button variant='outlined' onClick={() => handleSelectorOpen(field)}>
              {formData[field.name] 
                ? (Array.isArray(formData[field.name]) 
                  ? formData[field.name].map(item => item.label).join(', ')
                  : formData[field.name].label)
                : `Select ${field.label}`}
            </Button>
          </FormControl>
        );
      default:
        return null;
    }
  };

  const renderSelectorModal = () => (
    <Modal
      open={selectorOpen}
      onClose={handleSelectorClose}
      aria-labelledby="selector-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: 600,
        maxHeight: '80%',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        overflow: 'auto',
      }}>
        <Typography variant="h6" id="selector-title">
          Select {currentField?.label}
          <IconButton
            aria-label="close"
            onClick={handleSelectorClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Typography>
        <TextField
          sx={{ mb: 2 }}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Grid container spacing={2} sx={{ mt: 2 }}>
 {filteredOptions.map((option) => (             
 <Grid item xs={4} sm={3} md={2} key={option.value}>               
 <Paper                 elevation={3}                 sx={{                   p: 2,                   display: 'flex',                   flexDirection: 'column',                   alignItems: 'center',                   cursor: 'pointer',                   bgcolor: tempSelection.some(item => item.value === option.value) ? 'action.selected' : 'background.paper',                 }}                 onClick={() => handleOptionToggle(option)}               >                 <Checkbox                   checked={tempSelection.some(item => item.value === option.value)}                   sx={{ p: 0, mb: 1 }}                 />                 
 <Typography variant="body2" align="center">                   {option.label}                 
 </Typography>               </Paper>             </Grid>           ))}
        </Grid>
        <Button onClick={handleSelectionConfirm} fullWidth variant="contained" sx={{ mt: 2 }}>
          Confirm
        </Button>
      </Box>
    </Modal>
  );

  return (
    <div>
      <Button onClick={handleOpen} variant='contained' sx={{ mt: 2 }}>Open Modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
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
          <h2 id="modal-title" className='text-gray-700'>Añadir acciones</h2>
          {config.filter(field => field.type).map((field) => renderField(field))}
          <Button variant="contained" onClick={handleSubmit} fullWidth>
            Submit
          </Button>
        </Box>
      </Modal>
      {renderSelectorModal()}

    </div>
  );
};

export default DynamicModal;
