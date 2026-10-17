import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AskVerdantPanel } from './components/AskVerdantPanel';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensePage } from './pages/ExpensePage';
import { GoalPage } from './pages/GoalPage';
import { PlanPage } from './pages/PlanPage';
import { ProfilePage } from './pages/ProfilePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardOverview, InAppNotification, UserProfile } from './types';
import { api, getAuthToken } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isAskVerdantOpen, setIsAskVerdantOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Check persistent session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          setCurrentUser(null);
        }
      }
      setAuthChecked(true);
    };
    checkSession();
  }, []);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getDashboardOverview();
      setDashboardData(data);
      const notifsRes = await api.getNotifications();
      setNotifications(notifsRes.notifications);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, refreshTrigger]);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setRefreshTrigger((prev) => prev + 1);
    setCurrentTab('dashboard');
  };

  const handleOnboardingComplete = (user: UserProfile) => {
    setCurrentUser(user);
    setRefreshTrigger((prev) => prev + 1);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    setCurrentUser(null);
    setDashboardData(null);
    setNotifications([]);
    setCurrentTab('dashboard');
  };

  const handleQuickResetDemo = async () => {
    try {
      const res = await api.demoLogin();
      setCurrentUser(res.user);
      setRefreshTrigger((prev) => prev + 1);
      setCurrentTab('dashboard');
    } catch (err) {
      alert('Failed to reset demo: ' + err);
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    await api.markNotificationRead(id);
    const notifsRes = await api.getNotifications();
    setNotifications(notifsRes.notifications);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMarkAllNotifRead = async () => {
    await api.markAllNotificationsRead();
    const notifsRes = await api.getNotifications();
    setNotifications(notifsRes.notifications);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex items-center justify-center font-editorial text-[#183D32]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 bg-[#183D32] text-[#D5EE75] flex items-center justify-center font-bold text-lg rounded-sm mx-auto animate-pulse">
            V
          </div>
          <p className="text-sm font-mono-num">Verifying Living Ledger Session...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Show Auth Page (Arjun Demo access + Personal sign-in / registration)
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. Authenticated but Personal User not onboarded -> Show Onboarding Wizard
  if (!currentUser.is_demo && !currentUser.is_onboarded) {
    return <OnboardingPage user={currentUser} onComplete={handleOnboardingComplete} />;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const isDemoUser = Boolean(currentUser.is_demo);

  return (
    <div className="min-h-screen bg-[#F6F3EB] flex">
      {/* Sidebar Rail */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onQuickResetDemo={handleQuickResetDemo}
        onOpenAskVerdant={() => setIsAskVerdantOpen(true)}
        onLogout={handleLogout}
        userName={currentUser.name || (isDemoUser ? 'Arjun Verma' : 'Personal Account')}
        isDemo={isDemoUser}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-12 py-8 overflow-y-auto max-h-screen">
        {currentTab === 'dashboard' && (
          <DashboardPage
            data={dashboardData}
            onNavigateTab={setCurrentTab}
            currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensePage
            currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}

        {currentTab === 'goals' && (
          <GoalPage
            currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
            monthlySurplus={dashboardData?.financial_health?.monthly_surplus || 0}
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
            onNavigateToPlan={() => setCurrentTab('plan')}
          />
        )}

        {currentTab === 'plan' && (
          <PlanPage
            currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
            onOpenAskVerdant={() => setIsAskVerdantOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            user={currentUser}
            currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
            onProfileUpdated={() => setRefreshTrigger((prev) => prev + 1)}
            onNavigateToPlan={() => setCurrentTab('plan')}
          />
        )}

        {currentTab === 'methodology' && <MethodologyPage />}
      </main>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifRead}
      />

      {/* Ask VERDANT Contextual Panel */}
      <AskVerdantPanel
        isOpen={isAskVerdantOpen}
        onClose={() => setIsAskVerdantOpen(false)}
        currency={currentUser.currency === 'USD' ? '$' : (currentUser.currency === 'EUR' ? '€' : '₹')}
        onRefreshDashboard={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

export default App;
