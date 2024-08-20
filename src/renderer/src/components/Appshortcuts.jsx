import React, { useState, useEffect } from "react";
import socketManager from "../utils/socket";
import { getHostname, getPort } from "../utils/network";

function Appshortcuts() {
  const [apps, setApps] = useState([]);

  const getapps = async () => {
    try {
      const protocol = window.location.protocol;
      const localhostname = getHostname();
      const ipport = protocol === "file:" ? 3333 : await getPort(localhostname);
      const fetchurl = `http://${localhostname}:${ipport}`;
      console.log("fetchurl", fetchurl);

      try {
        const response = await fetch(`${fetchurl}/apps`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const appsData = await response.json();
        console.log("apps:", appsData);
        setApps(appsData);
      } catch (error) {
        console.error("Error fetching apps:", error);
      }
    } catch (error) {
      console.error("Error fetching apps:", error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(getapps, 1000);
    return () => clearTimeout(timeoutId); // Cleanup timeout if component unmounts
  }, []);

  const executeApp = (data) => {
    console.log("executeApp", data);
    socketManager.emitMessage("openapp", data);
  };

  return (
    <div className="card bg-base-100 shadow-xl m-4 p-4">
      {apps.map((app, index) => (
        <button key={index} onClick={() => executeApp(app)} className="btn m-2">
          {app.name}
        </button>
      ))}
    </div>
  );
}

export default Appshortcuts;
