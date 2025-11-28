'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Settings,
  Loader2,
  FileText,
  LogOut,
  ClipboardList,
  TrendingUp,
  Bell,
  CircleUser,
  SquareChartGantt,
  Eye,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Truck,
} from 'lucide-react';

// TODO: Implementasi theme switcher (light/dark mode)
// TODO: Tambahkan breadcrumb navigation yang dinamis
// TODO: Integrasi dengan notification system untuk bell icon
// TODO: Implementasi keyboard shortcuts untuk toggle sidebar
// TODO: Tambahkan search functionality di sidebar menu

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // redirect jika tidak terautentikasi atau bukan admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // menu sidebar dengan path untuk active state
  const sidebarMenus = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'akun', label: 'Manajemen Akun', icon: Users, path: '/admin/accounts' },
    { id: 'deliveries', label: 'Buat Delivery', icon: Truck, path: '/admin/deliveries' },
    { id: 'escrow', label: 'Kontrol Escrow', icon: Shield, path: '/admin/escrow', badge: 2 },
    { id: 'masalah', label: 'Manajemen Masalah', icon: ClipboardList, path: '/admin/issues' },
    { id: 'review', label: 'Manual Review', icon: Eye, path: '/admin/manual-review' },
    { id: 'deteksi', label: 'Deteksi Anomali', icon: AlertTriangle, path: '/admin/anomalies' },
    { id: 'optimasi', label: 'Optimasi Anggaran', icon: TrendingUp, path: '/admin/budget' },
    { id: 'laporan', label: 'Laporan', icon: SquareChartGantt, path: '/admin/reports' },
    { id: 'pengaturan', label: 'Pengaturan Sistem', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    // TODO: Implementasi logout functionality dengan clear session/token
    router.push('/login');
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  // check apakah menu sedang aktif berdasarkan pathname
  const isMenuActive = (menuPath: string) => {
    if (menuPath === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(menuPath);
  };

  // toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // handle touch start untuk swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  // handle touch move untuk swipe
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // handle touch end untuk swipe
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      // swipe left - close sidebar
      setIsSidebarOpen(false);
    }

    if (touchEnd - touchStart > 150) {
      // swipe right - open sidebar
      setIsSidebarOpen(true);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col gpu-accelerate admin-sidebar transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isMobileMenuOpen ? 'translate-x-0' : ''} ${isSidebarOpen ? 'w-64' : 'lg:w-20'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Dashboard</h1>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mx-auto">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
          )}
          {/* Toggle Button - Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
          {/* Close Button - Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scroll-container">
          {isSidebarOpen && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3">
              Laporan & Analitik
            </p>
          )}
          {sidebarMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleMenuClick(menu.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth text-left relative group ${
                isMenuActive(menu.path)
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${!isSidebarOpen ? 'justify-center' : ''}`}
              title={!isSidebarOpen ? menu.label : ''}
            >
              <menu.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && (
                <>
                  <span className="font-medium text-sm">{menu.label}</span>
                  {menu.badge && (
                    <span className="ml-auto w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                      {menu.badge}
                    </span>
                  )}
                </>
              )}
              {!isSidebarOpen && menu.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                  {menu.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Support & Logout */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-smooth text-left ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
            title={!isSidebarOpen ? 'Support' : ''}
          >
            <FileText className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium text-sm">Support</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-smooth text-left ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
            title={!isSidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-container bg-gray-50">
        {/* Top Header - dengan user info */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 gpu-accelerate">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-smooth"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-smooth">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full notification-badge"></span>
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                  <CircleUser className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.email || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
