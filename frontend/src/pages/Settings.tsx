import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Settings() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const expireDate = user.expireDate ? new Date(user.expireDate) : null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/change-password', { oldPassword, newPassword });
      setMessage('密码修改成功');
      setOldPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || err.message || '修改失败');
      } else {
        setError('修改失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <div className="app-page-tag">SETTINGS</div>
        <h2 className="app-page-title">设置</h2>
        <div className="app-page-sub">管理您的账户与安全选项</div>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Account info */}
        <div className="app-card">
          <div className="app-page-tag" style={{ marginBottom: 16 }}>ACCOUNT INFO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="app-label" style={{ margin: 0 }}>邮箱</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#7ba3c8' }}>{user.email || '—'}</span>
            </div>
            <div className="app-divider" style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="app-label" style={{ margin: 0 }}>有效期</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: expireDate && expireDate < new Date() ? '#ff6b6b' : '#00ff9d' }}>
                {expireDate ? expireDate.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>
            </div>
            <div className="app-divider" style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="app-label" style={{ margin: 0 }}>邀请码</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#00c8ff', letterSpacing: '.12em' }}>{user.inviteCode || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="app-card">
          <div className="app-page-tag" style={{ marginBottom: 16 }}>SECURITY</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8f4ff', marginBottom: 4 }}>修改密码</div>
          <div style={{ fontSize: 12, color: '#3d5a7a', marginBottom: 20, fontFamily: "'Share Tech Mono',monospace" }}>定期更新密码以保护您的账户安全</div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="app-label">当前密码</label>
              <input className="app-input" type="password" placeholder="输入当前密码" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label className="app-label">新密码</label>
              <input className="app-input" type="password" placeholder="设置新密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>

            {error && <div className="app-error">{error}</div>}
            {message && <div className="app-success">{message}</div>}

            <div>
              <button type="submit" className="app-btn app-btn-primary" disabled={loading}>
                {loading && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'app-spin .8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                )}
                {loading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="app-card" style={{ borderColor: 'rgba(255,60,60,0.15)' }}>
          <div className="app-page-tag" style={{ marginBottom: 16, color: '#ff6b6b' }}>DANGER ZONE</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8f4ff', marginBottom: 4 }}>退出登录</div>
          <div style={{ fontSize: 12, color: '#3d5a7a', marginBottom: 20, fontFamily: "'Share Tech Mono',monospace" }}>退出后需重新验证身份</div>
          <button className="app-btn app-btn-danger" onClick={handleLogout}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H2v12h4M11 11l3-3-3-3M14 8H6"/></svg>
            退出登录
          </button>
        </div>

      </div>
    </Layout>
  );
}
