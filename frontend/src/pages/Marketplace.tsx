import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

const SERVICE_ICONS: Record<string, string> = {
  '联网搜索': '🔍', '菜谱查询': '🍳', 'MBTI': '🧠', '股票': '📈',
  '汇率': '💱', '火车票': '🚄', '黄金': '🥇', '行业报告': '📊',
  '知识库': '📚', '快递': '📦', '航班': '✈️', '新闻': '📰',
};

function getIcon(name: string) {
  for (const [k, v] of Object.entries(SERVICE_ICONS)) {
    if (name.includes(k)) return v;
  }
  return '⚡';
}

export default function Marketplace() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [wssUrl, setWssUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/services').then(res => setServices(res.data)).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!selectedService || !wssUrl) return;
    setAdding(true);
    setError('');
    try {
      await axios.post('/api/instances', { serviceId: selectedService.id, xiaozhiWssUrl: wssUrl });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '添加实例失败，请检查输入');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: 28 }}>
        <div className="app-page-tag">SERVICE MARKETPLACE</div>
        <h2 className="app-page-title">服务市场</h2>
        <div className="app-page-sub">选择一个 MCP 服务，连接您的小智设备</div>
      </div>

      {!selectedService ? (
        /* Service list */
        <div className="app-grid-3">
          {services.map(svc => (
            <div
              key={svc.id}
              className="svc-card"
              onClick={() => { setSelectedService(svc); setWssUrl(''); setError(''); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="svc-icon">{getIcon(svc.name)}</div>
                <span className="app-badge app-badge-free">FREE</span>
              </div>
              <div className="svc-name">{svc.name}</div>
              <div className="svc-desc">{svc.description}</div>
              <button className="app-btn app-btn-ghost" style={{ width: '100%', marginTop: 4 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
                安装
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Install form */
        <div style={{ maxWidth: 560 }}>
          <button
            className="app-btn app-btn-ghost app-btn-sm"
            style={{ marginBottom: 24 }}
            onClick={() => setSelectedService(null)}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
            返回市场
          </button>

          <div className="app-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div className="svc-icon" style={{ width: 44, height: 44, fontSize: 22 }}>{getIcon(selectedService.name)}</div>
              <div>
                <div className="app-page-tag" style={{ marginBottom: 2 }}>INSTALL SERVICE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8f4ff' }}>{selectedService.name}</div>
              </div>
            </div>

            <div className="app-info" style={{ marginBottom: 20 }}>
              {selectedService.description}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="app-label">WebSocket 地址</label>
              <input
                className="app-input"
                placeholder="wss://api.nocode.cd/mcp/?token=..."
                value={wssUrl}
                onChange={e => setWssUrl(e.target.value)}
                autoFocus
              />
              <div style={{ fontSize: 11, color: '#3d5a7a', marginTop: 6, fontFamily: "'Share Tech Mono',monospace" }}>
                机器人平台为该智能体提供的 WebSocket 连接地址
              </div>
            </div>

            {error && <div className="app-error" style={{ marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="app-btn app-btn-ghost" onClick={() => setSelectedService(null)}>取消</button>
              <button className="app-btn app-btn-primary" onClick={handleAdd} disabled={!wssUrl || adding}>
                {adding && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'app-spin .8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                )}
                {adding ? '添加中...' : '添加实例'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
