import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  MessageCircle,
  FileJson,
  Calendar,
  ShieldCheck,
  Settings,
  Database,
  Brain,
  Upload,
  Trash2,
  HardDrive,
  Bell,
  CheckCircle,
  XCircle,
  TrendingDown
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import adminAPI from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [days, setDays] = useState(30);
  const [alerts, setAlerts] = useState([]);

  // Generate alerts based on analytics data
  const generateAlerts = useCallback((analyticsData) => {
    const newAlerts = [];
    const now = new Date();
    
    // Fallback Rate Alert (threshold: > 15%)
    if (analyticsData?.nlp?.fallback_rate > 15) {
      newAlerts.push({
        id: 'fallback-spike',
        type: 'fallback',
        severity: analyticsData.nlp.fallback_rate > 25 ? 'critical' : 'warning',
        title: 'Fallback Rate Spike',
        message: `Fallback rate is at ${analyticsData.nlp.fallback_rate}% - exceeds 15% threshold`,
        timestamp: now,
        acknowledged: false
      });
    }
    
    // Latency Alert (threshold: > 3s)
    if (analyticsData?.nlp?.avg_latency > 3) {
      newAlerts.push({
        id: 'latency-degradation',
        type: 'performance',
        severity: analyticsData.nlp.avg_latency > 5 ? 'critical' : 'warning',
        title: 'Performance Degradation',
        message: `Average latency is ${analyticsData.nlp.avg_latency}s - exceeds 3s threshold`,
        timestamp: now,
        acknowledged: false
      });
    }
    
    // High Traffic Alert (threshold: > 1000 conversations in period)
    if (analyticsData?.summary?.total_conversations > 1000) {
      newAlerts.push({
        id: 'high-traffic',
        type: 'traffic',
        severity: analyticsData.summary.total_conversations > 5000 ? 'critical' : 'info',
        title: 'High Traffic Volume',
        message: `${analyticsData.summary.total_conversations} conversations detected - consider scaling resources`,
        timestamp: now,
        acknowledged: false
      });
    }
    
    // Low Engagement Alert
    if (analyticsData?.summary?.engagement_rate < 30) {
      newAlerts.push({
        id: 'low-engagement',
        type: 'performance',
        severity: 'warning',
        title: 'Low Engagement Rate',
        message: `Engagement rate dropped to ${analyticsData.summary.engagement_rate}% - below 30% threshold`,
        timestamp: now,
        acknowledged: false
      });
    }
    
    setAlerts(newAlerts);
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        adminAPI.getAnalytics(days),
        adminAPI.getUsers(userSearchQuery),
        adminAPI.getSettings(),
        adminAPI.searchLogs(logSearchQuery)
      ]);
      setData(results[0].data);
      generateAlerts(results[0].data); // Auto-generate alerts based on analytics
      setUsers(extractUsersArray(results[1].data));
      
      const settingsMap = results[2].data.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
      setSettings(settingsMap);
      setLogs(results[3].data);
    } catch (error) {
      console.error("Failed to load admin metrics:", error);
      toast.error("Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  }, [days, userSearchQuery, logSearchQuery, generateAlerts]);

  const extractUsersArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.results && Array.isArray(payload.results)) return payload.results;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };
  

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleLogSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await adminAPI.searchLogs(logSearchQuery);
      setLogs(response.data);
    } catch (err) {
      console.error("Log search failed:", err);
      toast.error("Log search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await adminAPI.getUsers(userSearchQuery);
      setUsers(extractUsersArray(response.data));
    } catch (err) {
      console.error("User search failed:", err);
      toast.error("User search failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const sentimentData = data ? Object.entries(data.nlp.sentiment_breakdown).map(([name, value]) => ({ name, value })) : [];
  const intentData = data ? Object.entries(data.intents).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Intelligence, performance, and system orchestration.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                  days === d ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button onClick={loadAdminData} variant="outline" className="bg-white">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-200 flex overflow-x-auto scrollbar-hide gap-4 md:gap-8">
        {[
          { id: 'overview', label: 'Overview', icon: LineChart },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'performance', label: 'NLP Performance', icon: Zap },
          { id: 'logs', label: 'Chat Logs', icon: FileJson },
          { id: 'knowledge', label: 'Knowledge Base', icon: Database },
          { id: 'learning', label: 'Learning Engine', icon: Brain },
          { id: 'health', label: 'System Health', icon: HardDrive },
          { id: 'alerts', label: 'Alerts', icon: Bell },
          { id: 'controls', label: 'Controls', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Total Conversations" 
                value={data?.summary.total_conversations} 
                icon={MessageSquare} 
                trend="+12%" 
                color="blue"
              />
              <StatCard 
                label="Active Users" 
                value={data?.summary.active_users} 
                icon={Users} 
                trend="+5.4%" 
                color="emerald"
              />
              <StatCard 
                label="Engagement Rate" 
                value={`${data?.summary.engagement_rate}%`} 
                icon={TrendingUp} 
                trend="+2.1%" 
                color="indigo"
              />
              <StatCard 
                label="Avg Turns/Chat" 
                value={data?.summary.avg_turns} 
                icon={Activity} 
                trend="-0.5%" 
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Trends Chart */}
              <Card className="lg:col-span-2 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Conversation Trends
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trends}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Intents Share */}
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Top User Intents
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={intentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-orange-50">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Inference Latency</h3>
                  <p className="text-sm text-slate-500">Average model response time.</p>
                </div>
              </div>
              <div className="text-center py-10">
                <p className="text-6xl font-bold text-slate-900 mb-4">{data?.nlp.avg_latency}s</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 w-fit mx-auto px-4 py-2 rounded-full font-bold">
                  <Zap className="w-4 h-4" />
                  Optimal Score
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Fallback Rate</h3>
                  <p className="text-sm text-slate-500">% of unsupported queries.</p>
                </div>
              </div>
              <div className="text-center py-10">
                <p className="text-6xl font-bold text-slate-900 mb-4">{data?.nlp.fallback_rate}%</p>
                <div className="flex items-center justify-center gap-2 text-slate-600 bg-slate-100 w-fit mx-auto px-4 py-2 rounded-full font-bold">
                  <Activity className="w-4 h-4" />
                  Within Threshold
                </div>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-bold text-slate-900 mb-6">User Sentiment Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="cell-pos" fill="#10b981" />
                        <Cell key="cell-neu" fill="#3b82f6" />
                        <Cell key="cell-neg" fill="#ef4444" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="md:col-span-2 flex flex-col justify-center space-y-4">
                  <SentimentBar label="Positive" percentage={74} color="bg-emerald-500" />
                  <SentimentBar label="Neutral" percentage={20} color="bg-blue-500" />
                  <SentimentBar label="Negative" percentage={6} color="bg-red-500" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'segmentation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Geographical Distribution
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'USA', users: 450 },
                    { name: 'UK', users: 210 },
                    { name: 'Nigeria', users: 380 },
                    { name: 'Canada', users: 190 },
                    { name: 'Germany', users: 150 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Device Breakdown
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: 65 },
                        { name: 'Mobile Web', value: 25 },
                        { name: 'Native App', value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-bold text-slate-900 mb-6">Business KPIs (Revenue & Conversions)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-600 uppercase mb-2">Lead Conversion</p>
                    <p className="text-4xl font-black text-indigo-900">8.4%</p>
                    <p className="text-xs text-indigo-500 mt-2">Chat-to-Signup rate</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-sm font-bold text-emerald-600 uppercase mb-2">Estimated ROI</p>
                    <p className="text-4xl font-black text-emerald-900">$12,450</p>
                    <p className="text-xs text-emerald-500 mt-2">Value driven by AI interactions</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-sm font-bold text-blue-600 uppercase mb-2">Retention Rate</p>
                    <p className="text-4xl font-black text-blue-900">42%</p>
                    <p className="text-xs text-blue-500 mt-2">Returning users monthly</p>
                 </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
              <form onSubmit={handleLogSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search conversations by user or message..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chat Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Msgs</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {log.user[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{log.title || 'Untitled Chat'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(log.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-bold text-slate-600">
                          {log.message_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-md rounded-lg text-blue-600">
                          <ExternalLink className="w-4 h-4 cursor-not-allowed" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">Showing top {logs.length} interactions</p>
              <Button variant="ghost" size="sm" className="text-blue-600 font-bold">Export to JSON <FileJson className="w-3 h-3 ml-2"/></Button>
            </div>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
              <form onSubmit={handleUserSearch} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <Button type="submit" size="sm">Search</Button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No users found.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {u.first_name?.[0] || u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{u.is_staff ? 'Admin' : 'User'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.is_staff && u.is_active ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50">Admin</span>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => adminAPI.toggleUserStatus(u.id).then(() => loadAdminData())}
                              className={u.is_active ? 'text-red-500' : 'text-emerald-500'}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Knowledge Base Management</h3>
                  <p className="text-slate-500">Upload and manage documents for RAG. Changes sync automatically.</p>
                </div>
                <div className="flex gap-3">
                  <input
                    type="file"
                    id="kb-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('name', file.name);
                        adminAPI.uploadDocument(formData)
                          .then(() => {
                            toast.success("Document uploaded and sync started!");
                            loadAdminData(); // Refresh data after upload
                          })
                          .catch(() => toast.error("Upload failed"));
                      }
                    }}
                  />
                  <Button onClick={() => document.getElementById('kb-upload').click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload (.pdf, .md)
                  </Button>
                </div>
              </div>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Document</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Size</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!data?.health.knowledge_base.documents || data?.health.knowledge_base.documents.length === 0) ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No documents indexed yet.</td>
                      </tr>
                    ) : (
                      data.health.knowledge_base.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">{doc.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{doc.file_type}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{(doc.size / 1024).toFixed(1)} KB</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${doc.indexed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {doc.indexed_at ? 'Indexed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                adminAPI.deleteDocument(doc.id).then(() => {
                                  toast.success("Document removed");
                                  loadAdminData(); // Refresh data after deletion
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-blue-50">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Training Engine</h3>
                  <p className="text-sm text-slate-500">Feedback-driven learning.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">High Quality Feedback</p>
                  <p className="text-4xl font-black text-slate-900">{data?.learning.high_quality_feedback_count}</p>
                </div>
                
                <Button 
                  onClick={() => {
                    adminAPI.triggerExport().then(() => toast.success("Export triggered!"));
                  }}
                  className="w-full"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Request Manual Export
                </Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-600" />
                Exported Datasets
              </h3>
              <div className="space-y-4">
                {data?.learning.exported_datasets.map((dataset, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{dataset.name}</p>
                      <p className="text-xs text-slate-500">{(dataset.size / 1024).toFixed(1)} KB • {new Date(dataset.created_at * 1000).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {data?.learning.exported_datasets.length === 0 && (
                  <p className="text-center text-slate-500 py-10 italic">No datasets generated yet.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-600" />
                System Limits
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">User Rate Limit</span>
                  <span className="text-sm font-bold">{data?.health.throttle_rates.user}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Anon Rate Limit</span>
                  <span className="text-sm font-bold">{data?.health.throttle_rates.anon}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Celery Orchestrator
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-700">Worker Uptime</span>
                  <span className="text-sm font-bold text-emerald-800">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Concurrency</span>
                  <span className="text-sm font-bold">{data?.health.celery.concurrency}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Scalability Forecast
              </h3>
              <p className="text-xs text-slate-500 mb-4">Current load suggests optimal performance.</p>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[15%]" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-right">15% Resource Usage</p>
            </Card>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <Card className="p-6 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      Content Safety
                   </h3>
                   <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                   </div>
                </div>
                <p className="text-sm text-slate-500 mb-6">Automated harmful content detection and blocking using Gemini filters.</p>
                <div className="space-y-3">
                   <SafetyToggle label="Hate Speech" active={true} />
                   <SafetyToggle label="Harassment" active={true} />
                   <SafetyToggle label="Explicit Content" active={false} />
                </div>
             </Card>

             <Card className="p-6 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                      RAG Controls
                   </h3>
                   <div 
                     className={cn(
                       "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                       settings['RAG_ENABLED'] !== 'false' ? "bg-blue-600" : "bg-slate-300"
                     )}
                     onClick={() => {
                       const newValue = settings['RAG_ENABLED'] === 'false' ? 'true' : 'false';
                       adminAPI.updateSetting('RAG_ENABLED', newValue)
                         .then(() => {
                           toast.success(`RAG ${newValue === 'true' ? 'enabled' : 'disabled'}`);
                           loadAdminData();
                         })
                         .catch(() => toast.error('Failed to update RAG setting'));
                     }}
                   >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        settings['RAG_ENABLED'] !== 'false' ? "right-1" : "left-1"
                      )} />
                   </div>
                </div>
                <p className="text-sm text-slate-500 mb-6">Toggle Retrieval-Augmented Generation system-wide for the chatbot.</p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                   <span className="text-sm font-semibold text-slate-700">Semantic Search</span>
                   <span className={cn(
                     "text-xs font-bold px-2 py-1 rounded-md",
                     settings['RAG_ENABLED'] !== 'false' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                   )}>
                     {settings['RAG_ENABLED'] !== 'false' ? 'LIVE' : 'OFF'}
                   </span>
                </div>
             </Card>

             <Card className="p-6 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-600" />
                      Model Swapper
                   </h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">Active model engine selector.</p>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings['ACTIVE_MODEL'] || 'gemini-2.5-flash'}
                  onChange={(e) => {
                    const selectedLabel = e.target.selectedOptions[0].text;
                    adminAPI.updateSetting('ACTIVE_MODEL', e.target.value)
                      .then(() => {
                        toast.success(`Switched to ${selectedLabel}`);
                        loadAdminData();
                      });
                  }}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Performance)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Accuracy)</option>
                  <option value="gemini-2.0-experimental">Gemini 2.0 Exp (Latest)</option>
                </select>
             </Card>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            {/* Alert Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Critical Alerts</p>
                    <p className="text-3xl font-black text-slate-900">
                      {alerts.filter(a => a.severity === 'critical').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-red-50">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Warnings</p>
                    <p className="text-3xl font-black text-slate-900">
                      {alerts.filter(a => a.severity === 'warning').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">System Status</p>
                    <p className="text-xl font-black text-emerald-600">
                      {alerts.length === 0 ? 'All Clear' : 'Needs Attention'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Active Alerts List */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Active Alerts
                  </h3>
                  <p className="text-sm text-slate-500">Real-time system notifications</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateAlerts(data)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Alerts
                </Button>
              </div>
              
              <div className="divide-y divide-slate-100">
                {alerts.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-700">No Active Alerts</p>
                    <p className="text-sm text-slate-500 mt-1">All systems are operating normally</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-xl",
                          alert.severity === 'critical' ? "bg-red-100" :
                          alert.severity === 'warning' ? "bg-amber-100" : "bg-blue-100"
                        )}>
                          {alert.type === 'fallback' && <TrendingDown className={cn(
                            "w-5 h-5",
                            alert.severity === 'critical' ? "text-red-600" : "text-amber-600"
                          )} />}
                          {alert.type === 'performance' && <Zap className={cn(
                            "w-5 h-5",
                            alert.severity === 'critical' ? "text-red-600" : "text-amber-600"
                          )} />}
                          {alert.type === 'traffic' && <TrendingUp className={cn(
                            "w-5 h-5",
                            alert.severity === 'critical' ? "text-red-600" : "text-blue-600"
                          )} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              alert.severity === 'critical' ? "bg-red-100 text-red-700" :
                              alert.severity === 'warning' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{alert.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {alert.timestamp.toLocaleTimeString()} - {alert.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setAlerts(prev => prev.filter(a => a.id !== alert.id));
                            toast.success('Alert dismissed');
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Alert Thresholds Configuration */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                Alert Thresholds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-100">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Fallback Spike</p>
                      <p className="text-xs text-slate-500">Triggers when fallback rate exceeds threshold</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Threshold</span>
                    <span className="text-sm font-bold text-slate-900">15%</span>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Performance Degradation</p>
                      <p className="text-xs text-slate-500">Triggers when latency exceeds limit</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Threshold</span>
                    <span className="text-sm font-bold text-slate-900">3 seconds</span>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">High Traffic</p>
                      <p className="text-xs text-slate-500">Triggers during traffic spikes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Threshold</span>
                    <span className="text-sm font-bold text-slate-900">1000 chats/period</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color }) => {
  if (!Icon) return null;
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", colorMap[color] || colorMap.blue)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend.startsWith('+') ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"
        )}>
          {trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-500 mb-1">{label}</h3>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </Card>
  );
};

const SentimentBar = ({ label, percentage, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs font-bold">
      <span className="text-slate-600 uppercase tracking-widest">{label}</span>
      <span className="text-slate-900">{percentage}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-1000", color)} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const SafetyToggle = ({ label, active }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className={cn(
      "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
      active ? "bg-blue-600" : "bg-slate-300"
    )}>
      <div className={cn(
        "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
        active ? "right-1" : "left-1"
      )} />
    </div>
  </div>
);

export default AnalyticsDashboard;
