import React from 'react';
import ButtonGrid from './components/ButtonGrid';

const GridButton = () => {
  const handleButtonClick = (button) => {
    console.log(`Button clicked: ${button.label} at (${button.row}, ${button.col})`);
  };

  const handleDelete = (row, col) => {
    console.log(`Button deleted at (${row}, ${col})`);
  };

  return (
    <ButtonGrid 
      containerId="myButtonGrid"
      gridWidth={500}
      gridHeight={500}
      rows={5}
      cols={5}
      onButtonClick={handleButtonClick}
      onDelete={handleDelete}
    />
  );
};

export default GridButton;