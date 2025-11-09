import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    userGrowth: [],
    bookingTrends: [],
    establishmentDistribution: [],
    revenueOverview: {}
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        api.get('/api/admin/analytics/overview'),
        api.get('/api/admin/analytics/user-growth'),
        api.get('/api/admin/analytics/booking-trends'),
        api.get('/api/admin/analytics/establishment-distribution'),
        api.get('/api/admin/analytics/revenue-overview')
      ]);

      // Check if all requests failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        setError('Unable to load analytics data. Please check your connection and try again.');
        // Use fallback data
        setAnalyticsData({
          overview: { totalUsers: 0, totalEstablishments: 0, totalBookings: 0, totalReviews: 0 },
          userGrowth: [],
          bookingTrends: [],
          establishmentDistribution: [],
          revenueOverview: { totalRevenue: 0, monthlyRevenue: 0, averageBookingValue: 0, revenueGrowth: 0 }
        });
      } else {
        setAnalyticsData({
          overview: results[0].status === 'fulfilled' ? results[0].value.data : { totalUsers: 0, totalEstablishments: 0, totalBookings: 0, totalReviews: 0 },
          userGrowth: results[1].status === 'fulfilled' ? results[1].value.data : [],
          bookingTrends: results[2].status === 'fulfilled' ? results[2].value.data : [],
          establishmentDistribution: results[3].status === 'fulfilled' ? results[3].value.data : [],
          revenueOverview: results[4].status === 'fulfilled' ? results[4].value.data : { totalRevenue: 0, monthlyRevenue: 0, averageBookingValue: 0, revenueGrowth: 0 }
        });
      }

      // Log any failed requests
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = ['overview', 'user-growth', 'booking-trends', 'establishment-distribution', 'revenue-overview'];
          console.error(`Failed to fetch ${endpoints[index]}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('An unexpected error occurred while loading analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-2 flex items-center ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="mr-1">{change > 0 ? '↗️' : '↘️'}</span>
              {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const LineChart = ({ data, title, xKey, yKey, color = "blue" }) => {
    const maxValue = Math.max(...data.map(item => item[yKey]));
    const minValue = Math.min(...data.map(item => item[yKey]));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="40"
                y1={40 + (i * 32)}
                x2="380"
                y2={40 + (i * 32)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4].map(i => {
              const value = Math.round(maxValue - (i * range / 4));
              return (
                <text
                  key={i}
                  x="35"
                  y={45 + (i * 32)}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {value}
                </text>
              );
            })}

            {/* Line path */}
            <path
              d={`M ${data.map((item, index) => {
                const x = 50 + (index * (320 / (data.length - 1)));
                const y = 40 + ((maxValue - item[yKey]) / range) * 128;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}`}
              fill="none"
              stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'}
              strokeWidth="3"
              className="drop-shadow-sm"
            />

            {/* Data points */}
            {data.map((item, index) => {
              const x = 50 + (index * (320 / (data.length - 1)));
              const y = 40 + ((maxValue - item[yKey]) / range) * 128;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'}
                  className="drop-shadow-sm"
                />
              );
            })}

            {/* X-axis labels */}
            {data.map((item, index) => {
              const x = 50 + (index * (320 / (data.length - 1)));
              return (
                <text
                  key={index}
                  x={x}
                  y="190"
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {item[xKey]}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const PieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const slices = data.map((item, index) => {
      const percentage = (item.count / total) * 100;
      const angle = (item.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      return {
        path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
        color: colors[index % colors.length],
        label: item.type,
        count: item.count,
        percentage: percentage.toFixed(1)
      };
    });

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={slice.path}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </svg>
          </div>
          <div className="space-y-3">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: slice.color }}
                ></div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{slice.label}</span>
                  <span className="text-gray-600 ml-2">
                    {slice.count} ({slice.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="mr-3">📊</span>
          Analytics Dashboard
        </h2>
        <button
          onClick={fetchAnalyticsData}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50"
        >
          <span className="mr-2">{loading ? '⏳' : '🔄'}</span>
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData.overview.totalUsers || 0}
          change={analyticsData.overview.userGrowth}
          icon="👥"
          color="from-blue-100 to-blue-200"
        />
        <StatCard
          title="Total Establishments"
          value={analyticsData.overview.totalEstablishments || 0}
          change={5.2}
          icon="🏢"
          color="from-green-100 to-green-200"
        />
        <StatCard
          title="Total Bookings"
          value={analyticsData.overview.totalBookings || 0}
          change={analyticsData.overview.bookingGrowth}
          icon="📅"
          color="from-yellow-100 to-yellow-200"
        />
        <StatCard
          title="Total Reviews"
          value={analyticsData.overview.totalReviews || 0}
          change={7.8}
          icon="⭐"
          color="from-purple-100 to-purple-200"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        {analyticsData.userGrowth.length > 0 && (
          <LineChart
            data={analyticsData.userGrowth}
            title="User Growth Over Time"
            xKey="month"
            yKey="users"
            color="blue"
          />
        )}

        {/* Booking Trends Chart */}
        {analyticsData.bookingTrends.length > 0 && (
          <LineChart
            data={analyticsData.bookingTrends}
            title="Booking Trends"
            xKey="period"
            yKey="bookings"
            color="green"
          />
        )}
      </div>

      {/* Establishment Distribution and Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Establishment Distribution */}
        {analyticsData.establishmentDistribution.length > 0 && (
          <PieChart
            data={analyticsData.establishmentDistribution}
            title="Establishment Distribution by Type"
          />
        )}

        {/* Revenue Overview */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Revenue</span>
              <span className="text-2xl font-bold text-green-600">
                ${analyticsData.revenueOverview.totalRevenue?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Monthly Revenue</span>
              <span className="text-xl font-semibold text-blue-600">
                ${analyticsData.revenueOverview.monthlyRevenue?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Booking Value</span>
              <span className="text-xl font-semibold text-purple-600">
                ${analyticsData.revenueOverview.averageBookingValue || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Revenue Growth</span>
              <span className="text-xl font-semibold text-green-600 flex items-center">
                <span className="mr-1">↗️</span>
                {analyticsData.revenueOverview.revenueGrowth || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Breakdown */}
      {analyticsData.revenueOverview.monthlyBreakdown && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {analyticsData.revenueOverview.monthlyBreakdown.map((month, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{month.month}</div>
                <div className="text-lg font-bold text-blue-600">
                  ${month.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;