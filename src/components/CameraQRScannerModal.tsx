import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, SwitchCamera, Upload, AlertCircle } from 'lucide-react';

interface CameraQRScannerModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onScan?: (decodedText: string) => void;
  onScanSuccess?: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  isOpen,
  title,
  subtitle,
  onScan,
  onScanSuccess,
  onClose
}) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const handleSuccess = (decodedText: string) => {
    playBeep();
    stopScanner().then(() => {
      const text = decodedText.trim();
      if (onScan) onScan(text);
      if (onScanSuccess) onScanSuccess(text);
      onClose();
    });
  };

  const startScanner = async (cameraIdOrFacing: string | { facingMode: string }) => {
    try {
      setErrorMsg(null);
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
      }

      const scanner = new Html5Qrcode('camera-qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      html5QrCodeRef.current = scanner;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edgeSize = Math.min(viewfinderWidth, viewfinderHeight) * 0.85;
          return {
            width: Math.floor(edgeSize),
            height: Math.floor(edgeSize)
          };
        },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await scanner.start(
        cameraIdOrFacing,
        config,
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Normal frame scan tick
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setErrorMsg(err?.message || 'Could not access camera. Please verify camera permissions or upload an image.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
          );
          const chosen = backCam ? backCam.id : devices[0].id;
          setActiveCameraId(chosen);
          startScanner(chosen);
        } else {
          startScanner({ facingMode: 'environment' });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        startScanner({ facingMode: 'environment' });
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIdx = cameras.findIndex(c => c.id === activeCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextCamera = cameras[nextIdx];
    setActiveCameraId(nextCamera.id);
    startScanner(nextCamera.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('camera-qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        html5QrCodeRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, true);
      handleSuccess(decodedText);
    } catch (err: any) {
      setErrorMsg('No readable QR code found in the selected image.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-fluid-3 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-fluid-xl max-w-md w-full max-h-[90dvh] overflow-y-auto scroll-touch p-fluid-4 pb-safe space-y-fluid-3 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm font-sans break-token">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 font-mono break-token">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="tap shrink-0 -mr-1.5 -mt-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative mx-auto w-full aspect-square max-w-[46dvh] max-h-[46dvh] bg-black rounded-fluid overflow-hidden border border-slate-800 flex items-center justify-center">
          <div id="camera-qr-reader" className="w-full max-h-full text-slate-300 text-xs overflow-hidden" />

          {/* Target Scan Bounding Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="aspect-square w-[70%] max-w-[14rem] border-2 border-indigo-400/80 rounded-xl relative shadow-[0_0_20px_rgba(99,102,241,0.25)] animate-pulse">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br" />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-fluid-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="min-w-0 break-token">{errorMsg}</span>
          </div>
        )}

        {/* Controls: Camera Switcher + Upload File Fallback */}
        <div className="flex flex-col xs:flex-row xs:flex-wrap xs:items-center xs:justify-between gap-2 pt-fluid-2 border-t border-slate-800 text-xs font-mono">
          {cameras.length > 1 ? (
            <button
              onClick={handleSwitchCamera}
              className="tap w-full xs:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <SwitchCamera className="w-3.5 h-3.5 shrink-0" />
              <span className="break-token">Flip Camera</span>
            </button>
          ) : <div className="hidden xs:block" />}

          <div className="w-full xs:w-auto">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tap w-full xs:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="break-token">Upload QR Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
