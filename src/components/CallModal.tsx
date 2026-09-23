import React, { useEffect, useState } from 'react';
import { CallRecord, User } from '../types.ts';
import { api } from '../api.ts';
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

interface CallModalProps {
  call: CallRecord;
  currentUser: User;
  onCallEnded: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  call,
  currentUser,
  onCallEnded,
}) => {
  const isIncoming = call.receiverId === currentUser.id && call.status === 'ringing';
  const isOutgoing = call.callerId === currentUser.id && call.status === 'ringing';
  const isActive = call.status === 'active';

  const [callDuration, setCallDuration] = useState(0);
  const otherName = call.callerId === currentUser.id ? call.receiverName : call.callerName;
  const otherAvatar = call.callerId === currentUser.id ? call.receiverAvatar : call.callerAvatar;

  useEffect(() => {
    let timer: any;
    if (isActive) {
      timer = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive]);

  const handleAccept = async () => {
    try {
      await api.respondCall(call.id, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    try {
      await api.respondCall(call.id, false);
      onCallEnded();
    } catch (e) {
      console.error(e);
      onCallEnded();
    }
  };

  const handleEnd = async () => {
    try {
      await api.endCall(call.id);
    } catch (e) {
      console.error(e);
    } finally {
      onCallEnded();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Incoming Call Overlay
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#0b1020] border border-cyan-800/80 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            {otherAvatar ? (
              <img src={otherAvatar} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500 shadow-xl" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {otherName.charAt(0)}
              </div>
            )}
            <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75"></span>
          </div>

          <div>
            <span className="text-xs font-bold text-cyan-400">
              {call.callType === 'video' ? 'مكالمة فيديو واردة...' : 'مكالمة صوتية واردة...'}
            </span>
            <h3 className="text-xl font-black text-white mt-1">{otherName}</h3>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              onClick={handleReject}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 cursor-pointer"
              title="رفض المكالمة"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            <button
              onClick={handleAccept}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 cursor-pointer"
              title="قبول المكالمة"
            >
              {call.callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Outgoing Ringing Overlay
  if (isOutgoing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            {otherAvatar ? (
              <img src={otherAvatar} alt="" className="w-24 h-24 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {otherName.charAt(0)}
              </div>
            )}
            <span className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-50"></span>
          </div>

          <div>
            <span className="text-xs text-slate-400">جاري الاتصال...</span>
            <h3 className="text-xl font-black text-white mt-1">{otherName}</h3>
          </div>

          <div className="pt-2">
            <button
              onClick={handleEnd}
              className="w-14 h-14 mx-auto rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 cursor-pointer"
              title="إلغاء الاتصال"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Call Screen
  if (isActive) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070a14] flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 bg-[#090d1a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">
              مكالمة مع {otherName} ({formatSeconds(callDuration)})
            </span>
          </div>

          <button
            onClick={handleEnd}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>إنهاء</span>
          </button>
        </div>

        {/* Daily Prebuilt Frame or Fallback UI */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {call.roomUrl ? (
            <iframe
              src={call.roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="SNNS Call"
            ></iframe>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-white text-3xl font-bold">
                {otherName.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-white">{otherName}</h3>
              <p className="text-xs text-emerald-400">المكالمة نشطة ومستمرة</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
