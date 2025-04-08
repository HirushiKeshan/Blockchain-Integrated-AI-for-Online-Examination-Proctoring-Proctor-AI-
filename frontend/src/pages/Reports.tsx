import React, { useState, useEffect } from 'react';
import { Download, Filter, AlertTriangle, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Assessment {
  id: string;
  userId: string;
  userName: string;
  submittedAt: Date;
  score: number;
  flagged: boolean;
  suspiciousActivities: {
    tabSwitching: number;
    aiDetection: number;
    multipleDevices: boolean;
  };
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  severity?: string;
  assessmentId?: string;
}

interface FilterOptions {
  severity: string;
  dateRange: string;
  activityType: string;
}

// Mock API function - replace with actual API call
const fetchCompletedAssessments = async (): Promise<Assessment[]> => {
  // This would be replaced with an actual API call
  const mockData = localStorage.getItem('completedAssessments');
  if (mockData) {
    return JSON.parse(mockData).map((assessment: any) => ({
      ...assessment,
      submittedAt: new Date(assessment.submittedAt)
    }));
  }
  return [];
};

export function Reports() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState({
    suspicious: { tabSwitching: 0, aiDetection: 0, multipleDevices: 0 },
    assessments: { total: 0, flagged: 0, clean: 0 },
    performance: { responseTime: 234, uptime: 99.9, apiCalls: 45 }
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    severity: 'all',
    dateRange: '24h',
    activityType: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load assessment data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch completed assessments
        const completedAssessments = await fetchCompletedAssessments();
        setAssessments(completedAssessments);
        
        // Generate activities from assessments
        const activities: Activity[] = [];
        completedAssessments.forEach(assessment => {
          // Create activities based on suspicious activities
          if (assessment.suspiciousActivities.tabSwitching > 3) {
            activities.push({
              id: `tab-${assessment.id}`,
              type: 'Tab Switching',
              description: `Excessive tab switching detected for ${assessment.userName}`,
              timestamp: assessment.submittedAt,
              severity: assessment.suspiciousActivities.tabSwitching > 5 ? 'high' : 'medium',
              assessmentId: assessment.id
            });
          }
          
          if (assessment.suspiciousActivities.aiDetection > 0) {
            activities.push({
              id: `ai-${assessment.id}`,
              type: 'AI Detection',
              description: `Potential AI assistance detected for ${assessment.userName}`,
              timestamp: assessment.submittedAt,
              severity: 'high',
              assessmentId: assessment.id
            });
          }
          
          if (assessment.suspiciousActivities.multipleDevices) {
            activities.push({
              id: `device-${assessment.id}`,
              type: 'Multiple Devices',
              description: `Multiple devices detected for ${assessment.userName}`,
              timestamp: assessment.submittedAt,
              severity: 'medium',
              assessmentId: assessment.id
            });
          }
        });
        
        // Add activities from localStorage if they exist (for backward compatibility)
        const storedActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        setRecentActivities([...activities, ...storedActivities].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        
        // Calculate stats
        const tabSwitchingTotal = completedAssessments.reduce((sum, a) => sum + a.suspiciousActivities.tabSwitching, 0);
        const aiDetectionTotal = completedAssessments.reduce((sum, a) => sum + a.suspiciousActivities.aiDetection, 0);
        const multipleDevicesCount = completedAssessments.filter(a => a.suspiciousActivities.multipleDevices).length;
        
        setStats({
          suspicious: {
            tabSwitching: completedAssessments.length ? Math.round(tabSwitchingTotal / completedAssessments.length) : 0,
            aiDetection: completedAssessments.length ? Math.round((aiDetectionTotal / completedAssessments.length) * 100) : 0,
            multipleDevices: completedAssessments.length ? Math.round((multipleDevicesCount / completedAssessments.length) * 100) : 0
          },
          assessments: {
            total: completedAssessments.length,
            flagged: completedAssessments.filter(a => a.flagged).length,
            clean: completedAssessments.filter(a => !a.flagged).length
          },
          performance: {
            responseTime: 234, // Replace with actual metrics if available
            uptime: 99.9,
            apiCalls: 45
          }
        });
      } catch (error) {
        console.error('Error loading assessment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // Set up polling interval for new assessments
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Check for new assessments every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleExport = () => {
    const exportData = {
      stats,
      assessments,
      recentActivities,
      exportDate: new Date().toISOString(),
      filters
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proctor-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyFilters = (activities: Activity[]) => {
    return activities.filter(activity => {
      const date = new Date(activity.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      const matchesSeverity = filters.severity === 'all' || activity.severity === filters.severity;
      const matchesType = filters.activityType === 'all' || activity.type.toLowerCase().includes(filters.activityType.toLowerCase());
      const matchesDate = filters.dateRange === 'all' ||
        (filters.dateRange === '24h' && hoursDiff <= 24) ||
        (filters.dateRange === '7d' && hoursDiff <= 168) ||
        (filters.dateRange === '30d' && hoursDiff <= 720);

      return matchesSeverity && matchesType && matchesDate;
    });
  };

  const filteredActivities = applyFilters(recentActivities);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analysis Reports</h1>
        <div className="flex space-x-4">
          <motion.button 
            className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </motion.button>
          <motion.button 
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent mb-4"></div>
          <p className="text-gray-600">Loading assessment data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div 
              className="bg-white rounded-3xl shadow-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspicious Activities</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tab Switching</span>
                  <span className="font-semibold text-gray-900">{stats.suspicious.tabSwitching}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Detection</span>
                  <span className="font-semibold text-gray-900">{stats.suspicious.aiDetection}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Multiple Devices</span>
                  <span className="font-semibold text-gray-900">{stats.suspicious.multipleDevices}%</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white rounded-3xl shadow-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Assessments</span>
                  <span className="font-semibold text-gray-900">{stats.assessments.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Flagged Sessions</span>
                  <span className="font-semibold text-red-600">{stats.assessments.flagged}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Clean Sessions</span>
                  <span className="font-semibold text-green-600">{stats.assessments.clean}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white rounded-3xl shadow-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Response Time</span>
                  <span className="font-semibold text-gray-900">{stats.performance.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-semibold text-gray-900">{stats.performance.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Calls</span>
                  <span className="font-semibold text-gray-900">{stats.performance.apiCalls}k/day</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="bg-white rounded-3xl shadow-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Completed Assessments</h3>
              <span className="text-sm text-gray-600">{assessments.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No assessments found
                      </td>
                    </tr>
                  ) : (
                    assessments.map((assessment) => (
                      <tr key={assessment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.userName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(assessment.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.score}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${assessment.flagged ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {assessment.flagged ? 'Flagged' : 'Clean'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-3xl shadow-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
            <div className="space-y-4">
              <AnimatePresence>
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No incidents match your current filter criteria
                  </div>
                ) : (
                  filteredActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 border border-gray-100 rounded-2xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                          {activity.severity === 'high' && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              High Risk
                            </span>
                          )}
                          {activity.severity === 'medium' && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Medium Risk
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Filter Reports</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.activityType}
                    onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
                  >
                    <option value="all">All Activities</option>
                    <option value="ai">AI Detection</option>
                    <option value="tab">Tab Switching</option>
                    <option value="face">Face Detection</option>
                    <option value="phone">Phone Usage</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setFilters({
                        severity: 'all',
                        dateRange: '24h',
                        activityType: 'all'
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}