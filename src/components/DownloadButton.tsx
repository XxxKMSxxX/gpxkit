import type { ReactNode } from "react";

type DownloadButtonProps = {
  href: string;
  fileName: string;
  children: ReactNode;
};

export default function DownloadButton({ href, fileName, children }: DownloadButtonProps) {
  return (
    <a
      href={href}
      download={fileName}
      className="mb-6 inline-flex items-center gap-2 rounded-md bg-trace px-4 py-2 font-mono text-xs tracking-[0.05em] text-paper uppercase transition-colors hover:bg-trace-dim"
    >
      {children}
    </a>
  );
}
