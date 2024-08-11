import React from 'react';
import DynamicModal from './DynamicModal';

const Modalconfig = () => {
  const formConfig = [
    {
      database: 'myCustomDatabase',
      objectStore: 'customFormData',
    },
    {
      type: 'input',
      name: 'username',
      label: 'Username',
      inputType: 'text',
    },
    {
      type: 'input',
      name: 'age',
      label: 'Age',
      inputType: 'number',
    },
    {
        type: 'select',
        name: 'languages',
        label: 'Languages',
        options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
            { value: 'mx', label: 'Mexico' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'de', label: 'Germany' },
            { value: 'fr', label: 'France' },
            { value: 'it', label: 'Italy' },
            { value: 'es', label: 'Spain' },
            { value: 'br', label: 'Brazil' },
            { value: 'au', label: 'Australia' },
            { value: 'jp', label: 'Japan' },
            { value: 'kr', label: 'Korea' },
            { value: 'in', label: 'India' },
            { value: 'ru', label: 'Russia' },
            { value: 'cn', label: 'China' },
            { value: 'tr', label: 'Turkey' },
          ],
        },
  ];

  const handleSave = (data) => {
    console.log('Data saved to IndexedDB and retrieved:', data);
  };

  return (
    <div>
      <h1>Dynamic Modal with IndexedDB</h1>
      <DynamicModal config={formConfig} onSave={handleSave} />
    </div>
  );
};

export default Modalconfig;