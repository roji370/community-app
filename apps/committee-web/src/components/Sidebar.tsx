'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/services/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/visitors', label: 'Visitors', icon: '🚶' },
  { href: '/complaints', label: 'Complaints', icon: '📋' },
  { href: '/billing', label: 'Billing', icon: '💰' },
  { href: '/notices', label: 'Notices', icon: '📢' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>🏘️ Community</h2>
        <span>Committee Dashboard</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout}>
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
