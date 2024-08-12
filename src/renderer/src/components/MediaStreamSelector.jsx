import React, { useState, useEffect } from 'react';

function MediaStreamSelector({ onStreamSelected }) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  useEffect(() => {
    async function getMediaDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        
        setVideoDevices(videoInputDevices);
        setAudioDevices(audioInputDevices);

        if (videoInputDevices.length > 0) setSelectedVideoDevice(videoInputDevices[0].deviceId);
        if (audioInputDevices.length > 0) setSelectedAudioDevice(audioInputDevices[0].deviceId);

      } catch (error) {
        console.error('Error fetching media devices:', error);
      }
    }

    getMediaDevices();
  }, []);

  const handleStartStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoDevice },
        audio: { deviceId: selectedAudioDevice }
      });
      onStreamSelected(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  return (
    <div>
      <label>
        Video Source:
        <select value={selectedVideoDevice} onChange={e => setSelectedVideoDevice(e.target.value)}>
          {videoDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </label>

      <label>
        Audio Source:
        <select value={selectedAudioDevice} onChange={e => setSelectedAudioDevice(e.target.value)}>
          {audioDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </option>
          ))}
        </select>
      </label>

      <button onClick={handleStartStream}>Start Stream</button>
    </div>
  );
}

export default MediaStreamSelector;
