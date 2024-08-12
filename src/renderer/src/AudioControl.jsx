import React, { useEffect, useState } from 'react';
import socketManager from './utils/socket';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const VolumeSlider = ({ session, onChange }) => {
  const [sliderValue, setSliderValue] = useState(Math.round(session.volume * 100));

  const handleChange = (event, newValue) => {
    const value = newValue;
    setSliderValue(value);
  };

  const handleChangeCommitted = (event, newValue) => {
    const value = newValue;
    onChange(value);
  };

  const displayName = session.name
    ? session.name
    : session.pid === 0
      ? 'Volumen del Sistema'
      : 'Unknown';

  return (
    <Box component="section" sx={{ p: 2, border: '1px dashed grey', position: 'relative' }}>
      <Typography gutterBottom sx={{ display: 'inline-block', marginRight: 'auto' }}>
        {displayName} (PID: {session.pid})
      </Typography>
      <Typography sx={{ float: 'right', fontWeight: 'bold' }}>{sliderValue}%</Typography>
      <Slider
        value={sliderValue}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        min={0}
        max={100}
        sx={{
          width: '100%',
          height: 40, 
          mt: 2,
          '& .MuiSlider-thumb': {
            width: 50,
            height: 50,
            backgroundColor: '#4caf50',
            border: '3px solid #388e3c',
            transition: 'none',
            '&:hover, &:focus': {
              boxShadow: 'none',
            },
          },
          '& .MuiSlider-track': {
            height: 40,
            borderRadius: 10,
            backgroundColor: '#81c784',
            transition: 'none',
          },
          '& .MuiSlider-rail': {
            height: 40,
            borderRadius: 10,
            backgroundColor: '#c8e6c9',
            transition: 'none',
          },
        }}
      />
    </Box>
  );
};

const AudioControl = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    socketManager.onMessage('audioData', (data) => {
      setSessions(data.sessions);
    });

    return () => {
      console.log('AudioControl');
      // disconnectSocket();
    };
  }, []);

  const changeVolume = (pid, volume) => {
    console.log('changeVolume', pid, volume);
    socketManager.emitMessage('setVolume', { pid, volume });
  };

  const changeMasterVolume = (volume) => {
    socketManager.emitMessage('setMasterVolume', volume);
  };

  return (
    <Box className="m-0 p-0 overflow-hidden">
      <Typography variant="h5" gutterBottom>Audio Control</Typography>
      {sessions.map((session, index) => (
        <VolumeSlider
          key={`${session.pid}-${index}`}
          session={session}
          onChange={(value) => changeVolume(session.pid, value / 100)}
        />
      ))}
      <VolumeSlider
        session={{ pid: 0, name: 'Master', volume: 1 }}
        onChange={(value) => changeMasterVolume(value / 100)}
      />
    </Box>
  );
};

export default AudioControl;
