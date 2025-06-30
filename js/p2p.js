// WebRTC P2P connection logic using SimplePeer
// Connects to signaling server and exchanges signaling data via WebSocket

let SIGNAL_SERVER_URL = 'wss://hypnotic-brassy-forest.glitch.me';
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (window.SIGNAL_SERVER_URL) {
    SIGNAL_SERVER_URL = window.SIGNAL_SERVER_URL;
  } else if (params.get('signal')) {
    SIGNAL_SERVER_URL = params.get('signal');
  }
}
let signalSocket;
let peer;
let currentRoom;

function cleanupPeer() {
  if (peer) {
    try { peer.destroy(); } catch (e) {}
    peer = null;
  }
  if (signalSocket) {
    try { signalSocket.close(); } catch (e) {}
    signalSocket = null;
  }
}

function startPeer(initiator) {
  peer = new SimplePeer({ initiator, trickle: false });
  window.peer = peer;
  peer.on('signal', data => {
    if (signalSocket && signalSocket.readyState === WebSocket.OPEN) {
      signalSocket.send(
        JSON.stringify({ type: 'signal', room: currentRoom, payload: data })
      );
    }
  });
  peer.on('connect', () => {
    console.log('WebRTC connection established');
    if (typeof window.onPeerConnect === 'function') window.onPeerConnect(peer.initiator);
  });
  peer.on('data', data => {
    try {
      const msg = JSON.parse(data.toString());
      if (typeof window.onPeerMessage === 'function') window.onPeerMessage(msg);
    } catch (e) {
      console.error('Invalid peer data', e);
    }
  });
  peer.on('close', () => {
    if (typeof window.onPeerClose === 'function') window.onPeerClose();
  });
  peer.on('error', err => console.error('Peer error:', err));
}

function connectToRoom(roomId) {
  cleanupPeer();
  currentRoom = roomId;
  signalSocket = new WebSocket(SIGNAL_SERVER_URL);

  let gotSignal = false;

  signalSocket.onopen = () => {
    signalSocket.send(JSON.stringify({ type: 'join', room: roomId }));
    // If no signal arrives shortly assume we are the first and create the offer
    setTimeout(() => {
      if (!peer && !gotSignal) startPeer(true);
    }, 500);
  };

  signalSocket.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.type === 'signal') {
      gotSignal = true;
      if (!peer) startPeer(false);
      peer.signal(msg.payload);
    }
  };

  signalSocket.onclose = () => {
    cleanupPeer();
    if (typeof window.onPeerClose === 'function') window.onPeerClose();
  };
}

function sendPeerData(data) {
  if (!peer || !peer.connected) return;
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  peer.send(payload);
}

// Expose functions globally
window.connectToRoom = connectToRoom;
window.sendPeerData = sendPeerData;
window.disconnectPeer = cleanupPeer;
