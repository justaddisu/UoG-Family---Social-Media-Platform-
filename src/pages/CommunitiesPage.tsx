import React, { useState, useEffect } from 'react';
import { communityService } from '../services/api';
import { Group } from '../types';
import { Users, Plus, Star, Tag, Compass, Sparkles, Loader2, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CommunitiesPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Circle creation form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PUBLIC');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setIsLoading(true);
      const list = await communityService.getGroups();
      setGroups(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleJoin = async (groupId: string) => {
    try {
      const res = await communityService.toggleJoinGroup(groupId);
      setGroups(groups.map(g => {
        if (g.id === groupId) {
          const currentCount = g.membersCount || 0;
          return {
            ...g,
            isJoined: res.isJoined,
            membersCount: res.isJoined ? currentCount + 1 : Math.max(0, currentCount - 1)
          };
        }
        return g;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsPosting(true);
      const created = await communityService.createGroup({
        name,
        description,
        type,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      });
      
      setGroups([...groups, {
        ...created,
        isJoined: true,
        membersCount: 1
      }]);
      
      setName('');
      setDescription('');
      setCoverUrl('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Fail to create community board.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Visual Header row with creation triggers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">University Interest Circles</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Join technical chapters, research labs, or sports societies at UoG.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Circle</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">No communities established.</p>
          <p className="text-xs">Establish the very first University Club!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map(group => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Cover representation */}
                <div 
                  className="h-24 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${group.coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600'})` }} 
                />
                
                {/* Text Content */}
                <div className="p-5 font-sans">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1 flex items-center">
                    <Star className="w-3.5 h-3.5 text-yellow-500 mr-1.5" />
                    {group.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border">{group.type}</span>
                    <span>•</span>
                    <span>{group.membersCount || 0} Members</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {group.description || 'Welcome! Explore interest boards, lecture discussions, and sports updates.'}
                  </p>
                </div>
              </div>

              {/* Action bar */}
              <div className="p-5 pt-0 border-t border-slate-100 flex justify-between items-center text-xs mt-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  Active
                </span>

                <button
                  onClick={() => handleToggleJoin(group.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${group.isJoined ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                >
                  {group.isJoined ? 'Leave' : 'Join'}
                </button>
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
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h3 className="text-md font-bold font-display text-white">Create University Circle</h3>
              </div>

              <form onSubmit={handleCreateClub} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Circle Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gondar Tech Hub / BioMed Scholars"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Missions & Short Overview</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what members will do here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Privacy Level</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                  >
                    <option value="PUBLIC">PUBLIC (All Gondarians can discover and join)</option>
                    <option value="PRIVATE">PRIVATE (Moderator verification needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Banner Image Cover URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-150 outline-none"
                  />
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
                    <span>Submit and Launch</span>
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
