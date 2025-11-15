'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface ModernSidebarProps {
  navItems: NavItem[];
  userRole: string;
  userName: string;
  userEmail: string;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  navItems,
  userRole,
  userName,
  userEmail,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-gradient-bg-1 text-white',
    school: 'bg-gradient-bg-4 text-white',
    catering: 'bg-gradient-bg-2 text-white',
    public: 'bg-gradient-bg-3 text-white',
  };

  return (
    <aside className="w-72 h-screen glass border-r border-white/20 flex flex-col fade-in">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-bg-1 flex items-center justify-center shadow-glow">
            <span className="text-2xl font-bold text-white">MBG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">MBG</h1>
            <p className="text-xs text-gray-600">Makan Bergizi Gabocor</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${roleColors[userRole.toLowerCase()] || roleColors.public} flex items-center justify-center font-bold shadow-modern`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`sidebar-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="p-3 rounded-xl bg-gradient-bg-1 text-white text-sm">
          <p className="font-semibold mb-1">Powered by AI & Blockchain</p>
          <p className="text-xs text-white/80">
            Transparansi penuh untuk generasi lebih sehat
          </p>
        </div>
      </div>
    </aside>
  );
};

export default ModernSidebar;
