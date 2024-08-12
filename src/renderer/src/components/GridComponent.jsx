import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridComponent = ({ items, onReorder, onDelete, callback, editorMode = false }) => {
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const layout = localItems.map((item, index) => ({
    i: item.id.toString(),
    x: item.position?.x || (index % 4),
    y: item.position?.y || Math.floor(index / 4),
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
    e.stopPropagation(); // Detiene la propagación del evento
    console.log('Elemento eliminado:', id);
    onDelete(id);
    setLocalItems(localItems.filter(item => item.id !== id));
  };

  return (
    <div className="grid-container">
      <GridLayout
        className="layout"
        layout={layout}
        cols={4}
        rowHeight={100}
        width={1200}
        onLayoutChange={handleLayoutChange}
        compactType={null}
        preventCollision={true}
        isDraggable={editorMode}
        isResizable={editorMode}
      >
        {localItems.map((item) => (
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
                  className="add-button btn btn-primary"
                  onClick={() => callback(item)}
                >
                  {item.id}
                </button>
              )}
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
};

export default GridComponent;