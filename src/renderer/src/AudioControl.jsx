import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
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
          height: 20, 
          mt: 2,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            backgroundColor: '#4caf50',
            border: '3px solid #388e3c',
            transition: 'none',
            '&:hover, &:focus': {
              boxShadow: 'none',
            },
          },
          '& .MuiSlider-track': {
            height: 50,
            borderRadius: 10,
            backgroundColor: '#81c784',
            transition: 'none',
          },
          '& .MuiSlider-rail': {
            height: 20,
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
  const [socket, setSocket] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('audioData', (data) => {
      setSessions(data.sessions);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const changeVolume = (pid, volume) => {
    if (socket) {
      socket.emit('setVolume', { pid, volume });
    }
  };

  const changeMasterVolume = (volume) => {
    if (socket) {
      socket.emit('setMasterVolume', volume);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Audio Control</Typography>
      {sessions.map((session) => (
        <VolumeSlider
          key={session.pid}
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
