import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Image, RefreshCw } from 'lucide-react';

const CameraApp = () => {
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState([]);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Detect available video input devices
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (error) {
      console.error('Error detecting devices:', error);
    }
  };

  // Initialize camera stream
  const initCamera = async (deviceId = null) => {
    try {
      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Setup media recorder for video recording
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const videoURL = URL.createObjectURL(blob);
          setCapturedMedia(prev => [...prev, {
            type: 'video',
            url: videoURL
          }]);
          chunksRef.current = [];
        };
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      const photoURL = canvas.toDataURL('image/jpeg');
      setCapturedMedia(prev => [...prev, {
        type: 'photo',
        url: photoURL
      }]);
    }
  };

  // Start video recording
  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Change active camera
  const switchCamera = (deviceId) => {
    setCurrentDevice(deviceId);
    initCamera(deviceId);
  };

  // Effect to initialize camera and get devices on mount
  useEffect(() => {
    getDevices();
    initCamera();

    // Cleanup stream on unmount
    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full aspect-video bg-black"
          />
          
          {devices.length > 1 && (
            <select 
              onChange={(e) => switchCamera(e.target.value)}
              className="absolute top-2 right-2 bg-white/70 rounded p-1"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${devices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-center space-x-4 p-4 bg-gray-50">
          <button 
            onClick={capturePhoto} 
            className="p-2 bg-blue-500 text-white rounded-full"
          >
            <Camera size={24} />
          </button>
          
          {!isRecording ? (
            <button 
              onClick={startRecording} 
              className="p-2 bg-red-500 text-white rounded-full"
            >
              <Video size={24} />
            </button>
          ) : (
            <button 
              onClick={stopRecording} 
              className="p-2 bg-red-700 text-white rounded-full"
            >
              <RefreshCw size={24} />
            </button>
          )}
        </div>

        {capturedMedia.length > 0 && (
          <div className="p-4 bg-gray-100">
            <h3 className="text-lg font-semibold mb-2">Captured Media</h3>
            <div className="grid grid-cols-3 gap-2">
              {capturedMedia.map((media, index) => (
                <div key={index} className="relative">
                  {media.type === 'photo' ? (
                    <img 
                      src={media.url} 
                      alt={`Captured ${index}`} 
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      className="w-full h-24 object-cover rounded"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraApp;