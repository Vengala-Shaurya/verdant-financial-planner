import React from 'react';
import {
  Compass,
  PieChart,
  Target,
  Sparkles,
  User,
  BookOpen,
  Bell,
  RefreshCw,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onQuickResetDemo: () => void;
  onOpenAskVerdant: () => void;
  userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  unreadCount,
  onOpenNotifications,
  onQuickResetDemo,
  onOpenAskVerdant,
  userName
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Living Ledger', icon: Compass, badge: null },
    { id: 'expenses', label: 'Expense Ledger', icon: Receipt, badge: null },
    { id: 'goals', label: 'Financial Goals', icon: Target, badge: null },
    { id: 'plan', label: 'AI Savings Plan', icon: Sparkles, badge: 'Core' },
    { id: 'profile', label: 'Financial Profile', icon: User, badge: null },
    { id: 'methodology', label: 'Methodology & Architecture', icon: BookOpen, badge: 'PT1' },
  ];

  return (
    <aside className="w-64 border-r border-[#D8DCD1] bg-[#FFFEFA] flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#D8DCD1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-editorial font-bold text-lg rounded-sm">
                V
              </div>
              <span className="font-editorial text-2xl tracking-tight text-[#183D32] font-semibold">
                VERDANT
              </span>
            </div>
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 text-[#202822]/70 hover:text-[#183D32] transition-colors rounded-sm hover:bg-[#F6F3EB]"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#C66D51] rounded-full ring-2 ring-[#FFFEFA]" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#202822]/60 mt-1.5 uppercase tracking-widest font-mono-num font-medium">
            Personal Wealth System
          </p>
        </div>

        {/* Navigation Rail */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-all rounded-sm font-medium ${
                  isActive
                    ? 'bg-[#183D32] text-[#FFFEFA] shadow-xs'
                    : 'text-[#202822]/80 hover:bg-[#F6F3EB] hover:text-[#183D32]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D5EE75]' : 'text-[#202822]/60'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                      isActive
                        ? 'bg-[#D5EE75] text-[#183D32]'
                        : 'bg-[#F6F3EB] text-[#183D32] border border-[#D8DCD1]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Ask VERDANT Quick Launcher */}
        <div className="p-3 pt-2">
          <button
            onClick={onOpenAskVerdant}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-sm font-semibold border border-[#183D32] bg-[#FBF9F4] text-[#183D32] hover:bg-[#D5EE75]/20 transition-all shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#183D32]" />
              <span>Ask VERDANT</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#183D32] text-[#D5EE75] rounded font-mono-num font-bold">
              AI CHAT
            </span>
          </button>
        </div>
      </div>

      {/* User Status and Academic Demo Reset Footer */}
      <div className="p-4 border-t border-[#D8DCD1] bg-[#FBF9F4]">
        <div className="flex items-center justify-between mb-3">
          <div className="truncate">
            <p className="text-xs font-semibold text-[#183D32] truncate">{userName || 'Arjun Verma'}</p>
            <p className="text-[10px] text-[#202822]/60 font-mono-num">Academic Review Demo</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#183D32]" title="System Online" />
        </div>

        <button
          onClick={onQuickResetDemo}
          className="w-full flex items-center justify-center space-x-1.5 text-xs py-2 px-3 border border-[#D8DCD1] rounded-sm bg-[#FFFEFA] text-[#183D32] hover:bg-[#D5EE75]/20 hover:border-[#183D32] transition-colors font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo (₹50k/₹22k)</span>
        </button>
      </div>
    </aside>
  );
};
