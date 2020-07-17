const express = require("express");
const socketIO = require("socket.io");
const { createServer, Server: HTTPServer } = require("http");
const path = require("path");

/**
 * @callback ListenCallback
 * @param {number} portNumber
 * @returns {void}
 */

class Server {
	/**
	 * @private
	 * @type {express.Application}
	 */
	app;
	/**
	 * @private
	 * @type {HTTPServer}
	 */
	httpServer;
	/**
	 * @private
	 * @type {socketIO.Server}
	 */
	socket;
	/**
	 * @private
	 * @readonly
	 * @type {number}
	 */
	DEFAULT_PORT = process.env.APP_DEFAULT_PORT || 8000;

	constructor() {
		/**
		 * @type {Server}
		 */
		this.initialize();
		this.handleRoutes();
	}

	/**
	 * @private
	 */
	configureApp() {
		this.app.use(express.static(path.join(__dirname, "../public")));
	}

	/**
	 * @private
	 */
	initialize() {
		this.app = express();
		this.httpServer = createServer(this.app);
		this.socket = socketIO(this.httpServer);

		this.configureApp();
		this.handleSocketConnection();
	}

	/**
	 * @private
	 */
	handleRoutes() {
		this.app.get("/", (req, res) => {
			res.send("<p>Hello to WebRTC Boilerplate! :)</p>");
		});
	}

	/**
	 * @private
	 */
	handleSocketConnection() {
		this.socket.on("connection", () => {
			console.log("Socket connected!");
		});
	}

	/**
	 * @public
	 * @param {ListenCallback} cb - Called when app starts listening on app's defined port number
	 */
	listen(cb) {
		this.httpServer.listen(this.DEFAULT_PORT, () => {
			cb(this.DEFAULT_PORT);
		});
	}
}

module.exports = {
	Server
};
