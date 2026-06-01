import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

function createPeerConnection(socket, remoteUserId, onRemoteStream, onIceSend) {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const iceCandidateQueue = [];
  let remoteDescSet = false;

  // Flush queued ICE candidates once remote description is set
  const flushQueue = async () => {
    while (iceCandidateQueue.length) {
      const c = iceCandidateQueue.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
  };

  pc.ontrack = (event) => {
    // Build a MediaStream from incoming tracks
    let stream = event.streams?.[0];
    if (!stream) {
      stream = new MediaStream();
      stream.addTrack(event.track);
    }
    onRemoteStream(stream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceSend(event.candidate);
  };

  pc.onconnectionstatechange = () => {
    console.log('[WebRTC] connection state:', pc.connectionState);
  };

  // Unique named handler for ICE candidates from the remote peer
  const iceName = `iceCandidate_${remoteUserId}`;
  const iceHandler = async ({ candidate, from }) => {
    if (from !== remoteUserId) return;
    if (remoteDescSet) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
    } else {
      iceCandidateQueue.push(candidate);
    }
  };
  socket.on(iceName, iceHandler);
  // Also listen on generic 'iceCandidate' event (server may emit either)
  socket.on('iceCandidate', iceHandler);

  const setRemoteDone = async () => {
    remoteDescSet = true;
    await flushQueue();
  };

  const cleanup = () => {
    socket.off(iceName, iceHandler);
    socket.off('iceCandidate', iceHandler);
  };

  return { pc, setRemoteDone, cleanup };
}

export const useCallStore = create((set, get) => ({
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  pcCleanup: null,
  isMuted: false,
  isCameraOff: false,
  callDuration: 0,
  durationInterval: null,

  setIncomingCall: (call) => set({ incomingCall: call }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    localStream?.getVideoTracks().forEach(t => { t.enabled = isCameraOff; });
    set({ isCameraOff: !isCameraOff });
  },

  startDurationTimer: () => {
    if (get().durationInterval) return; // prevent double-start
    const interval = setInterval(() => set(s => ({ callDuration: s.callDuration + 1 })), 1000);
    set({ durationInterval: interval, callDuration: 0 });
  },

  endCall: () => {
    const { localStream, peerConnection, durationInterval, pcCleanup } = get();
    localStream?.getTracks().forEach(t => t.stop());
    peerConnection?.close();
    if (durationInterval) clearInterval(durationInterval);
    pcCleanup?.();
    set({
      activeCall: null, localStream: null, remoteStream: null,
      peerConnection: null, pcCleanup: null,
      isMuted: false, isCameraOff: false,
      callDuration: 0, durationInterval: null,
    });
  },

  initiateCall: async (targetUser, type) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const constraints = type === 'video' ? { video: true, audio: true } : { audio: true, video: false };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream });

      const { pc, setRemoteDone, cleanup } = createPeerConnection(
        socket,
        targetUser._id,
        (stream) => set({ remoteStream: stream }),
        (candidate) => socket.emit('iceCandidate', { to: targetUser._id, candidate })
      );

      // Add tracks to PC before creating offer
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
      await pc.setLocalDescription(offer);

      socket.emit('callUser', { to: targetUser._id, type, offer, callId });
      set({ activeCall: { userId: targetUser._id, type, callId, startedAt: null }, peerConnection: pc, pcCleanup: cleanup });

      socket.once('callAnswered', async ({ answer, callId: aid }) => {
        if (aid !== callId) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await setRemoteDone();
        set(s => ({ activeCall: s.activeCall ? { ...s.activeCall, startedAt: Date.now() } : null }));
        get().startDurationTimer();
      });

      socket.once('callRejected', ({ callId: rid }) => {
        if (rid !== callId) return;
        get().endCall();
        set({ activeCall: null });
      });

      socket.once('callEnded', ({ callId: eid }) => {
        if (eid !== callId) return;
        get().endCall();
      });

    } catch (err) {
      console.error('[WebRTC] initiateCall error:', err);
      get().endCall();
    }
  },

  acceptCall: async (callData) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !callData) return;
    const { from, offer, callId, type } = callData;

    try {
      const constraints = type === 'video' ? { video: true, audio: true } : { audio: true, video: false };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream });

      const { pc, setRemoteDone, cleanup } = createPeerConnection(
        socket,
        from,
        (stream) => set({ remoteStream: stream }),
        (candidate) => socket.emit('iceCandidate', { to: from, candidate })
      );

      // Add tracks before setting remote description
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      // Set remote description first, then create answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await setRemoteDone(); // flush any buffered ICE candidates

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answerCall', { to: from, answer, callId });

      set({
        activeCall: { userId: from, type, callId, startedAt: Date.now() },
        peerConnection: pc,
        pcCleanup: cleanup,
        incomingCall: null,
      });
      get().startDurationTimer();

      socket.once('callEnded', ({ callId: eid }) => {
        if (eid !== callId) return;
        get().endCall();
      });

    } catch (err) {
      console.error('[WebRTC] acceptCall error:', err);
      get().endCall();
    }
  },

  rejectCall: (callData) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !callData) return;
    socket.emit('rejectCall', { to: callData.from, callId: callData.callId });
    set({ incomingCall: null });
  },

  hangUp: (targetUserId) => {
    const socket = useAuthStore.getState().socket;
    const { activeCall } = get();
    if (socket && activeCall) {
      socket.emit('endCall', { to: targetUserId || activeCall.userId, callId: activeCall.callId });
    }
    get().endCall();
  },
}));
