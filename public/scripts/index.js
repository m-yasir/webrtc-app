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

initLocalVideo();
