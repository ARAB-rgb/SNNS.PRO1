import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { VideoItem, VideoComment, User } from '../types.ts';
import { Heart, MessageSquare, Share2, Plus, Film, X, Send } from 'lucide-react';

interface VideosViewProps {
  currentUser: User;
}

export const VideosView: React.FC<VideosViewProps> = ({ currentUser }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'friends' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Comments modal states
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentInput, setCommentInput] = useState('');

  const loadVideos = async () => {
    try {
      const res = await api.getVideos();
      setVideos(res.videos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleLike = async (videoId: string) => {
    try {
      const res = await api.likeVideo(videoId);
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id === videoId) {
            const hasLiked = v.likes.includes(currentUser.id);
            const nextLikes = hasLiked
              ? v.likes.filter((id) => id !== currentUser.id)
              : [...v.likes, currentUser.id];
            return { ...v, likes: nextLikes };
          }
          return v;
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenComments = async (videoId: string) => {
    setActiveVideoId(videoId);
    try {
      const res = await api.getVideoComments(videoId);
      setComments(res.comments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideoId || !commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');
    try {
      const res = await api.addVideoComment(activeVideoId, text);
      setComments((prev) => [...prev, res.comment]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;
    setIsUploading(true);
    try {
      const url = await api.uploadFile(videoFile);
      const res = await api.uploadVideo({
        videoUrl: url,
        caption,
        privacy,
        allowComments,
        allowDownload,
      });
      setVideos((prev) => [res.video, ...prev]);
      setShowUploadModal(false);
      setCaption('');
      setVideoFile(null);
    } catch (e: any) {
      alert('فشل رفع الفيديو: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-400">لحظات SNNS</span>
          <h2 className="text-2xl font-black text-white mt-0.5">فيديوهات المجتمع</h2>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>نشر لحظة جديدة</span>
        </button>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري تحميل الفيديوهات...</div>
      ) : videos.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-3">
          <Film className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد لحظات منشورة بعد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            كن أول من يشارك لحظة أو فيديو قصير مع مجتمع SNNS.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
          >
            نشر أول فيديو
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map((v) => {
            const hasLiked = v.likes.includes(currentUser.id);
            return (
              <div
                key={v.id}
                className="bg-[#0b1020] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-xl mx-auto"
              >
                {/* Author Bar */}
                <div className="p-4 flex items-center gap-3">
                  {v.authorAvatar ? (
                    <img src={v.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {v.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-xs">{v.authorName}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                {/* Video Player */}
                <div className="relative aspect-[9/14] sm:aspect-[9/12] max-h-[560px] bg-black flex items-center justify-center">
                  <video
                    src={v.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Actions & Caption */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(v.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                          hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{v.likes.length}</span>
                      </button>

                      {v.allowComments && (
                        <button
                          onClick={() => handleOpenComments(v.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                          <span>التعليقات</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(v.videoUrl);
                        alert('تم نسخ رابط الفيديو');
                      }}
                      className="text-slate-400 hover:text-white"
                      title="مشاركة"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {v.caption && <p className="text-xs text-slate-200 leading-relaxed">{v.caption}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">نشر فيديو / لحظة جديدة</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">ملف الفيديو *</label>
                <input
                  type="file"
                  required
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-950 file:text-rose-400 hover:file:bg-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الوصف أو النص</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="شارك ما يدور في ذهنك..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الخصوصية</label>
                <select
                  value={privacy}
                  onChange={(e: any) => setPrivacy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="public">الجميع (عام)</option>
                  <option value="followers">المتابعون فقط</option>
                  <option value="friends">الأصدقاء فقط</option>
                  <option value="private">خاص بي فقط</option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span>السماح بالتعليقات</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span>السماح بالتنزيل</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploading || !videoFile}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isUploading ? 'جاري رفع الفيديو...' : 'نشر الفيديو'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {activeVideoId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">التعليقات</h3>
              <button onClick={() => setActiveVideoId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">لا توجد تعليقات بعد، كن أول من يعلّق!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <strong className="text-rose-400 block">{c.authorName}</strong>
                    <p className="text-slate-200 mt-0.5">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="اكتب تعليقك..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="p-2 bg-rose-600 text-white rounded-xl disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
