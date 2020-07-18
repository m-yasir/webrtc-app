const { RTCPeerConnection, RTCSessionDescription } = window;
const socket = io.connect("localhost:8000");

/**
 * @type {RTCPeerConnection | undefined}
 */
let peerConnection;

/**
 * @description
 * @returns {void}
 */
async function initLocalVideo() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		});
		console.log(stream);
		const localv = document.getElementById("local-video");
		localv && (localv.srcObject = stream);
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
	socket.emit("callUser", {
		offer,
		to: socketId
	});
};

/** 
 * @description Listens for "call-request" event emit from server (expected: when other socket connected to server makes a call to this client)
 */
socket.on("call-request", ({ offer, from }) => {	
	console.log("Call from socketId: ", from);
});

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
