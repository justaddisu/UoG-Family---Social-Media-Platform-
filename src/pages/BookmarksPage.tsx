import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import { Post } from '../types';
import { Bookmark, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function BookmarksPage() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const list = await postService.getBookmarks();
      setBookmarkedPosts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      await postService.toggleBookmark(postId);
      setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center space-x-2.5 mb-6">
        <Bookmark className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-bold text-slate-900 font-display">Personal Bookmarks Shelf</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-slate-250 rounded-xl" />
          ))}
        </div>
      ) : bookmarkedPosts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold">No bookmarks saved yet.</p>
          <p className="text-xs text-slate-400">Click the bookmark tag on the campus feed notices to pin them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedPosts.map(post => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex justify-between items-start"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-800">
                    {post.author?.profile?.fullName}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">{post.author?.profile?.department}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans mt-1">
                  {post.content}
                </p>
                {post.media && post.media.length > 0 && (
                  <img 
                    src={post.media[0].url} 
                    alt="pinned source" 
                    referrerPolicy="no-referrer"
                    className="max-h-40 rounded border mt-2"
                  />
                )}
              </div>

              <button 
                onClick={() => handleRemoveBookmark(post.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                title="Remove Bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
