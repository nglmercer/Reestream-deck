import React, { useState } from "react";

function FileUploader({ onFileInfo }) {
  const [fileInfo, setFileInfo] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const filePath = file.path;
      const fileDetails = {
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
      };
      setFileInfo(fileDetails);
      onFileInfo(fileDetails);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const filePath = file.path;
      const fileDetails = {
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
      };
      setFileInfo(fileDetails);
      onFileInfo(fileDetails);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        border: "2px dashed #ccc",
        padding: "20px",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <input
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="fileInput"
      />
      <label htmlFor="fileInput">
        {fileInfo
          ? `Selected File: ${fileInfo.path}`
          : "Drag & Drop a file or Click to upload"}
      </label>
    </div>
  );
}

export default FileUploader;
