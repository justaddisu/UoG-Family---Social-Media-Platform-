import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/api';
import { Announcement } from '../types';
import { Megaphone, Pin, Plus, AlertTriangle, Info, Bell, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export default function AnnouncementsPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Forms
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [isPinned, setIsPinned] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR' || user?.role === 'LECTURER';

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      setIsLoading(true);
      const list = await announcementService.getAnnouncements();
      setAnnouncements(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsPosting(true);
      const created = await announcementService.createAnnouncement({
        title,
        content,
        priority,
        isPinned,
      });

      setAnnouncements([created, ...announcements]);
      setTitle('');
      setContent('');
      setPriority('NORMAL');
      setIsPinned(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Memo dispatch failed.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">University Board Announcements</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Official council communications, department priority notifications, and academic columns.</p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Memo</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">No active announcements.</p>
          <p className="text-xs">University boards are currently silent.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {announcements.map(memo => (
            <motion.div
              key={memo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border p-6 rounded-xl shadow-sm relative ${memo.isPinned ? 'bg-yellow-500/5 border-yellow-500/25' : 'bg-white border-slate-200'}`}
            >
              {/* Pin indicator */}
              {memo.isPinned && (
                <div className="absolute top-4 right-4 flex items-center space-x-1 text-[10px] font-mono text-yellow-600 font-bold uppercase">
                  <Pin className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span>Pinned Priority Board</span>
                </div>
              )}

              {/* Priority alert badge */}
              <div className="flex items-center space-x-2 mb-3">
                {memo.priority === 'URGENT' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-100 text-red-600 border border-red-200 flex items-center space-x-1 uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    Highly Urgent
                  </span>
                ) : memo.priority === 'HIGH' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-600 border border-amber-200 flex items-center space-x-1 uppercase tracking-wider">
                    <Bell className="w-3 h-3 mr-0.5" />
                    High Priority
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-600 border border-blue-200 flex items-center space-x-1 uppercase tracking-wider">
                    <Info className="w-3 h-3 mr-0.5" />
                    Standard Notice
                  </span>
                )}
                
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(memo.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Content Header column */}
              <h3 className="text-md font-bold text-slate-900 mb-2 font-display">
                {memo.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                {memo.content}
              </p>

              {/* Publisher line */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Dispensed by: {memo.createdBy || 'University Registrar'} — Official Academic Column
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Circle creation Modal backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 max-w-md w-full p-6 rounded-xl shadow-xl"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Megaphone className="w-5 h-5 text-yellow-500" />
                <h3 className="text-md font-bold font-display text-white">Publish Official Memo</h3>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Memo Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class Schedule shifts, Research grants..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Body Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detail the precise academic guidelines, instructions or notice guidelines..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Priority Channel</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-4">
                    <input
                      type="checkbox"
                      id="pin-check"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <label htmlFor="pin-check" className="text-slate-300 font-semibold">Pin to top of stack</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold flex items-center space-x-1"
                  >
                    {isPosting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Deploy Official Memo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
