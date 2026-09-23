/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api, getToken, setToken } from './api.ts';
import { User, CallRecord } from './types.ts';
import { TopNav } from './components/TopNav.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ContactsView } from './components/ContactsView.tsx';
import { ChatsView } from './components/ChatsView.tsx';
import { NearbyView } from './components/NearbyView.tsx';
import { LiveView } from './components/LiveView.tsx';
import { VideosView } from './components/VideosView.tsx';
import { MarketView } from './components/MarketView.tsx';
import { CompaniesView } from './components/CompaniesView.tsx';
import { GroupsView } from './components/GroupsView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { NotificationsView } from './components/NotificationsView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { AdminSTSView } from './components/AdminSTSView.tsx';
import { CallModal } from './components/CallModal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('contacts');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active call monitoring
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);

  // Deep linking & specific view targets
  const [activeChatPeerId, setActiveChatPeerId] = useState<string | undefined>(undefined);
  const [liveStreamId, setLiveStreamId] = useState<string | undefined>(undefined);
  const [liveJoinRole, setLiveJoinRole] = useState<string | undefined>(undefined);

  // Badges
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // 1. Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const res = await api.me();
        setCurrentUser(res.user);
      } catch (e) {
        console.warn('Session expired or invalid token');
        setToken(null);
      } finally {
        setInitializing(false);
      }
    };
    checkAuth();

    // Check URL parameters for direct links (e.g. ?page=live&streamId=xxx&join=guest)
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const sId = params.get('streamId');
    const joinRole = params.get('join');
    const peerId = params.get('peerId');

    if (pageParam) setCurrentPage(pageParam);
    if (sId) setLiveStreamId(sId);
    if (joinRole) setLiveJoinRole(joinRole);
    if (peerId) {
      setActiveChatPeerId(peerId);
      setCurrentPage('chats');
    }
  }, []);

  // 2. Active call polling & notifications polling
  useEffect(() => {
    if (!currentUser) return;

    const pollBackground = async () => {
      try {
        // Poll for incoming/active call
        const callRes = await api.getActiveCall();
        if (callRes.call) {
          setCurrentCall(callRes.call);
        } else {
          setCurrentCall(null);
        }

        // Poll chat unread
        const chatsRes = await api.getChats();
        const unreadTotal = (chatsRes.chats || []).reduce(
          (acc: number, c: any) => acc + (c.unreadCount || 0),
          0
        );
        setUnreadChatsCount(unreadTotal);

        // Poll notifications unread
        const notifsRes = await api.getNotifications();
        const unreadNotifs = (notifsRes.notifications || []).filter((n: any) => !n.read).length;
        setUnreadNotifsCount(unreadNotifs);
      } catch (e) {
        // Silently catch transient network issues
      }
    };

    pollBackground();
    const interval = setInterval(pollBackground, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
      setCurrentUser(null);
    }
  };

  const handleStartCall = async (targetUser: User, type: 'audio' | 'video') => {
    try {
      const res = await api.initiateCall(targetUser.id, type);
      setCurrentCall(res.call);
    } catch (e: any) {
      alert('فشل بدء المكالمة: ' + e.message);
    }
  };

  const handleOpenChat = (peerId: string) => {
    setActiveChatPeerId(peerId);
    setCurrentPage('chats');
  };

  const handleOpenLive = (streamId?: string) => {
    setLiveStreamId(streamId);
    setLiveJoinRole(undefined);
    setCurrentPage('live');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#070a14] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 animate-spin flex items-center justify-center p-1">
          <div className="w-full h-full bg-[#070a14] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar */}
      <TopNav
        user={currentUser}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onSelectPage={(p) => setCurrentPage(p)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          user={currentUser}
          currentPage={currentPage}
          onSelectPage={(p) => setCurrentPage(p)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          unreadChatsCount={unreadChatsCount}
          unreadNotificationsCount={unreadNotifsCount}
        />

        {/* Page Content Router */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          {currentPage === 'contacts' && (
            <ContactsView
              currentUser={currentUser}
              onStartCall={handleStartCall}
              onOpenChat={handleOpenChat}
              onOpenLive={handleOpenLive}
            />
          )}

          {currentPage === 'chats' && (
            <ChatsView
              currentUser={currentUser}
              activePeerId={activeChatPeerId}
              onSelectPeer={(pId) => setActiveChatPeerId(pId)}
              onStartCall={handleStartCall}
            />
          )}

          {currentPage === 'nearby' && (
            <NearbyView
              currentUser={currentUser}
              onOpenChat={handleOpenChat}
              onStartCall={handleStartCall}
            />
          )}

          {currentPage === 'live' && (
            <LiveView
              currentUser={currentUser}
              initialStreamId={liveStreamId}
              initialJoinRole={liveJoinRole}
              onBackToDirectory={() => {
                setLiveStreamId(undefined);
                setLiveJoinRole(undefined);
                setCurrentPage('contacts');
              }}
            />
          )}

          {currentPage === 'videos' && <VideosView currentUser={currentUser} />}

          {currentPage === 'market' && (
            <MarketView
              currentUser={currentUser}
              onOpenChat={handleOpenChat}
              onStartCall={handleStartCall}
            />
          )}

          {currentPage === 'companies' && <CompaniesView currentUser={currentUser} />}

          {currentPage === 'groups' && <GroupsView currentUser={currentUser} />}

          {currentPage === 'history' && (
            <HistoryView currentUser={currentUser} onStartCall={handleStartCall} />
          )}

          {currentPage === 'notifications' && (
            <NotificationsView onOpenChat={handleOpenChat} />
          )}

          {currentPage === 'profile' && (
            <ProfileView user={currentUser} onUserUpdated={(u) => setCurrentUser(u)} />
          )}

          {currentPage === 'admin' && <AdminSTSView currentUser={currentUser} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onSelectPage={(p) => setCurrentPage(p)}
        unreadChatsCount={unreadChatsCount}
      />

      {/* Global Active / Incoming Call Modal */}
      {currentCall && (
        <CallModal
          call={currentCall}
          currentUser={currentUser}
          onCallEnded={() => setCurrentCall(null)}
        />
      )}
    </div>
  );
}
