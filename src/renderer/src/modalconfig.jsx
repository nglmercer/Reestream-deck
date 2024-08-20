import React from "react";
import DynamicModal from "./components/DynamicModal";
import datajson from "./assets/datajson/keyboard.json";

const Modalconfig = ({ onSave }) => {
  const options = Object.entries(datajson).map(([value, label]) => ({
    value,
    label,
  }));

  const formConfig = [
    {
      database: "myCustomDatabase",
      objectStore: "customFormData",
    },
    {
      type: "input",
      name: "nombre",
      label: "nombre",
      inputType: "text",
    },
    {
      type: "multiSelect",
      name: "keyvalue",
      label: "keyvalue",
      options: options,
    },
    {
      type: "colorPicker",
      name: "color",
      label: "color",
    },
  ];

  const handleSave = (data) => {
    console.log("Data saved to IndexedDB and retrieved:", data);
    onSave(); // Notifica a Gridcontent que se ha guardado la información
  };

  return (
    <div>
      <DynamicModal config={formConfig} onSave={handleSave} />
    </div>
  );
};

export default Modalconfig;
