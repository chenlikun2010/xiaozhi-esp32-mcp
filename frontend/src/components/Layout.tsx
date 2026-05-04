import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const APP_CSS = `
  /* ── Reset & base ── */
  .app-wrap { min-height:100vh; background:#030610; color:#e8f4ff; font-family:'Noto Sans SC',sans-serif; display:flex; flex-direction:column; }
  .app-wrap * { box-sizing:border-box; }

  /* ── Background grid ── */
  .app-bg-grid { position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px);
    background-size:60px 60px; }

  /* ── Layout shell ── */
  .app-shell { display:flex; flex:1; position:relative; z-index:1; }

  /* ── Sidebar ── */
  .app-sidebar { width:240px; min-height:100vh; background:#06101f; border-right:1px solid rgba(0,200,255,0.1);
    display:flex; flex-direction:column; padding:0; flex-shrink:0; position:relative; z-index:10; }
  .app-sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px 20px 16px; border-bottom:1px solid rgba(0,200,255,0.08); text-decoration:none; }
  .app-sidebar-logo-text { font-family:'Share Tech Mono',monospace; font-size:14px; color:#00c8ff; letter-spacing:.08em; }
  .app-sidebar-logo-sub { font-size:9px; color:#3d5a7a; letter-spacing:.15em; text-transform:uppercase; font-family:'Share Tech Mono',monospace; }
  .app-sidebar-nav { padding:16px 12px; flex:1; display:flex; flex-direction:column; gap:4px; }
  .app-nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:3px; cursor:pointer;
    font-family:'Share Tech Mono',monospace; font-size:12px; letter-spacing:.06em; color:#7ba3c8;
    background:transparent; border:none; width:100%; text-align:left; transition:all .2s; text-decoration:none; }
  .app-nav-item:hover { background:rgba(0,200,255,0.06); color:#e8f4ff; }
  .app-nav-item.active { background:rgba(0,200,255,0.1); color:#00c8ff; border-left:2px solid #00c8ff; padding-left:10px; }
  .app-nav-icon { width:16px; height:16px; opacity:.7; flex-shrink:0; }
  .app-nav-item.active .app-nav-icon { opacity:1; }
  .app-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(0,200,255,0.08); }
  .app-sidebar-user { font-family:'Share Tech Mono',monospace; font-size:10px; color:#3d5a7a; letter-spacing:.06em;
    display:flex; align-items:center; gap:6px; }
  .app-user-dot { width:6px; height:6px; border-radius:50%; background:#00ff9d; box-shadow:0 0 6px #00ff9d; animation:app-pulse 2s infinite; }
  @keyframes app-pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #00ff9d} 50%{opacity:.6;box-shadow:0 0 3px #00ff9d} }

  /* ── Mobile header ── */
  .app-mobile-header { display:none; position:sticky; top:0; z-index:20; background:rgba(3,6,16,.92); backdrop-filter:blur(12px);
    border-bottom:1px solid rgba(0,200,255,0.1); padding:0 16px; height:56px; align-items:center; justify-content:space-between; }
  .app-mobile-logo { font-family:'Share Tech Mono',monospace; font-size:14px; color:#00c8ff; letter-spacing:.08em; }
  .app-hamburger { background:transparent; border:1px solid rgba(0,200,255,0.2); color:#7ba3c8; width:34px; height:34px;
    border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .app-sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:9; }
  .app-sidebar-overlay.open { display:block; }

  /* ── Main content ── */
  .app-main { flex:1; padding:32px 36px; overflow-x:hidden; min-width:0; }

  /* ── Page header ── */
  .app-page-tag { font-family:'Share Tech Mono',monospace; font-size:10px; color:#00c8ff; letter-spacing:.2em; text-transform:uppercase;
    display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .app-page-tag::before { content:''; width:12px; height:1px; background:#00c8ff; opacity:.5; }
  .app-page-title { font-size:26px; font-weight:700; letter-spacing:-.01em; margin-bottom:4px; }
  .app-page-sub { font-size:12px; color:#7ba3c8; font-weight:300; font-family:'Share Tech Mono',monospace; }

  /* ── Cards ── */
  .app-card { background:#0a1428; border:1px solid rgba(0,200,255,0.12); border-radius:4px; padding:24px; position:relative; overflow:hidden; }
  .app-card-hover { transition:border-color .2s, background .2s, transform .2s; }
  .app-card-hover:hover { border-color:rgba(0,200,255,0.3); background:#0d1a30; transform:translateY(-1px); }
  .app-card-title { font-size:13px; font-weight:600; color:#e8f4ff; margin-bottom:4px; }
  .app-card-sub { font-size:11px; color:#3d5a7a; font-family:'Share Tech Mono',monospace; }

  /* ── Inputs ── */
  .app-label { font-family:'Share Tech Mono',monospace; font-size:10px; color:#3d5a7a; letter-spacing:.12em; text-transform:uppercase; display:block; margin-bottom:6px; }
  .app-input { width:100%; height:42px; background:rgba(0,200,255,0.04); border:1px solid rgba(0,200,255,0.12); border-radius:3px;
    padding:0 12px; font-family:'Share Tech Mono',monospace; font-size:12px; color:#e8f4ff; outline:none; transition:all .2s; }
  .app-input::placeholder { color:#3d5a7a; font-size:11px; }
  .app-input:focus { border-color:rgba(0,200,255,0.4); background:rgba(0,200,255,0.07); box-shadow:0 0 0 3px rgba(0,200,255,0.07); }

  /* ── Buttons ── */
  .app-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:'Share Tech Mono',monospace;
    font-size:11px; letter-spacing:.1em; border-radius:3px; cursor:pointer; transition:all .2s; border:none; padding:0 18px; height:38px; }
  .app-btn-primary { background:#00c8ff; color:#030610; }
  .app-btn-primary:hover { box-shadow:0 0 20px rgba(0,200,255,0.4); transform:translateY(-1px); }
  .app-btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; box-shadow:none; }
  .app-btn-ghost { background:transparent; color:#00c8ff; border:1px solid rgba(0,200,255,0.3); }
  .app-btn-ghost:hover { background:rgba(0,200,255,0.08); }
  .app-btn-ghost:disabled { opacity:.6; cursor:not-allowed; }
  .app-btn-danger { background:rgba(255,60,60,0.1); color:#ff6b6b; border:1px solid rgba(255,60,60,0.25); }
  .app-btn-danger:hover { background:rgba(255,60,60,0.2); border-color:rgba(255,60,60,0.5); }
  .app-btn-success { background:rgba(0,255,157,0.1); color:#00ff9d; border:1px solid rgba(0,255,157,0.25); }
  .app-btn-success:hover { background:rgba(0,255,157,0.2); }
  .app-btn-sm { height:30px; padding:0 12px; font-size:10px; }

  /* ── Status badges ── */
  .app-badge { font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:.1em; padding:3px 8px; border-radius:2px; text-transform:uppercase; }
  .app-badge-running { background:rgba(0,255,157,0.1); border:1px solid rgba(0,255,157,0.25); color:#00ff9d; }
  .app-badge-stopped { background:rgba(100,120,140,0.1); border:1px solid rgba(100,120,140,0.2); color:#7ba3c8; }
  .app-badge-error { background:rgba(255,60,60,0.1); border:1px solid rgba(255,60,60,0.25); color:#ff6b6b; }
  .app-badge-pending { background:rgba(0,200,255,0.08); border:1px solid rgba(0,200,255,0.2); color:#00c8ff; }
  .app-badge-processing { background:rgba(255,200,0,0.08); border:1px solid rgba(255,200,0,0.2); color:#ffc800; }
  .app-badge-completed { background:rgba(0,255,157,0.08); border:1px solid rgba(0,255,157,0.2); color:#00ff9d; }
  .app-badge-failed { background:rgba(255,60,60,0.08); border:1px solid rgba(255,60,60,0.2); color:#ff6b6b; }
  .app-badge-free { background:rgba(0,255,157,0.08); border:1px solid rgba(0,255,157,0.25); color:#00ff9d; }
  .app-badge-new { background:rgba(0,200,255,0.08); border:1px solid rgba(0,200,255,0.25); color:#00c8ff; }

  /* ── Alert messages ── */
  .app-error { background:rgba(255,50,50,0.08); border:1px solid rgba(255,50,50,0.2); border-radius:3px; padding:10px 14px;
    font-size:12px; color:#ff6b6b; font-family:'Share Tech Mono',monospace; }
  .app-success { background:rgba(0,255,157,0.06); border:1px solid rgba(0,255,157,0.2); border-radius:3px; padding:10px 14px;
    font-size:12px; color:#00ff9d; font-family:'Share Tech Mono',monospace; }
  .app-info { background:rgba(0,200,255,0.06); border:1px solid rgba(0,200,255,0.18); border-radius:3px; padding:12px 16px;
    font-size:12px; color:rgba(0,200,255,0.8); font-family:'Share Tech Mono',monospace; line-height:1.7; }

  /* ── Divider ── */
  .app-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(0,200,255,0.15),transparent); margin:24px 0; }

  /* ── Code block ── */
  .app-code-block { background:rgba(0,0,0,.3); border:1px solid rgba(0,200,255,0.1); border-radius:3px; padding:8px 12px;
    font-family:'Share Tech Mono',monospace; font-size:11px; color:rgba(0,200,255,0.7); word-break:break-all; }

  /* ── Table ── */
  .app-table { width:100%; border-collapse:collapse; }
  .app-table th { font-family:'Share Tech Mono',monospace; font-size:10px; color:#3d5a7a; letter-spacing:.1em; text-transform:uppercase;
    padding:10px 14px; text-align:left; border-bottom:1px solid rgba(0,200,255,0.1); }
  .app-table td { padding:12px 14px; font-size:12px; color:#7ba3c8; border-bottom:1px solid rgba(0,200,255,0.06); vertical-align:middle; }
  .app-table tr:hover td { background:rgba(0,200,255,0.03); }
  .app-table td.primary { color:#e8f4ff; font-weight:500; }

  /* ── Empty state ── */
  .app-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 24px;
    text-align:center; border:1px dashed rgba(0,200,255,0.15); border-radius:4px; }
  .app-empty-icon { font-size:32px; margin-bottom:16px; opacity:.5; }
  .app-empty-title { font-size:15px; font-weight:600; margin-bottom:8px; color:#e8f4ff; }
  .app-empty-desc { font-size:12px; color:#3d5a7a; max-width:280px; line-height:1.7; font-weight:300; margin-bottom:20px; }

  /* ── Loading spinner ── */
  .app-spinner { width:36px; height:36px; border:2px solid rgba(0,200,255,0.15); border-top-color:#00c8ff;
    border-radius:50%; animation:app-spin 0.8s linear infinite; }
  @keyframes app-spin { to { transform:rotate(360deg); } }

  /* ── Instance card ── */
  .inst-card { background:#0a1428; border:1px solid rgba(0,200,255,0.12); border-radius:4px; overflow:hidden; display:flex; flex-direction:column;
    transition:border-color .2s, background .2s; }
  .inst-card:hover { border-color:rgba(0,200,255,0.28); background:#0d1a30; }
  .inst-card-body { padding:22px; flex:1; }
  .inst-card-footer { padding:14px 20px; background:rgba(0,200,255,0.02); border-top:1px solid rgba(0,200,255,0.08); display:flex; gap:10px; }
  .inst-power-icon { width:36px; height:36px; border-radius:50%; border:1px solid rgba(0,200,255,0.2); display:flex; align-items:center;
    justify-content:center; background:rgba(0,200,255,0.06); }
  .inst-power-icon.on { border-color:rgba(0,255,157,0.4); background:rgba(0,255,157,0.08); }

  /* ── Service card (marketplace) ── */
  .svc-card { background:#0a1428; border:1px solid rgba(0,200,255,0.12); border-radius:4px; padding:24px; display:flex; flex-direction:column;
    gap:10px; transition:border-color .2s,background .2s,transform .2s; cursor:pointer; }
  .svc-card:hover { border-color:rgba(0,200,255,0.35); background:#0d1a30; transform:translateY(-2px); }
  .svc-card.selected { border-color:rgba(0,200,255,0.6); background:#0d1a30; }
  .svc-icon { width:38px; height:38px; border-radius:6px; display:flex; align-items:center; justify-content:center;
    font-size:18px; background:rgba(0,200,255,0.08); border:1px solid rgba(0,200,255,0.15); }
  .svc-name { font-size:15px; font-weight:600; color:#e8f4ff; }
  .svc-desc { font-size:12px; color:#7ba3c8; line-height:1.65; font-weight:300; flex:1; }

  /* ── Drop zone ── */
  .drop-zone { border:2px dashed rgba(0,200,255,0.2); border-radius:4px; padding:40px 24px; text-align:center;
    cursor:pointer; transition:all .2s; }
  .drop-zone:hover, .drop-zone.active { border-color:rgba(0,200,255,0.5); background:rgba(0,200,255,0.04); }
  .drop-zone.disabled { opacity:.5; pointer-events:none; }
  .drop-zone-icon { font-size:32px; margin-bottom:12px; }
  .drop-zone-text { font-size:14px; color:#7ba3c8; }
  .drop-zone-sub { font-size:11px; color:#3d5a7a; margin-top:4px; font-family:'Share Tech Mono',monospace; }

  /* ── Modal overlay ── */
  .app-modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(3,6,16,.8);
    backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; }
  .app-modal { background:#0a1428; border:1px solid rgba(0,200,255,0.3); border-radius:6px; padding:32px;
    width:100%; max-width:460px; position:relative; box-shadow:0 0 60px rgba(0,200,255,0.08),0 32px 60px rgba(0,0,0,.5);
    animation:app-modal-in .25s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes app-modal-in { from{opacity:0;transform:scale(.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .app-modal-close { position:absolute; top:16px; right:16px; width:28px; height:28px; background:rgba(0,200,255,0.06);
    border:1px solid rgba(0,200,255,0.15); border-radius:2px; color:#7ba3c8; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
  .app-modal-close:hover { border-color:rgba(0,200,255,0.4); color:#00c8ff; }

  /* ── Expire warning banner ── */
  .app-expire-banner { background:rgba(255,60,60,0.07); border:1px solid rgba(255,60,60,0.2); border-radius:4px;
    padding:20px 24px; display:flex; align-items:center; gap:16px; margin-bottom:24px; }

  /* ── Grid layout ── */
  .app-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .app-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }

  /* ── Responsive ── */
  @media(max-width:768px){
    .app-mobile-header { display:flex; }
    .app-sidebar { position:fixed; inset-y:0; left:0; transform:translateX(-100%); transition:transform .2s; }
    .app-sidebar.open { transform:translateX(0); }
    .app-main { padding:20px 16px; }
    .app-grid-3 { grid-template-columns:1fr; }
    .app-grid-2 { grid-template-columns:1fr; }
  }
  @media(min-width:769px){
    .app-wrap { flex-direction:row; }
    .app-shell { flex-direction:row; }
  }
`;

const NAV_ITEMS = [
  {
    label: '仪表盘', path: '/dashboard',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  },
  {
    label: '服务市场', path: '/marketplace',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12l-1 6H3L2 3z"/><circle cx="6" cy="13" r="1"/><circle cx="11" cy="13" r="1"/></svg>,
  },
  {
    label: '知识库', path: '/knowledge',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h8l2 2v10H3V2z"/><path d="M5 6h6M5 9h4"/></svg>,
  },
  {
    label: '设置', path: '/settings',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect((): (() => void) | void => {
    const el = document.createElement('style');
    el.textContent = APP_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  return (
    <div className="app-wrap">
      <div className="app-bg-grid" />

      {/* Mobile header */}
      <header className="app-mobile-header">
        <span className="app-mobile-logo">小智 MCP</span>
        <button className="app-hamburger" onClick={() => setSidebarOpen(v => !v)}>
          {sidebarOpen
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </header>

      <div className={cn('app-sidebar-overlay', sidebarOpen && 'open')} onClick={() => setSidebarOpen(false)} />

      <div className="app-shell">
        {/* Sidebar */}
        <aside className={cn('app-sidebar', sidebarOpen && 'open')}>
          <Link to="/" className="app-sidebar-logo">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="28" height="28" rx="4" stroke="rgba(0,200,255,0.4)" strokeWidth="1"/>
              <rect x="8" y="8" width="16" height="16" rx="2" fill="rgba(0,200,255,0.1)" stroke="rgba(0,200,255,0.6)" strokeWidth="1"/>
              <circle cx="16" cy="16" r="4" fill="rgba(0,200,255,0.8)"/>
              <line x1="2" y1="16" x2="6" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5"/>
              <line x1="26" y1="16" x2="30" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5"/>
            </svg>
            <div>
              <div className="app-sidebar-logo-text">小智 MCP</div>
              <div className="app-sidebar-logo-sub">ESP32 · Open Source</div>
            </div>
          </Link>

          <nav className="app-sidebar-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                className={cn('app-nav-item', location.pathname === item.path && 'active')}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              >
                <svg className="app-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {item.icon.props.children}
                </svg>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="app-sidebar-footer">
            <div className="app-sidebar-user">
              <span className="app-user-dot" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || '已登录'}</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
