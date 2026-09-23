export interface DailyRoomResult {
  roomName: string;
  roomUrl: string;
  hostToken?: string;
  guestToken?: string;
}

export async function createDailyRoom(roomPrefix: string, hostName: string): Promise<DailyRoomResult> {
  const apiKey = process.env.DAILY_API_KEY?.trim();
  const domain = process.env.DAILY_DOMAIN?.trim() || 'snns';
  const cleanPrefix = roomPrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueSuffix = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const roomName = `snns_${cleanPrefix}_${uniqueSuffix}`.toLowerCase().substring(0, 48);

  if (apiKey) {
    try {
      const roomRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'public',
          properties: {
            enable_screenshare: true,
            enable_chat: false,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          },
        }),
      });

      if (roomRes.ok) {
        const roomData = await roomRes.json();
        const roomUrl = roomData.url || `https://${domain}.daily.co/${roomName}`;

        // Create host token
        let hostToken: string | undefined;
        try {
          const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              properties: {
                room_name: roomName,
                is_owner: true,
                user_name: hostName,
                enable_screenshare: true,
              },
            }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            hostToken = tokenData.token;
          }
        } catch (e) {
          console.error('Failed to create Daily host token:', e);
        }

        return {
          roomName,
          roomUrl,
          hostToken,
        };
      } else {
        const errText = await roomRes.text();
        console.warn('Daily room creation API returned error, falling back to dedicated URL:', errText);
      }
    } catch (e) {
      console.error('Daily API fetch failed, falling back to dedicated URL:', e);
    }
  }

  // Dedicated room URL without exposing any secret to client
  const fallbackUrl = `https://${domain}.daily.co/${roomName}`;
  return {
    roomName,
    roomUrl: fallbackUrl,
  };
}
