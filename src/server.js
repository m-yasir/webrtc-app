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
	 * @type {string[]}
	 */
	connectedSockets = [];

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
	io;
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
		this.io = socketIO(this.httpServer);

		this.configureApp();
		this.handleRoutes();
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
		this.io.on("connection", (socket) => {
			console.log("Client connected! ID: ", socket.id);
			const existingSocket = this.connectedSockets.find(
				(existingSocket) => existingSocket === socket.id
			);

			if (!existingSocket) {
				this.connectedSockets.push(socket.id);
			}
			
			socket.on("disconnect", () => {
				console.log("Client disconnected! ID: ", socket.id);
			});
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
