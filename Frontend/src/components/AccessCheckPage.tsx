import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AccessCheckPageProps {
  userName: string;
  onBack: () => void;
}

export function AccessCheckPage({ userName, onBack }: AccessCheckPageProps) {
  const [selectedLab, setSelectedLab] = useState('');
  const [accessResult, setAccessResult] = useState<{
    status: 'granted' | 'denied' | null;
    message: string;
    confidence?: number;
    reason?: string;
  }>({ status: null, message: '' });
  const [loading, setLoading] = useState(false);

  const labs = [
    { id: '1', name: 'Lab A - Electronics', location: 'Building 2, Floor 3' },
    { id: '2', name: 'Lab B - Programming', location: 'Building 1, Floor 2' },
    { id: '3', name: 'Lab C - Robotics', location: 'Building 3, Floor 1' },
    { id: '4', name: 'Lab D - Networks', location: 'Building 2, Floor 1' },
  ];

  const handleCheckAccess = async () => {
    if (!selectedLab) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const granted = Math.random() > 0.2;
    const confidence = Math.floor(Math.random() * 20) + 80;

    setAccessResult({
      status: granted ? 'granted' : 'denied',
      message: granted ? 'Access Granted' : 'Access Denied',
      confidence: granted ? confidence : undefined,
      reason: granted ? undefined : 'No access permission for this laboratory',
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Check</h1>
            <p className="text-gray-600">Welcome, <span className="font-semibold">{userName}</span></p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Laboratory</h2>
              <div className="space-y-3">
                {labs.map((lab) => (
                  <label
                    key={lab.id}
                    className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <input
                      type="radio"
                      name="lab"
                      value={lab.id}
                      checked={selectedLab === lab.id}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{lab.name}</p>
                      <p className="text-sm text-gray-600">{lab.location}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleCheckAccess}
                disabled={!selectedLab || loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying Access...' : 'Check Access'}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Result</h2>

              {accessResult.status === null ? (
                <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center h-64 border-2 border-gray-200 border-dashed">
                  <Clock className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-center">Select a laboratory and check access</p>
                </div>
              ) : accessResult.status === 'granted' ? (
                <div className="bg-green-50 rounded-lg p-8 border-2 border-green-200">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 text-center mb-2">
                    {accessResult.message}
                  </h3>
                  <div className="mt-6 space-y-3">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Facial Match Confidence</p>
                      <p className="text-2xl font-bold text-green-600">{accessResult.confidence}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="text-lg font-semibold text-green-700">Entry Allowed</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-8 border-2 border-red-200">
                  <div className="flex items-center justify-center mb-4">
                    <XCircle className="w-16 h-16 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-900 text-center mb-2">
                    {accessResult.message}
                  </h3>
                  <div className="mt-6 space-y-3">
                    <div className="bg-white rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reason</p>
                        <p className="text-gray-900">{accessResult.reason}</p>
                      </div>
                    </div>
                    <p className="text-sm text-red-700 text-center mt-4">
                      Please contact your laboratory supervisor for access authorization.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
