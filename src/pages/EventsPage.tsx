import React, { useState, useEffect } from 'react';
import { eventService } from '../services/api';
import { Event } from '../types';
import { CalendarDays, MapPin, UserCheck, Plus, Sparkles, Loader2, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Event Creation forms
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const list = await eventService.getEvents();
      setEvents(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRsvp = async (eventId: string, decision: 'YES' | 'MAYBE' | 'NO' | 'NONE') => {
    try {
      const res = await eventService.registerRsvp(eventId, decision);
      // Rehydrate local counters or simply match status
      setEvents(events.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            isRegistered: res.isRegistered,
          };
        }
        return ev;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !startDate) return;

    try {
      setIsPosting(true);
      const created = await eventService.createEvent({
        title,
        description,
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600',
      });

      setEvents([...events, {
        ...created,
        isRegistered: true,
        registrationsCount: 1
      }]);

      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setCoverUrl('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Event creation failed.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header and Title action layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">Campus Academic Calendar</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">RSVP to hackathons, medical forums, and official graduation alumni mixers.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Coordinate Event</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">No planned events.</p>
          <p className="text-xs">Establish the very first Gondar forum calendar entry!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(ev => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row justify-between"
            >
              {/* Cover visual representation card */}
              <div 
                className="w-full md:w-48 h-32 md:h-auto bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${ev.coverUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600'})` }} 
              />

              {/* Data block Column */}
              <div className="p-6 flex-1 flex flex-col justify-between font-sans">
                <div>
                  <h3 className="text-md font-bold text-slate-900 mb-1.5 flex items-center">
                    <Sparkles className="w-4 h-4 text-yellow-500 mr-1.5 animate-pulse" />
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {ev.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {new Date(ev.startDate).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {ev.location}
                    </span>
                  </div>
                </div>

                {/* RSVP control panel bottom */}
                <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                    RSVP Status:
                  </span>

                  <button
                    onClick={() => handleRsvp(ev.id, ev.isRegistered ? 'NONE' : 'YES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${ev.isRegistered ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{ev.isRegistered ? 'Registered (Leave)' : 'Register RSVP'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Creation event Modal backdrop */}
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
                <CalendarDays className="w-5 h-5 text-yellow-500" />
                <h3 className="text-md font-bold font-display text-white">Coordinate Academic Event</h3>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 font-sans">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Informatics Hackathon 2026 / Public Health Forum"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Brief Description</label>
                  <textarea
                    rows={3}
                    placeholder="Detail the agenda, speakers, refreshments, and coordinate targets..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Campus Physical Location / Zoom Link</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Informatics Main Hall, Maraki Campus"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-150 outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-150 outline-none focus:border-yellow-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-150 outline-none focus:border-yellow-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Banner Cover Image URL (Optional)</label>
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
                    <span>Deploy Calendar Event</span>
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
