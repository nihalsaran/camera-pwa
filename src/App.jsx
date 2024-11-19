import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, RefreshCw, Usb } from 'lucide-react';

const CameraApp = () => {
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const detectCameras = async () => {
    try {
      // Explicitly request camera permissions
      await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');

      // Prioritize USB/External cameras
      const externalCameras = videoDevices.filter(device => 
        device.label.toLowerCase().includes('usb') || 
        device.label.toLowerCase().includes('external')
      );

      const finalDevices = externalCameras.length > 0 
        ? externalCameras 
        : videoDevices;

      setDevices(finalDevices);
      
      if (finalDevices.length > 0) {
        initializeCamera(finalDevices[0].deviceId);
      } else {
        setCameraError('No cameras detected');
      }
    } catch (error) {
      console.error('Camera Detection Error:', error);
      setCameraError(error.message);
    }
  };

  const initializeCamera = async (deviceId) => {
    try {
      // Multiple constraint strategies
      const constraintStrategies = [
        { 
          video: { 
            deviceId: { exact: deviceId },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        },
        { video: { deviceId: { exact: deviceId } } },
        { video: true }
      ];

      for (const constraints of constraintStrategies) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCurrentDevice(deviceId);
            
            // Additional logging
            stream.getTracks().forEach(track => {
              console.log('Active Camera Track:', {
                label: track.label,
                id: track.id,
                kind: track.kind
              });
            });
            
            return;
          }
        } catch (strategyError) {
          console.warn('Camera strategy failed:', strategyError);
        }
      }

      throw new Error('Could not initialize camera');
    } catch (error) {
      console.error('Camera Initialization Failed:', error);
      setCameraError(error.message);
    }
  };

  useEffect(() => {
    detectCameras();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Render method with error handling
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {cameraError ? (
          <div className="p-4 bg-red-100 text-red-800 flex items-center">
            <Usb className="mr-2" />
            <span>{cameraError}</span>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full aspect-video bg-black"
            />

            {devices.length > 1 && (
              <select 
                value={currentDevice || ''}
                onChange={(e) => initializeCamera(e.target.value)}
                className="w-full p-2 border-t"
              >
                {devices.map(device => (
                  <option 
                    key={device.deviceId} 
                    value={device.deviceId}
                  >
                    {device.label || 'Unknown Camera'}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-center">
        <button 
          onClick={detectCameras} 
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center mx-auto"
        >
          <RefreshCw className="mr-2" /> 
          Refresh Cameras
        </button>
      </div>
    </div>
  );
};

export default CameraApp;