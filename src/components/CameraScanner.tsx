import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

// Restrict decoding to the 1-D formats printed on physical media so we don't
// pick up random QR codes or misread other symbologies.
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

export default function CameraScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    let stopFn: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined, // let the browser pick (prefers rear camera on mobile)
          videoRef.current!,
          (result, _err, ctrl) => {
            if (result && !cancelled) {
              cancelled = true;
              ctrl.stop();
              onDetected(result.getText());
            }
          }
        );
        stopFn = () => controls.stop();
      } catch (e) {
        setError(
          e instanceof Error
            ? `Could not start the camera: ${e.message}`
            : "Could not start the camera."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (stopFn) stopFn();
    };
  }, [onDetected]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-header">
          <span>Point the camera at the barcode</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close camera">
            ✕
          </button>
        </div>
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="video-wrap">
            <video ref={videoRef} className="scanner-video" muted playsInline />
            <div className="scanner-reticle" />
          </div>
        )}
        <p className="hint">Hold steady — detection happens automatically.</p>
      </div>
    </div>
  );
}
