import React, { useState } from 'react';
import api from '../../utils/api';

const AnalyticsTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, name) => {
    try {
      const response = await api.get(endpoint);
      return { name, status: 'success', data: response.data };
    } catch (error) {
      return { 
        name, 
        status: 'error', 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const endpoints = [
      { url: '/api/admin/analytics/overview', name: 'Overview' },
      { url: '/api/admin/analytics/user-growth', name: 'User Growth' },
      { url: '/api/admin/analytics/booking-trends', name: 'Booking Trends' },
      { url: '/api/admin/analytics/establishment-distribution', name: 'Establishment Distribution' },
      { url: '/api/admin/analytics/revenue-overview', name: 'Revenue Overview' }
    ];

    const results = {};
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.url, endpoint.name);
      results[endpoint.name] = result;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Endpoints Test</h3>
        <button
          onClick={runAllTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(testResults).map(([name, result]) => (
          <div key={name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{result.name}</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                result.status === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.status === 'success' ? '✅ Success' : '❌ Error'}
              </span>
            </div>
            
            {result.status === 'success' ? (
              <div className="bg-gray-50 rounded p-3">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-red-50 rounded p-3">
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Click "Test All Endpoints" to verify analytics functionality
        </div>
      )}
    </div>
  );
};

export default AnalyticsTest;