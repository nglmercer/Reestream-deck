import React, { useState, useEffect } from "react";
import { openDB } from "idb";
import GridComponent from "./components/GridComponent";
import Modalconfig from "./modalconfig";
import socketManager from "./utils/socket";
import { Button } from "@mui/material";
const DB_NAME = "myCustomDatabase";
const STORE_NAME = "customFormData";

const Gridcontent = () => {
  const [items, setItems] = useState([]);
  const [editorMode, setEditorMode] = useState(false);

  const loadItemsFromDB = async () => {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        },
      });

      const dbItems = await db.getAll(STORE_NAME);
      console.log("Items cargados de IndexedDB:", dbItems);

      const dbItemsCopy = JSON.parse(JSON.stringify(dbItems));
      const mappedItems = mapItemsManually(dbItemsCopy);
      setItems(mappedItems);
    } catch (error) {
      console.error("Error loading items from IndexedDB:", error);
    }
  };

  useEffect(() => {
    socketManager.onMessage("keypressed", (data) => {
      console.log("Keypressed:", data);
    });

    loadItemsFromDB();
  }, []);

  const mapItemsManually = (dbItems) => {
    console.log(dbItems);
    return dbItems.map((item) => ({
      id: item.id,
      content: item.nombre,
      value: item.keyvalue,
      color: item.color ? item.color : "btn-primary",
      position: item.position ? { ...item.position } : { x: 0, y: 0 },
    }));
  };

  const handleReorder = (newOrder) => {
    setItems(newOrder);
    console.log("Nuevo orden:", newOrder);
  };

  const handleDelete = async (id) => {
    console.log("Eliminando elemento con ID:", id);
    if (id === null) {
      setItems([]);
      try {
        const db = await openDB(DB_NAME, 1);
        const tx = db.transaction(STORE_NAME, "readwrite");
        await tx.store.clear();
        await tx.done;
      } catch (error) {
        console.error("Error clearing IndexedDB:", error);
      }
    } else {
      try {
        const db = await openDB(DB_NAME, 1);
        const tx = db.transaction(STORE_NAME, "readwrite");
        await tx.store.delete(id);
        await tx.done;

        console.log("Elemento eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting item from IndexedDB:", error);
      }
    }
  };

  const handleCallback = (data) => {
    console.log("callback 1234124124", data, data.value);

    if (data.value.length > 0) {
      const keysToPress = data.value.map((item) => Number(item.value));
      socketManager.emitMessage("presskey", keysToPress);
    }
  };

  const handleSave = () => {
    loadItemsFromDB(); // Recargar los datos cuando se guarda algo en el modal
  };

  return (
    <div className="cssportal-grid">
      <div id="div1">
        {" "}
        <Modalconfig onSave={handleSave} />
      </div>
      <div id="div2">
        {" "}
        <Button variant="contained" onClick={() => setEditorMode(!editorMode)}>
          {editorMode ? "Desactivar Modo Editor" : "Activar Modo Editor"}
        </Button>
      </div>
      <div id="div3">
        {" "}
        <GridComponent
          items={items}
          onReorder={handleReorder}
          onDelete={handleDelete}
          editorMode={editorMode}
          callback={handleCallback}
        />
      </div>
    </div>
  );
};

export default Gridcontent;
