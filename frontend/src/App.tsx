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
import { WelcomePage } from './pages/WelcomePage';
import { DashboardOverview, InAppNotification } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('welcome');
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isAskVerdantOpen, setIsAskVerdantOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadData = async () => {
    try {
      const data = await api.getDashboardOverview(1);
      setDashboardData(data);
      const notifsRes = await api.getNotifications(1);
      setNotifications(notifsRes.notifications);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleQuickResetDemo = async () => {
    try {
      await api.demoLogin();
      setRefreshTrigger((prev) => prev + 1);
      setCurrentTab('dashboard');
    } catch (err) {
      alert('Failed to reset demo: ' + err);
    }
  };

  const handleStartDemo = async () => {
    try {
      await api.demoLogin();
      setRefreshTrigger((prev) => prev + 1);
      setCurrentTab('dashboard');
    } catch (err) {
      setCurrentTab('dashboard');
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    await api.markNotificationRead(id);
    const notifsRes = await api.getNotifications(1);
    setNotifications(notifsRes.notifications);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMarkAllNotifRead = async () => {
    await api.markAllNotificationsRead(1);
    const notifsRes = await api.getNotifications(1);
    setNotifications(notifsRes.notifications);
    setRefreshTrigger((prev) => prev + 1);
  };

  if (currentTab === 'welcome') {
    return (
      <WelcomePage
        onStartDemo={handleStartDemo}
        onNavigateToApp={() => setCurrentTab('dashboard')}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
        userName={dashboardData?.user?.name || 'Arjun Verma'}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-12 py-8 overflow-y-auto max-h-screen">
        {currentTab === 'dashboard' && (
          <DashboardPage
            data={dashboardData}
            onNavigateTab={setCurrentTab}
            currency="₹"
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensePage
            currency="₹"
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}

        {currentTab === 'goals' && (
          <GoalPage
            currency="₹"
            monthlySurplus={dashboardData?.financial_health?.monthly_surplus || 0}
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
            onNavigateToPlan={() => setCurrentTab('plan')}
          />
        )}

        {currentTab === 'plan' && (
          <PlanPage
            currency="₹"
            onDataChanged={() => setRefreshTrigger((prev) => prev + 1)}
            onOpenAskVerdant={() => setIsAskVerdantOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            user={dashboardData?.user || null}
            currency="₹"
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
        currency="₹"
        onRefreshDashboard={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

export default App;
