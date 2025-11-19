import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  School,
  UtensilsCrossed,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Menu,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'admin' | 'school' | 'catering';
  userName?: string;
}

export default function DashboardLayout({ children, role, userName = 'User' }: DashboardLayoutProps) {
  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
      { icon: School, label: 'Monitoring Sekolah', href: '/admin/schools' },
      { icon: UtensilsCrossed, label: 'Monitoring Katering', href: '/admin/caterings' },
      { icon: BarChart3, label: 'AI Priority Map', href: '/admin/priority' },
      { icon: Users, label: 'Manajemen User', href: '/admin/users' },
      { icon: Settings, label: 'Pengaturan', href: '/admin/settings' },
    ],
    school: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/school' },
      { icon: UtensilsCrossed, label: 'Verifikasi Pengiriman', href: '/school/verify' },
      { icon: BarChart3, label: 'Riwayat', href: '/school/history' },
      { icon: Settings, label: 'Pengaturan', href: '/school/settings' },
    ],
    catering: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/catering' },
      { icon: School, label: 'Jadwal Pengiriman', href: '/catering/schedule' },
      { icon: BarChart3, label: 'Status Pembayaran', href: '/catering/payments' },
      { icon: Settings, label: 'Pengaturan', href: '/catering/settings' },
    ],
  };

  const roleColors = {
    admin: 'from-blue-600 to-blue-700',
    school: 'from-green-600 to-green-700',
    catering: 'from-purple-600 to-purple-700',
  };

  const roleLabels = {
    admin: 'Admin Dinas',
    school: 'Sekolah',
    catering: 'Katering',
  };

  return (
    <div className="min-h-screen blockchain-mesh">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass-card bg-white/10 border-r border-white/20 z-50">
        <div className="p-6">
          {/* logo */}
          <Link href="/" className="flex justify-center">
            <Image
              src="/MBG-removebg-preview.png"
              alt="MBG Logo"
              width={160}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* User Info */}
        <div className={`mx-4 mb-4 p-4 glass-card bg-gradient-to-r ${roleColors[role]} rounded-lg`}>
          <p className="text-white text-sm font-semibold">{userName}</p>
          <p className="text-blue-100 text-xs">{roleLabels[role]}</p>
        </div>

        {/* Navigation */}
        <nav className="px-4">
          <ul className="space-y-1">
            {menuItems[role].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <item.icon className="w-5 h-5 group-hover:text-white" />
                  <span className="group-hover:text-white">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="glass-card bg-white/5 border-b border-white/10 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{userName.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
