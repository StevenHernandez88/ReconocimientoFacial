import { useState } from 'react';
import { LogOut, Users, Building2, BarChart3, Settings, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  onLogout: () => void;
  onCheckAccess: () => void;
  onAccessLogs: () => void;
  onAdminPanel: () => void;
}

export function Dashboard({ onLogout, onCheckAccess, onAccessLogs, onAdminPanel }: DashboardProps) {
  const { user } = useAuth();
  const [stats] = useState({
    todayAccess: 8,
    totalAccess: 45,
    labs: 4,
    uptime: '99.9%',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Control de Acceso</h1>
            <p className="text-gray-600 mt-1">Laboratory Access Control System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{user?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Accesses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAccess}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Accesses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAccess}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Laboratories</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.labs}</p>
              </div>
              <Building2 className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">System Uptime</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.uptime}</p>
              </div>
              <div className="w-12 h-12 text-amber-500 opacity-20 flex items-center justify-center">
                ✓
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={onCheckAccess}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Check Laboratory Access
              </button>

              <button
                onClick={onAccessLogs}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                View Access Logs
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={onAdminPanel}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Admin Panel
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { time: '10:30 AM', action: 'Accessed Lab A', status: 'granted' },
                { time: '09:15 AM', action: 'Access denied Lab C', status: 'denied' },
                { time: 'Yesterday', action: 'Accessed Lab B', status: 'granted' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{item.action}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'granted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'granted' ? 'Granted' : 'Denied'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
