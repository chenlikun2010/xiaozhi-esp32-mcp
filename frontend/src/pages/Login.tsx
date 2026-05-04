import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const AUTH_CSS = `
  .auth-page { min-height:100vh;background:#030610;display:flex;align-items:center;justify-content:center;
    font-family:'Noto Sans SC',sans-serif;color:#e8f4ff;position:relative;overflow:hidden; }
  .auth-page * { box-sizing:border-box; }
  .auth-grid { position:fixed;inset:0;pointer-events:none;
    background-image:linear-gradient(rgba(0,200,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.03) 1px,transparent 1px);
    background-size:60px 60px;animation:auth-drift 40s linear infinite; }
  @keyframes auth-drift { 0%{background-position:0 0} 100%{background-position:60px 60px} }
  .auth-glow { position:fixed;top:-200px;left:50%;transform:translateX(-50%);width:700px;height:500px;
    background:radial-gradient(ellipse,rgba(0,200,255,0.07) 0%,transparent 70%);pointer-events:none; }

  .auth-card { position:relative;z-index:1;width:100%;max-width:420px;padding:0 20px; }
  .auth-logo { display:flex;align-items:center;gap:12px;margin-bottom:40px;text-decoration:none; }
  .auth-logo-text { font-family:'Share Tech Mono',monospace;font-size:18px;color:#00c8ff;letter-spacing:.08em; }
  .auth-logo-sub { font-size:10px;color:#3d5a7a;letter-spacing:.15em;text-transform:uppercase;font-family:'Share Tech Mono',monospace; }

  .auth-box { background:#0a1428;border:1px solid rgba(0,200,255,0.25);border-radius:6px;padding:36px;
    box-shadow:0 0 60px rgba(0,200,255,0.06),0 32px 64px rgba(0,0,0,0.4); }
  .auth-tag { font-family:'Share Tech Mono',monospace;font-size:10px;color:#00c8ff;letter-spacing:.2em;text-transform:uppercase;
    display:flex;align-items:center;gap:8px;margin-bottom:10px; }
  .auth-tag::before { content:'';width:16px;height:1px;background:#00c8ff;opacity:.5; }
  .auth-title { font-size:22px;font-weight:700;margin-bottom:4px;letter-spacing:-.01em; }
  .auth-sub { font-size:12px;color:#7ba3c8;font-weight:300;margin-bottom:28px; }

  .auth-tabs { display:flex;gap:0;background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.12);border-radius:3px;padding:3px;margin-bottom:20px; }
  .auth-tab { flex:1;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.08em;padding:7px;
    background:transparent;border:none;color:#3d5a7a;cursor:pointer;border-radius:2px;transition:all .2s; }
  .auth-tab.active { background:#00c8ff;color:#030610; }

  .auth-field-group { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
  .auth-label { font-family:'Share Tech Mono',monospace;font-size:10px;color:#3d5a7a;letter-spacing:.12em;text-transform:uppercase; }
  .auth-input { width:100%;height:44px;background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.12);
    border-radius:3px;padding:0 14px;font-family:'Share Tech Mono',monospace;font-size:13px;color:#e8f4ff;
    outline:none;transition:border-color .2s,background .2s; }
  .auth-input::placeholder { color:#3d5a7a;font-size:12px; }
  .auth-input:focus { border-color:rgba(0,200,255,0.4);background:rgba(0,200,255,0.07);box-shadow:0 0 0 3px rgba(0,200,255,0.08); }

  .auth-input-row { display:flex;gap:8px; }
  .auth-input-row .auth-input { flex:1; }
  .auth-code-btn { flex-shrink:0;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.06em;
    padding:0 14px;background:transparent;border:1px solid rgba(0,200,255,0.4);color:#00c8ff;border-radius:3px;
    cursor:pointer;white-space:nowrap;transition:all .2s; }
  .auth-code-btn:hover:not(:disabled) { background:rgba(0,200,255,0.12); }
  .auth-code-btn:disabled { color:#3d5a7a;border-color:rgba(0,200,255,0.12);cursor:not-allowed; }

  .auth-forgot { text-align:right;margin-top:-6px;margin-bottom:8px; }
  .auth-forgot a { font-size:11px;color:#00c8ff;font-family:'Share Tech Mono',monospace;text-decoration:none; }
  .auth-forgot a:hover { text-decoration:underline; }

  .auth-submit { width:100%;height:46px;background:#00c8ff;color:#030610;border:none;border-radius:3px;
    font-family:'Share Tech Mono',monospace;font-size:13px;font-weight:600;letter-spacing:.12em;cursor:pointer;
    transition:box-shadow .2s,transform .1s;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px; }
  .auth-submit:hover:not(:disabled) { box-shadow:0 0 28px rgba(0,200,255,0.45),0 0 60px rgba(0,200,255,0.15);transform:translateY(-1px); }
  .auth-submit:disabled { opacity:.7;cursor:not-allowed; }

  .auth-divider { display:flex;align-items:center;gap:12px;color:#3d5a7a;font-size:11px;font-family:'Share Tech Mono',monospace;margin:16px 0; }
  .auth-divider::before,.auth-divider::after { content:'';flex:1;height:1px;background:rgba(0,200,255,0.12); }

  .auth-footer { text-align:center;font-size:11px;color:#3d5a7a;font-family:'Share Tech Mono',monospace;margin-top:20px; }
  .auth-footer a { color:#00c8ff;text-decoration:none; }
  .auth-footer a:hover { text-decoration:underline; }

  .auth-error { background:rgba(255,50,50,0.08);border:1px solid rgba(255,50,50,0.2);border-radius:3px;
    padding:10px 14px;font-size:12px;color:#ff6b6b;font-family:'Share Tech Mono',monospace;margin-bottom:12px; }

  .auth-back { position:fixed;top:24px;left:32px;z-index:10;display:flex;align-items:center;gap:8px;
    font-family:'Share Tech Mono',monospace;font-size:11px;color:#3d5a7a;text-decoration:none;
    letter-spacing:.08em;transition:color .2s; }
  .auth-back:hover { color:#00c8ff; }

  @keyframes auth-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

export default function Login() {
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startCountdown = async () => {
    if (!email.trim()) { setError('请输入邮箱'); return; }
    setSending(true);
    try {
      await axios.post('/api/send-verification-code', { email, type: 'login' });
      setSending(false);
      setCountdown(60);
      const t = setInterval(() => setCountdown(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    } catch (err: any) {
      setSending(false);
      setError(err.response?.data?.message || '发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = mode === 'password' ? { email, password } : { email, code };
      const res = await axios.post('/api/login', payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div className="auth-page">
        <div className="auth-grid" />
        <div className="auth-glow" />

        <Link to="/" className="auth-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          返回首页
        </Link>

        <div className="auth-card">
          <Link to="/" className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="28" height="28" rx="4" stroke="rgba(0,200,255,0.4)" strokeWidth="1" />
              <rect x="8" y="8" width="16" height="16" rx="2" fill="rgba(0,200,255,0.1)" stroke="rgba(0,200,255,0.6)" strokeWidth="1" />
              <circle cx="16" cy="16" r="4" fill="rgba(0,200,255,0.8)" />
              <line x1="2" y1="16" x2="6" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
              <line x1="26" y1="16" x2="30" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
            </svg>
            <div>
              <div className="auth-logo-text">小智 MCP</div>
              <div className="auth-logo-sub">ESP32 · Open Source</div>
            </div>
          </Link>

          <div className="auth-box">
            <div className="auth-tag">USER ACCESS</div>
            <div className="auth-title">欢迎回来</div>
            <div className="auth-sub">登录您的小智 MCP 账户以继续</div>

            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'password' ? 'active' : ''}`} onClick={() => setMode('password')}>账号密码</button>
              <button className={`auth-tab ${mode === 'code' ? 'active' : ''}`} onClick={() => setMode('code')}>邮箱验证码</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <div className="auth-label">邮箱</div>
                <input className="auth-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>

              {mode === 'password' ? (
                <>
                  <div className="auth-field-group">
                    <div className="auth-label">密码</div>
                    <input className="auth-input" type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <div className="auth-forgot"><Link to="/forgot-password">忘记密码？</Link></div>
                </>
              ) : (
                <div className="auth-field-group">
                  <div className="auth-label">验证码</div>
                  <div className="auth-input-row">
                    <input className="auth-input" type="text" placeholder="6 位验证码" value={code} onChange={e => setCode(e.target.value)} maxLength={6} required />
                    <button type="button" className="auth-code-btn" onClick={startCountdown} disabled={countdown > 0 || sending}>
                      {sending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'auth-spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" /></svg>}
                {loading ? '连接中...' : '登录'}
              </button>
            </form>

            <div className="auth-divider">没有账号？</div>
            <div className="auth-footer">
              <Link to="/register">立即注册</Link>
              <span style={{ margin: '0 8px', color: '#3d5a7a' }}>·</span>
              登录即同意 <a href="#">服务协议</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
