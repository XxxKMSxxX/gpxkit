import { useCallback, useRef, useState } from "react";

type FileDropZoneProps = {
  onFile: (file: File) => void;
};

export default function FileDropZone({ onFile }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={{
        border: `2px dashed ${isDragOver ? "#e63946" : "#999"}`,
        borderRadius: 8,
        padding: "2.5rem",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <p>GPXファイルをドラッグ&ドロップ、またはクリックして選択</p>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        ファイルはブラウザ内で処理され、どこにもアップロードされません。
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
