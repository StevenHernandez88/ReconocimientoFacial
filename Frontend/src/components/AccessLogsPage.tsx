import { useState, useMemo } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';

interface AccessLogsPageProps {
  onBack: () => void;
}

interface LogEntry {
  id: string;
  laboratory: string;
  time: string;
  status: 'granted' | 'denied';
  confidence: number;
  reason?: string;
}

export function AccessLogsPage({ onBack }: AccessLogsPageProps) {
  const [dateFilter, setDateFilter] = useState('week');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockLogs: LogEntry[] = [
    { id: '1', laboratory: 'Lab A - Electronics', time: '2025-11-21 10:30', status: 'granted', confidence: 95 },
    { id: '2', laboratory: 'Lab B - Programming', time: '2025-11-21 09:15', status: 'granted', confidence: 92 },
    { id: '3', laboratory: 'Lab C - Robotics', time: '2025-11-20 14:45', status: 'denied', confidence: 0, reason: 'No access permission' },
    { id: '4', laboratory: 'Lab A - Electronics', time: '2025-11-20 08:00', status: 'granted', confidence: 96 },
    { id: '5', laboratory: 'Lab D - Networks', time: '2025-11-19 16:20', status: 'granted', confidence: 94 },
    { id: '6', laboratory: 'Lab B - Programming', time: '2025-11-19 11:10', status: 'granted', confidence: 97 },
    { id: '7', laboratory: 'Lab A - Electronics', time: '2025-11-18 13:30', status: 'granted', confidence: 93 },
    { id: '8', laboratory: 'Lab C - Robotics', time: '2025-11-18 09:00', status: 'denied', confidence: 0, reason: 'No access permission' },
  ];

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [statusFilter]);

  const stats = {
    totalAccess: mockLogs.length,
    granted: mockLogs.filter(l => l.status === 'granted').length,
    denied: mockLogs.filter(l => l.status === 'denied').length,
    avgConfidence: Math.round(
      mockLogs.filter(l => l.status === 'granted').reduce((a, b) => a + b.confidence, 0) /
      mockLogs.filter(l => l.status === 'granted').length
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Access Logs</h1>
              <p className="text-gray-600 mt-1">Your laboratory access history</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <p className="text-gray-600 text-sm font-semibold mb-1">Total Accesses</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAccess}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <p className="text-gray-600 text-sm font-semibold mb-1">Granted</p>
              <p className="text-3xl font-bold text-green-600">{stats.granted}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
              <p className="text-gray-600 text-sm font-semibold mb-1">Denied</p>
              <p className="text-3xl font-bold text-red-600">{stats.denied}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <p className="text-gray-600 text-sm font-semibold mb-1">Avg Confidence</p>
              <p className="text-3xl font-bold text-purple-600">{stats.avgConfidence}%</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="granted">Granted Only</option>
                <option value="denied">Denied Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Laboratory</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{log.laboratory}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'granted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'granted' ? '✓ Granted' : '✗ Denied'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'granted' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${log.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{log.confidence}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.reason || 'Facial recognition match successful'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
