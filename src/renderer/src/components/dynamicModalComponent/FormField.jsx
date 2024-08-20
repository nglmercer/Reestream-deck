import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import ColorPicker from "./ColorPicker";

const FormField = ({ field, formData, handleChange, handleSelectorOpen }) => {
  switch (field.type) {
    case "input":
      return (
        <TextField
          label={field.label}
          name={field.name}
          value={formData[field.name] || ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type={field.inputType || "text"}
        />
      );
    case "select":
      return (
        <FormControl fullWidth margin="normal">
          <InputLabel>{field.label}</InputLabel>
          <Select
            name={field.name}
            value={formData[field.name] || ""}
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
    case "objectSelect":
    case "multiSelect":
      return (
        <FormControl fullWidth margin="normal">
          <Typography>{field.label}</Typography>
          <Button variant="outlined" onClick={() => handleSelectorOpen(field)}>
            {formData[field.name]
              ? Array.isArray(formData[field.name])
                ? formData[field.name].map((item) => item.label).join(", ")
                : formData[field.name].label
              : `Select ${field.label}`}
          </Button>
        </FormControl>
      );
    case "colorPicker":
      return (
        <ColorPicker
          label={field.label}
          name={field.name}
          value={formData[field.name] || ""}
          onChange={handleChange}
        />
      );
    default:
      return null;
  }
};

export default FormField;
