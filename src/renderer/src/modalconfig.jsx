import React from 'react';
import DynamicModal from './components/DynamicModal';
import datajson from './assets/datajson/keyboard.json';
const Modalconfig = () => {
  const options = Object.entries(datajson).map(([value, label]) => ({
    value,
    label
  }));
    const formConfig = [
    {
      database: 'myCustomDatabase',
      objectStore: 'customFormData',
    },
    {
      type: 'input',
      name: 'nombre',
      label: 'nombre',
      inputType: 'text',
    },
    {
        type: 'multiSelect',
        name: 'keyvalue',
        label: 'keyvalue',
        options: options,
        },
  ];

  const handleSave = (data) => {
    console.log('Data saved to IndexedDB and retrieved:', data);
  };
  return (
    <div>
      {/* <h1 className='text-center bg-black'>Dynamic Modal with IndexedDB</h1> */}
      <DynamicModal config={formConfig} onSave={handleSave} />
    </div>
  );
};

export default Modalconfig;