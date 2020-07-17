const { Server } = require("./server");

const server = new Server();

server.listen((port) => {
    console.log(`Now listening on port number: ${port}...`);
})
