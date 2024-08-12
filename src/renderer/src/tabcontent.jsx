import { useState, useEffect } from 'react';
import { Button, ButtonGroup, ThemeProvider, createTheme } from '@mui/material';
import AudioControl from './AudioControl';
import Gridcontent from './keycontrol';
import WebRTCComponent from './components/webRTC';
import './assets/MainScreen.css'; 

const tabs = [
  { id: 'tab1', label: 'Control de Audio' },
  { id: 'tab2', label: 'Configurar Acciones' },
  { id: 'tab3', label: 'keyboard test' },
];

const MainScreen = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const savedTab = parseInt(localStorage.getItem('selectedTab') || '0', 10);
    setSelectedTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedTab', selectedTab.toString());
  }, [selectedTab]);

  const handleTabChange = (index) => {
    setSelectedTab(index);
  };

  const handleChangeTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const theme = createTheme({
    palette: {
      mode: darkTheme ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="parent">
        <div className="divmenu">
          <ButtonGroup className='menucontent'>
            <Button data-testid="btn-change-theme" onClick={handleChangeTheme}>
              {darkTheme ? '🌞' : '🌙'}
            </Button>
            {tabs.map((tab, index) => (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(index)}
                variant={selectedTab === index ? 'contained' : 'outlined'}
              >
                {tab.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="content">
          <div style={{ display: selectedTab === 0 ? 'block' : 'none' }}>
            <h2>{tabs[0].label}</h2>
            <AudioControl />
          </div>
          <div style={{ display: selectedTab === 1 ? 'block' : 'none' }}>
            <h2>{tabs[1].label}</h2>
            <WebRTCComponent />
            <p className="tip">
              Please try pressing <code>F12</code> to open the devTool
            </p>
          </div>
          <div style={{ display: selectedTab === 2 ? 'block' : 'none' }}>
            <h2>{tabs[2].label}</h2>
            <Gridcontent />
            <p className="tip"></p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MainScreen;