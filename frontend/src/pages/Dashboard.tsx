import React, { useState, useEffect } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { 
  Users, FileCheck, AlertTriangle, Clock, Bell, 
  ChevronDown, BarChart2, Shield, Activity, Settings,
  Download, Eye, Trash2, RefreshCw, Calendar,
  MoreVertical, XCircle, FileText, CheckCircle, 
  Loader, User, Moon, Sun, Globe
} from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({
    suspicious: { 
      tabSwitching: 24, 
      aiDetection: 12, 
      multipleDevices: 8,
      cameraDisabled: 15,
      copyPasteAttempts: 31,
      unauthorizedPeople: 6
    },
    assessments: { total: 15, flagged: 32, clean: 124 },
    performance: { responseTime: 234, uptime: 99.9 }
  });
  
  const [timeRange, setTimeRange] = useState('today');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Multiple tab switching detected', time: '5 minutes ago', type: 'warning' },
    { id: 2, title: 'AI assistance detected', time: '15 minutes ago', type: 'alert' },
    { id: 3, title: 'System update completed', time: '1 hour ago', type: 'info' }
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false);
  const [isDetailedReportOpen, setIsDetailedReportOpen] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // New state for settings
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    refreshInterval: 30,
    language: 'English',
    timezone: 'UTC'
  });
  
  // Status history data
  const [statusHistory, setStatusHistory] = useState([
    { 
      date: '2025-04-06', 
      status: 'Operational', 
      incidents: [] 
    },
    { 
      date: '2025-04-05', 
      status: 'Degraded Performance', 
      incidents: [
        { time: '14:23', service: 'Video Processing', issue: 'High latency', resolved: true, duration: '47 minutes' }
      ] 
    },
    { 
      date: '2025-04-04', 
      status: 'Operational', 
      incidents: [] 
    },
    { 
      date: '2025-04-03', 
      status: 'Partial Outage', 
      incidents: [
        { time: '09:12', service: 'AI Analysis Engine', issue: 'Service unavailable', resolved: true, duration: '34 minutes' },
        { time: '12:45', service: 'Plagiarism Detection', issue: 'Timeout errors', resolved: true, duration: '18 minutes' }
      ] 
    },
    { 
      date: '2025-04-02', 
      status: 'Operational', 
      incidents: [] 
    }
  ]);
  
  // Detailed report data
  const [performanceReports, setPerformanceReports] = useState([
    {
      id: 1,
      title: 'Daily System Performance Report',
      date: '2025-04-05',
      metrics: {
        responseTime: { avg: 216, min: 103, max: 487 },
        uptime: 99.94,
        errorRate: 0.06,
        throughput: '157.3 req/sec'
      },
      summary: 'System performance is nominal with stable response times and high uptime.'
    },
    {
      id: 2,
      title: 'Weekly System Performance Summary',
      date: '2025-04-01',
      metrics: {
        responseTime: { avg: 245, min: 97, max: 512 },
        uptime: 99.87,
        errorRate: 0.13,
        throughput: '142.9 req/sec'
      },
      summary: 'Weekly performance shows consistent uptime with a brief degradation period on Apr 3.'
    },
    {
      id: 3,
      title: 'Monthly Resource Utilization Report',
      date: '2025-03-31',
      metrics: {
        cpuUsage: '47%',
        memoryUsage: '62%',
        diskUsage: '38%',
        networkBandwidth: '4.7 Gbps'
      },
      summary: 'Resource utilization remains within expected parameters with no capacity concerns.'
    }
  ]);
  
  useEffect(() => {
    // Set up interval for only updating performance metrics, not assessments or suspicious activities
    const interval = setInterval(() => {
      setStats(prev => ({
        // Keep suspicious activities stable - no random changes
        suspicious: {
          ...prev.suspicious
        },
        // Keep assessments stable with fixed values
        assessments: {
          total: 15, // Keep this fixed at 15
          flagged: prev.assessments.flagged,
          clean: prev.assessments.clean
        },
        performance: {
          responseTime: Math.max(100, Math.min(500, prev.performance.responseTime + Math.floor(Math.random() * 20) - 10)),
          uptime: Math.min(100, Math.max(98, prev.performance.uptime + (Math.random() * 0.1 - 0.05)))
        }
      }));
      
      // No more random notifications - they should only be triggered by real events
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  
  // Function to simulate a real suspicious activity detection
  // This would be replaced with actual event handlers in a real system
  const handleSuspiciousActivity = (activityType) => {
    setStats(prev => ({
      ...prev,
      suspicious: {
        ...prev.suspicious,
        [activityType]: prev.suspicious[activityType]
      }
    }));
    
    // Add a relevant notification
    const notificationTypes = {
      tabSwitching: { title: 'Multiple tab switching detected', type: 'warning' },
      aiDetection: { title: 'AI assistance detected', type: 'alert' },
      multipleDevices: { title: 'Multiple device login', type: 'warning' },
      cameraDisabled: { title: 'Camera disabled detected', type: 'alert' },
      copyPasteAttempts: { title: 'Copy/Paste attempt detected', type: 'warning' },
      unauthorizedPeople: { title: 'Unauthorized person detected', type: 'alert' }
    };
    
    const notification = notificationTypes[activityType];
    if (notification) {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          title: notification.title, 
          time: 'Just now', 
          type: notification.type 
        },
        ...prev.slice(0, 4)
      ]);
    }
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'alert': return 'bg-red-100 text-red-600';
      case 'info': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'bg-green-100 text-green-700';
      case 'Degraded Performance': return 'bg-yellow-100 text-yellow-700';
      case 'Partial Outage': return 'bg-orange-100 text-orange-700';
      case 'Major Outage': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Function to download a report
  const downloadReport = (reportId) => {
    console.log(`Downloading report with ID: ${reportId}`);
    // Implementation would generate and download a PDF or CSV
  };
  
  // Function to update settings
  const updateSetting = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [setting]: value }
        : value
    }));
  };

  // Close all popups when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsNotificationOpen(false);
      setIsTimeRangeOpen(false);
      setIsDetailedReportOpen(false);
      setIsStatusHistoryOpen(false);
      setIsSettingsOpen(false);
    };
    
    window.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Prevent closing popups when clicking inside them
  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Proctor Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
                setIsTimeRangeOpen(false);
                setIsSettingsOpen(false);
              }}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl z-50 p-2 border border-gray-100"
                onClick={handlePopupClick}
              >
                <div className="flex items-center justify-between p-2 border-b border-gray-100">
                  <h3 className="font-medium">Notifications</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notification => (
                    <div key={notification.id} className="p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mt-1 ${getNotificationColor(notification.type)}`}>
                          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                          {notification.type === 'alert' && <Shield className="w-4 h-4" />}
                          {notification.type === 'info' && <Activity className="w-4 h-4" />}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 mt-2">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative inline-block">
            <button 
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsTimeRangeOpen(!isTimeRangeOpen);
                setIsNotificationOpen(false);
                setIsSettingsOpen(false);
              }}
            >
              <span className="font-medium text-sm">{timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isTimeRangeOpen && (
              <div 
                className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-50"
                onClick={handlePopupClick}
              >
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setTimeRange('today');
                      setIsTimeRangeOpen(false);
                    }}
                  >
                    Today
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setTimeRange('week');
                      setIsTimeRangeOpen(false);
                    }}
                  >
                    Last 7 days
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setTimeRange('month');
                      setIsTimeRangeOpen(false);
                    }}
                  >
                    Last 30 days
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(!isSettingsOpen);
              setIsNotificationOpen(false);
              setIsTimeRangeOpen(false);
            }}
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Settings Modal */}
          {isSettingsOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
              onClick={() => setIsSettingsOpen(false)}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={handlePopupClick}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Theme Settings */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-800 mb-2">Appearance</h3>
                    <div className="flex items-center space-x-4">
                      <button 
                        className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${settings.theme === 'light' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => updateSetting('theme', 'light')}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </button>
                      <button 
                        className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${settings.theme === 'dark' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => updateSetting('theme', 'dark')}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </button>
                      <button 
                        className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${settings.theme === 'system' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => updateSetting('theme', 'system')}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        System
                      </button>
                    </div>
                  </div>
                  
                  {/* Notification Settings */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-800 mb-2">Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Email Alerts</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.notifications.email}
                            onChange={() => updateSetting('notifications', 'email', !settings.notifications.email)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Push Notifications</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.notifications.push}
                            onChange={() => updateSetting('notifications', 'push', !settings.notifications.push)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">SMS Alerts</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.notifications.sms}
                            onChange={() => updateSetting('notifications', 'sms', !settings.notifications.sms)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Language & Region */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-800 mb-2">Language & Region</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Language</label>
                        <select 
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                          value={settings.language}
                          onChange={(e) => updateSetting('language', e.target.value)}
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Japanese">Japanese</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Timezone</label>
                        <select 
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                          value={settings.timezone}
                          onChange={(e) => updateSetting('timezone', e.target.value)}
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="CST">CST (Central Standard Time)</option>
                          <option value="PST">PST (Pacific Standard Time)</option>
                          <option value="GMT">GMT (Greenwich Mean Time)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Refresh Interval */}
                  <div className="mb-6">
                    <h3 className="text-base font-medium text-gray-800 mb-2">Dashboard Refresh</h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Refresh Interval (seconds)</label>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={settings.refreshInterval}
                        onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5s</span>
                        <span>{settings.refreshInterval}s</span>
                        <span>60s</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 flex justify-end space-x-2">
                  <button 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Active Sessions"
          value="24"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          className="rounded-3xl hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300"
          trend="+8% from yesterday"
          trendUp={true}
        />
        <DashboardCard
          title="Completed Assessments"
          value="15" // Fixed value of 15
          icon={<FileCheck className="w-6 h-6 text-green-600" />}
          className="rounded-3xl hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300"
          trend="+12% from yesterday"
          trendUp={true}
        />
        <DashboardCard
          title="Flagged Activities"
          value={stats.suspicious.tabSwitching.toString()}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          className="rounded-3xl hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300"
          trend="+3% from yesterday"
          trendUp={false}
        />
        <DashboardCard
          title="Average Duration"
          value="45m"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          className="rounded-3xl hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300"
          trend="-2% from yesterday"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="bg-white rounded-3xl shadow-md p-8 border border-blue-100 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">System Performance</h2>
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailedReportOpen(!isDetailedReportOpen);
              }}
            >
              <span>Detailed Report</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Detailed Report Dropdown */}
            {isDetailedReportOpen && (
              <div 
                className="absolute mt-10 right-10 w-96 bg-white shadow-xl rounded-xl z-40 border border-blue-100"
                onClick={handlePopupClick}
              >
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Performance Reports</h3>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {performanceReports.map(report => (
                    <div key={report.id} className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-blue-800">{report.title}</h4>
                          <p className="text-xs text-gray-500">{report.date}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                            onClick={() => downloadReport(report.id)}
                          >
                            <Download className="w-4 h-4 text-blue-700" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors">
                            <Eye className="w-4 h-4 text-blue-700" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg text-sm">
                        <p className="text-gray-700 mb-2">{report.summary}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {report.metrics.responseTime && (
                            <div className="p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs text-gray-500 block">Response Time</span>
                              <span className="font-medium text-gray-800">
                                Avg: {report.metrics.responseTime.avg}ms
                              </span>
                            </div>
                          )}
                          
                          {report.metrics.uptime && (
                            <div className="p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs text-gray-500 block">Uptime</span>
                              <span className="font-medium text-gray-800">{report.metrics.uptime}%</span>
                            </div>
                          )}
                          
                          {report.metrics.errorRate && (
                            <div className="p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs text-gray-500 block">Error Rate</span>
                              <span className="font-medium text-gray-800">{report.metrics.errorRate}%</span>
                            </div>
                          )}
                          {report.metrics.throughput && (
  <div className="p-2 bg-gray-50 rounded-lg">
    <span className="text-xs text-gray-500 block">Throughput</span>
    <span className="font-medium text-gray-800">{report.metrics.throughput}</span>
  </div>
)}

{report.metrics.cpuUsage && (
  <div className="p-2 bg-gray-50 rounded-lg">
    <span className="text-xs text-gray-500 block">CPU Usage</span>
    <span className="font-medium text-gray-800">{report.metrics.cpuUsage}</span>
  </div>
)}

{report.metrics.memoryUsage && (
  <div className="p-2 bg-gray-50 rounded-lg">
    <span className="text-xs text-gray-500 block">Memory Usage</span>
    <span className="font-medium text-gray-800">{report.metrics.memoryUsage}</span>
  </div>
)}

{report.metrics.diskUsage && (
  <div className="p-2 bg-gray-50 rounded-lg">
    <span className="text-xs text-gray-500 block">Disk Usage</span>
    <span className="font-medium text-gray-800">{report.metrics.diskUsage}</span>
  </div>
)}

{report.metrics.networkBandwidth && (
  <div className="p-2 bg-gray-50 rounded-lg">
    <span className="text-xs text-gray-500 block">Network Bandwidth</span>
    <span className="font-medium text-gray-800">{report.metrics.networkBandwidth}</span>
  </div>
)}
</div>
</div>
</div>
))}
</div>
</div>
)}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
<div className="flex items-center justify-between mb-2">
<h3 className="text-blue-800 font-medium">Response Time</h3>
<span className="text-sm text-blue-600">{stats.performance.responseTime}ms</span>
</div>
<div className="w-full bg-blue-200 rounded-full h-2.5">
<div 
  className="bg-blue-600 h-2.5 rounded-full" 
  style={{ width: `${Math.min(100, (stats.performance.responseTime / 500) * 100)}%` }}
></div>
</div>
<div className="mt-2 flex justify-between text-xs text-blue-700">
<span>0ms</span>
<span>250ms</span>
<span>500ms</span>
</div>
</div>

<div className="p-4 bg-green-50 rounded-xl border border-green-100">
<div className="flex items-center justify-between mb-2">
<h3 className="text-green-800 font-medium">System Uptime</h3>
<span className="text-sm text-green-600">{stats.performance.uptime.toFixed(1)}%</span>
</div>
<div className="w-full bg-green-200 rounded-full h-2.5">
<div 
  className="bg-green-600 h-2.5 rounded-full" 
  style={{ width: `${Math.min(100, stats.performance.uptime)}%` }}
></div>
</div>
<div className="mt-2 flex justify-between text-xs text-green-700">
<span>95%</span>
<span>97.5%</span>
<span>100%</span>
</div>
</div>
</div>

<div className="mt-6">
<div className="flex items-center justify-between mb-3">
<h3 className="text-gray-800 font-medium">System Status</h3>
<button 
className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
onClick={(e) => {
  e.stopPropagation();
  setIsStatusHistoryOpen(!isStatusHistoryOpen);
}}
>
<span>Status History</span>
<ChevronDown className="w-4 h-4" />
</button>

{/* Status History Dropdown */}
{isStatusHistoryOpen && (
<div 
  className="absolute mt-10 right-10 w-96 bg-white shadow-xl rounded-xl z-40 border border-blue-100"
  onClick={handlePopupClick}
>
  <div className="p-4 border-b border-gray-100">
    <h3 className="font-semibold text-gray-800">System Status History</h3>
  </div>
  <div className="max-h-96 overflow-y-auto p-2">
    {statusHistory.map((day, index) => (
      <div key={index} className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-600 mr-2" />
            <span className="font-medium text-gray-800">{day.date}</span>
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(day.status)}`}>
            {day.status}
          </div>
        </div>
        
        {day.incidents.length > 0 && (
          <div className="bg-white rounded-lg p-2 mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Incidents ({day.incidents.length})</h4>
            {day.incidents.map((incident, idx) => (
              <div key={idx} className="p-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800">{incident.time}</span>
                  <span className={incident.resolved ? "text-green-600" : "text-red-600"}>
                    {incident.resolved ? "Resolved" : "Ongoing"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {incident.service}: {incident.issue}
                </p>
                {incident.resolved && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {incident.duration}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
)}
</div>

<div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
<div className="flex items-center">
<div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
<div>
  <span className="text-gray-800 font-medium block">All Systems Operational</span>
  <span className="text-xs text-gray-500">Last updated: 5 minutes ago</span>
</div>
</div>
<button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
<RefreshCw className="w-4 h-4 text-gray-600" />
</button>
</div>
</div>
</div>

<div className="bg-white rounded-3xl shadow-md p-8 border border-red-100 hover:shadow-lg hover:shadow-red-100/30 transition-all duration-200">
<h2 className="text-xl font-semibold text-gray-900 mb-6">Suspicious Activities</h2>

<div className="grid grid-cols-2 gap-4 mb-6">
<div 
  className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center space-x-3 cursor-pointer hover:bg-red-100 transition-colors"
  onClick={() => handleSuspiciousActivity('tabSwitching')}
>
  <div className="bg-red-100 p-2 rounded-lg">
    <Activity className="w-5 h-5 text-red-600" />
  </div>
  <div>
    <span className="block text-red-800 font-medium">Tab Switching</span>
    <span className="text-sm text-red-600">{stats.suspicious.tabSwitching} incidents</span>
  </div>
</div>

<div 
  className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center space-x-3 cursor-pointer hover:bg-orange-100 transition-colors"
  onClick={() => handleSuspiciousActivity('aiDetection')}
>
  <div className="bg-orange-100 p-2 rounded-lg">
    <Shield className="w-5 h-5 text-orange-600" />
  </div>
  <div>
    <span className="block text-orange-800 font-medium">AI Detection</span>
    <span className="text-sm text-orange-600">{stats.suspicious.aiDetection} incidents</span>
  </div>
</div>

<div 
  className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center space-x-3 cursor-pointer hover:bg-yellow-100 transition-colors"
  onClick={() => handleSuspiciousActivity('multipleDevices')}
>
  <div className="bg-yellow-100 p-2 rounded-lg">
    <Globe className="w-5 h-5 text-yellow-600" />
  </div>
  <div>
    <span className="block text-yellow-800 font-medium">Multiple Devices</span>
    <span className="text-sm text-yellow-600">{stats.suspicious.multipleDevices} incidents</span>
  </div>
</div>

<div 
  className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center space-x-3 cursor-pointer hover:bg-purple-100 transition-colors"
  onClick={() => handleSuspiciousActivity('cameraDisabled')}
>
  <div className="bg-purple-100 p-2 rounded-lg">
    <Eye className="w-5 h-5 text-purple-600" />
  </div>
  <div>
    <span className="block text-purple-800 font-medium">Camera Disabled</span>
    <span className="text-sm text-purple-600">{stats.suspicious.cameraDisabled} incidents</span>
  </div>
</div>

<div 
  className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center space-x-3 cursor-pointer hover:bg-blue-100 transition-colors"
  onClick={() => handleSuspiciousActivity('copyPasteAttempts')}
>
  <div className="bg-blue-100 p-2 rounded-lg">
    <FileText className="w-5 h-5 text-blue-600" />
  </div>
  <div>
    <span className="block text-blue-800 font-medium">Copy/Paste</span>
    <span className="text-sm text-blue-600">{stats.suspicious.copyPasteAttempts} incidents</span>
  </div>
</div>

<div 
  className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center space-x-3 cursor-pointer hover:bg-green-100 transition-colors"
  onClick={() => handleSuspiciousActivity('unauthorizedPeople')}
>
  <div className="bg-green-100 p-2 rounded-lg">
    <User className="w-5 h-5 text-green-600" />
  </div>
  <div>
    <span className="block text-green-800 font-medium">Unauthorized</span>
    <span className="text-sm text-green-600">{stats.suspicious.unauthorizedPeople} incidents</span>
  </div>
</div>
</div>

<div>
<h3 className="text-gray-800 font-medium mb-3">Assessments Status</h3>
<div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center space-x-2">
    <div className="h-3 w-3 rounded-full bg-green-500"></div>
    <span className="text-sm text-gray-700">Clean Assessments</span>
  </div>
  <span className="font-medium text-gray-900">{stats.assessments.clean}</span>
</div>
<div className="w-full bg-gray-200 rounded-full h-2 mb-3">
  <div 
    className="bg-green-500 h-2 rounded-full" 
    style={{ width: `${(stats.assessments.clean / (stats.assessments.clean + stats.assessments.flagged)) * 100}%` }}
  ></div>
</div>

<div className="flex items-center justify-between mb-2">
  <div className="flex items-center space-x-2">
    <div className="h-3 w-3 rounded-full bg-red-500"></div>
    <span className="text-sm text-gray-700">Flagged Assessments</span>
  </div>
  <span className="font-medium text-gray-900">{stats.assessments.flagged}</span>
</div>
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-red-500 h-2 rounded-full" 
    style={{ width: `${(stats.assessments.flagged / (stats.assessments.clean + stats.assessments.flagged)) * 100}%` }}
  ></div>
</div>
</div>
</div>
</div>
</div>

<div className="bg-white rounded-3xl shadow-md p-8 border border-gray-100">
<div className="flex items-center justify-between mb-6">
<h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
<div className="flex space-x-2">
<button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
  <Trash2 className="w-4 h-4 text-gray-700" />
</button>
<button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
  <RefreshCw className="w-4 h-4 text-gray-700" />
</button>
<button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
  <MoreVertical className="w-4 h-4 text-gray-700" />
</button>
</div>
</div>

<div className="overflow-x-auto">
<table className="w-full">
<thead>
  <tr className="text-left text-gray-500 border-b border-gray-100">
    <th className="pb-3 font-medium">Event</th>
    <th className="pb-3 font-medium">Time</th>
    <th className="pb-3 font-medium">Status</th>
    <th className="pb-3 font-medium">Action</th>
  </tr>
</thead>
<tbody>
  <tr className="border-b border-gray-100">
    <td className="py-3">
      <div className="flex items-center">
        <div className="bg-yellow-100 p-2 rounded-lg mr-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
        </div>
        <span className="text-gray-800">Multiple tab switching detected</span>
      </div>
    </td>
    <td className="py-3 text-gray-500">45 minutes ago</td>
    <td className="py-3">
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs">Warning</span>
    </td>
    <td className="py-3">
      <button className="text-blue-600 hover:text-blue-800">Review</button>
    </td>
  </tr>
  <tr className="border-b border-gray-100">
    <td className="py-3">
      <div className="flex items-center">
        <div className="bg-red-100 p-2 rounded-lg mr-3">
          <Shield className="w-4 h-4 text-red-600" />
        </div>
        <span className="text-gray-800">AI assistance detected</span>
      </div>
    </td>
    <td className="py-3 text-gray-500"> yesterday </td>
    <td className="py-3">
      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Alert</span>
    </td>
    <td className="py-3">
      <button className="text-blue-600 hover:text-blue-800">Review</button>
    </td>
  </tr>
  <tr className="border-b border-gray-100">
    <td className="py-3">
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <CheckCircle className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-gray-800">Assessment completed</span>
      </div>
    </td>
    <td className="py-3 text-gray-500"> yesterday </td>
    <td className="py-3">
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">Complete</span>
    </td>
    <td className="py-3">
      <button className="text-blue-600 hover:text-blue-800">View</button>
    </td>
  </tr>
  <tr className="border-b border-gray-100">
    <td className="py-3">
      <div className="flex items-center">
        <div className="bg-green-100 p-2 rounded-lg mr-3">
          <Loader className="w-4 h-4 text-green-600" />
        </div>
        <span className="text-gray-800">Assessment started</span>
      </div>
    </td>
    <td className="py-3 text-gray-500">5 days ago</td>
    <td className="py-3">
      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">Active</span>
    </td>
    <td className="py-3">
      <button className="text-blue-600 hover:text-blue-800">Monitor</button>
    </td>
  </tr>
  <tr>
    <td className="py-3">
      <div className="flex items-center">
        <div className="bg-purple-100 p-2 rounded-lg mr-3">
          <Eye className="w-4 h-4 text-purple-600" />
        </div>
        <span className="text-gray-800">Camera disabled</span>
      </div>
    </td>
    <td className="py-3 text-gray-500">6 days ago</td>
    <td className="py-3">
      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs">Warning</span>
    </td>
    <td className="py-3">
      <button className="text-blue-600 hover:text-blue-800">Review</button>
    </td>
  </tr>
</tbody>
</table>
</div>
</div>
</div>
);
}
                          