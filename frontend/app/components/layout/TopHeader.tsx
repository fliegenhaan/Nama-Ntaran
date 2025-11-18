'use client';

import React, { useState } from 'react';
import { Bell, Mail, User, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopHeaderProps {
  userName?: string;
  userEmail?: string;
  notificationCount?: number;
  messageCount?: number;
  onLogout?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({
  userName = 'Pengguna',
  userEmail = '',
  notificationCount = 0,
  messageCount = 0,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm gpu-accelerate">
      <div className="h-full px-6 flex items-center justify-end gap-4">
        {/* tombol notifikasi */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-smooth focus-ring"
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </motion.span>
          )}
        </motion.button>

        {/* tombol pesan */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-smooth focus-ring"
          aria-label="Pesan"
        >
          <Mail className="w-5 h-5 text-gray-700" />
          {messageCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
            >
              {messageCount > 9 ? '9+' : messageCount}
            </motion.span>
          )}
        </motion.button>

        {/* profil dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-2 pr-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-smooth focus-ring"
            aria-label="Profil Pengguna"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-600 truncate max-w-[150px]">
                  {userEmail}
                </p>
              )}
            </div>
          </motion.button>

          {/* dropdown menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden gpu-accelerate"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <p className="font-semibold text-gray-900">{userName}</p>
                  {userEmail && (
                    <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  )}
                </div>

                <div className="p-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-smooth text-left text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Profil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-smooth text-left text-gray-700">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Pengaturan</span>
                  </button>
                </div>

                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-smooth text-left text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Keluar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
