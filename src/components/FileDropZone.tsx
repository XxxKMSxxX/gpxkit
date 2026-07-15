import { useCallback, useRef, useState } from "react";

type FileDropZoneProps = {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
};

export default function FileDropZone({ onFiles, multiple = false }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = multiple ? Array.from(fileList) : [fileList[0]];
      onFiles(files);
    },
    [onFiles, multiple],
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
      <p>Drag & drop {multiple ? "GPX files" : "a GPX file"} here, or click to browse</p>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        Files are processed in your browser — nothing is ever uploaded.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
