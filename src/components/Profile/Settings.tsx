'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  FaSun, FaMoon, FaSignOutAlt, FaBell, FaLock, FaUserShield,
  FaQuestionCircle, FaInfoCircle, FaChevronRight, FaTimes,
  FaBookmark, FaHistory, FaQrcode, FaStar, FaUsers
} from 'react-icons/fa';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsItem {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('msalToken');
    localStorage.removeItem('college');
    localStorage.removeItem('department');
    localStorage.removeItem('enrollmentId');
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!isOpen) return null;

  const settingsSections: SettingsSection[] = [
    {
      title: 'Your activity',
      items: [
        { icon: FaBookmark, label: 'Saved', onClick: () => router.push('/saved') },
        { icon: FaHistory, label: 'Archive', onClick: () => router.push('/archived') },
        { icon: FaHistory, label: 'Your activity', onClick: () => router.push('/activity') },
      ]
    },
    {
      title: 'How you use ClipSync',
      items: [
        { icon: FaBell, label: 'Notifications', onClick: () => router.push('/notifications') },
        { icon: FaHistory, label: 'Time spent', onClick: () => {} },
      ]
    },
    {
      title: 'Who can see your content',
      items: [
        { icon: FaLock, label: 'Account privacy', onClick: () => {} },
        { icon: FaUsers, label: 'Close Friends', onClick: () => {} },
        { icon: FaUserShield, label: 'Blocked', onClick: () => {} },
      ]
    },
    {
      title: 'More info and support',
      items: [
        { icon: FaQuestionCircle, label: 'Help', onClick: () => {} },
        { icon: FaInfoCircle, label: 'About', onClick: () => {} },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute inset-x-0 bottom-0 md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-96 max-h-[90vh] md:max-h-full overflow-y-auto rounded-t-2xl md:rounded-none animate-slide-up md:animate-slide-left bg-theme-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b theme-header">
          <h2 className="text-xl font-semibold text-theme-color">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FaTimes className="w-5 h-5 text-theme-color" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pb-24 md:pb-4">
          {/* QR Code */}
          <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
              <FaQrcode className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-theme-color">QR code</p>
              <p className="text-xs opacity-50 text-theme-color">Share your profile</p>
            </div>
            <FaChevronRight className="w-4 h-4 opacity-50 text-theme-color" />
          </button>

          {/* Settings Sections */}
          {settingsSections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider mb-2 px-2 opacity-50 text-theme-color">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <item.icon className="w-5 h-5 text-theme-color" />
                    <span className="flex-1 text-left text-theme-color">{item.label}</span>
                    <FaChevronRight className="w-4 h-4 opacity-50 text-theme-color" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Theme Toggle */}
          <div className="mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider mb-2 px-2 opacity-50 text-theme-color">
              Appearance
            </h3>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'light' ? (
                <FaMoon className="w-5 h-5 text-theme-color" />
              ) : (
                <FaSun className="w-5 h-5 text-theme-color" />
              )}
              <span className="flex-1 text-left text-theme-color">
                Switch to {theme === 'light' ? 'dark' : 'light'} mode
              </span>
            </button>
          </div>

          {/* Add Account */}
          <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 mb-2">
            <FaStar className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500">Add account</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FaSignOutAlt className="w-5 h-5 text-red-500" />
            <span className="text-red-500">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
