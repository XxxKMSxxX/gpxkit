type SampleLinkProps = {
  label: string;
  onClick: () => void;
};

export default function SampleLink({ label, onClick }: SampleLinkProps) {
  return (
    <p className="mt-3 text-center font-mono text-xs text-faint">
      No file handy?{" "}
      <button
        type="button"
        onClick={onClick}
        className="text-trace underline underline-offset-2 hover:text-trace-dim"
      >
        {label}
      </button>
    </p>
  );
}
