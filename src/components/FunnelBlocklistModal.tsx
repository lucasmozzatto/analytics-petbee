import { useEffect, useState } from 'react';
import { getFunnelPageConfig, updateFunnelPageConfig } from '../lib/api';
import type { FunnelPageConfig } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function FunnelBlocklistModal({ open, onClose, onSaved }: Props) {
  const [pages, setPages] = useState<FunnelPageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  // Local toggle state: maps pagePath → blocked (true = hidden)
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  // Original state for diff calculation
  const [original, setOriginal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    setPrefixInput('');
    getFunnelPageConfig()
      .then((res) => {
        setPages(res.pages);
        const state: Record<string, boolean> = {};
        for (const p of res.pages) {
          state[p.pagePath] = p.blocked;
        }
        setToggles({ ...state });
        setOriginal({ ...state });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = search
    ? pages.filter((p) => p.pagePath.toLowerCase().includes(search.toLowerCase()))
    : pages;

  const visibleCount = Object.values(toggles).filter((b) => !b).length;
  const totalCount = pages.length;

  // Count how many pages match prefix and are currently visible
  const prefixMatches = prefixInput
    ? pages.filter((p) => p.pagePath.startsWith(prefixInput) && !toggles[p.pagePath]).length
    : 0;

  const handleToggle = (pagePath: string) => {
    setToggles((prev) => ({ ...prev, [pagePath]: !prev[pagePath] }));
  };

  const handleBlockByPrefix = () => {
    if (!prefixInput) return;
    setToggles((prev) => {
      const next = { ...prev };
      for (const page of pages) {
        if (page.pagePath.startsWith(prefixInput)) {
          next[page.pagePath] = true;
        }
      }
      return next;
    });
    setPrefixInput('');
  };

  const handleSave = async () => {
    // Calculate diff: what changed from original
    const blocked: string[] = [];
    const unblocked: string[] = [];

    for (const [path, isBlocked] of Object.entries(toggles)) {
      if (isBlocked !== original[path]) {
        if (isBlocked) {
          blocked.push(path);
        } else {
          unblocked.push(path);
        }
      }
    }

    if (blocked.length === 0 && unblocked.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await updateFunnelPageConfig(blocked, unblocked);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save blocklist:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="text-xs font-semibold tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              CONFIGURAR VISIBILIDADE DE PAGINAS
            </h2>
            <p
              className="text-xs mt-1"
              style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
            >
              {visibleCount} de {totalCount} visiveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg cursor-pointer px-2"
            style={{ color: 'var(--text-muted)' }}
          >
            &times;
          </button>
        </div>

        {/* Block by prefix */}
        <div className="px-4 pt-3 shrink-0">
          <label
            className="text-[10px] font-semibold tracking-wider block mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            BLOQUEAR POR PREFIXO
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              placeholder="/orders"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '12px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBlockByPrefix();
              }}
            />
            <button
              onClick={handleBlockByPrefix}
              disabled={!prefixInput || prefixMatches === 0}
              className="px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors shrink-0"
              style={{
                fontFamily: 'var(--mono)',
                backgroundColor: prefixMatches > 0 ? 'var(--red-dim)' : 'var(--surface-alt)',
                color: prefixMatches > 0 ? 'var(--red)' : 'var(--text-muted)',
                border: `1px solid ${prefixMatches > 0 ? 'var(--red)' : 'var(--border)'}`,
                opacity: !prefixInput || prefixMatches === 0 ? 0.5 : 1,
              }}
            >
              Bloquear {prefixMatches > 0 ? `(${prefixMatches})` : ''}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pagina..."
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
            }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma pagina encontrada.
            </div>
          ) : (
            filtered.map((page) => {
              const isBlocked = toggles[page.pagePath] ?? false;
              return (
                <div
                  key={page.pagePath}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isBlocked ? 'transparent' : 'var(--accent-dim)',
                  }}
                  onClick={() => handleToggle(page.pagePath)}
                >
                  {/* Toggle switch */}
                  <div
                    className="relative shrink-0 rounded-full transition-colors"
                    style={{
                      width: '36px',
                      height: '20px',
                      backgroundColor: isBlocked ? 'var(--surface-alt)' : 'var(--accent)',
                    }}
                  >
                    <div
                      className="absolute top-[2px] rounded-full transition-all"
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: 'var(--text)',
                        left: isBlocked ? '2px' : '18px',
                      }}
                    />
                  </div>

                  {/* Page path */}
                  <span
                    className="text-xs truncate"
                    title={page.pagePath}
                    style={{
                      fontFamily: 'var(--mono)',
                      color: isBlocked ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: isBlocked ? 'line-through' : 'none',
                    }}
                  >
                    {page.pagePath}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 flex items-center justify-end gap-3 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
            style={{
              fontFamily: 'var(--mono)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
            style={{
              fontFamily: 'var(--mono)',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
