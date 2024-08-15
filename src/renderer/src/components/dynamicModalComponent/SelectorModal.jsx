import React, { useState } from 'react';
import { Modal, Box, Button, Grid, Paper, Typography, Checkbox, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SelectorModal = ({ field, formData, setFormData, onClose }) => {
  const [tempSelection, setTempSelection] = useState(formData[field.name] || []);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSelectionConfirm = () => {
    setFormData((prevData) => ({
      ...prevData,
      [field.name]: field.type === 'objectSelect' ? tempSelection[0] : tempSelection,
    }));
    onClose();
  };

  const filteredOptions = field.options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal open={true} onClose={onClose}>
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
        p: 2,
        overflow: 'auto',
      }}>
        <Typography variant="h6">
          Select {field.label}
          <IconButton
            aria-label="close"
            onClick={onClose}
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
          sx={{ mb: 1 }}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Grid container spacing={1} sx={{ mt: 2 }}>
        <Button onClick={handleSelectionConfirm} fullWidth variant="contained">
          Confirm
        </Button>
          {filteredOptions.map((option) => (
            <Grid item xs={4} sm={3} md={2} key={option.value}>
              
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: tempSelection.some(item => item.value === option.value) ? 'action.selected' : 'background.paper',
                }}
                onClick={() => handleOptionToggle(option)}
              >
                <Checkbox
                  checked={tempSelection.some(item => item.value === option.value)}
                  sx={{ p: 0, mb: 1 }}
                />
                <Typography variant="body2" align="center">
                  {option.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Box>
    </Modal>
  );
};

export default SelectorModal;
