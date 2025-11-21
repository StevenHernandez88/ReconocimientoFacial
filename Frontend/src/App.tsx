import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { AccessCheckPage } from './components/AccessCheckPage';
import { AccessLogsPage } from './components/AccessLogsPage';
import { AdminPanel } from './components/AdminPanel';

type Page = 'login' | 'dashboard' | 'access-check' | 'access-logs' | 'admin';

function App() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-blue-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading system...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('login');
  };

  if (!user) {
    return <LoginPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  return (
    <>
      {currentPage === 'dashboard' && (
        <Dashboard
          onLogout={handleLogout}
          onCheckAccess={() => setCurrentPage('access-check')}
          onAccessLogs={() => setCurrentPage('access-logs')}
          onAdminPanel={() => setCurrentPage('admin')}
        />
      )}
      {currentPage === 'access-check' && (
        <AccessCheckPage
          userName={user.email}
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'access-logs' && (
        <AccessLogsPage onBack={() => setCurrentPage('dashboard')} />
      )}
      {currentPage === 'admin' && (
        <AdminPanel onBack={() => setCurrentPage('dashboard')} />
      )}
    </>
  );
}

export default App;
