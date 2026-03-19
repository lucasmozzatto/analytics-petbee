import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTimeWindow } from '../hooks/useGA4Data';
import { generateInsight, getInsightHistory, getInsight } from '../lib/api';
import type { InsightSummary, InsightFull } from '../types';
import { formatDateBR } from '../lib/format';
import TimeWindowPicker from '../components/TimeWindowPicker';

export default function Insights() {
  const { window, setWindow, startDate, endDate } = useTimeWindow();
  const [analysis, setAnalysis] = useState<InsightFull | null>(null);
  const [history, setHistory] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  useEffect(() => {
    getInsightHistory().then(setHistory).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateInsight(
        startDate,
        endDate,
        systemPrompt || undefined,
        userPrompt || undefined
      );
      setAnalysis(result);
      const updated = await getInsightHistory();
      setHistory(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = async (id: number) => {
    try {
      const result = await getInsight(id);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: 'var(--accent)' }}>✦</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Insights AI</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Análise automatizada com inteligência artificial</p>
      </div>

      <TimeWindowPicker value={window} onChange={setWindow} startDate={startDate} endDate={endDate} />

      {/* Config section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          style={{ color: 'var(--text-dim)' }}
        >
          <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            CONFIGURAR PROMPTS
          </span>
          <span className="text-xs">{showConfig ? '▲' : '▼'}</span>
        </button>
        {showConfig && (
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                System Prompt (opcional)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm resize-y"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                }}
                placeholder="Contexto adicional para a análise..."
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                User Prompt (opcional)
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm resize-y"
                style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                }}
                placeholder="Placeholders disponíveis: {startDate}, {endDate}, {n_dias}, {tabela_kpis_gerais}, etc."
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: loading ? 'var(--surface-alt)' : 'var(--accent)',
          color: loading ? 'var(--text-muted)' : 'white',
        }}
      >
        {loading ? 'Gerando análise...' : 'Gerar Análise'}
      </button>

      {/* Result */}
      {analysis && (
        <div
          className="rounded-xl p-6 fade-up"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              ANÁLISE — {formatDateBR(analysis.startDate)} a {formatDateBR(analysis.endDate)}
            </h3>
            <span className="text-[10px]" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
              {analysis.createdAt}
            </span>
          </div>
          <div
            className="prose prose-invert prose-sm max-w-none"
            style={{ color: 'var(--text)', fontFamily: 'var(--sans)' }}
          >
            <ReactMarkdown>{analysis.analysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="p-4 pb-0">
            <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              HISTÓRICO DE ANÁLISES
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectHistory(item.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left"
                style={{
                  backgroundColor: analysis?.id === item.id ? 'var(--surface-alt)' : 'transparent',
                  border: analysis?.id === item.id ? '1px solid var(--border-light)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (analysis?.id !== item.id) e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
                }}
                onMouseLeave={(e) => {
                  if (analysis?.id !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  {formatDateBR(item.startDate)} → {formatDateBR(item.endDate)}
                </span>
                <span className="text-[10px]" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                  {item.createdAt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
