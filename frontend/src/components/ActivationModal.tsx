import { useState } from 'react';
import axios from 'axios';
import wechatSupport from '../assets/wechat-support.jpg';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivationModal({ isOpen, onClose, onSuccess }: ActivationModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/activate', { code });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.expireDate = res.data.user.expireDate;
      localStorage.setItem('user', JSON.stringify(user));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || err.message || '激活失败，请检查激活码');
      } else {
        setError('激活失败，请检查激活码');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="app-modal">
        <button className="app-modal-close" onClick={onClose}>✕</button>

        <div className="app-page-tag" style={{ marginBottom: 8 }}>ACTIVATION</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>购买激活时长</div>
        <div style={{ fontSize: 12, color: '#3d5a7a', fontFamily: "'Share Tech Mono',monospace", marginBottom: 24 }}>
          扫描下方二维码联系客服购买激活码
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 160, height: 160, borderRadius: 6, overflow: 'hidden',
            border: '1px solid rgba(0,200,255,0.2)', background: 'rgba(0,0,0,.3)'
          }}>
            <img src={wechatSupport} alt="WeChat" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: 'rgba(0,200,255,0.6)',
            background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)',
            padding: '4px 12px', borderRadius: 2
          }}>
            微信号：McpManageSupport
          </div>
        </div>

        <div className="app-divider" />

        <div style={{ marginBottom: 16 }}>
          <label className="app-label">激活码</label>
          <input
            className="app-input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="例如：VIP-MONTH"
            style={{ textAlign: 'center', letterSpacing: '.15em', fontWeight: 600 }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
          />
        </div>

        {error && <div className="app-error" style={{ marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="app-btn app-btn-ghost" onClick={onClose}>取消</button>
          <button className="app-btn app-btn-primary" onClick={handleActivate} disabled={loading || !code}>
            {loading && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'app-spin .8s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
              </svg>
            )}
            {loading ? '激活中...' : '立即激活'}
          </button>
        </div>
      </div>
    </div>
  );
}
