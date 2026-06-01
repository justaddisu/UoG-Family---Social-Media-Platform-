import React, { useState, useEffect } from 'react';
import { adminService, reportService } from '../services/api';
import { Report, User, AuditLog, AnalyticsSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ShieldCheck, ShieldAlert, BadgeAlert, Users, Trash2, CheckCircle2, ChevronRight, FileText, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [roster, setRoster] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'roster' | 'logs' | 'charts'>('reports');

  useEffect(() => {
    fetchAdminSuite();
  }, [activeTab]);

  const fetchAdminSuite = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'reports') {
        const list = await reportService.listReports();
        setReports(list);
      } else if (activeTab === 'roster') {
        const list = await adminService.getRoster();
        setRoster(list);
      } else if (activeTab === 'logs') {
        const logs = await adminService.getAuditLogs();
        setAuditLogs(logs);
      } else if (activeTab === 'charts') {
        const summary = await adminService.getAnalytics();
        setAnalytics(summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', resolution: 'DELETE' | 'NONE') => {
    try {
      await reportService.resolveReport(reportId, status, resolution);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      setRoster(roster.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (e) {
      console.error(e);
    }
  };

  // Safe mock chart fallback for demo
  const sampleRegistrationHistory = [
    { name: 'Mon', Student: 24, Staff: 3, Reports: 1 },
    { name: 'Tue', Student: 35, Staff: 4, Reports: 2 },
    { name: 'Wed', Student: 42, Staff: 8, Reports: 0 },
    { name: 'Thu', Student: 51, Staff: 12, Reports: 5 },
    { name: 'Fri', Student: 68, Staff: 15, Reports: 2 },
    { name: 'Sat', Student: 91, Staff: 20, Reports: 4 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Brand Identity Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-red-500 font-bold mb-1.5 uppercase font-mono tracking-widest text-xs">
          <ShieldAlert className="w-5 h-5 animate-pulse text-red-500" />
          <span>Restricted Administrative Council</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">University security & Audit Desk</h2>
        <p className="text-xs text-slate-500 mt-1">Audit student roles, handle content infractions, monitor platform analytics, and review system audit trails.</p>
      </div>

      {/* Control Tabs bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-150 pb-4 mb-6">
        {[
          { id: 'reports', label: '📢 Pending Infractions' },
          { id: 'charts', label: '📊 Active Analytics' },
          { id: 'roster', label: '👥 User Registrar' },
          { id: 'logs', label: '📜 Action Trails' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${activeTab === tab.id ? 'bg-red-950 text-white border-red-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Display panels */}
      {isLoading ? (
        <div className="text-center py-16 animate-pulse space-y-4">
          <div className="h-44 bg-slate-150 rounded-xl" />
        </div>
      ) : activeTab === 'reports' ? (
        reports.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-500">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-bold">Unimpeachable Safety Standards Met</p>
            <p className="text-xs text-slate-400">Gondarians have reported zero community guidelines violations today.</p>
          </div>
        ) : (
          <div className="space-y-4 font-sans text-xs">
            {reports.map(rep => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 text-red-600 font-bold uppercase tracking-wider mb-1">
                    <BadgeAlert className="w-3.5 h-3.5" />
                    <span>Reason: {rep.reason}</span>
                  </div>
                  
                  <p className="text-slate-800 mt-1 mb-1.5 text-xs">
                    Target Type: <strong>{rep.targetType}</strong> (ID: {rep.targetId})
                  </p>
                  
                  {rep.description && (
                    <p className="text-slate-500 italic">"{rep.description}"</p>
                  )}

                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Incident filed by user {rep.reporterId} on {new Date(rep.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Resolvers */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => handleResolve(rep.id, 'RESOLVED', 'DELETE')}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                  >
                    Delete Content
                  </button>
                  <button
                    onClick={() => handleResolve(rep.id, 'DISMISSED', 'NONE')}
                    className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Dismiss Report
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : activeTab === 'roster' ? (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-[10px] tracking-wider font-bold text-slate-500">
              <tr>
                <th className="p-4">Academic Member</th>
                <th className="p-4">Faculty Division</th>
                <th className="p-4">Current Clearance Role</th>
                <th className="p-4">Action Role Adjustments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map(u => (
                <tr key={u.id}>
                  <td className="p-4 font-bold text-slate-900">{u.profile?.fullName || u.email}</td>
                  <td className="p-4">{u.profile?.college} • {u.profile?.department}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-700">{u.role}</span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-50 border p-1 rounded font-semibold text-xs text-slate-700"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="ALUMNI">ALUMNI</option>
                      <option value="LECTURER">LECTURER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="GONDAR_COMMUNITY">GONDAR COMMUNITY</option>
                      <option value="CLUB_ADMIN">CLUB_ADMIN</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'logs' ? (
        auditLogs.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-xs">Audit trails empty.</p>
        ) : (
          <div className="bg-slate-900 text-slate-200 border border-slate-800 p-5 rounded-xl font-mono text-[11px] shadow-inner divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="py-2.5 flex items-start space-x-2">
                <ChevronRight className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-yellow-400 font-bold mr-1.5">[{log.action}]</span>
                  <span className="text-slate-300">{log.description || 'Identity Transaction Approved.'}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">By Administrator ID: {log.userId} • {new Date(log.createdAt).toISOString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Render Visual Recharts Charts */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* User active registrations */}
          <div className="bg-white border p-6 rounded-xl shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-yellow-505" />
              Users Roster Registrations
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleRegistrationHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Student" fill="#eab308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Staff" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System safety threat tracking */}
          <div className="bg-white border p-6 rounded-xl shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-red-500 animate-pulse" />
              Platform Violations Trends
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleRegistrationHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Reports" stroke="#dc2626" strokeWidth={3.5} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Aggregated widgets */}
          {analytics && (
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Students Total</p>
                <p className="text-xl font-black mt-1 text-yellow-400">{analytics.activeUsersCount}</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Total Publications</p>
                <p className="text-xl font-black mt-1 text-yellow-400">{analytics.postsCount}</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Active Communities</p>
                <p className="text-xl font-black mt-1 text-yellow-400">{analytics.groupGrowth?.length || 4}</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Active Events</p>
                <p className="text-xl font-black mt-1 text-yellow-400">12</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
