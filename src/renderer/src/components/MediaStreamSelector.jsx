import React, { useState, useEffect } from 'react';

function MediaStreamSelector({ onStreamSelected }) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [includeAudioInScreenShare, setIncludeAudioInScreenShare] = useState(false);

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
      let stream;
      if (isScreenSharing) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: includeAudioInScreenShare
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedVideoDevice },
          audio: { deviceId: selectedAudioDevice }
        });
      }
      onStreamSelected(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  return (
    <div className="flex flex-wrap ">
      <div className="card bg-base-100 w-4/5 max-w-xl shadow-xl">
      <div className="card-body">
        <label className="block mb-2 font-bold">
          Transmitir fuentes:
          <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={isScreenSharing ? 'screen' : 'camera'}
            onChange={(e) => setIsScreenSharing(e.target.value === 'screen')}
          >
            <option value="camera">Camara y Micrófono</option>
            <option value="screen">Transmitir Pantalla</option>
          </select>
        </label>
      </div>

      {!isScreenSharing && (
        <>
          <div className="mockup-code m-4 p-4">
            <label className="block mb-2 font-bold">
              Seleccionar fuente de video:
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={selectedVideoDevice} 
                onChange={e => setSelectedVideoDevice(e.target.value)}
              >
                {videoDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mockup-code m-4 p-4">
            <label className="block mb-2 font-bold">
              Seleccionar fuente de audio:
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={selectedAudioDevice} 
                onChange={e => setSelectedAudioDevice(e.target.value)}
              >
                {audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      {isScreenSharing && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="checkbox checkbox-lg"
              checked={includeAudioInScreenShare}
              onChange={(e) => setIncludeAudioInScreenShare(e.target.checked)}
            />
            <span className="ml-2">Incluir audio en pantalla compartida</span>
          </label>
        </div>
      )}
      </div>
      <button 
        className="btn btn-primary btn-lg"
        onClick={handleStartStream}
      >
        Transmitir ahora
      </button>
    </div>
  );
}

export default MediaStreamSelector;