import { useState, useEffect } from 'react';
import { Button, ButtonGroup, Modal,useMediaQuery, ThemeProvider, createTheme } from '@mui/material';
import AudioControl from './AudioControl';
import KeyboardSelector from './keycontrol';
import Modalconfig from './modalconfig';
import GridButton from './GridButton';
import './assets/MainScreen.css'; 

const tabs = [
  { id: 'tab1', label: 'Control de Audio' },
  { id: 'tab2', label: 'modalconfig' },
  { id: 'tab3', label: 'keyboard test' },
];

const MainScreen = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tabContentVisible, setTabContentVisible] = useState(true);
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
    setTabContentVisible(true);
  };

  const handleToggleContent = () => {
    setTabContentVisible(!tabContentVisible);
  };

  const handleChangeTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <AudioControl />;
        
      case 1:
        return <Modalconfig />;
      case 2:
        return <GridButton />;
      default:
        return <p>Contenido de {tabs[selectedTab].label}</p>;
    }
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
          {tabContentVisible && (
            <div >
              <h2>{tabs[selectedTab].label}</h2>
              {renderTabContent()}
            </div>
          )}
        </div>

        <Button onClick={handleToggleContent}>
          {tabContentVisible ? 'Ocultar Contenido' : 'Mostrar Contenido'}
        </Button>
      </div>
    </ThemeProvider>
  );
};

export default MainScreen;


