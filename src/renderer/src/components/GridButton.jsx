import React from "react";
const GridButton = ({ text, callback }) => {
  const handleClick = (e) => {
    if (callback) {
      callback();
    }
  };

  return (
    <div className="grid-button-container">
      <button className={`grid-button btn btn-primary`} onClick={handleClick}>
        {text}
      </button>
    </div>
  );
};

export default GridButton;
