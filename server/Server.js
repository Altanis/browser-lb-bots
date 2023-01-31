/** Handles communication between master (Server) and puppet (slave tab). */

const { WebSocketServer } = require("diep-ws");

class Server {
    /** The scoreboards fetched by the slave tab. */
    servers = {
        /** The cached servers. */
        cached: [],

        /** The servers actively being fetched. */
        servers: [],

        /** The last update for the cache. */
        lastSweep: Date.now()
    };

    /** The server which the class is managing. */
    wss = new WebSocketServer({ port: 3000 });

    constructor() {
        this.handle();
    }

    handle() {
        this.wss.on("listening", () => console.log("[WS]: Server listening on port 3000. You may connect a slave tab."));
        this.wss.on("error", err => console.error("[WS]: An error has occured.", err));
        this.wss.on("close", () => console.log("[WS]: Server closed prematurely."));
        this.wss.on("connection", (socket, request) => {
            console.log("[WS]: A slave tab has connected!");
            if (this.wss.clients.size > 1) console.warn("[WS]: More than one connection has been made. This may interfere with server fetching.");

            socket.on("error", err => console.error("[WS_SOCKET]: The slave tab has an error.", err));
            socket.on("close", () => console.log("[WS_SOCKET]: The slave tab has closed the connection."));
            socket.on("message", (data) => {
                data = data.toString();
                
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    console.error("[WS_SOCKET]: The slave tab has sent an undecipherable message.");
                }

                // Message Format: { server: ServerInfo, scores: ScoreboardEntry[], end: boolean }
                const { server, scores } = data;
                this.servers.servers.push({ server, scores, time: Date.now() });
                console.log(this.servers.servers[this.servers.servers.length - 1]);

                if (data.end) {
                    let linksFound = [];
                    this.servers.servers = this.servers.servers.filter(server => {
                        if (linksFound.includes(server.server.link)) return false;
                        linksFound.push(server.server.link);
                        return true;
                    });

                    this.servers.cached = this.servers.servers;
                    this.servers.cached.lastSweep = Date.now();

                    this.servers.servers = {};

                    this.wss.tunnelInit({
                        servers: this.servers.cached
                    }).then(() => console.log("Crowdsourced servers.")).catch(er => console.error("Could not crowdsource servers! Contact Altanis#0129.", er));

                    console.log("Finished caching servers.");
                }
            });
        });
    }
}

module.exports = {
    server: new Server()
};