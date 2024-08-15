import React from 'react';
const GridButton = ({ text, callback, label, deleteCallback, showDeleteButton }) => {
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
    <div className="grid-button-container" >
        <button className={`grid-button btn btn-primary`} onClick={handleClick}>{text}</button>
      {deleteCallback && showDeleteButton && (
        <button variant="destructive" className="delete-button absolute top-0 right-0 " onClick={handleDelete}>
          {label}
        </button>
      )}
    </div>
  );
};

export default GridButton;
