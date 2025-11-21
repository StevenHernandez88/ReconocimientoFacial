import { useState } from 'react';
import { Trash2, Plus, Search, Users, Building2 } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'inactive';
  facialRegistered: boolean;
}

interface LabData {
  id: string;
  name: string;
  location: string;
  capacity: number;
  occupied: number;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'labs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [users] = useState<UserData[]>([
    { id: '1', email: 'student1@udal.edu.co', name: 'Juan García', role: 'student', status: 'active', facialRegistered: true },
    { id: '2', email: 'student2@udal.edu.co', name: 'María López', role: 'student', status: 'active', facialRegistered: true },
    { id: '3', email: 'instructor@udal.edu.co', name: 'Prof. Carlos Ruiz', role: 'instructor', status: 'active', facialRegistered: true },
    { id: '4', email: 'admin@udal.edu.co', name: 'Admin User', role: 'admin', status: 'active', facialRegistered: true },
    { id: '5', email: 'inactive@udal.edu.co', name: 'Alumno Inactivo', role: 'student', status: 'inactive', facialRegistered: false },
  ]);

  const [labs] = useState<LabData[]>([
    { id: '1', name: 'Lab A - Electronics', location: 'Building 2, Floor 3', capacity: 30, occupied: 12 },
    { id: '2', name: 'Lab B - Programming', location: 'Building 1, Floor 2', capacity: 25, occupied: 20 },
    { id: '3', name: 'Lab C - Robotics', location: 'Building 3, Floor 1', capacity: 20, occupied: 5 },
    { id: '4', name: 'Lab D - Networks', location: 'Building 2, Floor 1', capacity: 35, occupied: 15 },
  ]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'labs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Laboratories
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? 'Search users by email or name...' : 'Search laboratories...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Facial Data</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{user.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'student'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'instructor'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.facialRegistered ? (
                          <span className="text-green-600 font-semibold">✓ Registered</span>
                        ) : (
                          <span className="text-gray-500">Not registered</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-red-600 hover:text-red-800 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLabs.map((lab) => (
                <div key={lab.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lab.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{lab.location}</p>
                    </div>
                    <button className="text-red-600 hover:text-red-800 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Occupancy</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lab.occupied}/{lab.capacity}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(lab.occupied / lab.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold text-gray-900">{lab.capacity} people</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New {activeTab === 'users' ? 'User' : 'Laboratory'}</h2>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder={activeTab === 'users' ? 'Email' : 'Lab Name'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {activeTab === 'users' && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Student</option>
                    <option>Instructor</option>
                    <option>Admin</option>
                  </select>
                </>
              )}
              {activeTab === 'labs' && (
                <>
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Capacity"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
