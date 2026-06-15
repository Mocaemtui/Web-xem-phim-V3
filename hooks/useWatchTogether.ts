import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

export interface Watcher {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

export const useWatchTogether = (roomId: string, username: string, initialIsHost: boolean) => {
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [myId, setMyId] = useState<string>('');
  
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  const onPlayRef = useRef<((time: number) => void) | null>(null);
  const onPauseRef = useRef<(() => void) | null>(null);
  const onSeekRef = useRef<((time: number) => void) | null>(null);
  const onRequestSyncRef = useRef<(() => void) | null>(null);
  const onSyncResponseRef = useRef<((data: { time: number, isPlaying: boolean, serverIndex?: number, episodeIndex?: number }) => void) | null>(null);
  const onChangeEpisodeRef = useRef<((serverIndex: number, episodeIndex: number) => void) | null>(null);
  const onChangeHostRef = useRef<((newHostId: string) => void) | null>(null);

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'System',
        text,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };
  useEffect(() => {
    if (!roomId || !username) return;
    if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      addSystemMessage("Lỗi: Chưa cấu hình Pusher. Tính năng xem chung sẽ không hoạt động.");
      console.warn("Pusher environment variables (NEXT_PUBLIC_PUSHER_APP_KEY or NEXT_PUBLIC_PUSHER_CLUSTER) are missing!");
      return;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
      auth: {
        params: {
          username,
          is_host: initialIsHost ? 'true' : 'false',
        },
      },
    });

    pusherRef.current = pusher;
    const channelName = `presence-room-${roomId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setMyId(members.myID);
      const initialWatchers: Watcher[] = [];
      members.each((member: any) => {
        initialWatchers.push({
          id: member.id,
          name: member.info.name,
          isHost: member.info.isHost,
        });
      });
      setWatchers(initialWatchers);
      addSystemMessage(`Bạn đã tham gia phòng. Có ${members.count} người đang xem.`);
    });

    channel.bind('pusher:member_added', (member: any) => {
      setWatchers((prev) => [
        ...prev,
        { id: member.id, name: member.info.name, isHost: member.info.isHost },
      ]);
      addSystemMessage(`${member.info.name} vừa tham gia phòng`);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setWatchers((prev) => {
        const removedUser = prev.find((w) => w.id === member.id);
        if (removedUser) {
          addSystemMessage(`${removedUser.name} vừa rời phòng`);
          setTypingUsers((typing) => typing.filter((name) => name !== removedUser.name));
        }
        return prev.filter((w) => w.id !== member.id);
      });
    });

    // Video Events
    channel.bind('client-play', (data: { time: number }) => {
      if (onPlayRef.current) onPlayRef.current(data.time);
    });

    channel.bind('client-pause', () => {
      if (onPauseRef.current) onPauseRef.current();
    });

    channel.bind('client-seek', (data: { time: number }) => {
      if (onSeekRef.current) onSeekRef.current(data.time);
    });

    channel.bind('client-request-sync', () => {
      if (onRequestSyncRef.current) onRequestSyncRef.current();
    });

    channel.bind('client-sync-response', (data: { time: number, isPlaying: boolean, serverIndex?: number, episodeIndex?: number }) => {
      if (onSyncResponseRef.current) onSyncResponseRef.current(data);
    });

    channel.bind('client-change-episode', (data: { serverIndex: number, episodeIndex: number }) => {
      if (onChangeEpisodeRef.current) onChangeEpisodeRef.current(data.serverIndex, data.episodeIndex);
    });

    // Chat Events
    channel.bind('client-chat', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    channel.bind('client-system-action', (data: { text: string }) => {
      addSystemMessage(data.text);
    });

    // Reaction Event
    channel.bind('client-reaction', (data: { emoji: string }) => {
      setReactions((prev) => [
        ...prev,
        { id: Math.random().toString(36).substring(7), emoji: data.emoji, x: Math.random() * 80 + 10 },
      ]);
      // Remove reaction after 3s
      setTimeout(() => {
        setReactions((current) => current.slice(1));
      }, 3000);
    });

    // Typing Event
    channel.bind('client-typing', (data: { name: string, isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping && !prev.includes(data.name)) return [...prev, data.name];
        if (!data.isTyping) return prev.filter((name) => name !== data.name);
        return prev;
      });
    });

    // Host Change Event
    channel.bind('client-change-host', (data: { newHostId: string, newHostName: string }) => {
      setWatchers((prev) =>
        prev.map((w) => ({
          ...w,
          isHost: w.id === data.newHostId,
        }))
      );
      addSystemMessage(`${data.newHostName} đã trở thành Host mới.`);
      if (onChangeHostRef.current) {
        onChangeHostRef.current(data.newHostId);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [roomId, username, initialIsHost]);

  const triggerPlay = (time: number) => {
    channelRef.current?.trigger('client-play', { time });
  };

  const triggerPause = () => {
    channelRef.current?.trigger('client-pause', {});
  };

  const triggerSeek = (time: number) => {
    channelRef.current?.trigger('client-seek', { time });
  };

  const triggerRequestSync = () => {
    channelRef.current?.trigger('client-request-sync', {});
  };

  const triggerSyncResponse = (time: number, isPlaying: boolean, serverIndex: number, episodeIndex: number) => {
    channelRef.current?.trigger('client-sync-response', { time, isPlaying, serverIndex, episodeIndex });
  };

  const triggerChangeEpisode = (serverIndex: number, episodeIndex: number) => {
    channelRef.current?.trigger('client-change-episode', { serverIndex, episodeIndex });
  };

  const triggerReaction = (emoji: string) => {
    channelRef.current?.trigger('client-reaction', { emoji });
    // Thêm cho chính mình
    setReactions((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), emoji, x: Math.random() * 80 + 10 },
    ]);
    setTimeout(() => {
      setReactions((current) => current.slice(1));
    }, 3000);
  };

  const triggerTyping = (isTyping: boolean) => {
    channelRef.current?.trigger('client-typing', { name: username, isTyping });
  };

  const triggerSystemAction = (text: string) => {
    channelRef.current?.trigger('client-system-action', { text });
    addSystemMessage(text);
  };

  const sendMessage = (text: string) => {
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: username,
      text,
      timestamp: Date.now(),
    };
    channelRef.current?.trigger('client-chat', message);
    setMessages((prev) => [...prev, message]);
    // Gửi xong thì hết gõ
    triggerTyping(false);
  };

  const triggerChangeHost = (newHostId: string, newHostName: string) => {
    channelRef.current?.trigger('client-change-host', { newHostId, newHostName });
    setWatchers((prev) =>
      prev.map((w) => ({
        ...w,
        isHost: w.id === newHostId,
      }))
    );
    addSystemMessage(`${newHostName} đã trở thành Host mới.`);
    if (onChangeHostRef.current) {
      onChangeHostRef.current(newHostId);
    }
  };

  return {
    watchers,
    messages,
    reactions,
    typingUsers,
    triggerPlay,
    triggerPause,
    triggerSeek,
    triggerRequestSync,
    triggerSyncResponse,
    triggerChangeEpisode,
    triggerReaction,
    triggerTyping,
    triggerSystemAction,
    sendMessage,
    onPlayRef,
    onPauseRef,
    onSeekRef,
    onRequestSyncRef,
    onSyncResponseRef,
    onChangeEpisodeRef,
    myId,
    triggerChangeHost,
    onChangeHostRef,
  };
};

