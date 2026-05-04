import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { cn, copyToClipboard } from '../lib/utils';
import { ActivationModal } from '../components/ActivationModal';

interface Instance {
  id: number;
  serviceId: number;
  xiaozhiWssUrl: string;
  status: string;
  startTime?: string;
  active: boolean;
  service?: { name: string };
}

export default function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const expireDate = user.expireDate ? new Date(user.expireDate) : null;
  const isExpired = expireDate ? expireDate < new Date() : false;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else navigate('/login');
  }, [navigate]);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      setInstances(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isExpired) {
      fetchInstances();
      const t = setInterval(fetchInstances, 5000);
      return () => clearInterval(t);
    } else {
      setLoading(false);
    }
  }, [isExpired]);

  const handleStart = async (id: number) => {
    try { await axios.post(`/api/instances/${id}/start`); fetchInstances(); } catch (e) { console.error(e); }
  };
  const handleStop = async (id: number) => {
    try { await axios.post(`/api/instances/${id}/stop`); fetchInstances(); } catch (e) { console.error(e); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个实例吗？')) return;
    try { await axios.delete(`/api/instances/${id}`); fetchInstances(); } catch (e) { console.error(e); }
  };

  return (
    <Layout>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="app-page-tag">DASHBOARD</div>
          <h2 className="app-page-title">我的实例</h2>
          <div className="app-page-sub">
            {user.email}
            {expireDate && (
              <span style={{ marginLeft: 12, color: isExpired ? '#ff6b6b' : 'rgba(0,200,255,0.6)' }}>
                · 有效期至 {expireDate.toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="app-btn app-btn-ghost"
            onClick={() => navigate('/invite-list')}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2-5 5-5"/><path d="M13 8v4M11 10h4"/></svg>
            邀请码: {user.inviteCode || 'N/A'}
          </button>
          <button className="app-btn app-btn-primary" onClick={() => navigate('/marketplace')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
            新增实例
          </button>
        </div>
      </div>

      {/* Expired state */}
      {isExpired && (
        <div className="app-expire-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#ff6b6b', marginBottom: 4, fontSize: 14 }}>试用期已过期</div>
            <div style={{ fontSize: 12, color: '#7ba3c8' }}>请购买激活时长以继续使用 MCP 服务</div>
          </div>
          <button className="app-btn app-btn-primary" onClick={() => setShowActivateModal(true)}>
            购买激活时长
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="app-spinner" />
        </div>
      )}

      {/* Instance grid */}
      {!loading && !isExpired && (
        <>
          {instances.length === 0 ? (
            <div className="app-empty">
              <div className="app-empty-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth="1.5">
                  <rect x="6" y="12" width="28" height="20" rx="2"/><path d="M14 12V9a6 6 0 0112 0v3"/><circle cx="20" cy="22" r="3"/>
                </svg>
              </div>
              <div className="app-empty-title">暂无服务实例</div>
              <div className="app-empty-desc">去服务市场挑选一个 MCP 服务，一键安装到您的小智设备</div>
              <button className="app-btn app-btn-primary" onClick={() => navigate('/marketplace')}>前往服务市场</button>
            </div>
          ) : (
            <div className="app-grid-3">
              {instances.map(inst => (
                <InstanceCard
                  key={inst.id}
                  instance={inst}
                  onStart={handleStart}
                  onStop={handleStop}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ActivationModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </Layout>
  );
}

function InstanceCard({ instance, onStart, onStop, onDelete }: {
  instance: { id: number; serviceId: number; xiaozhiWssUrl: string; status: string; active: boolean; service?: { name: string } };
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const isRunning = instance.status === 'running';
  const isError = instance.status === 'error';

  const handleCopy = async () => {
    const ok = await copyToClipboard(instance.xiaozhiWssUrl);
    if (!ok) prompt('请手动复制 WebSocket 地址：', instance.xiaozhiWssUrl);
  };

  return (
    <div className="inst-card">
      <div className="inst-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div className={cn('inst-power-icon', instance.active && 'on')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={instance.active ? '#00ff9d' : '#3d5a7a'} strokeWidth="2" strokeLinecap="round">
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </div>
          <span className={cn('app-badge', isRunning ? 'app-badge-running' : isError ? 'app-badge-error' : 'app-badge-stopped')}>
            {isRunning ? '运行中' : isError ? '异常' : '已停止'}
          </span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#e8f4ff' }}>
          {instance.service ? instance.service.name : `MCP 服务 #${instance.serviceId}`}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#3d5a7a', marginBottom: 14 }}>
          ID: {instance.id}
        </div>

        <div className="app-code-block" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {instance.xiaozhiWssUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,200,255,0.5)', flexShrink: 0, padding: '2px 4px' }}
            title="复制地址"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </div>

      <div className="inst-card-footer">
        {!isRunning ? (
          <button className="app-btn app-btn-success" style={{ flex: 1 }} onClick={() => onStart(instance.id)}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l8 5-8 5V3z"/></svg>
            启动
          </button>
        ) : (
          <button className="app-btn app-btn-danger" style={{ flex: 1 }} onClick={() => onStop(instance.id)}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1"/></svg>
            停止
          </button>
        )}
        <button className="app-btn app-btn-ghost" style={{ flex: 1 }} onClick={() => onDelete(instance.id)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10H3z"/></svg>
          删除
        </button>
      </div>
    </div>
  );
}
