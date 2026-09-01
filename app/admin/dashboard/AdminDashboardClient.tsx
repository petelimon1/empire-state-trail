'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mountain,
  Save,
  LogOut,
  MapPin,
  Settings,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  Activity,
  BookOpen,
  Camera,
  X,
  RefreshCw,
  Navigation,
  Zap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Link2Off,
} from 'lucide-react';
import { DAYS_DATA } from '@/lib/tripData';
import { cn } from '@/lib/utils';

interface TripStatus {
  current_day: number | null;
  garmin_livetrack_url: string | null;
}

interface LiveLocation {
  lat: number | null;
  lng: number | null;
  source: string | null;
  updated_at: string | null;
}

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface DaySection {
  expanded: boolean;
  diary: string;
  stravaId: string;
  saving: boolean;
  savingStrava: boolean;
  stravaMessage: string;
  uploading: boolean;
  uploadError: string;
  photos: Array<{ id: string; public_url: string; caption: string | null }>;
  comments: Comment[];
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [tripStatus, setTripStatus] = useState<TripStatus>({ current_day: null, garmin_livetrack_url: null });
  const [garminUrl, setGarminUrl] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | ''>('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [daySections, setDaySections] = useState<Record<number, DaySection>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{success?: boolean; changes?: string[]; error?: string} | null>(null);
  const [testActivityId, setTestActivityId] = useState('17832378893');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'loading' | 'active' | 'inactive' | 'error'>('loading');
  const [webhookWorking, setWebhookWorking] = useState(false);
  const [resettingTest, setResettingTest] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LiveLocation>({ lat: null, lng: null, source: null, updated_at: null });
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    fetchTripStatus();
    fetchLiveLocation();
    fetchWebhookStatus();
    // Initialize day sections
    const sections: Record<number, DaySection> = {};
    DAYS_DATA.forEach((day) => {
      sections[day.id] = {
        expanded: false,
        diary: '',
        stravaId: '',
        saving: false,
        savingStrava: false,
        stravaMessage: '',
        uploading: false,
        uploadError: '',
        photos: [],
        comments: [],
      };
    });
    setDaySections(sections);
  }, []);

  async function fetchLiveLocation() {
    try {
      const r = await fetch('/api/location', { cache: 'no-store' });
      const data = await r.json();
      setLiveLocation(data);
      if (data.lat != null) setManualLat(String(data.lat));
      if (data.lng != null) setManualLng(String(data.lng));
    } catch {}
  }

  async function handleSaveLocation() {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      setLocationMessage('Invalid coordinates');
      return;
    }
    setLocationSaving(true);
    setLocationMessage('');
    try {
      const r = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      if (r.ok) {
        setLocationMessage('Location saved!');
        await fetchLiveLocation();
        setTimeout(() => setLocationMessage(''), 3000);
      } else {
        const d = await r.json();
        setLocationMessage(d.error || 'Failed to save');
      }
    } catch {
      setLocationMessage('Error saving location');
    } finally {
      setLocationSaving(false);
    }
  }

  async function handleClearLocation() {
    if (!confirm('Clear the stored location? The live dot will disappear from the map.')) return;
    setLocationSaving(true);
    try {
      await fetch('/api/location', { method: 'DELETE' });
      setLiveLocation({ lat: null, lng: null, source: null, updated_at: null });
      setManualLat('');
      setManualLng('');
      setLocationMessage('Location cleared');
      setTimeout(() => setLocationMessage(''), 3000);
    } catch {
      setLocationMessage('Error clearing location');
    } finally {
      setLocationSaving(false);
    }
  }

  async function fetchTripStatus() {
    try {
      const r = await fetch('/api/trip-status');
      const data = await r.json();
      setTripStatus(data);
      setGarminUrl(data.garmin_livetrack_url || '');
      setSelectedDay(data.current_day || '');
    } catch (err) {
      console.error('Failed to fetch trip status:', err);
    }
  }

  async function handleSaveTripStatus() {
    setSavingStatus(true);
    setStatusMessage('');
    try {
      const r = await fetch('/api/trip-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_day: selectedDay === '' ? null : Number(selectedDay),
          garmin_livetrack_url: garminUrl || null,
        }),
      });
      if (r.ok) {
        setStatusMessage('Trip status updated!');
        await fetchTripStatus();
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        const data = await r.json();
        setStatusMessage(data.error || 'Failed to update');
      }
    } catch {
      setStatusMessage('Error updating trip status');
    } finally {
      setSavingStatus(false);
    }
  }

  async function toggleDaySection(dayId: number) {
    const section = daySections[dayId];
    if (!section) return;

    if (!section.expanded) {
      // Optimistically show as expanded while loading
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], expanded: true } }));

      // Load all data in parallel
      const [diaryData, photosData, dayData, commentsData] = await Promise.all([
        fetch(`/api/diary?dayId=${dayId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/photos?dayId=${dayId}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/days?dayId=${dayId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/comments?dayId=${dayId}`).then((r) => r.json()).catch(() => []),
      ]);

      setDaySections((prev) => ({
        ...prev,
        [dayId]: {
          ...prev[dayId],
          diary: diaryData?.content || '',
          stravaId: dayData?.strava_activity_id ? String(dayData.strava_activity_id) : '',
          photos: Array.isArray(photosData) ? photosData : [],
          comments: Array.isArray(commentsData) ? commentsData : [],
        },
      }));
    } else {
      setDaySections((prev) => ({
        ...prev,
        [dayId]: { ...prev[dayId], expanded: false },
      }));
    }
  }

  async function saveDiary(dayId: number) {
    const section = daySections[dayId];
    if (!section) return;

    setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], saving: true } }));
    try {
      await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, content: section.diary }),
      });
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], saving: false } }));
    } catch {
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], saving: false } }));
    }
  }

  async function handlePhotoUpload(dayId: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], uploading: true, uploadError: '' } }));

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dayId', String(dayId));

      try {
        const r = await fetch('/api/photos', { method: 'POST', body: formData });
        const data = await r.json();
        if (!r.ok) {
          setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], uploadError: data.error || 'Upload failed' } }));
          continue;
        }
        if (data.photo) {
          setDaySections((prev) => ({
            ...prev,
            [dayId]: {
              ...prev[dayId],
              photos: [...prev[dayId].photos, data.photo],
            },
          }));
        }
      } catch (err) {
        console.error('Upload error:', err);
        setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], uploadError: 'Upload failed — check your connection' } }));
      }
    }
    setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], uploading: false } }));
  }

  async function deletePhoto(dayId: number, photoId: string) {
    if (!confirm('Delete photo?')) return;
    try {
      await fetch(`/api/photos?id=${photoId}`, { method: 'DELETE' });
      setDaySections((prev) => ({
        ...prev,
        [dayId]: {
          ...prev[dayId],
          photos: prev[dayId].photos.filter((p) => p.id !== photoId),
        },
      }));
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  function updatePhotoCaption(dayId: number, photoId: string, caption: string) {
    setDaySections((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        photos: prev[dayId].photos.map((p) => (p.id === photoId ? { ...p, caption } : p)),
      },
    }));
  }

  async function savePhotoCaption(photoId: string, caption: string) {
    try {
      await fetch('/api/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photoId, caption }),
      });
    } catch (err) {
      console.error('Caption save error:', err);
    }
  }

  async function deleteComment(dayId: number, commentId: string) {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    try {
      const r = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (r.ok) {
        setDaySections((prev) => ({
          ...prev,
          [dayId]: {
            ...prev[dayId],
            comments: prev[dayId].comments.filter((c) => c.id !== commentId),
          },
        }));
      } else {
        const data = await r.json();
        alert('Failed to delete: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Delete request failed');
    }
  }

  async function handleUnlinkStrava(dayId: number) {
    if (!confirm('Unlink the Strava activity from this day? The activity stays on Strava — it just won\'t show on the site.')) return;
    setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], savingStrava: true, stravaMessage: '' } }));
    try {
      const r = await fetch('/api/trip-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, strava_activity_id: null }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || 'Failed');
      }
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], stravaId: '', stravaMessage: '✓ Strava activity unlinked' } }));
    } catch (err: any) {
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], stravaMessage: `Error: ${err.message}` } }));
    } finally {
      setDaySections((prev) => ({ ...prev, [dayId]: { ...prev[dayId], savingStrava: false } }));
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/admin', { method: 'DELETE' });
    router.push('/admin');
  }

  async function fetchWebhookStatus() {
    try {
      const r = await fetch('/api/strava/webhook-subscribe');
      if (!r.ok) { setWebhookStatus('error'); return; }
      const data = await r.json();
      setWebhookStatus(data.active ? 'active' : 'inactive');
    } catch {
      setWebhookStatus('error');
    }
  }

  async function handleWebhookSubscribe() {
    setWebhookWorking(true);
    try {
      const r = await fetch('/api/strava/webhook-subscribe', { method: 'POST' });
      const data = await r.json();
      if (r.ok) setWebhookStatus('active');
      else alert('Error: ' + JSON.stringify(data.error));
    } catch {
      alert('Request failed');
    } finally {
      setWebhookWorking(false);
    }
  }

  async function handleWebhookUnsubscribe() {
    if (!confirm('Remove the Strava webhook? Activities will no longer auto-link.')) return;
    setWebhookWorking(true);
    try {
      const r = await fetch('/api/strava/webhook-subscribe', { method: 'DELETE' });
      if (r.ok) setWebhookStatus('inactive');
      else alert('Failed to remove webhook');
    } catch {
      alert('Request failed');
    } finally {
      setWebhookWorking(false);
    }
  }

  async function handleResetTestDay() {
    if (!confirm('Reset the test day? This will clear the LiveTrack URL, Strava link, diary, and photos for the test slot.')) return;
    setResettingTest(true);
    try {
      const r = await fetch('/api/test-day/reset', { method: 'POST' });
      const data = await r.json();
      if (data.success) {
        alert('Test day cleared! Ready for a fresh test.');
        fetchTripStatus();
      } else {
        alert('Reset failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Reset request failed');
    } finally {
      setResettingTest(false);
    }
  }

  async function handleTestStrava() {
    if (!testActivityId) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const r = await fetch(`/api/strava/test?activityId=${testActivityId}`);
      const data = await r.json();
      setTestResult({ ok: r.ok, data });
    } catch {
      setTestResult({ ok: false, data: { error: 'Request failed' } });
    } finally {
      setTestLoading(false);
    }
  }

  async function handleSaveActivity() {
    if (!testActivityId) return;
    setSavingActivity(true);
    try {
      const r = await fetch('/api/strava/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: Number(testActivityId) }),
      });
      const data = await r.json();
      if (data.success) {
        alert(`✓ Activity saved to Day ${data.savedToDay}. Check the ${data.savedToDay === 99 ? '/test-day' : `/day/${data.savedToDay}`} page.`);
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Request failed');
    } finally {
      setSavingActivity(false);
    }
  }

  async function handleSyncDoc() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch('/api/sync-doc', { method: 'POST' });
      const data = await r.json();
      setSyncResult(data);
    } catch {
      setSyncResult({ error: 'Request failed' });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin nav */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-highland-purple/20 border border-highland-purple/30 flex items-center justify-center">
              <Mountain className="w-4 h-4 text-highland-purple" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 text-sm">Admin Dashboard</span>
              <span className="text-slate-600 text-xs ml-2">Empire State Trail 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Trip Status Panel */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-highland-purple/5">
            <Settings className="w-5 h-5 text-highland-purple" />
            <h2 className="font-display text-lg font-semibold text-slate-200">Trip Status</h2>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Active Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-highland-purple text-sm"
              >
                <option value="">— No active day (pre/post trip)</option>
                {DAYS_DATA.map((day) => (
                  <option key={day.id} value={day.id}>
                    Day {day.id} — {day.from_location} → {day.to_location} ({day.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Garmin LiveTrack URL
                <span className="text-slate-600 font-normal ml-2">
                  (set manually or via Zapier webhook)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={garminUrl}
                  onChange={(e) => setGarminUrl(e.target.value)}
                  placeholder="https://livetrack.garmin.com/session/..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-highland-purple text-sm"
                />
                {garminUrl && (
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={async () => {
                      if (!confirm('Remove the LiveTrack URL? The "Watch Pete Live" button will disappear from the site immediately.')) return;
                      setGarminUrl('');
                      setSavingStatus(true);
                      setStatusMessage('');
                      try {
                        const r = await fetch('/api/trip-status', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            current_day: selectedDay === '' ? null : Number(selectedDay),
                            garmin_livetrack_url: null,
                          }),
                        });
                        if (r.ok) {
                          setStatusMessage('LiveTrack URL removed');
                          await fetchTripStatus();
                          setTimeout(() => setStatusMessage(''), 3000);
                        }
                      } catch {
                        setStatusMessage('Error removing URL');
                      } finally {
                        setSavingStatus(false);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                    title="Remove LiveTrack URL"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveTripStatus}
                disabled={savingStatus}
                className="flex items-center gap-2 bg-highland-purple hover:bg-highland-purple-dark disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Save className="w-4 h-4" />
                {savingStatus ? 'Saving...' : 'Save Status'}
              </button>
              {statusMessage && (
                <span className={cn(
                  'text-sm',
                  statusMessage.includes('Error') || statusMessage.includes('Failed')
                    ? 'text-red-400'
                    : 'text-emerald-400'
                )}>
                  {statusMessage}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Live Location */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-blue-500/5">
            <Navigation className="w-5 h-5 text-blue-400" />
            <h2 className="font-display text-lg font-semibold text-slate-200">Live Location</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Current status */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 flex items-start gap-3">
              <div className={cn(
                'mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                liveLocation.lat != null ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'
              )} />
              <div>
                {liveLocation.lat != null ? (
                  <>
                    <p className="text-slate-200 text-sm font-medium">
                      {liveLocation.lat.toFixed(5)}, {liveLocation.lng?.toFixed(5)}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Source: <span className="text-blue-400">{liveLocation.source === 'garmin' ? 'Garmin LiveTrack KML' : 'Manual / iOS Shortcut'}</span>
                      {liveLocation.updated_at && (
                        <> · Updated {new Date(liveLocation.updated_at).toLocaleTimeString()}</>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">No live location — dot hidden from map</p>
                )}
              </div>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              <span className="text-slate-400 font-medium">Automatic:</span> When a Garmin LiveTrack URL is set above, the map fetches your position directly from the Garmin KML feed every 60 seconds — no extra steps needed.
              <br />
              <span className="text-slate-400 font-medium mt-1 block">Manual override:</span> Enter coordinates below (e.g. from Google Maps) or use the iOS Shortcut to ping your iPhone GPS.
            </p>

            {/* Manual coordinate input */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g. 42.6526"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g. -73.7562"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSaveLocation}
                disabled={locationSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {locationSaving ? 'Saving...' : 'Set Location'}
              </button>
              {liveLocation.lat != null && (
                <button
                  onClick={handleClearLocation}
                  disabled={locationSaving}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
              <button
                onClick={fetchLiveLocation}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              {locationMessage && (
                <span className={cn(
                  'text-sm',
                  locationMessage.includes('Error') || locationMessage.includes('Failed') || locationMessage.includes('Invalid')
                    ? 'text-red-400'
                    : 'text-emerald-400'
                )}>
                  {locationMessage}
                </span>
              )}
            </div>

            {/* iOS Shortcut instructions */}
            <details className="group">
              <summary className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer select-none transition-colors">
                iOS Shortcut setup (fallback if Garmin KML doesn't work) ›
              </summary>
              <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2 text-xs text-slate-400">
                <p>1. Open <strong className="text-slate-300">Shortcuts</strong> on your iPhone → tap <strong className="text-slate-300">+</strong></p>
                <p>2. Add action: <strong className="text-slate-300">Get Current Location</strong></p>
                <p>3. Add action: <strong className="text-slate-300">Get Dictionary from Input</strong> (to extract lat/lng)</p>
                <p>4. Add action: <strong className="text-slate-300">URL</strong> → set to your site URL + <code className="bg-slate-800 px-1 rounded">/api/location</code></p>
                <p>5. Add action: <strong className="text-slate-300">Get Contents of URL</strong> → Method: POST, Body: JSON</p>
                <p className="font-mono bg-slate-800 rounded p-2 text-slate-300">
                  {`{ "lat": [Latitude], "lng": [Longitude], "secret": "YOUR_GARMIN_WEBHOOK_SECRET" }`}
                </p>
                <p>6. Add an <strong className="text-slate-300">Automation</strong>: Time of Day, every 10 minutes, 7am–7pm, run the shortcut</p>
              </div>
            </details>
          </div>
        </section>

        {/* Google Doc Sync */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-highland-green/5">
            <BookOpen className="w-5 h-5 text-highland-green" />
            <h2 className="font-display text-lg font-semibold text-slate-200">Sync from Google Doc</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-400 text-sm">
              Re-reads your planning Google Doc and updates accommodation details, dinner options, and resupply notes for each day.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncDoc}
                disabled={syncing}
                className="flex items-center gap-2 bg-highland-green hover:bg-emerald-500 disabled:opacity-50 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
            {syncResult && (
              <div className={cn(
                'rounded-xl p-4 text-sm space-y-2',
                syncResult.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
              )}>
                {syncResult.error ? (
                  <p className="text-red-400">{syncResult.error}</p>
                ) : (
                  <>
                    <p className="text-emerald-400 font-medium">✓ Synced {syncResult.changes?.length} day(s)</p>
                    {syncResult.changes?.map((c, i) => (
                      <p key={i} className="text-slate-400">{c}</p>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Automation */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-yellow-500/5">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="font-display text-lg font-semibold text-slate-200">Automation</h2>
            <span className="ml-auto text-xs text-slate-600">Set up once before the trip</span>
          </div>

          <div className="divide-y divide-slate-800">

            {/* Strava auto-link */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <h3 className="text-slate-200 font-medium text-sm">Strava Activity Auto-Link</h3>
                    {webhookStatus === 'loading' && (
                      <span className="text-slate-600 text-xs">Checking...</span>
                    )}
                    {webhookStatus === 'active' && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                    {webhookStatus === 'inactive' && (
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Not subscribed
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    When you finish a day's ride, Garmin syncs to Strava automatically. This webhook tells Strava to notify your site — the activity is then matched to the correct day by date, no manual steps needed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {webhookStatus !== 'active' ? (
                  <button
                    onClick={handleWebhookSubscribe}
                    disabled={webhookWorking}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {webhookWorking ? 'Subscribing...' : 'Subscribe to Strava Webhook'}
                  </button>
                ) : (
                  <button
                    onClick={handleWebhookUnsubscribe}
                    disabled={webhookWorking}
                    className="text-slate-500 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
                  >
                    {webhookWorking ? 'Removing...' : 'Remove subscription'}
                  </button>
                )}
                <button onClick={fetchWebhookStatus} className="text-slate-600 hover:text-slate-400 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {webhookStatus === 'active' && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400 space-y-1">
                  <p className="font-medium">✓ Ready — no action needed each day</p>
                  <p className="text-emerald-500/80">Finish your ride → Garmin syncs to Strava → activity appears on the day page automatically within ~5 minutes.</p>
                </div>
              )}
            </div>

            {/* Garmin LiveTrack */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-blue-400" />
                <h3 className="text-slate-200 font-medium text-sm">Garmin LiveTrack Auto-Post</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                When you start an activity with LiveTrack enabled, Garmin emails you the LiveTrack link. Zapier (free) watches for that email and posts the URL to your site automatically.
              </p>

              <details className="group">
                <summary className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer select-none transition-colors font-medium">
                  Zapier setup instructions (one-time) ›
                </summary>
                <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3 text-xs text-slate-400">
                  <p className="text-slate-300 font-medium">Step 1 — Garmin (one-time)</p>
                  <p>Open <strong className="text-slate-300">Garmin Connect Mobile</strong> → Menu → Settings → <strong className="text-slate-300">LiveTrack</strong> → turn on <strong className="text-slate-300">Auto-Start</strong>. LiveTrack will now start whenever you begin a recorded activity.</p>

                  <p className="text-slate-300 font-medium mt-2">Step 2 — Zapier (free, one-time)</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    <li>Go to <strong className="text-slate-300">zapier.com</strong> → Create Zap</li>
                    <li>Trigger: <strong className="text-slate-300">Gmail → New Email</strong></li>
                    <li>Filter: From = <code className="bg-slate-800 px-1 rounded">noreply@connect.garmin.com</code>, Subject contains <code className="bg-slate-800 px-1 rounded">LiveTrack</code></li>
                    <li>Add step: <strong className="text-slate-300">Formatter → Text → Extract URL</strong> from email body (picks out the livetrack.garmin.com link)</li>
                    <li>Add step: <strong className="text-slate-300">Webhooks by Zapier → POST</strong></li>
                    <li>URL: <code className="bg-slate-800 px-1 rounded text-blue-400 break-all">https://YOUR-SITE.netlify.app/api/garmin/webhook</code></li>
                    <li>Payload type: <strong className="text-slate-300">JSON</strong></li>
                    <li>Data: <code className="bg-slate-800 px-1 rounded">livetrack_url</code> → the extracted URL from step 4</li>
                    <li>Header: <code className="bg-slate-800 px-1 rounded">x-webhook-secret</code> → your <code className="bg-slate-800 px-1 rounded">GARMIN_WEBHOOK_SECRET</code> value from Netlify env vars</li>
                  </ol>

                  <div className="mt-2 rounded-lg bg-slate-800/80 p-3 space-y-1">
                    <p className="text-slate-300 font-medium">Result each day:</p>
                    <p>Start ride → Garmin sends email → Zapier triggers in ~2 min → LiveTrack link appears on site. Viewers see the live tracking button on the day page automatically.</p>
                  </div>
                </div>
              </details>

              <details className="group">
                <summary className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer select-none transition-colors">
                  Manual fallback (iOS Shortcut) ›
                </summary>
                <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2 text-xs text-slate-400">
                  <p>If Zapier isn't set up, you can paste the LiveTrack URL directly into the <strong className="text-slate-300">Garmin LiveTrack URL</strong> field in the Trip Status section above — just copy it from the Garmin Connect app when your activity starts.</p>
                  <p className="text-slate-500">The LiveTrack URL looks like: <code className="bg-slate-800 px-1 rounded">https://livetrack.garmin.com/session/...</code></p>
                </div>
              </details>
            </div>

          </div>
        </section>

        {/* Strava Test Panel */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800 bg-orange-500/5">
            <Activity className="w-5 h-5 text-orange-400" />
            <h2 className="font-display text-lg font-semibold text-slate-200">Strava Connection Test</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-400 text-sm">
              Enter a Strava activity ID to verify your API credentials are working. Use this to confirm an activity will load correctly before linking it to a day.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testActivityId}
                onChange={(e) => setTestActivityId(e.target.value)}
                placeholder="e.g. 17832378893"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 text-sm font-mono"
              />
              <button
                onClick={handleTestStrava}
                disabled={testLoading || !testActivityId}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Activity className={cn('w-4 h-4', testLoading && 'animate-pulse')} />
                {testLoading ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={handleSaveActivity}
                disabled={savingActivity || !testActivityId}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Save className={cn('w-4 h-4', savingActivity && 'animate-pulse')} />
                {savingActivity ? 'Saving...' : 'Save to Day'}
              </button>
            </div>

            {testResult && (
              <div className={cn(
                'rounded-xl p-4 space-y-3 text-sm',
                testResult.ok
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              )}>
                {testResult.ok ? (
                  <>
                    <p className="text-emerald-400 font-semibold">✓ Strava API connected successfully</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-slate-300">
                      {testResult.data.name && (
                        <div className="col-span-2">
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Activity</span>
                          <p className="font-medium mt-0.5">{testResult.data.name}</p>
                        </div>
                      )}
                      {testResult.data.type && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Type</span>
                          <p className="mt-0.5">{testResult.data.type}</p>
                        </div>
                      )}
                      {testResult.data.distance != null && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Distance</span>
                          <p className="mt-0.5">{(testResult.data.distance / 1000).toFixed(2)} km</p>
                        </div>
                      )}
                      {testResult.data.moving_time != null && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Moving Time</span>
                          <p className="mt-0.5">
                            {Math.floor(testResult.data.moving_time / 3600)}h {Math.floor((testResult.data.moving_time % 3600) / 60)}m
                          </p>
                        </div>
                      )}
                      {testResult.data.total_elevation_gain != null && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Elevation Gain</span>
                          <p className="mt-0.5">{testResult.data.total_elevation_gain} m</p>
                        </div>
                      )}
                      {testResult.data.start_date_local && (
                        <div>
                          <span className="text-slate-500 text-xs uppercase tracking-wider">Date</span>
                          <p className="mt-0.5">{new Date(testResult.data.start_date_local).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-red-400">{testResult.data.error || 'Unknown error'}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Test Day Reset */}
        <section>
          <h2 className="font-display text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-400" />
            Test Day
          </h2>
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-300 text-sm font-medium">Reset test slot</p>
              <p className="text-slate-500 text-xs mt-0.5">Clears LiveTrack URL, Strava link, diary, and photos so you can run a clean end-to-end test.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/test-day"
                target="_blank"
                className="text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2 whitespace-nowrap"
              >
                View test page ↗
              </a>
              <button
                onClick={handleResetTestDay}
                disabled={resettingTest}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <RefreshCw className={cn('w-4 h-4', resettingTest && 'animate-spin')} />
                {resettingTest ? 'Resetting...' : 'Reset Test Day'}
              </button>
            </div>
          </div>
        </section>

        {/* Per-day management */}
        <section>
          <h2 className="font-display text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-highland-purple" />
            Day Management
          </h2>

          <div className="space-y-3">
            {DAYS_DATA.map((day) => {
              const section = daySections[day.id];
              if (!section) return null;

              return (
                <div key={day.id} className="glass-card rounded-xl overflow-hidden border border-slate-700/50">
                  {/* Day header / toggle */}
                  <button
                    onClick={() => toggleDaySection(day.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-highland-purple/20 flex items-center justify-center text-highland-purple font-bold text-sm">
                        {day.id}
                      </div>
                      <div>
                        <div className="text-slate-200 font-medium text-sm">
                          {day.from_location} → {day.to_location}
                        </div>
                        <div className="text-slate-500 text-xs">{day.date} · {day.distance_km}km</div>
                      </div>
                    </div>
                    {section.expanded
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />
                    }
                  </button>

                  {section.expanded && (
                    <div className="border-t border-slate-800 px-5 py-5 space-y-6">

                      {/* Strava Activity ID */}
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
                          <Activity className="w-4 h-4 text-orange-400" />
                          Strava Activity
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={section.stravaId}
                            onChange={(e) =>
                              setDaySections((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], stravaId: e.target.value },
                              }))
                            }
                            placeholder="e.g. 12345678901"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-highland-purple text-sm font-mono"
                          />
                          <button
                            type="button"
                            disabled={section.savingStrava}
                            onClick={async () => {
                              setDaySections((prev) => ({ ...prev, [day.id]: { ...prev[day.id], savingStrava: true, stravaMessage: '' } }));
                              try {
                                const r = await fetch('/api/trip-status', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    dayId: day.id,
                                    strava_activity_id: section.stravaId || null,
                                  }),
                                });
                                const data = await r.json();
                                if (!r.ok) throw new Error(data.error || 'Save failed');
                                const resolvedId = data.resolved_id || section.stravaId;
                                setDaySections((prev) => ({ ...prev, [day.id]: { ...prev[day.id], stravaId: resolvedId, stravaMessage: `✓ Saved as ID: ${resolvedId}` } }));
                              } catch (err: any) {
                                setDaySections((prev) => ({ ...prev, [day.id]: { ...prev[day.id], stravaMessage: `Error: ${err.message}` } }));
                              } finally {
                                setDaySections((prev) => ({ ...prev, [day.id]: { ...prev[day.id], savingStrava: false } }));
                              }
                            }}
                            className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {section.savingStrava ? 'Saving…' : 'Save'}
                          </button>
                          {section.stravaId && (
                            <button
                              type="button"
                              disabled={section.savingStrava}
                              onClick={() => handleUnlinkStrava(day.id)}
                              title="Remove the Strava activity link from this day"
                              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                              Unlink
                            </button>
                          )}
                        </div>
                        {section.stravaMessage && (
                          <p className={`text-xs mt-1 ${section.stravaMessage.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {section.stravaMessage}
                          </p>
                        )}
                        <p className="text-slate-600 text-xs mt-1">
                          Paste a numeric ID, strava.com/activities/… URL, or strava.app.link share link — resolved automatically on save.
                        </p>
                      </div>

                      {/* Diary Entry */}
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
                          <BookOpen className="w-4 h-4 text-highland-purple" />
                          Trail Diary Entry
                        </label>
                        <textarea
                          value={section.diary}
                          onChange={(e) =>
                            setDaySections((prev) => ({
                              ...prev,
                              [day.id]: { ...prev[day.id], diary: e.target.value },
                            }))
                          }
                          rows={8}
                          placeholder="Write the diary entry for this day..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-highland-purple text-sm resize-y"
                        />
                        <button
                          onClick={() => saveDiary(day.id)}
                          disabled={section.saving}
                          className="mt-2 flex items-center gap-2 bg-highland-purple/20 hover:bg-highland-purple/30 border border-highland-purple/30 text-highland-purple px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {section.saving ? 'Saving...' : 'Save Diary'}
                        </button>
                      </div>

                      {/* Photos */}
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-3">
                          <Camera className="w-4 h-4 text-blue-400" />
                          Photos
                        </label>

                        {/* Upload zone */}
                        <label
                          htmlFor={`admin-photo-${day.id}`}
                          className="block border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-4 text-center cursor-pointer transition-colors mb-3"
                        >
                          <input
                            id={`admin-photo-${day.id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(day.id, e.target.files)}
                          />
                          <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                          <p className="text-slate-500 text-sm">
                            {section.uploading ? 'Uploading...' : 'Click to upload photos'}
                          </p>
                        </label>

                        {section.uploadError && (
                          <p className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            Upload failed: {section.uploadError}
                          </p>
                        )}

                        {/* Photo grid */}
                        {section.photos.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {section.photos.map((photo) => (
                              <div key={photo.id} className="rounded-lg overflow-hidden bg-slate-900/60">
                                <div className="relative aspect-square group">
                                  <img
                                    src={photo.public_url}
                                    alt="Uploaded photo"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => deletePhoto(day.id, photo.id)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={photo.caption || ''}
                                  onChange={(e) => updatePhotoCaption(day.id, photo.id, e.target.value)}
                                  onBlur={(e) => savePhotoCaption(photo.id, e.target.value)}
                                  placeholder="Caption..."
                                  className="w-full bg-slate-900 text-slate-300 placeholder-slate-600 text-xs px-1.5 py-1 outline-none border-t border-slate-800 focus:bg-slate-800"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-600 text-sm">No photos uploaded yet</p>
                        )}
                      </div>

                      {/* Comments */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                            <MessageSquare className="w-4 h-4 text-highland-purple" />
                            Comments
                            {section.comments.length > 0 && (
                              <span className="text-slate-500 font-normal">({section.comments.length})</span>
                            )}
                          </label>
                          <button
                            onClick={async () => {
                              const data = await fetch(`/api/comments?dayId=${day.id}`).then((r) => r.json()).catch(() => []);
                              setDaySections((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], comments: Array.isArray(data) ? data : [] },
                              }));
                            }}
                            className="text-slate-600 hover:text-slate-400 transition-colors"
                            title="Refresh comments"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {section.comments.length === 0 ? (
                          <p className="text-slate-600 text-sm">No comments yet</p>
                        ) : (
                          <div className="space-y-2">
                            {section.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="flex items-start gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 group"
                              >
                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-slate-400 text-xs font-medium">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-slate-300 text-sm font-medium">{comment.user_name}</span>
                                    <span className="text-slate-600 text-xs">
                                      {new Date(comment.created_at).toLocaleString('en-GB', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm mt-0.5 break-words">{comment.content}</p>
                                </div>
                                <button
                                  onClick={() => deleteComment(day.id, comment.id)}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 rounded"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View day link */}
                      <div>
                        <Link
                          href={`/day/${day.id}`}
                          className="text-highland-purple hover:text-purple-400 text-sm transition-colors"
                          target="_blank"
                        >
                          View Day {day.id} page →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
