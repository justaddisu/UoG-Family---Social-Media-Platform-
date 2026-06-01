import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { userService, postService } from '../services/api';
import { User, Post } from '../types';
import { motion } from 'motion/react';
import { 
  Settings, 
  MapPin, 
  BookOpen, 
  Award, 
  UserPlus, 
  UserMinus, 
  Calendar,
  Grid,
  Users,
  Compass,
  FileText
} from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [profileUser, setProfileUser] = useState<(User & { isFollowing: boolean; stats: { posts: number; following: number; followers: number } }) | null>(null);
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'followers' | 'following'>('timeline');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'followers' && userId) {
      userService.getFollowers(userId).then(setFollowers).catch(console.error);
    } else if (activeTab === 'following' && userId) {
      userService.getFollowing(userId).then(setFollowing).catch(console.error);
    }
  }, [activeTab, userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const data = await userService.getProfile(userId);
      setProfileUser(data);

      // Filter global posts list for personalized author posts for timeline simulation
      const allPosts = await postService.getPosts();
      const filtered = allPosts.filter(p => p.authorId === userId);
      setPersonalPosts(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileUser || !userId) return;
    try {
      const res = await userService.toggleFollow(userId);
      setProfileUser({
        ...profileUser,
        isFollowing: res.isFollowing,
        stats: {
          ...profileUser.stats,
          followers: res.isFollowing ? profileUser.stats.followers + 1 : profileUser.stats.followers - 1
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-40 bg-slate-200 rounded-xl" />
        <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto -mt-12" />
        <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="font-bold">Identity Profile not found.</p>
        <p className="text-xs">That student or lecturer has not been registered in our database.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Visual Canvas Banner Stack */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div 
          className="h-48 sm:h-64 bg-cover bg-center relative" 
          style={{ backgroundImage: `url(${profileUser.profile?.coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000'})` }} 
        />
        
        {/* Profile Info Overlay Row */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 space-y-4 sm:space-y-0">
            <img 
              src={profileUser.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white ml-2"
            />

            {/* Profile Action Buttons */}
            <div className="flex space-x-3 self-start sm:self-auto sm:pb-2">
              {isOwnProfile ? (
                <Link
                  to="/settings"
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Update Profile Details</span>
                </Link>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${profileUser.isFollowing ? 'bg-slate-100 text-slate-850 hover:bg-slate-250' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {profileUser.isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Following (Disconnect)</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow / Connection</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bio Block */}
          <div className="space-y-2 mt-4 ml-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
              {profileUser.profile?.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-medium text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700 uppercase">
                {profileUser.role}
              </span>
              <span className="flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {profileUser.profile?.department}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Compass className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {profileUser.profile?.college}
              </span>
              {profileUser.profile?.graduationYear && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                    Graduation {profileUser.profile?.graduationYear}
                  </span>
                </>
              )}
            </div>

            {profileUser.profile?.bio ? (
              <p className="text-sm text-slate-700 max-w-2xl pt-2 leading-relaxed font-sans">
                {profileUser.profile?.bio}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic pt-2">No bio research overview provided yet.</p>
            )}

            {/* Custom Skills Badges */}
            {profileUser.profile?.skills && profileUser.profile.skills.trim().length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {profileUser.profile.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 text-[10px] uppercase font-bold bg-yellow-500/10 text-slate-900 border border-yellow-500/15 rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Social Stats Row */}
          <div className="flex space-x-6 border-t border-slate-150 pt-5 mt-6 ml-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center pb-2 cursor-pointer border-b-2 transition ${activeTab === 'timeline' ? 'border-yellow-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Grid className="w-4 h-4 mr-1.5" />
              <span>Notices ({profileUser.stats.posts})</span>
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex items-center pb-2 cursor-pointer border-b-2 transition ${activeTab === 'followers' ? 'border-yellow-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              <span>Followers ({profileUser.stats.followers})</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex items-center pb-2 cursor-pointer border-b-2 transition ${activeTab === 'following' ? 'border-yellow-500 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              <span>Following ({profileUser.stats.following})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Content Layout */}
      <div className="mt-8">
        {activeTab === 'timeline' ? (
          personalPosts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No personal posts.</p>
              <p className="text-xs">Publish a timeline item to populate this shelf!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {personalPosts.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono font-medium">Timeline Announcement</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-sans">{p.content}</p>
                  {p.media && p.media.length > 0 && (
                    <img 
                      src={p.media[0].url} 
                      alt="attachment" 
                      referrerPolicy="no-referrer"
                      className="mt-3.5 rounded-lg border max-h-72 object-cover w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'followers' ? (
          followers.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
              No followers listed yet. Be the first to subscribe to their feed!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {followers.map(f => (
                <Link 
                  key={f.id} 
                  to={`/profile/${f.id}`}
                  className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-3 hover:border-slate-300 transition"
                >
                  <img src={f.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{f.profile?.fullName}</p>
                    <p className="text-[10px] text-slate-400">{f.profile?.department}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          following.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
              Not following any users. Discover neighbors on the campus feed page!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {following.map(f => (
                <Link 
                  key={f.id} 
                  to={`/profile/${f.id}`}
                  className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-3 hover:border-slate-300 transition"
                >
                  <img src={f.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{f.profile?.fullName}</p>
                    <p className="text-[10px] text-slate-400">{f.profile?.department}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
