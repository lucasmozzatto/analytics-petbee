interface CompareToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function CompareToggle({ enabled, onChange }: CompareToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        backgroundColor: enabled ? 'var(--accent-dim)' : 'transparent',
        border: enabled ? '1px solid var(--accent)' : '1px solid var(--border)',
        color: enabled ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      <span
        className="w-3 h-3 rounded-sm"
        style={{
          backgroundColor: enabled ? 'var(--accent)' : 'var(--surface-alt)',
          border: enabled ? 'none' : '1px solid var(--border-light)',
        }}
      />
      Comparar com período anterior
    </button>
  );
}
