const { RTCPeerConnection, RTCSessionDescription } = window;
const socket = io.connect("localhost:8000");

// TODO: Handle PeerConnectionError through a promise function that acts as a middleWare
// TODO: (logic?) Make a Map of PeerConnections and use them for multiple parties/clients

/**
 * @type {Map<string, boolean>}
 * @description Var that holds status of calls in progress with other sockets
 */
let callsInProgress = new Map();

/**
 * @type {RTCPeerConnection | undefined}
 */
let peerConnection;

/**
 * @description Initializes Client's own video/audio stream and sets it in track to send through RTCPeerConnection
 * @returns {void}
 */
async function initLocalVideo() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		});
		const localv = document.getElementById("local-video");
		localv && (localv.srcObject = stream);
		/** Set your audio/video stream to be streamed to peer connection(s) */
		stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	} catch (e) {
		console.warn(e);
	}
}

/**
 *
 * @param {RTCConfiguration} config
 * @returns {RTCPeerConnection}
 */
function getNewRTCPeerConnection(config = {}) {
	return new RTCPeerConnection(config);
}

/**
 * @description Initializes (WebRTC) RTCPeerConnection
 * @returns {void}
 */
function initRTCPeerConnection() {
	try {
		peerConnection = getNewRTCPeerConnection();
		/** Set stream to #remote-video video element */
		peerConnection.ontrack(({ streams: [stream] }) => {
			const videoElement = document.getElementById("remote-video");
			videoElement && (videoElement.srcObject = stream);
		});
	} catch (error) {
		console.warn("initRTCPeerConnection error: ", error);
	}
}

/**
 * @param {string} socketId
 * @description Since there's no UI to call other user (WebRTC "test" app duh), this method is added to window (global) to manually call other socket from invocation through browser console
 * @returns {void}
 */
const CallSocketUser = async (socketId) => {
	if (peerConnection === undefined) {
		window.alert(
			"Remote connection not available. Please contact an administrator!"
		);
		return;
	}
	if (socketId === undefined || !isNaN(socketId)) {
		throw "Invalid SocketID!";
	}
	const offer = await peerConnection.createOffer({
		offerToReceiveAudio: true,
		offerToReceiveVideo: true
	});
	await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
	
	/** Call user and send RTC Offer */
	socket.emit("call-user", {
		offer,
		to: socketId
	});
};

/** 
 * @description Listens for "call-request" event emit from server (expected: when other socket connected to server makes a call to this client)
 */
socket.on("call-request", ({ offer, from: socketId }) => {
	console.log("Call from socketId: ", socketId);
	if (peerConnection === undefined) {
		window.alert(
			"Unable to establish connection to other socket due to RTCPeerConnection being undefined. Please contact an administrator!"
		);
		return;
	}
	await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
	const answer = await peerConnection.createAnswer({
		offerToReceiveVideo: true,
		offerToReceiveAudio: true
	});
	await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

	socket.emit("accept-call", {
		answer,
		to: socketId
	})
});

/**
 * @description Listener to Accept Call and establish RTC connection
 */
socket.on("call-accepted", ({ answer, from: socketId }) => {
	console.log("Call Accepted from: ", socketId);
	if (peerConnection === undefined) {
		window.alert(
			"Unable to establish connection to other socket due to RTCPeerConnection being undefined. Please contact an administrator!"
		);
		return;
	}
	/** set status of the peer connection to remote's answer */
	peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

	/** Call the client only once */
	if (!callsInProgress.get(socketId)) {
		callsInProgress.set(socketId, true);
		CallSocketUser(socketId);
	}
});

/**
 * @description Listener to cancel session in case the client is disconnected from server (expected: to be called on other socket's disconnection(s))
 */
socket.on("disconnect-call", ({ from }) => {
	/** Close call if it was in progress */
	if (callsInProgress.get(from)) {
		peerConnection.close();
	}
	console.log("Disconnect Call from socketId: ", from);
	callsInProgress.delete(from);
})

/**
 * @description Listens for "client-socket-id" event emit from server (expected: on connection to server)
 */
socket.on("client-socket-id", ({ data: { socketId } }) => {
	console.log("Client socket ID: ", socketId);
});

/**
 * Init client vars needed for app to function
 */
function init() {
	initLocalVideo();
	initRTCPeerConnection();
	window.CallSocketUser = CallSocketUser;
}

init();
