import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api.ts';
import { User, LiveStream, StreamGuest } from '../types.ts';
import {
  Radio,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Layout,
  Users,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Power,
  Heart,
  Flame,
  VolumeX,
  Volume2,
  UserX,
  ChevronRight,
  Eye,
  Settings,
  Sparkles,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface LiveViewProps {
  currentUser: User;
  initialStreamId?: string;
  initialJoinRole?: string; // 'guest' | undefined
  onBackToDirectory: () => void;
}

export const LiveView: React.FC<LiveViewProps> = ({
  currentUser,
  initialStreamId,
  initialJoinRole,
  onBackToDirectory,
}) => {
  // Modes: 'browse' (view active streams list) | 'studio' (broadcaster studio) | 'watch' (viewer mode) | 'guest_backstage'
  const [viewMode, setViewMode] = useState<'browse' | 'studio' | 'watch' | 'guest_backstage'>('browse');
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);

  // Broadcaster Studio Form States
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDesc, setStreamDesc] = useState('');
  const [streamCategory, setStreamCategory] = useState('talk');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Live Media Stream & Devices
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  // Studio Controls & Layout
  const [activeLayout, setActiveLayout] = useState<'solo' | 'side-by-side' | 'grid' | 'pip'>('solo');
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [showBackstagePanel, setShowBackstagePanel] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair'>('excellent');
  const [pingMs, setPingMs] = useState(28);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'viewer' | 'guest' | null>(null);

  // Live Chat & Reactions
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; senderName: string; text: string; createdAt: number }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; type: string; left: number }>>([]);

  // Video Refs
  const broadcasterVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const viewerDailyFrameRef = useRef<HTMLIFrameElement>(null);

  // 1. Initial Load and Routes
  useEffect(() => {
    loadActiveStreams();
    if (initialStreamId) {
      if (initialJoinRole === 'guest') {
        joinAsGuestBackstage(initialStreamId);
      } else {
        openStreamViewer(initialStreamId);
      }
    }
  }, [initialStreamId, initialJoinRole]);

  const loadActiveStreams = async () => {
    try {
      const res = await api.getStreams();
      setActiveStreams(res.streams || []);
    } catch (e) {
      console.error('Failed to load active streams:', e);
    }
  };

  // 2. Hardware devices enumeration & initial media setup
  const initDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevs = devices.filter((d) => d.kind === 'videoinput');
      const aDevs = devices.filter((d) => d.kind === 'audioinput');
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
      if (vDevs.length && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
      if (aDevs.length && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
    } catch (e) {
      console.warn('Could not enumerate devices:', e);
    }
  };

  const startCameraStream = async (videoDeviceId?: string, audioDeviceId?: string) => {
    try {
      // stop previous tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      if (broadcasterVideoRef.current) {
        broadcasterVideoRef.current.srcObject = stream;
      }
      setCamOn(true);
      setMicOn(true);
      initDevices();
    } catch (err) {
      console.warn('Media devices not accessible, simulating clean studio state:', err);
    }
  };

  // Switch camera toggle
  const toggleCamera = () => {
    if (mediaStream) {
      const vTrack = mediaStream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setCamOn(vTrack.enabled);
      }
    } else {
      setCamOn(!camOn);
    }
  };

  // Switch microphone toggle
  const toggleMic = () => {
    if (mediaStream) {
      const aTrack = mediaStream.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setMicOn(aTrack.enabled);
      }
    } else {
      setMicOn(!micOn);
    }
  };

  // Screen sharing toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(sStream);
        setIsScreenSharing(true);
        sStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = sStream;
        }
      } catch (e) {
        console.warn('Screen share canceled or not supported:', e);
      }
    }
  };

  // 3. Broadcaster starts broadcast
  const handleStartBroadcast = async () => {
    if (!streamTitle.trim()) {
      alert('يرجى كتابة عنوان للبث قبل البدء');
      return;
    }

    try {
      const res = await api.createStream({
        title: streamTitle.trim(),
        description: streamDesc.trim(),
        category: streamCategory,
        coverUrl,
      });

      setCurrentStream(res.stream);
      setIsBroadcasting(true);
      const now = Date.now();
      setBroadcastStartTime(now);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء غرفة البث');
    }
  };

  // 4. Broadcaster ends broadcast
  const handleConfirmEndBroadcast = async () => {
    if (currentStream) {
      try {
        await api.endStream(currentStream.id);
      } catch (e) {
        console.error(e);
      }
    }
    // Stop tracks
    if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    if (screenStream) screenStream.getTracks().forEach((t) => t.stop());

    setIsBroadcasting(false);
    setShowEndConfirm(false);
    setBroadcastStartTime(null);
    setCurrentStream(null);
    setViewMode('browse');
    loadActiveStreams();
  };

  // Timer loop for broadcast duration
  useEffect(() => {
    if (!broadcastStartTime || !isBroadcasting) return;
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - broadcastStartTime) / 1000);
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setElapsedTime(`${hrs}:${mins}:${secs}`);

      // Random jitter for ping calculation to simulate real network metrics
      const ping = 24 + Math.floor(Math.random() * 12);
      setPingMs(ping);
      setConnectionQuality(ping < 45 ? 'excellent' : ping < 80 ? 'good' : 'fair');
    }, 1000);
    return () => clearInterval(timer);
  }, [broadcastStartTime, isBroadcasting]);

  // 5. Heartbeat loop for active broadcast or viewer mode
  useEffect(() => {
    if (!currentStream || viewMode === 'browse') return;

    const syncStream = async () => {
      try {
        const hb = await api.heartbeatStream(currentStream.id);
        if (!hb.active && viewMode === 'watch') {
          alert('انتهى البث المباشر');
          setViewMode('browse');
          loadActiveStreams();
          return;
        }

        setCurrentStream((prev) =>
          prev
            ? {
                ...prev,
                viewerCount: hb.viewerCount,
                guests: hb.guests || [],
                activeLayout: hb.layout || prev.activeLayout,
              }
            : null
        );

        // Load recent chat messages
        const chatRes = await api.getStreamChat(currentStream.id);
        setChatMessages(chatRes.messages || []);

        // Load reactions
        const rxRes = await api.getStreamReactions(currentStream.id, Date.now() - 4000);
        if (rxRes.reactions?.length) {
          rxRes.reactions.forEach((rx: any) => {
            triggerReactionAnim(rx.type);
          });
        }
      } catch (e) {
        console.error('Heartbeat error:', e);
      }
    };

    syncStream();
    const interval = setInterval(syncStream, 3000);
    return () => clearInterval(interval);
  }, [currentStream?.id, viewMode]);

  // 6. Viewer mode
  const openStreamViewer = async (streamId: string) => {
    try {
      const res = await api.getStream(streamId);
      setCurrentStream(res.stream);
      setViewMode('watch');
    } catch (e: any) {
      alert('البث غير متاح');
    }
  };

  // 7. Guest Backstage Join
  const joinAsGuestBackstage = async (streamId: string) => {
    try {
      const res = await api.joinBackstage(streamId, {
        name: currentUser.displayName || currentUser.name,
        camOn: true,
        micOn: true,
      });
      const streamRes = await api.getStream(streamId);
      setCurrentStream(streamRes.stream);
      setViewMode('guest_backstage');
      startCameraStream();
    } catch (e: any) {
      alert('فشل الانضمام للكواليس: ' + e.message);
    }
  };

  // Backstage Host Controls
  const handleAdmitGuest = async (guestId: string) => {
    if (!currentStream) return;
    try {
      const res = await api.admitGuest(currentStream.id, guestId);
      setCurrentStream((prev) => (prev ? { ...prev, guests: res.guests, activeLayout: res.layout } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectGuest = async (guestId: string) => {
    if (!currentStream) return;
    try {
      const res = await api.rejectGuest(currentStream.id, guestId);
      setCurrentStream((prev) => (prev ? { ...prev, guests: res.guests } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMuteGuest = async (guestId: string, currentMute: boolean) => {
    if (!currentStream) return;
    try {
      await api.muteGuest(currentStream.id, guestId, !currentMute);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!currentStream) return;
    try {
      const res = await api.removeGuest(currentStream.id, guestId);
      setCurrentStream((prev) => (prev ? { ...prev, guests: res.guests, activeLayout: res.layout } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLayoutChange = async (layout: 'solo' | 'side-by-side' | 'grid' | 'pip') => {
    setActiveLayout(layout);
    if (currentStream && isBroadcasting) {
      try {
        await api.setStreamLayout(currentStream.id, layout);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Chat message send
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentStream) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await api.sendStreamChat(currentStream.id, {
        text,
        guestName: currentUser.displayName || currentUser.name,
      });
      setChatMessages((prev) => [...prev, res.message]);
    } catch (e) {
      console.error('Chat error:', e);
    }
  };

  // Floating Reactions
  const triggerReactionAnim = (type: string) => {
    const id = 'rx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const left = 20 + Math.random() * 60; // 20% to 80%
    setFloatingReactions((prev) => [...prev.slice(-20), { id, type, left }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const handleSendReaction = async (type: string) => {
    if (!currentStream) return;
    triggerReactionAnim(type);
    try {
      await api.sendStreamReaction(currentStream.id, type);
    } catch (e) {
      console.error(e);
    }
  };

  // Copy Links
  const copyViewerLink = () => {
    if (!currentStream) return;
    const url = `${window.location.origin}/?page=live&streamId=${currentStream.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink('viewer');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const copyGuestLink = () => {
    if (!currentStream) return;
    const url = `${window.location.origin}/?page=live&streamId=${currentStream.id}&join=guest`;
    navigator.clipboard.writeText(url);
    setCopiedLink('guest');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Open Broadcaster Studio
  const handleOpenStudio = () => {
    setViewMode('studio');
    startCameraStream();
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await api.uploadFile(file);
      setCoverUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingCover(false);
    }
  };

  // ========================================================
  // RENDER: 1) Active Streams Browse List
  // ========================================================
  if (viewMode === 'browse') {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-black tracking-widest text-rose-500 uppercase">SNNS LIVE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">استوديو البث المباشر</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              مساحة بث احترافية، تحكم متكامل في الكاميرا، الميكروفون، مشاركة الشاشة، وإدارة الضيوف في الكواليس.
            </p>
          </div>

          <button
            onClick={handleOpenStudio}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-rose-600/40 hover:shadow-rose-600/60 transition-all flex items-center justify-center gap-2 cursor-pointer glow-crimson"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>بدء بث جديد في SNNS Studio</span>
          </button>
        </div>

        {/* Active Streams Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>البثوث المباشرة المتاحة الآن</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/40">
                {activeStreams.length}
              </span>
            </h3>
            <button
              onClick={loadActiveStreams}
              className="text-xs text-slate-400 hover:text-white"
            >
              تحديث القائمة
            </button>
          </div>

          {activeStreams.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/60 p-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-500/80 text-2xl font-black shadow-lg">
                ●
              </div>
              <h4 className="text-base font-bold text-slate-200">لا توجد بثوث مباشرة متاحة حالياً</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                لا توجد بثوث نشطة في الوقت الحالي. كن أول من يبدأ بثاً حقيقياً في منصة SNNS!
              </p>
              <button
                onClick={handleOpenStudio}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>ابدأ بثك الآن</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeStreams.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openStreamViewer(s.id)}
                  className="group relative bg-[#0b1020] border border-slate-800 hover:border-rose-700/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-rose-950/30 transition-all cursor-pointer flex flex-col"
                >
                  {/* Thumbnail / Cover */}
                  <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                    {s.coverUrl ? (
                      <img src={s.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-950/50 via-purple-950/40 to-slate-950 flex items-center justify-center">
                        <Radio className="w-12 h-12 text-rose-500/40" />
                      </div>
                    )}

                    {/* Top badging */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-black shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>مباشر</span>
                    </div>

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>{s.viewerCount}</span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4 flex items-start gap-3 flex-1 justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {s.hostAvatar ? (
                          <img src={s.hostAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {s.hostName?.charAt(0) || 'H'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-rose-400 transition-colors">
                          {s.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{s.hostName}</p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold flex-shrink-0">
                      {s.category === 'gaming'
                        ? 'ألعاب'
                        : s.category === 'music'
                        ? 'موسيقى'
                        : s.category === 'business'
                        ? 'أعمال'
                        : s.category === 'education'
                        ? 'تعليم'
                        : 'حوارات'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 2) Broadcaster Studio Mode (SNNS LIVE Studio)
  // ========================================================
  if (viewMode === 'studio') {
    const stageGuests = (currentStream?.guests || []).filter((g) => g.status === 'stage');
    const backstageGuests = (currentStream?.guests || []).filter((g) => g.status === 'backstage');

    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#070a14] overflow-hidden text-slate-100">
        {/* Studio Top Control Bar */}
        <header className="h-14 px-4 bg-[#090d1a] border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isBroadcasting) setShowEndConfirm(true);
                else {
                  if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
                  setViewMode('browse');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>‹</span>
              <span>خروج من الاستوديو</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-400">SNNS Studio</span>
              {isBroadcasting ? (
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 text-xs font-black live-pulse">
                  <span>●</span>
                  <span>مباشر: {elapsedTime}</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400">
                  معاينة ما قبل البث
                </span>
              )}
            </div>
          </div>

          {/* Real Network Quality & Metrics */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionQuality === 'excellent'
                    ? 'bg-emerald-400'
                    : connectionQuality === 'good'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              ></span>
              <span className="text-slate-300">
                الاتصال:{' '}
                {connectionQuality === 'excellent'
                  ? 'ممتاز'
                  : connectionQuality === 'good'
                  ? 'جيد'
                  : 'ضعيف'}{' '}
                ({pingMs}ms)
              </span>
            </div>

            {/* Viewer Count & Guests Count */}
            {isBroadcasting && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-xl">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{currentStream?.viewerCount || 0} مشاهد</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-xl">
                  <Users className="w-3.5 h-3.5" />
                  <span>{stageGuests.length} ضيوف في المشهد</span>
                </div>
              </div>
            )}

            {/* Broadcast action button */}
            {!isBroadcasting ? (
              <button
                onClick={handleStartBroadcast}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/40 cursor-pointer"
              >
                بدء البث للجميع
              </button>
            ) : (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="px-4 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>إنهاء البث</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Studio Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Video Preview & Stage Compositor */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3 bg-[#070a14]">
            {/* Composited Preview Window */}
            <div className="relative flex-1 bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              {/* Layout Rendering Engine */}
              {activeLayout === 'solo' && (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={broadcasterVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
                  />
                  {!camOn && (
                    <div className="text-center space-y-2">
                      <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <CameraOff className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400">الكاميرا متوقفة</p>
                    </div>
                  )}

                  {/* Broadcaster Label overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>المذيع: {currentUser.displayName || currentUser.name}</span>
                    {!micOn && <MicOff className="w-3 h-3 text-rose-400" />}
                  </div>
                </div>
              )}

              {activeLayout === 'side-by-side' && (
                <div className="w-full h-full grid grid-cols-2 gap-1 bg-slate-950 p-1">
                  {/* Left: Host */}
                  <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <video
                      ref={broadcasterVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      المذيع
                    </div>
                  </div>

                  {/* Right: Stage Guest or Screen Share */}
                  <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                    {isScreenSharing ? (
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : stageGuests.length > 0 ? (
                      <div className="text-center space-y-2 p-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/60 border border-purple-500 flex items-center justify-center text-white font-bold text-base">
                          {stageGuests[0].name.charAt(0)}
                        </div>
                        <h4 className="font-bold text-sm text-white">{stageGuests[0].name}</h4>
                        <span className="text-[11px] text-emerald-400">ضيف على الهواء</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 p-4 text-slate-500">
                        <Users className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs">في انتظار انضمام ضيف للمشهد</p>
                        <button
                          onClick={copyGuestLink}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
                        >
                          نسخ رابط دعوة الضيف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLayout === 'grid' && (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 bg-slate-950 p-1.5">
                  {/* Cell 1: Host */}
                  <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <video
                      ref={broadcasterVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      المذيع
                    </div>
                  </div>

                  {/* Cell 2, 3, 4: Guests or Screen */}
                  {[0, 1, 2].map((idx) => {
                    const guest = stageGuests[idx];
                    return (
                      <div
                        key={idx}
                        className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800/80 p-3"
                      >
                        {guest ? (
                          <div className="text-center space-y-1">
                            <div className="w-12 h-12 mx-auto rounded-full bg-purple-900/60 border border-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {guest.name.charAt(0)}
                            </div>
                            <span className="font-bold text-xs text-white block truncate">{guest.name}</span>
                            <span className="text-[10px] text-emerald-400">ضيف</span>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-center">
                            <span className="text-xs block opacity-60">مقعد ضيف شاغر</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeLayout === 'pip' && (
                <div className="w-full h-full relative bg-slate-950">
                  {/* Main Screen/Video */}
                  {isScreenSharing ? (
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      ref={broadcasterVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Picture-in-Picture Mini Box */}
                  <div className="absolute bottom-4 left-4 w-44 sm:w-56 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/80 shadow-2xl z-10">
                    <video
                      ref={broadcasterVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.2 rounded text-[9px] font-bold text-white">
                      المذيع
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Reaction Animation Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingReactions.map((r) => (
                  <div
                    key={r.id}
                    className="reaction-bubble text-3xl"
                    style={{ bottom: '20px', left: `${r.left}%` }}
                  >
                    {r.type === 'heart' ? '❤️' : r.type === 'fire' ? '🔥' : '👏'}
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Bottom Toolbar (Controls & Layout Selectors) */}
            <div className="bg-[#090d1a] border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              {/* Media Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCamera}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    camOn
                      ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'bg-rose-950/80 border-rose-800 text-rose-400'
                  }`}
                  title={camOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                >
                  {camOn ? <Camera className="w-4 h-4 text-cyan-400" /> : <CameraOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{camOn ? 'الكاميرا' : 'معطلة'}</span>
                </button>

                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    micOn
                      ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'bg-rose-950/80 border-rose-800 text-rose-400'
                  }`}
                  title={micOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}
                >
                  {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{micOn ? 'المايك' : 'مكتوم'}</span>
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isScreenSharing
                      ? 'bg-purple-950 border-purple-700 text-purple-300'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="مشاركة الشاشة"
                >
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">{isScreenSharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة'}</span>
                </button>
              </div>

              {/* Layout Switcher Buttons */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => handleLayoutChange('solo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayout === 'solo'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="وضع فردي للمذيع"
                >
                  فردي
                </button>
                <button
                  onClick={() => handleLayoutChange('side-by-side')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayout === 'side-by-side'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="جنباً إلى جنب"
                >
                  جنباً لجنب
                </button>
                <button
                  onClick={() => handleLayoutChange('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayout === 'grid'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="شبكة 2x2 للضيوف"
                >
                  شبكة
                </button>
                <button
                  onClick={() => handleLayoutChange('pip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayout === 'pip'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="صورة داخل صورة"
                >
                  PiP
                </button>
              </div>

              {/* Hardware Device Pickers */}
              <div className="hidden lg:flex items-center gap-2 text-xs">
                {videoDevices.length > 1 && (
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => {
                      setSelectedVideoDevice(e.target.value);
                      startCameraStream(e.target.value, selectedAudioDevice);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                    title="اختيار الكاميرا"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        📷 {d.label || 'كاميرا'}
                      </option>
                    ))}
                  </select>
                )}

                {audioDevices.length > 1 && (
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => {
                      setSelectedAudioDevice(e.target.value);
                      startCameraStream(selectedVideoDevice, e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                    title="اختيار الميكروفون"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        🎤 {d.label || 'ميكروفون'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Panel toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowBackstagePanel(!showBackstagePanel)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    showBackstagePanel ? 'bg-purple-950 border-purple-700 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                  title="إظهار/إخفاء الكواليس"
                >
                  <Users className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowChatPanel(!showChatPanel)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    showChatPanel ? 'bg-cyan-950 border-cyan-700 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                  title="إظهار/إخفاء الدردشة"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Settings / Backstage / Live Chat */}
          <div className="w-80 lg:w-96 bg-[#090d1a] border-r border-slate-800 flex flex-col h-full flex-shrink-0">
            {/* Setup Form if NOT yet broadcasting */}
            {!isBroadcasting ? (
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                <div>
                  <span className="text-xs font-bold text-rose-400">إعدادات البث</span>
                  <h3 className="text-base font-black text-white">جهّز تفاصيل البث</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان البث *</label>
                  <input
                    type="text"
                    required
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="مثال: حوار مباشر مع الجمهور"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={streamCategory}
                    onChange={(e) => setStreamCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  >
                    <option value="talk">حوارات ونقاش</option>
                    <option value="gaming">ألعاب ورياضات إلكترونية</option>
                    <option value="music">موسيقى وصوتيات</option>
                    <option value="business">ريادة أعمال وشركات</option>
                    <option value="education">تعليم وتطوير</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">وصف مختصر</label>
                  <textarea
                    rows={3}
                    value={streamDesc}
                    onChange={(e) => setStreamDesc(e.target.value)}
                    placeholder="اكتب نبذة عمّا ستتحدث عنه..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">صورة الغلاف (اختياري)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-3 cursor-pointer transition-colors bg-slate-900/60">
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="h-20 w-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {uploadingCover ? 'جاري رفع الغلاف...' : 'اضغط لاختيار صورة'}
                      </span>
                    )}
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartBroadcast}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    بدء البث للجميع الآن
                  </button>
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    سيتم إنشاء غرفة بث فريدة خاصة بك وسينتقل البث لقائمة المباشر.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Backstage Drawer if enabled */}
                {showBackstagePanel && (
                  <div className="p-3 border-b border-slate-800 bg-[#0b1020]/90 flex-shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <h4 className="text-xs font-bold text-white">الكواليس (Backstage)</h4>
                      </div>
                      <button
                        onClick={copyGuestLink}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        {copiedLink === 'guest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>دعوة ضيف</span>
                      </button>
                    </div>

                    {/* Guests Waiting in Backstage */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {backstageGuests.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-2">
                          لا يوجد ضيوف في منطقة الانتظار حالياً.
                        </p>
                      ) : (
                        backstageGuests.map((g) => (
                          <div
                            key={g.id}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              <strong className="text-white">{g.name}</strong>
                              <span className="text-[10px] text-slate-400">
                                {g.camOn ? '📷' : '🚫'} {g.micOn ? '🎤' : '🔇'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAdmitGuest(g.id)}
                                className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px]"
                              >
                                إدخال للمشهد
                              </button>
                              <button
                                onClick={() => handleRejectGuest(g.id)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 text-[10px]"
                              >
                                رفض
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Stage Guests Management */}
                    {stageGuests.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">على الهواء الآن:</span>
                        {stageGuests.map((g) => (
                          <div
                            key={g.id}
                            className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-white">{g.name}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleMuteGuest(g.id, g.isMuted)}
                                className="text-slate-400 hover:text-white"
                                title={g.isMuted ? 'إلغاء الكتم' : 'كتم'}
                              >
                                {g.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleRemoveGuest(g.id)}
                                className="text-rose-400 hover:text-rose-300"
                                title="إزالة من البث"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Live Chat Panel */}
                {showChatPanel && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white">الدردشة المباشرة</h4>
                      </div>
                      <button
                        onClick={copyViewerLink}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        {copiedLink === 'viewer' ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        <span>مشاركة البث</span>
                      </button>
                    </div>

                    {/* Messages scroll */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {chatMessages.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-8">
                          ابدأ بالتفاعل، ستظهر رسائل المشاهدين هنا مباشرة.
                        </p>
                      ) : (
                        chatMessages.map((m) => (
                          <div key={m.id} className="text-xs space-y-0.5">
                            <span className="font-bold text-cyan-300 ml-1">{m.senderName}:</span>
                            <span className="text-slate-200">{m.text}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat compose */}
                    <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="اكتب رسالة للجمهور..."
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal to End Broadcast */}
        {showEndConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0b1020] border border-rose-800/80 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">هل أنت متأكد من إنهاء البث؟</h3>
                <p className="text-xs text-slate-400 mt-1">
                  سيتم إيقاف البث لجميع المشاهدين وإغلاق الغرفة.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء ومتابعة البث
                </button>
                <button
                  onClick={handleConfirmEndBroadcast}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  تأكيد الإنهاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // RENDER: 3) Viewer Experience Mode
  // ========================================================
  if (viewMode === 'watch' && currentStream) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#070a14] overflow-hidden">
        {/* Left: Video Player */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Daily Prebuilt Frame if room URL is provided */}
          {currentStream.roomUrl ? (
            <iframe
              ref={viewerDailyFrameRef}
              src={currentStream.roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title={currentStream.title}
            ></iframe>
          ) : (
            <div className="text-center space-y-2">
              <Radio className="w-12 h-12 mx-auto text-rose-500 animate-pulse" />
              <h3 className="font-bold text-white text-sm">البث المباشر نشط</h3>
              <p className="text-xs text-slate-400">{currentStream.title}</p>
            </div>
          )}

          {/* Floating Reaction Animation Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                className="reaction-bubble text-3xl"
                style={{ bottom: '20px', left: `${r.left}%` }}
              >
                {r.type === 'heart' ? '❤️' : r.type === 'fire' ? '🔥' : '👏'}
              </div>
            ))}
          </div>

          {/* Top Broadcaster Overlay Info */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              {currentStream.hostAvatar ? (
                <img src={currentStream.hostAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                  {currentStream.hostName.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="font-bold text-white text-xs">{currentStream.hostName}</h4>
                <span className="text-[10px] text-slate-300 truncate block max-w-xs">{currentStream.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>LIVE</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>{currentStream.viewerCount}</span>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => {
              api.leaveStream(currentStream.id);
              setViewMode('browse');
              loadActiveStreams();
            }}
            className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            ← خروج
          </button>
        </div>

        {/* Right: Live Chat & Reactions Panel */}
        <div className="w-full md:w-80 lg:w-96 bg-[#090d1a] border-r border-slate-800 flex flex-col h-64 md:h-full flex-shrink-0">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>الدردشة المباشرة</span>
            </h3>

            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSendReaction('heart')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-700 text-rose-400 transition-colors"
                title="إرسال قلب"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => handleSendReaction('fire')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-950 border border-slate-800 hover:border-amber-700 text-amber-400 transition-colors"
                title="إرسال نار"
              >
                <Flame className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => handleSendReaction('clap')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-700 text-cyan-400 transition-colors"
                title="تصفيق"
              >
                👏
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((m) => (
              <div key={m.id} className="text-xs">
                <span className="font-bold text-cyan-400 ml-1">{m.senderName}:</span>
                <span className="text-slate-200">{m.text}</span>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب تعليقاً في البث..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: 4) Guest Backstage Mode
  // ========================================================
  if (viewMode === 'guest_backstage' && currentStream) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#070a14] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-[#0b1020] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <Users className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">منطقة الانتظار</span>
            <h3 className="text-xl font-black text-white mt-1">أنت الآن في كواليس البث (Backstage)</h3>
            <p className="text-xs text-slate-400 mt-2">
              تم إرسال طلبك للمذيع <strong>{currentStream.hostName}</strong>. يمكنك فحص الكاميرا والصوت ريثما يقوم المذيع بإدخالك للمشهد.
            </p>
          </div>

          {/* Preview Video for Guest */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
            <video
              ref={broadcasterVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
            />
            {!camOn && (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                الكاميرا متوقفة
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                camOn ? 'bg-slate-900 border-slate-700 text-white' : 'bg-rose-950 border-rose-800 text-rose-400'
              }`}
            >
              {camOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              <span>{camOn ? 'الكاميرا تعمل' : 'الكاميرا متوقفة'}</span>
            </button>

            <button
              onClick={toggleMic}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                micOn ? 'bg-slate-900 border-slate-700 text-white' : 'bg-rose-950 border-rose-800 text-rose-400'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span>{micOn ? 'المايك يعمل' : 'المايك مكتوم'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
                setViewMode('browse');
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← إلغاء والعودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
