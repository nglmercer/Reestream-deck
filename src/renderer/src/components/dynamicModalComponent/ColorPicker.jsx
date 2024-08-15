import React from 'react';
import { TextField } from '@mui/material';

const ColorPicker = ({ label, name, value = "#bfdbfe", onChange }) => {
  return (
    <TextField
      label={label}
      name={name}
      type="color"
      value={value}
      onChange={onChange}
      fullWidth
      margin="normal"
    />
  );
};

export default ColorPicker;
