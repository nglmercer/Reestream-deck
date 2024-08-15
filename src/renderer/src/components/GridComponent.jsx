import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import GridButton from './GridButton';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridComponent = ({ items, onReorder, onDelete, callback, editorMode = false }) => {
  const [localItems, setLocalItems] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [cols, setCols] = useState(4);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const rowsPerPage = 8;
  const itemsPerPage = cols * rowsPerPage;

  useEffect(() => {
    const savedPositions = JSON.parse(localStorage.getItem('gridPositions')) || {};
    
    const itemsWithSavedPositions = items.map(item => {
      if (savedPositions[item.id]) {
        return { ...item, position: savedPositions[item.id] };
      }
      return item;
    });

    setLocalItems(itemsWithSavedPositions);
  }, [items]);

  useEffect(() => {
    const calculateLayout = () => {
      const minItemWidth = 200;
      const maxItemWidth = 300;
      const padding = 20;
      const availableWidth = window.innerWidth - padding;

      let calculatedCols = Math.floor(availableWidth / minItemWidth);
      
      if (availableWidth / calculatedCols > maxItemWidth) {
        calculatedCols = Math.ceil(availableWidth / maxItemWidth);
      }

      setCols(Math.max(1, calculatedCols));
      setContainerWidth(availableWidth);
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, []);

  const generateLayout = () => {
    return localItems.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((item, index) => ({
      i: item.id.toString(),
      x: item.position?.x !== undefined ? item.position.x : (index % cols),
      y: item.position?.y !== undefined ? item.position.y : Math.floor(index / cols),
      w: 1,
      h: 1,
    }));
  };

  const handleLayoutChange = (newLayout) => {
    const updatedItems = localItems.map(item => {
      const layoutItem = newLayout.find(l => l.i === item.id.toString());
      if (layoutItem) {
        return {
          ...item,
          position: { x: layoutItem.x, y: layoutItem.y },
        };
      }
      return item;
    });

    const positions = updatedItems.reduce((acc, item) => {
      if (item.position) {
        acc[item.id] = item.position;
      }
      return acc;
    }, {});

    localStorage.setItem('gridPositions', JSON.stringify(positions));

    setLocalItems(updatedItems);
    onReorder(updatedItems);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    onDelete(id);
    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    
    const savedPositions = JSON.parse(localStorage.getItem('gridPositions')) || {};
    delete savedPositions[id];
    localStorage.setItem('gridPositions', JSON.stringify(savedPositions));
  };

  const handleNextPage = () => {
    setPageIndex((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <div className="grid-container">
      <GridLayout
        className="layout"
        layout={generateLayout()}
        cols={cols}
        rowHeight={100}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        compactType={null}
        preventCollision={false}
        isDraggable={editorMode}
        isResizable={false}
      >
        {localItems.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((item) => (
          <div key={item.id} className={`grid-item-wrapper ${item.content ? 'occupied' : 'empty'}`}>
            <div className="grid-item">
              <div className="item-content">{item.content}</div>
              {callback && item.content && (
                <GridButton 
                  text={item.value?.map(val => val.label).join(' + ')}
                  callback={() => callback(item)}
                  label="Delete"
                  deleteCallback={(e) => handleDelete(e, item.id)}
                  color="blue"
                  showDeleteButton={editorMode}
                />
              )}
            </div>
          </div>
        ))}
      </GridLayout>

      <div className="pagination-controls">
        <GridButton text="Anterior" callback={handlePrevPage} color="btn-secondary" />
        <GridButton text="Siguiente" callback={handleNextPage} color="btn-secondary" />
      </div>
    </div>
  );
};

export default GridComponent;