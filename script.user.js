// ==UserScript==
// @name         Diep.io LB Bot
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Cache leaderboards from Diep.io!
// @author       Altanis#0129
// @match        *://diep.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=diep.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    /**
    * Made by Altanis#0129!
    */

    /** Prevent refreshing. */
    while (window.onbeforeunload !== null)
        window.onbeforeunload = null;

    /** Possibilities of every antecedent. */
    const base = "Lvl * Tank";
    const possibilities = [];
    for (let i = 1; i < 46; i++) possibilities.push(base.replace("*", i));

    const socket = new WebSocket("ws://localhost:3000");

    const crc2d = window.CanvasRenderingContext2D;
    if (!crc2d) throw new Error("wtf how r u even playing this game?");

    /** Lobby class, forces connections to lobbies. */
    const Lobby = class {
        /** The current lobby. */
        lobby = "";
        /** The next lobby. */
        nextLobby = "";
        /** The list of servers */
        servers = [];

        constructor() {
            this.readStorage();
        }

        /** Reads localStorage. */
        async readStorage() {
            /** Refreshes lobbies. */
            if (!localStorage["lbbot_lobbies"]) {
                const lobbies = (await fetch('https://matchmaker.api.rivet.gg/v1/lobbies/list').then(r => r.json())).lobbies
                .filter(lobby => !["sandbox", "event"].includes(lobby.game_mode_id));

                localStorage["lbbot_lobbies"] = JSON.stringify(lobbies);
                localStorage["lbbot_serverptr"] = 0;
            }

            this.servers = JSON.parse(localStorage["lbbot_lobbies"]);
            this.lobby = this.servers[+localStorage["lbbot_serverptr"]];
            this.nextLobby = this.servers[(+localStorage["lbbot_serverptr"]) + 1];

            console.log(`${+localStorage["lbbot_serverptr"] - 1}/${this.servers.length} servers done!`);

            this.parseServerCodes();
        }

        /** Parses server codes. */
        parseServerCodes() {
            const lobbyServerId = this.lobby.lobby_id;
            const nextLobbyServerId = this.nextLobby.lobby_id;

            this.lobby.link = this.nextLobby.link = "https://diep.io/#";

            for (const char of lobbyServerId) {
                const code = char.charCodeAt(0);
                const value = (`00${code.toString(16)}`).slice(-2);
                this.lobby.link += value.split("").reverse().join("").toUpperCase();
            }

            if (this.nextLobby) {
                for (const char of nextLobbyServerId) {
                    const code = char.charCodeAt(0);
                    const value = (`00${code.toString(16)}`).slice(-2);
                    this.nextLobby.link += value.split("").reverse().join("").toUpperCase();
                }
            }

            if (window.location.href !== this.lobby.link) {
                console.log(window.location.href, this.lobby.link);
                window.location.href = this.lobby.link;
                window.location.reload();
            }
        }

        /** Moves to the next server. */
        move() {
            ++localStorage["lbbot_serverptr"];
            if (this.nextLobby === undefined) {
                alert("Finished collecting servers!");

                delete localStorage.lbbot_lobbies;
                delete localStorage.lbbot_serverptr;
            }

            window.location.href = this.nextLobby;
            window.location.reload();
        }
    };

    /** Scanner class, reads the leaderboard. */
    const Scanner = class {
        /** Start reading text. Precedes "Scoreboard" and antecedes "Lvl 1 Tank". */
        read = false;
        /** Raw text collected by scanner. */
        text = "";
        /** The scoreboard collected. */
        scoreboard = [];

        constructor(lobby) {
            this.lobby = lobby;

            setInterval(() => input.trySpawn("LB Bot"), 150);

            /** Hooks CRC2D to see what is being rendered. */
            crc2d.prototype.fillText = new Proxy(crc2d.prototype.fillText, {
                apply: (f, _this, args) => {
                    if (this.read) this.#collect(args[0]);

                    /** If "Scoreboard" is read, everything after is part of the scoreboard */
                    if (args[0] === "Scoreboard") this.read = true;
                    return f.apply(_this, args);
                }
            });

            crc2d.prototype.fillRect = new Proxy(crc2d.prototype.fillRect, {
                apply(f, _this, args) {
                    if (this.read) console.log(_this.fillStyle);
                    return f.apply(_this, args);
                }
            });
        }

        /** Collects data from scoreboard. */
        #collect(text) {
            if (possibilities.includes(text)) {
                /** End of scoreboard. */
                this.read = false;
                this.#parse();
            }

            if (text.split("").map(x => x.charCodeAt()).length === 0) this.text += "\n";
            else this.text += text;
        }

        #parse() {
            const entries = this.text.split("\n");
            console.log(this.text);
            for (const entry of entries) {
                if (!entry) continue;

                let [name, score] = entry.split(" - ");

                if (!score) { // Unnamed tank.
                    score = name;
                    name = "unnamed";
                }

                if (!score.includes(".")) {
                    score = `.${score}`;
                    console.log(score);
                }

                /** As a consequence of lerp, the score displayed at the first frame is a tenth of the real score. */
                score = +score * 10 * 1000;
                this.scoreboard.push({ name, score });
            }

            console.log(this.scoreboard);
            socket.send(JSON.stringify({
                server: this.lobby.lobby,
                scores: this.scoreboard,
                end: this.lobby.nextLobby === undefined
            }));

            this.lobby.move();
        }
    };

    new Scanner(new Lobby());

    /** Disable debugger when opening console. */
    Function.prototype.constructor = new Proxy(Function.prototype.constructor, {
        apply(f, _this, args) {
            args[0] === "debugger" && (args[0] = "");
            return f.apply(_this, args);
        }
    });

    /** Credits to ABC for his Score Precision script! */
    const thousandPrecision = 6;
    const millionPrecision = 2;

    const encoder = new TextEncoder();

    const replaces = [
        ['%.1fm\x00', `%.${millionPrecision}f$ \x00`],
        ['%.1fk\x00', `%.${thousandPrecision}f \x00`],
    ].map((replace) => replace.map(str => encoder.encode(str)));

    const replaceOf = (buf, from, to) => {
        iter: for (let i = buf.length - (1 + from.length); i >= 0; --i) {
            for (let j = from.length - 1; j >= 0; --j) {
                if (from[j] === buf[i + j]) continue;
                continue iter;
            }

            for (let j = 0; j < from.length - 1; ++j) {
                buf[i + j] = to[j]
            }

            return buf;
        }
        return buf;
    }

    const _instantiate = WebAssembly.instantiate;

    WebAssembly.instantiate = async function inst(bin, options) {
        bin = new Uint8Array(bin);
        const wasm = await _instantiate(replaces.reduce((upd, [from, to]) => replaceOf(upd, from, to), bin).buffer, options)
        console.log("Successfully improved score precision");
        return wasm;
    }

    WebAssembly.instantiateStreaming = (blob, imports) => blob.arrayBuffer().then(bytes => WebAssembly.instantiate(bytes, imports));
})();