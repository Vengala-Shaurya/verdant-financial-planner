import React from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { InAppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#202822]/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#FFFEFA] h-full shadow-2xl border-l border-[#D8DCD1] flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#D8DCD1] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#183D32]" />
              <h3 className="font-editorial text-xl font-semibold text-[#183D32]">Ledger Notifications</h3>
            </div>
            <p className="text-xs text-[#202822]/60 mt-0.5 font-mono-num">
              Budget threshold alerts & milestone reminders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#202822]/60 hover:text-[#183D32] hover:bg-[#F6F3EB] rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#202822]/50 text-sm">
              All notifications caught up. No pending ledger alerts.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 border transition-all rounded-sm ${
                  n.is_read
                    ? 'bg-[#FFFEFA] border-[#D8DCD1] opacity-70'
                    : 'bg-[#FBF9F4] border-[#183D32]/30 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {n.type === 'budget' && <AlertCircle className="w-4 h-4 text-[#C66D51] shrink-0" />}
                    {n.type === 'milestone' && <TrendingUp className="w-4 h-4 text-[#183D32] shrink-0" />}
                    {n.type === 'deadline' && <Calendar className="w-4 h-4 text-[#183D32] shrink-0" />}
                    <h4 className="text-xs font-semibold text-[#183D32] tracking-wide">{n.title}</h4>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="text-[11px] text-[#183D32] hover:underline flex items-center space-x-0.5 shrink-0"
                    >
                      <Check className="w-3 h-3" />
                      <span>Read</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#202822]/80 mt-1.5 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-[#202822]/50 mt-2 block font-mono-num">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D8DCD1] bg-[#F6F3EB] flex justify-between items-center">
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[#183D32] hover:text-[#183D32]/80 font-medium flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 bg-[#183D32] text-[#FFFEFA] rounded-sm hover:bg-[#183D32]/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
