"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriviaGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const gameManager_1 = require("./gameManager");
const config_1 = require("@nestjs/config");
const cookie_1 = require("cookie");
const cors = process.env.CORS_URL != undefined
    ? process.env.CORS_URL
    : "http://localhost:3000";
let TriviaGateway = class TriviaGateway {
    constructor(configService) {
        this.configService = configService;
        this.STREAK = parseInt(this.configService.get("STREAK"));
        this.WRONG_ANSWER_COOLDOWN = parseInt(this.configService.get("WRONG_ANSWER_COOLDOWN"));
        this.MAX_PLAYER = parseInt(this.configService.get("MAX_PLAYER"));
    }
    onModuleInit() {
        if (this.gameManager == undefined) {
            this.gameManager = new gameManager_1.GameManager(this.server, this.configService);
        }
        this.server.on("connection", (socket) => {
            console.log(socket.id);
            console.log("Connected");
            let userId = this.getIdFromHeaders(socket);
            if (!userId) {
                this.generateAndSetCookie(socket);
            }
            else {
                if (this.gameManager.game.getPlayers().has(userId)) {
                    clearTimeout(this.gameManager.game.getPlayers().get(userId).isInTimeOut);
                    this.gameManager.game.getPlayers().get(userId).changeSocket(socket);
                }
            }
            socket.on("disconnect", () => {
                console.log(socket.id);
                console.log("Disconnected");
                let userId = this.getIdFromHeaders(socket);
                if (this.gameManager.game.getPlayers().has(userId) &&
                    !this.gameManager.game.hasGameStarted()) {
                    this.gameManager.game.getPlayers().get(userId).isInTimeOut =
                        setTimeout(() => {
                            console.log("User timed out");
                            if (this.gameManager.game.getPlayers().has(userId)) {
                                if (this.gameManager.game.getPlayers().get(userId).isReady) {
                                    --this.gameManager.game.nbReady;
                                }
                                this.gameManager.game.getPlayers().delete(userId);
                                this.sendReadyInfo();
                                if (this.gameManager.game.getNbPlayers() ===
                                    this.MAX_PLAYER - 1) {
                                    this.server.emit("gameNotFull");
                                }
                            }
                        }, 5000);
                }
            });
        });
    }
    generateAndSetCookie(socket) {
        const userId = socket.id;
        const cookieOptions = {
            httpOnly: true,
            maxAge: 60 * 60,
            sameSite: "strict",
            path: "/",
        };
        const serializedCookie = (0, cookie_1.serialize)("userId", userId, cookieOptions);
        socket.emit("setCookie", serializedCookie);
        socket.handshake.auth.token = serializedCookie;
        return userId;
    }
    sendReadyInfo() {
        this.server.emit("playersConnected", {
            nbReady: this.gameManager.game.getNbReady(),
            nbPlayers: this.gameManager.game.getNbPlayers(),
        });
    }
    getIdFromHeaders(socket) {
        const cookie = socket.handshake.auth.token;
        if (!cookie) {
            console.log("No cookie found");
            return null;
        }
        const parsedCookie = (0, cookie_1.parse)(cookie);
        return parsedCookie["userId"] || null;
    }
    onIsUserLogged(socket) {
        let loggedInfo = this.gameManager.game
            .getPlayers()
            .has(this.getIdFromHeaders(socket));
        this.server.to(socket.id).emit("loggedInfo", loggedInfo);
    }
    onLogin(name, socket) {
        if (this.gameManager.game.getNbPlayers() >= this.MAX_PLAYER) {
            return;
        }
        if (!this.gameManager.game.getPlayers().has(this.getIdFromHeaders(socket))) {
            let player = this.gameManager.game.addPlayer(this.getIdFromHeaders(socket), name, socket);
            if (this.gameManager.game.getNbPlayers() === this.MAX_PLAYER) {
                this.server.emit("gameFull");
            }
            let loggedInfo = this.gameManager.game
                .getPlayers()
                .has(this.getIdFromHeaders(socket));
            this.sendReadyInfo();
            this.server.to(socket.id).emit("loggedInfo", loggedInfo);
        }
    }
    onReady(socket) {
        const playerId = this.getIdFromHeaders(socket);
        if (this.gameManager.game.getPlayers().has(playerId) &&
            !this.gameManager.game.getPlayers().get(playerId).isReady) {
            this.gameManager.game.getPlayers().get(playerId).isReady = true;
            ++this.gameManager.game.nbReady;
        }
        this.sendReadyInfo();
        this.gameManager.game.checkAndStartGame();
    }
    onUnready(socket) {
        const playerId = this.getIdFromHeaders(socket);
        if (this.gameManager.game.getPlayers().has(playerId) &&
            this.gameManager.game.getPlayers().get(playerId).isReady) {
            this.gameManager.game.getPlayers().get(playerId).isReady = false;
            --this.gameManager.game.nbReady;
            this.sendReadyInfo();
        }
    }
    onQuestion(socket) {
        this.server.emit("onQuestion", {
            msg: "Question",
        });
    }
    onAttack(socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        const streak = player.getStreak();
        if (streak < this.STREAK)
            return;
        if (this.gameManager.game.getNbPlayerAlive() > 1) {
            const qSent = streak - this.STREAK;
            this.gameManager.game.sendFeedUpdate(player.getName() + " attacked with " + qSent + " question(s)");
            for (let i = 0; i <= qSent; i++) {
                console.log(player.getName() + " has attacked !");
                this.gameManager.game.attack(player);
            }
        }
        this.gameManager.game
            .getPlayerById(this.getIdFromHeaders(socket))
            .resetStreak();
        socket.emit("userInfo", player.getUserInfo());
    }
    onGetAllInfo(socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        if (player) {
            socket.emit("userInfo", player.getUserInfo());
            this.gameManager.game.emitCurrentQuestionOf(player);
            socket.emit("players", this.gameManager.game.getAllPlayerList());
        }
    }
    onAnswer(body, socket) {
        if (!this.gameManager.game.hasGameStarted()) {
            return;
        }
        const player = this.gameManager.game
            .getPlayers()
            .get(this.getIdFromHeaders(socket));
        if (player) {
            if (Date.now() - player.getWrongAnswerTime() <
                this.WRONG_ANSWER_COOLDOWN * 1000) {
                socket.emit("onCooldown", {
                    timeRemainingMs: this.WRONG_ANSWER_COOLDOWN -
                        (Date.now() - player.getWrongAnswerTime()),
                });
                return;
            }
            if (this.gameManager.game.checkPlayerAnswer(player, body)) {
                socket.emit("goodAnswer");
            }
            else {
                player.updateWrongAnswerTime();
                socket.emit("badAnswer");
            }
        }
    }
    onDeathUpdate(body, socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        this.server.emit("onDeath", this.getIdFromHeaders(socket));
    }
    getReadyInfo(socket) {
        this.sendReadyInfo();
    }
    getStreak(socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        socket.emit("streak", {
            streak: player.getStreak(),
        });
    }
    getRanking(socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        if (player) {
            this.gameManager.game.emitLeaderboardToPlayer(player);
        }
    }
    deleteUser(socket) {
        const player = this.gameManager.game.getPlayerById(this.getIdFromHeaders(socket));
        if (player) {
            this.gameManager.game.removePlayer(player);
            if (this.gameManager.game.getNbPlayers() === 0) {
                this.gameManager.resetGame();
            }
        }
    }
    getGameStatus(socket) {
        socket.emit("gameStatus", this.gameManager.game.getGameStatus());
    }
    isGameFull(socket) {
        if (this.gameManager.game.getNbPlayers() === this.MAX_PLAYER) {
            socket.emit("gameFull");
        }
        else {
            socket.emit("gameNotFull");
        }
    }
};
exports.TriviaGateway = TriviaGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TriviaGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("isUserLogged"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onIsUserLogged", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("login"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onLogin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("ready"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unready"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onUnready", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("question"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onQuestion", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("attack"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onAttack", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getAllInfo"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onGetAllInfo", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("answer"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("deathUpdate"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "onDeathUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getReadyInfo"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "getReadyInfo", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getStreak"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "getStreak", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getRanking"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "getRanking", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("deleteUser"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "deleteUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getGameStatus"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "getGameStatus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("isGameFull"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TriviaGateway.prototype, "isGameFull", null);
exports.TriviaGateway = TriviaGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: cors,
        },
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TriviaGateway);
//# sourceMappingURL=trivia.gateway.js.map