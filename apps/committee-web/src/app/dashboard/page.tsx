'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/components/AuthProvider';
import { getDashboardStats } from '@/services/committee';

interface DashboardData {
  totalUnits: number;
  activeResidents: number;
  pendingApprovals: number;
  todayVisitors: number;
  openComplaints: number;
  slaBreaches: number;
  collectionRate: number;
  recentVisitors: Array<{
    id: string;
    name: string;
    purpose: string;
    status: string;
    createdAt: string;
    unit: { identifier: string };
  }>;
  recentComplaints: Array<{
    id: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    unit: { identifier: string };
    sla: { status: string };
  }>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    APPROVED: 'badge-success', PAID: 'badge-success', RESOLVED: 'badge-success',
    PENDING: 'badge-warning', OPEN: 'badge-info', ACKNOWLEDGED: 'badge-accent',
    IN_PROGRESS: 'badge-accent', DENIED: 'badge-danger', EXPIRED: 'badge-muted',
    OVERDUE: 'badge-danger', REOPENED: 'badge-danger', BREACHED: 'badge-danger',
  };
  return map[status] || 'badge-muted';
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDashboardStats()
      .then((d) => setData(d as DashboardData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="loading-container"><div className="spinner" /></div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'Admin'}. Here&apos;s your society overview.</p>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏠</div>
            <div className="stat-value">{data.totalUnits}</div>
            <div className="stat-label">Total Units</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{data.activeResidents}</div>
            <div className="stat-label">Active Residents</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{data.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚶</div>
            <div className="stat-value">{data.todayVisitors}</div>
            <div className="stat-label">Today&apos;s Visitors</div>
          </div>
          <div className={`stat-card ${data.openComplaints > 0 ? 'warning' : 'success'}`}>
            <div className="stat-icon">📋</div>
            <div className="stat-value">{data.openComplaints}</div>
            <div className="stat-label">Open Complaints</div>
          </div>
          <div className={`stat-card ${data.slaBreaches > 0 ? 'danger' : 'success'}`}>
            <div className="stat-icon">🚨</div>
            <div className="stat-value">{data.slaBreaches}</div>
            <div className="stat-label">SLA Breaches</div>
          </div>
          <div className={`stat-card ${data.collectionRate >= 80 ? 'success' : data.collectionRate >= 50 ? 'warning' : 'danger'}`}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">{data.collectionRate}%</div>
            <div className="stat-label">Collection Rate</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Recent Visitors</h3>
            </div>
            {data.recentVisitors.length === 0 ? (
              <div className="empty-state"><p>No recent visitors</p></div>
            ) : (
              <ul className="activity-list">
                {data.recentVisitors.map((v) => (
                  <li key={v.id} className="activity-item">
                    <span className="activity-icon">🚶</span>
                    <span className="activity-text">
                      <strong>{v.name}</strong> — {v.purpose.toLowerCase()} to {v.unit.identifier}
                      {' '}<span className={`badge ${statusBadgeClass(v.status)}`}>{v.status}</span>
                    </span>
                    <span className="activity-time">{timeAgo(v.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Recent Complaints</h3>
            </div>
            {data.recentComplaints.length === 0 ? (
              <div className="empty-state"><p>No recent complaints</p></div>
            ) : (
              <ul className="activity-list">
                {data.recentComplaints.map((c) => (
                  <li key={c.id} className="activity-item">
                    <span className="activity-icon">📋</span>
                    <span className="activity-text">
                      <strong>{c.unit.identifier}</strong> — {c.category.toLowerCase().replace('_', ' ')}
                      {' '}<span className={`badge ${statusBadgeClass(c.status)}`}>{c.status}</span>
                      {c.sla.status === 'BREACHED' && <span className="badge badge-danger" style={{ marginLeft: 4 }}>SLA BREACHED</span>}
                    </span>
                    <span className="activity-time">{timeAgo(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
