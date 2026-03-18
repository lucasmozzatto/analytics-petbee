import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/visao-geral', icon: '◉', label: 'Visão Geral' },
  { to: '/trafego', icon: '⇅', label: 'Tráfego' },
  { to: '/utms', icon: '#', label: 'UTMs' },
  { to: '/funil', icon: '▽', label: 'Funil' },
  { to: '/paginas', icon: '≡', label: 'Páginas' },
];

export default function Sidebar() {
  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? '' : 'hover:opacity-80'
    }`;

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col py-6 px-4 z-50"
      style={{
        width: 'var(--sidebar-w)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            G
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Propriedade GA4
          </span>
        </div>
        <span className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>
          GA4 Dashboard
        </span>
      </div>

      {/* Section label */}
      <div
        className="text-[10px] font-semibold tracking-widest mb-2 px-3"
        style={{ color: 'var(--text-muted)' }}
      >
        ANALYTICS
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => linkClass(isActive)}
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--surface-alt)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
            })}
          >
            <span className="text-xs w-4 text-center opacity-60">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4" style={{ borderBottom: '1px solid var(--border)' }} />

      {/* Insights AI */}
      <NavLink
        to="/insights"
        className={({ isActive }) => linkClass(isActive)}
        style={({ isActive }) => ({
          backgroundColor: isActive ? 'var(--surface-alt)' : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-dim)',
          border: isActive ? '1px solid var(--border)' : '1px solid transparent',
        })}
      >
        <span className="text-xs w-4 text-center" style={{ color: 'var(--accent)' }}>✦</span>
        Insights AI
      </NavLink>

      {/* Footer */}
      <div className="mt-auto px-3">
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Google Analytics 4
        </div>
      </div>
    </aside>
  );
}
