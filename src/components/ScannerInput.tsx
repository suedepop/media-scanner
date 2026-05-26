import { useEffect, useRef, useState } from "react";
import CameraScanner from "./CameraScanner";

interface Props {
  onSubmit: (upc: string) => void;
  disabled?: boolean;
}

// Handles both a USB barcode scanner (which "types" the digits and presses
// Enter, just like a keyboard) and manual entry. A camera fallback is offered
// for phones / when no physical scanner is attached.
export default function ScannerInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field focused so a scanner's keystrokes always land here.
  useEffect(() => {
    if (!showCamera && !disabled) inputRef.current?.focus();
  }, [showCamera, disabled]);

  const submit = (raw: string) => {
    const upc = raw.trim();
    if (upc) onSubmit(upc);
  };

  return (
    <div className="scanner-input">
      <form
        className="scan-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <input
          ref={inputRef}
          className="upc-field"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Scan or type a UPC…"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={disabled || !value.trim()}>
          Look up
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setShowCamera(true)}
          disabled={disabled}
          title="Scan with your device camera"
        >
          📷 Camera
        </button>
      </form>

      {showCamera && (
        <CameraScanner
          onDetected={(code) => {
            setShowCamera(false);
            setValue(code);
            submit(code);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
