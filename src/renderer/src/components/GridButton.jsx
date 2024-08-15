import React from 'react';

const GridButton = ({ text, callback, label, color, deleteCallback, showDeleteButton }) => {
  const handleClick = (e) => {
    if (callback) {
      callback();
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (deleteCallback) {
      deleteCallback(e);
    }
  };

  return (
    <div className="grid-button-container">
      <div className={`grid-button ${color} btn btn-primary`}>
        <button onClick={handleClick}>{text}</button>
      </div>
      {deleteCallback && showDeleteButton && (
        <button className="delete-button" onClick={handleDelete}>
          {label}
        </button>
      )}
    </div>
  );
};

export default GridButton;
