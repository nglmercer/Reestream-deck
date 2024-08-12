import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridComponent = ({ items, onReorder, onDelete, callback, editorMode = false }) => {
  const [localItems, setLocalItems] = useState(items);
  const [cols, setCols] = useState(4);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    const calculateLayout = () => {
      const minItemWidth = 200; // Ancho mínimo deseado para cada item
      const maxItemWidth = 300; // Ancho máximo deseado para cada item
      const padding = 20; // Padding total (izquierda + derecha)
      const availableWidth = window.innerWidth - padding;

      // Calculamos el número de columnas basándonos en el ancho mínimo
      let calculatedCols = Math.floor(availableWidth / minItemWidth);
      
      // Ajustamos si excede el ancho máximo
      if (availableWidth / calculatedCols > maxItemWidth) {
        calculatedCols = Math.ceil(availableWidth / maxItemWidth);
      }

      setCols(Math.max(1, calculatedCols)); // Aseguramos al menos 1 columna
      setContainerWidth(availableWidth);
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, []);

  const layout = localItems.map((item, index) => ({
    i: item.id.toString(),
    x: item.position?.x || (index % cols),
    y: item.position?.y || Math.floor(index / cols),
    w: 1,
    h: 1,
  }));

  const handleLayoutChange = (newLayout) => {
    const reorderedItems = newLayout.map((layoutItem) => {
      const item = localItems.find((item) => item.id.toString() === layoutItem.i);
      return {
        ...item,
        position: { x: layoutItem.x, y: layoutItem.y },
      };
    });
    onReorder(reorderedItems);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    console.log('Elemento eliminado:', id);
    onDelete(id);
    setLocalItems(localItems.filter(item => item.id !== id));
  };

  return (
    <div className="grid-container">
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={100}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        compactType={null}
        preventCollision={true}
        isDraggable={editorMode}
        isResizable={editorMode}
      >
        {localItems.map((item) => {
          const keysToPress = item.value.map(item => item.label).join(' + ');

          return (
            <div key={item.id} className="grid-item-wrapper">
              {editorMode && (
                <button
                  className="delete-button"
                  onClick={(e) => handleDelete(e, item.id)}
                >
                  X
                </button>
              )}
              <div className="grid-item">
                <div className="item-content">{item.content}</div>
                {callback && (
                  <button
                    className="add-button btn btn-primary btn-lg"
                    onClick={() => callback(item)}
                  >
                    {keysToPress}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};

export default GridComponent;