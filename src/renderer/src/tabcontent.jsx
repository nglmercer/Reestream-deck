import { useState, useEffect } from "react";
import { Button, ButtonGroup, ThemeProvider, createTheme } from "@mui/material";
import AudioControl from "./AudioControl";
import Gridcontent from "./keycontrol";
import WebRTCChatRoom from "./WebRTCChatRoom";
import ChatRoomContainer from "./ChatRoomContainer";
import "./assets/MainScreen.css";
import "./assets/grid.css";
import IndexedDBManager from "./datamanager/IndexedDBManager";
import FileUploader from "./datamanager/FileUploader";
import Appshortcuts from "./components/Appshortcuts";
const tabs = [
  { id: "tab1", label: "Control de Audio" },
  { id: "tab2", label: "WebRTC Chat Room" },
  { id: "tab3", label: "Control de Acciones" },
  { id: "tab4", label: "Settings" },
];

const MainScreen = () => {
  const [selectedTab, setSelectedTab] = useState(() => {
    const savedTab = parseInt(localStorage.getItem("selectedTab") || "0", 10);
    console.log("Initial selectedTab", savedTab);
    return savedTab;
  });
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const savedTab = parseInt(localStorage.getItem("selectedTab") || "0", 10);
    console.log("selectedTab", savedTab);
    setSelectedTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedTab", selectedTab.toString());
  }, [selectedTab]);

  const handleTabChange = (index) => {
    setSelectedTab(index);
  };

  const handleChangeTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const theme = createTheme({
    palette: {
      mode: darkTheme ? "dark" : "light",
    },
  });
  const handleFileInfo = (fileDetails) => {
    console.log("File Details:", fileDetails);

    // Aquí puedes enviar la información del archivo al backend o hacer más procesamiento
    fetch("/file-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileDetails),
    })
      .then((response) => console.log("Success:", response))
      .then((data) => console.log("Success:", data))
      .catch((error) => console.error("Error:", error));
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="parent">
        <div className="divmenu">
          <ButtonGroup className="menucontent">
            <Button data-testid="btn-change-theme" onClick={handleChangeTheme}>
              {darkTheme ? "🌞" : "🌙"}
            </Button>
            {tabs.map((tab, index) => (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(index)}
                variant={selectedTab === index ? "contained" : "outlined"}
              >
                {tab.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="content">
          <div style={{ display: selectedTab === 0 ? "block" : "none" }}>
            <h2>{tabs[0].label}</h2>
            <AudioControl />
          </div>
          <div style={{ display: selectedTab === 1 ? "block" : "none" }}>
            <h2>{tabs[1].label}</h2>
            <ChatRoomContainer />
            <p className="tip">
              Please try pressing <code>F12</code> to open the devTool
            </p>
          </div>
          <div style={{ display: selectedTab === 2 ? "block" : "none" }}>
            <IndexedDBManager />
            <h2>{tabs[2].label}</h2>
            <Gridcontent />
            <p className="tip"></p>
          </div>
          <div style={{ display: selectedTab === 3 ? "block" : "none" }}>
            <h2>{tabs[3].label}</h2>
            <FileUploader onFileInfo={handleFileInfo} />
            <Appshortcuts />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MainScreen;
