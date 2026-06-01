import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { userService, mediaService } from '../services/api';
import { updateCurrentUserProfile } from '../redux/authSlice';
import { Save, ChevronLeft, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(user?.profile?.coverUrl || '');
  const [skillsStr, setSkillsStr] = useState(user?.profile?.skills || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateLogoUpload = async (type: 'avatar' | 'cover') => {
    try {
      const res = await mediaService.uploadMedia(`${type}.jpg`, '');
      if (type === 'avatar') {
        setAvatarUrl(res.url);
      } else {
        setCoverUrl(res.url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    try {
      setIsSubmitting(true);
      const updated = await userService.updateProfile({
        fullName,
        bio,
        avatarUrl,
        coverUrl,
        skills: skillsStr,
      });
      dispatch(updateCurrentUserProfile(updated));
      navigate(`/profile/${user?.id}`);
    } catch (err) {
      console.error(err);
      alert('Save operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header back linkage */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-xs text-slate-500 hover:text-slate-900 mb-6 cursor-pointer font-semibold"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        <span>Back to Profile</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 border-b pb-3 mb-6 flex items-center">
          <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
          Update Identity Details
        </h2>

        <form onSubmit={handleSave} className="space-y-5 text-xs text-slate-700">
          {/* Dr. Name */}
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Dr./Prof./Mr./Ms. Preferred Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm text-slate-800 outline-none focus:border-yellow-500 font-sans"
            />
          </div>

          {/* Biography summary */}
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Biography / Research Background Summary</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell Gondar about your master plans, active lecture series, classes, or hobbies..."
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm text-slate-800 outline-none focus:border-yellow-500 resize-none font-sans"
            />
          </div>

          {/* Media Links Wrapper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 outline-none mb-2"
              />
              <button
                type="button"
                onClick={() => handleSimulateLogoUpload('avatar')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Simulate Avatar Upload</span>
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Profile Cover Banner URL</label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-850 outline-none mb-2"
              />
              <button
                type="button"
                onClick={() => handleSimulateLogoUpload('cover')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Simulate Cover Upload</span>
              </button>
            </div>
          </div>

          {/* Skills tags separated by comma */}
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Skills Tags (Comma-Separated)</label>
            <input
              type="text"
              placeholder="Python, Public Health, Research Analysis, Java, Teaching"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm text-slate-800 outline-none focus:border-yellow-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Separate skills using a standard comma (e.g., Python, C++, Pediatrics).</p>
          </div>

          {/* Submitting Trigger */}
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 text-xs shadow disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Deploy Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
