import React, { useState, useEffect, useCallback } from 'react';
import { Button, Grid } from '@mui/material';

const ButtonGrid = ({ containerId, gridWidth, gridHeight, rows, cols, onButtonClick, onDelete }) => {
  const [buttons, setButtons] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    // Inicializar la cuadrícula
    const newGrid = Array(rows).fill().map(() => Array(cols).fill(null));
    setGrid(newGrid);

    // Cargar botones desde localStorage
    const savedButtons = JSON.parse(localStorage.getItem(`buttonGrid_${containerId}`)) || [];
    setButtons(savedButtons);
  }, [containerId, rows, cols]);

  useEffect(() => {
    // Guardar botones en localStorage cuando cambian
    localStorage.setItem(`buttonGrid_${containerId}`, JSON.stringify(buttons));
  }, [buttons, containerId]);

  const addButton = useCallback((row, col, label) => {
    setButtons(prevButtons => [...prevButtons, { row, col, label }]);
  }, []);

  const removeButton = useCallback((row, col) => {
    setButtons(prevButtons => prevButtons.filter(button => button.row !== row || button.col !== col));
    if (onDelete) onDelete(row, col);
  }, [onDelete]);

  const moveButton = useCallback((fromRow, fromCol, toRow, toCol) => {
    setButtons(prevButtons => {
      const buttonIndex = prevButtons.findIndex(b => b.row === fromRow && b.col === fromCol);
      if (buttonIndex === -1) return prevButtons;

      const newButtons = [...prevButtons];
      newButtons[buttonIndex] = { ...newButtons[buttonIndex], row: toRow, col: toCol };
      return newButtons;
    });
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (editMode) {
      const existingButton = buttons.find(b => b.row === row && b.col === col);
      if (existingButton) {
        removeButton(row, col);
      } else {
        const label = prompt('Enter button label:');
        if (label) addButton(row, col, label);
      }
    } else {
      const button = buttons.find(b => b.row === row && b.col === col);
      if (button && onButtonClick) onButtonClick(button);
    }
  }, [editMode, buttons, addButton, removeButton, onButtonClick]);

  return (
    <div id={containerId} style={{ width: gridWidth, height: gridHeight }}>
      <Button onClick={() => setEditMode(!editMode)}>
        {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
      </Button>
      <Grid container spacing={1} style={{ height: '100%' }}>
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <Grid item xs={12 / cols} key={`${rowIndex}-${colIndex}`} style={{ height: `${100 / rows}%` }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #ccc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {buttons.find(b => b.row === rowIndex && b.col === colIndex)?.label}
              </div>
            </Grid>
          ))
        )}
      </Grid>
    </div>
  );
};

export default ButtonGrid;