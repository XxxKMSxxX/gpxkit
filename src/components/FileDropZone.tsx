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
      className={`group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed px-8 py-14 text-center transition-colors ${
        isDragOver ? "border-trace bg-trace/5" : "border-line bg-panel hover:border-muted"
      }`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 128 128"
        fill="none"
        className={isDragOver ? "text-trace" : "text-faint transition-colors group-hover:text-muted"}
      >
        <path
          d="M64 12c-19.9 0-36 16.1-36 36 0 27 36 68 36 68s36-41 36-68c0-19.9-16.1-36-36-36Z"
          fill="currentColor"
        />
        <circle cx="64" cy="48" r="14" fill="#131922" />
      </svg>
      <p className="text-paper">
        Drag &amp; drop {multiple ? "GPX files" : "a GPX file"} here, or click to browse
      </p>
      <p className="font-mono text-xs tracking-[0.05em] text-faint uppercase">
        Processed in your browser — nothing is ever uploaded
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
