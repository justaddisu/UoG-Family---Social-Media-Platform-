import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { postService, userService, mediaService, reportService } from '../services/api';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Flag, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  Briefcase, 
  Search,
  Filter,
  Users,
  Award,
  ChevronRight,
  Smile,
  BadgeAlert,
  GraduationCap
} from 'lucide-react';

const REACTION_PALETTE = [
  { type: 'LIKE', label: '👍 Like' },
  { type: 'LOVE', label: '❤️ Love' },
  { type: 'CELEBRATE', label: '👏 Celebrate' },
  { type: 'SUPPORT', label: '🤝 Support' },
  { type: 'INSIGHTFUL', label: '💡 Insightful' },
  { type: 'FUNNY', label: '😂 Funny' }
];

export default function HomeFeed() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [feedType, setFeedType] = useState<'latest' | 'following' | 'trending'>('latest');
  const [postContent, setPostContent] = useState('');
  const [attachedUrl, setAttachedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeReactionPostId, setActiveReactionPostId] = useState<string | null>(null);
  
  // Comment drawers
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Moderation modal
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState('Offensive Content');
  const [reportDesc, setReportDesc] = useState('');

  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, [feedType]);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const list = await postService.getPosts(feedType);
      setPosts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const list = await userService.getSuggestions();
      setSuggestions(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      const created = await postService.createPost(
        postContent, 
        'PUBLIC', 
        attachedUrl ? [attachedUrl] : undefined
      );
      setPosts([created, ...posts]);
      setPostContent('');
      setAttachedUrl('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish post');
    }
  };

  const handleSimulateUpload = async () => {
    // Create a file input to allow local file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string)?.split(',')[1] || '';
          const res = await mediaService.uploadMedia(file.name, base64);
          setAttachedUrl(res.url);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Failed to upload image. Using default campus image instead.');
        // Fallback to random Unsplash image
        const res = await mediaService.uploadMedia('photo.jpg', '');
        setAttachedUrl(res.url);
      }
    };
    input.click();
  };

  const handleReact = async (postId: string, reactionType: string) => {
    try {
      const res = await postService.reactToPost(postId, reactionType);
      // Re-hydrate single post to show immediate update
      const updatedPost = await postService.getPostDetails(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
      setActiveReactionPostId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await postService.addComment(postId, commentText);
      setCommentText('');
      const updatedPost = await postService.getPostDetails(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmarkToggle = async (postId: string) => {
    try {
      const res = await postService.toggleBookmark(postId);
      setLocalBookmarks({
        ...localBookmarks,
        [postId]: res.isBookmarked
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await postService.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowSuggestion = async (suggestedId: string) => {
    try {
      await userService.toggleFollow(suggestedId);
      setSuggestions(suggestions.filter(s => s.id !== suggestedId));
    } catch (e) {
      console.error(e);
    }
  };

  const fileReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    try {
      await reportService.fileReport({
        targetType: 'POST',
        targetId: reportingPost.id,
        reason: reportReason,
        description: reportDesc
      });
      alert('Content reported. Security Moderators have been notified.');
      setReportingPost(null);
      setReportDesc('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      try {
        setIsLoading(true);
        const searchResults = await postService.getPosts(); // fallback inside client side
        const query = searchQuery.toLowerCase();
        if (query) {
          const filtered = searchResults.filter(p => p.content.toLowerCase().includes(query) || p.author.profile?.fullName.toLowerCase().includes(query));
          setPosts(filtered);
        } else {
          fetchFeed();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: User Card and Fast Filter Options */}
        <div id="side-feed-card" className="lg:col-span-1 space-y-6">
          {user && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="h-20 bg-cover bg-center" 
                style={{ backgroundImage: `url(${user.profile?.coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600'})` }} 
              />
              <div className="px-6 pb-6 text-center -mt-10 relative">
                <img 
                  src={user.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-4 border-white mx-auto shadow-sm"
                />
                <h3 className="mt-2 text-md font-bold text-slate-900 leading-tight">
                  {user.profile?.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {user.profile?.department} • {user.profile?.college}
                </p>
                <div className="mt-1 flex justify-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Filters Panel */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center mb-4">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Feed Filters
            </h4>
            <div className="space-y-1">
              {[
                { type: 'latest', label: '🏠 Latest Chronicles' },
                { type: 'following', label: '👥 Handshakes Feed' },
                { type: 'trending', label: '🔥 Campus Buzz' }
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setFeedType(opt.type as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center justify-between ${feedType === opt.type ? 'bg-yellow-500/10 text-slate-900 border-l-4 border-yellow-500' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>{opt.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Main Column: Publisher and Chronological Posts List */}
        <div id="posts-feed-container" className="lg:col-span-2 space-y-6">
          
          {/* Universal Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts or hashtag (Press Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition shadow-sm font-sans"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {/* Post Publisher Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex space-x-3">
                <img 
                  src={user?.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100"
                />
                <textarea
                  rows={2}
                  placeholder={`What is on your mind, ${user?.profile?.fullName.split(' ')[0]}? Share research, notices, or study logs... #hashtag`}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full resize-none outline-none text-slate-800 text-sm placeholder-slate-400 self-center"
                />
              </div>

              {/* Upload Previews */}
              {attachedUrl && (
                <div className="relative rounded overflow-hidden max-h-56 bg-slate-50 border border-slate-100">
                  <img src={attachedUrl} alt="Attachments Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setAttachedUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 font-bold text-white text-xs hover:bg-slate-900 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={handleSimulateUpload}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold select-none cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>Attach Campus Image</span>
                </button>

                <button
                  type="submit"
                  disabled={!postContent.trim()}
                  className="flex items-center space-x-1.5 px-4  py-1.5 rounded font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 text-xs shadow disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Notice</span>
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Posts Loop */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse space-y-4">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-12 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400">
              <Smile className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">The catalog is empty.</p>
              <p className="text-xs text-slate-400">Try creating a post or switching to the generic catalog.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <motion.div 
                  key={post.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative"
                >
                  {/* Title Header with action buttons */}
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-3">
                      <img 
                        src={post.author?.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                        alt="Author" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center">
                          {post.author?.profile?.fullName}
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-500 uppercase">
                            {post.author?.role}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {post.author?.profile?.department} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Security Report Trigger */}
                      <button 
                        onClick={() => setReportingPost(post)}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                        title="Report Content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>

                      {/* Author Purge Option */}
                      {(post.authorId === user?.id || user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR') && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Purge Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="mt-3.5 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {post.content}
                  </div>

                  {/* Embedded Media */}
                  {post.media && post.media.length > 0 && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-100 max-h-96 bg-slate-50">
                      <img 
                        src={post.media[0].url} 
                        alt="Notice media" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Reaction Summary Row */}
                  <div className="mt-4 flex justify-between text-slate-400 text-xs py-2 border-t border-b border-slate-100 items-center">
                    <div className="flex items-center space-x-1.5">
                      <div className="flex -space-x-1">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-white text-[10px]">👍</span>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 border border-white text-[10px]">❤️</span>
                      </div>
                      <span className="font-semibold text-slate-500">
                        {post.reactions?.length || 0} Reacts
                      </span>
                    </div>

                    <span className="font-semibold text-slate-500">
                      {post.comments?.length || 0} Comments
                    </span>
                  </div>

                  {/* Interactive Control Row */}
                  <div className="mt-2 flex justify-between relative">
                    {/* React Button with Popover hover */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveReactionPostId(activeReactionPostId === post.id ? null : post.id)}
                        className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded transition cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>React</span>
                      </button>

                      {/* Floating Emojis Palette */}
                      <AnimatePresence>
                        {activeReactionPostId === post.id && (
                          <motion.div 
                            initial={{ scale: 0.85, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: -45 }}
                            exit={{ scale: 0.85, opacity: 0, y: 10 }}
                            className="absolute z-35 flex space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-full shadow-xl"
                          >
                            {REACTION_PALETTE.map(react => (
                              <button
                                key={react.type}
                                onClick={() => handleReact(post.id, react.type)}
                                className="hover:scale-125 transition duration-150 p-1 text-sm rounded bg-slate-850 hover:bg-slate-700"
                                title={react.label}
                              >
                                {react.label.split(' ')[0]}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Comments Trigger */}
                    <button
                      onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>Comment</span>
                    </button>

                    {/* Bookmarking */}
                    <button
                      onClick={() => handleBookmarkToggle(post.id)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      {localBookmarks[post.id] ? (
                        <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Book</span>
                    </button>
                  </div>

                  {/* Stretched Comments Panel */}
                  <AnimatePresence>
                    {activeCommentsPostId === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        {/* Feed comments items */}
                        <div className="space-y-3.5 pt-4 border-t border-slate-100 max-h-56 overflow-y-auto">
                          {post.comments?.map(comment => (
                            <div key={comment.id} className="p-3 rounded bg-slate-50 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-900">
                                  {comment.author?.profile?.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-slate-800">{comment.content}</p>
                            </div>
                          ))}
                        </div>

                        {/* Comment Input wrapper */}
                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100">
                          <input
                            type="text"
                            placeholder="Write your constructive reply..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-yellow-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="bg-yellow-500 text-slate-950 p-2 rounded hover:bg-yellow-400 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: University Network Suggestions Directory */}
        <div id="right-column-tech" className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center mb-4">
              <Users className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
              Gondar Neighbors
            </h4>
            
            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-400 leading-tight">No suggested students available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {suggestions.map(sugg => (
                  <div key={sugg.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={sugg.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                        alt="Peer" 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <h5 className="font-bold text-slate-900 leading-tight">
                          {sugg.profile?.fullName.split(' ')[0]} {sugg.profile?.fullName.split(' ')[1] || ""}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {sugg.profile?.department}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollowSuggestion(sugg.id)}
                      className="px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-semibold cursor-pointer"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Institutional Stats Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl text-white shadow shadow-yellow-500/10">
            <h5 className="text-xs font-semibold text-yellow-400 uppercase tracking-widest flex items-center mb-3">
              <GraduationCap className="w-4 h-4 mr-1.5" />
              University Facts
            </h5>
            <div className="space-y-2 text-xs leading-relaxed text-slate-300 font-sans">
              <p>📍 Gondar, Amhara Region, Ethiopia</p>
              <p>🎓 Over 40,000 active students across 5 campuses.</p>
              <p>🦁 Known as the Royal College (est. 1954 Public Institution).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation reporting modal */}
      {reportingPost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 border border-slate-800 max-w-md w-full p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-2 mb-4 text-red-400">
              <BadgeAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="text-md font-bold">Report Content Policy Violation</h3>
            </div>
            
            <form onSubmit={fileReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 outline-none"
                >
                  <option value="Hate Speech / Verbal Abuse">Hate Speech / Verbal Abuse</option>
                  <option value="Academic Cheating Assistance">Academic Cheating Assistance</option>
                  <option value="Spam / Commercial Unsolicited">Spam / Commercial Unsolicited</option>
                  <option value="Extreme Toxicity / Flame War">Extreme Toxicity / Flame War</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Detailed Description (Optional)</label>
                <textarea 
                  rows={3}
                  value={reportDesc} 
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Explain why this violates our academic community guidelines..."
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setReportingPost(null)}
                  className="px-3.5 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-500"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
