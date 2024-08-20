import React, { useState, useEffect } from "react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import GridButton from "./GridButton";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
const ResponsiveGridLayout = WidthProvider(GridLayout);

const GridComponent = ({
  items,
  onReorder,
  onDelete,
  callback,
  editorMode = false,
}) => {
  const [localItems, setLocalItems] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [cols, setCols] = useState(4);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const rowsPerPage = 8;
  const [selectedItems, setSelectedItems] = useState([]);
  const itemsPerPage = cols * rowsPerPage;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const handleNextPage = () => {
    setPageIndex((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };
  useEffect(() => {
    if (!editorMode) {
      setSelectedItems([]); // Deselecciona todos los elementos
    }
  }, [editorMode]);
  useEffect(() => {
    const savedPositions =
      JSON.parse(localStorage.getItem("gridPositions")) || {};

    const itemsWithSavedPositions = items.map((item) => {
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
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, []);

  const generateLayout = () => {
    return localItems
      .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
      .map((item, index) => ({
        i: item.id.toString(),
        x: item.position?.x !== undefined ? item.position.x : index % cols,
        y:
          item.position?.y !== undefined
            ? item.position.y
            : Math.floor(index / cols),
        w: 1,
        h: 1,
      }));
  };

  const handleLayoutChange = (newLayout) => {
    const updatedItems = localItems.map((item) => {
      const layoutItem = newLayout.find((l) => l.i === item.id.toString());
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

    localStorage.setItem("gridPositions", JSON.stringify(positions));

    setLocalItems(updatedItems);
    onReorder(updatedItems);
  };

  const handleDeleteSelected = () => {
    const updatedItems = localItems.filter(
      (item) => !selectedItems.includes(item.id),
    );
    setLocalItems(updatedItems);
    setSelectedItems([]);

    const savedPositions =
      JSON.parse(localStorage.getItem("gridPositions")) || {};
    selectedItems.forEach((id) => delete savedPositions[id]);
    localStorage.setItem("gridPositions", JSON.stringify(savedPositions));

    selectedItems.forEach((id) => onDelete(id));
  };

  const handleSelect = (e, id) => {
    e.stopPropagation();
    if (editorMode) {
      setSelectedItems((prev) =>
        prev.includes(id)
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id],
      );
      console.log("Selected", id);
    } else {
      console.log("Deselected", id);
    }
  };
  return (
    <div className="grid-container">
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={handlePrevPage} className="btn btn-secondary">
            pestaña anterior
          </button>
          <button onClick={handleNextPage} className="btn btn-secondary">
            siguiente pestaña
          </button>
        </div>
      )}
      {editorMode && (
        <button onClick={handleDeleteSelected} className="btn btn-error">
          Eliminar Seleccionados
        </button>
      )}
      <ResponsiveGridLayout
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
        {localItems
          .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
          .map((item) => (
            <div
              key={item.id}
              className={`grid-item-wrapper ${item.content ? "occupied" : "empty"} ${selectedItems.includes(item.id) ? "selected" : ""}`}
              onClick={(e) => handleSelect(e, item.id)}
            >
              <div className="grid-item text-white font-bold py-2 px-4 rounded h-full w-full">
                <div className="item-content">{item.content}</div>
                <div className="position-debug">{item.positionIndex}</div>{" "}
                {/* Para debug style={{ backgroundColor: item.color }} */}
                <GridButton
                  text={item.value?.map((val) => val.label).join(" + ")}
                  callback={() => callback(item)}
                />
              </div>
            </div>
          ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default GridComponent;
