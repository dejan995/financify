
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { RefreshCw, CameraOff } from 'lucide-react';

const SkuScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const scannerRegionId = "barcodescanner-region";
  const html5QrcodeRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [isSwitching, setIsSwitching] = useState(false);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn("Error stopping the scanner, it might have already been stopped.", err);
      }
    }
  }, []);

  const requestCameraPermissionAndGetCameras = useCallback(async () => {
    setPermissionStatus('requesting');
    setErrorMessage('');
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        const lastUsedCameraId = localStorage.getItem('lastUsedCameraId');
        if (lastUsedCameraId && devices.some(d => d.id === lastUsedCameraId)) {
          setSelectedCameraId(lastUsedCameraId);
        } else {
          setSelectedCameraId(devices[0].id);
        }
        setPermissionStatus('granted');
      } else {
        setErrorMessage("No cameras found on this device.");
        setPermissionStatus('denied');
        onScanError("No cameras found on this device.");
      }
    } catch (err) {
      let userFriendlyMessage = "Could not access cameras. Please check permissions.";
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        userFriendlyMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      }
      setErrorMessage(userFriendlyMessage);
      setPermissionStatus('denied');
      onScanError(userFriendlyMessage);
    }
  }, [onScanError]);

  useEffect(() => {
    requestCameraPermissionAndGetCameras();
    return () => {
      stopScanner();
    };
  }, [requestCameraPermissionAndGetCameras, stopScanner]);

  useEffect(() => {
    if (permissionStatus === 'granted' && selectedCameraId && !isSwitching) {
      const scanner = new Html5Qrcode(scannerRegionId, { verbose: false });
      html5QrcodeRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.0,
      };

      const handleSuccess = (decodedText, decodedResult) => {
        stopScanner().then(() => {
          onScanSuccess(decodedText, decodedResult);
        });
      };

      const handleError = (error) => { /* Ignore non-critical scan errors */ };

      scanner.start(selectedCameraId, config, handleSuccess, handleError)
        .catch(err => {
          let userFriendlyMessage = "Failed to start scanner. Camera might be in use.";
          if (err.name === "NotReadableError") {
            userFriendlyMessage = "Camera is already in use by another application or browser tab.";
          }
          setErrorMessage(userFriendlyMessage);
        });
    }
  }, [selectedCameraId, permissionStatus, onScanSuccess, isSwitching, stopScanner]);

  const handleCameraChange = async (event) => {
    if (isSwitching) return;
    setIsSwitching(true);
    setErrorMessage('');

    const newCameraId = event.target.value;
    await stopScanner();
    
    setSelectedCameraId(newCameraId);
    localStorage.setItem('lastUsedCameraId', newCameraId);
    
    setTimeout(() => setIsSwitching(false), 100); 
  };

  const handleRetry = () => {
    requestCameraPermissionAndGetCameras();
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Scan SKU/Barcode</h3>
      </div>
      
      {permissionStatus === 'granted' && cameras.length > 0 && (
        <div className="mb-4">
          <label htmlFor="camera-select" className="block text-sm font-medium text-slate-300 mb-1">Select Camera:</label>
          <select 
            id="camera-select" 
            value={selectedCameraId} 
            onChange={handleCameraChange}
            disabled={isSwitching}
            className="w-full p-2 rounded-md bg-slate-700 border-slate-600 text-slate-100 disabled:opacity-50"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>{camera.label || `Camera ${camera.id}`}</option>
            ))}
          </select>
        </div>
      )}

      {permissionStatus === 'requesting' && (
        <div className="text-center text-slate-300 p-4">
          <p>Requesting camera permission...</p>
        </div>
      )}
      
      <div id={scannerRegionId} style={{ width: '100%', minHeight: '200px', display: permissionStatus === 'granted' ? 'block' : 'none' }}></div>
      
      {(errorMessage || (permissionStatus === 'denied' && !errorMessage)) && (
        <div className="text-center text-red-400 p-4 flex flex-col items-center">
          <CameraOff size={48} className="mb-2"/>
          <p className="font-semibold">Camera Access Issue</p>
          <p className="text-sm">{errorMessage || "Camera access was denied."}</p>
          <Button onClick={handleRetry} className="mt-4 bg-sky-500 hover:bg-sky-600 text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry / Grant Permission
          </Button>
        </div>
      )}
    </div>
  );
};

export default SkuScanner;
