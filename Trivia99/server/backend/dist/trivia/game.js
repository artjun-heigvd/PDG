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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const player_1 = require("./player");
const questionManager_1 = require("./questionManager");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const events_1 = require("events");
const gameManager_1 = require("./gameManager");
class Rank {
    constructor(player, rank) {
        this.playerid = player.getId();
        this.playerName = player.getName();
        this.rank = rank;
        this.goodAnswers = player.getGoodAnswers();
        this.badAnswers = player.getBadAnswers();
    }
}
let Game = class Game {
    constructor(server, configService, gameManager) {
        this.nbReady = 0;
        this.nbPlayerAlive = 0;
        this.players = new Map();
        this.hasStarted = false;
        this.hasEnded = false;
        this.server = server;
        this.configService = configService;
        this.gameManager = gameManager;
        this.questionLoaded = false;
        this.eventEmitter = new events_1.EventEmitter();
        this.continueSending = true;
        this.nbQuestionsSent = 0;
        this.TIME_BETWEEN_QUESTION =
            parseInt(this.configService.get("TIME_BETWEEN_QUESTION")) * 1000;
        this.READY_PLAYERS_THRESHOLD = parseFloat(this.configService.get("READY_PLAYERS_THRESHOLD"));
        this.NB_MIN_READY_PLAYERS = parseInt(this.configService.get("NB_MIN_READY_PLAYERS"));
        this.SIZE_OF_QUESTION_QUEUE = parseInt(this.configService.get("SIZE_OF_QUESTION_QUEUE"));
        this.LEVEL1 = parseInt(this.configService.get("LEVEL1"));
        this.LEVEL2 = parseInt(this.configService.get("LEVEL2"));
        this.LEVEL3 = parseInt(this.configService.get("LEVEL3"));
        this.LEVEL4 = parseInt(this.configService.get("LEVEL4"));
        this.LEVEL1_t = parseFloat(this.configService.get("LEVEL1_T"));
        this.LEVEL2_t = parseFloat(this.configService.get("LEVEL2_T"));
        this.LEVEL3_t = parseFloat(this.configService.get("LEVEL3_T"));
        this.LEVEL4_t = parseFloat(this.configService.get("LEVEL4_T"));
        this.eventEmitter = new events_1.EventEmitter();
    }
    hasGameStarted() {
        return this.hasStarted;
    }
    async stopGame() {
        await this.forceStopGame();
        this.gameManager.resetGameInSomeTime();
    }
    async forceStopGame() {
        this.continueSending = false;
        if (this.qManager !== undefined) {
            await this.qManager.waitForQuestionsToBeFetched();
        }
    }
    getNbQuestions() {
        return this.qManager.getUnusedQuestions();
    }
    checkAndStartGame() {
        if (!this.hasStarted) {
            if (this.getNbReady() >= this.NB_MIN_READY_PLAYERS &&
                this.getNbReady() >= this.getNbPlayers() * this.READY_PLAYERS_THRESHOLD) {
                this.startGame().then(() => console.log("Game started"));
            }
        }
    }
    addPlayer(id, name, socket) {
        let player = new player_1.Player(name, id, socket, this.configService);
        this.players.set(id, player);
        this.sendFeedUpdate(name + " joined the game");
        return player;
    }
    removePlayer(player) {
        this.players.delete(player.getId());
    }
    getPlayers() {
        return this.players;
    }
    getNbPlayers() {
        return this.players.size;
    }
    getNbPlayerAlive() {
        return this.nbPlayerAlive;
    }
    getNbReady() {
        return this.nbReady;
    }
    getGameStatus() {
        let answer;
        if (this.hasGameStarted()) {
            answer = "started";
        }
        else if (this.hasGameEnded()) {
            answer = "ended";
        }
        else {
            answer = "waiting";
        }
        return answer;
    }
    async startGame() {
        this.hasStarted = true;
        this.qManager = new questionManager_1.QuestionManager(this.configService);
        await this.qManager.initializeQuestions();
        this.questionLoaded = true;
        this.eventEmitter.emit("loaded");
        this.nbPlayerAlive = this.players.size;
        this.server.emit("startGame", {
            msg: "The game has started",
        });
        await this.sendTimedQuestionToEveryone();
        this.leaderboard = [];
    }
    getAllPlayerList() {
        let list = [];
        this.players.forEach((player) => {
            let smallPlayer = {
                isAlive: player.alive(),
                name: player.getName(),
            };
            list.push(smallPlayer);
        });
        return list;
    }
    async sendQuestionToEveryone() {
        let question = await this.qManager.newQuestion(false);
        this.players.forEach((_player, id) => {
            if (this.players.get(id).alive()) {
                this.addQuestionToPlayer(id, question);
            }
        });
    }
    async sendTimedQuestionToEveryone() {
        setTimeout(async () => {
            await this.sendQuestionToEveryone();
        }, 1000);
        setTimeout(async () => {
            await this.sendTimedQuestion();
        }, this.TIME_BETWEEN_QUESTION);
    }
    async sendTimedQuestion() {
        await this.sendQuestionToEveryone();
        ++this.nbQuestionsSent;
        let modifier = 1;
        if (this.continueSending) {
            if (this.nbQuestionsSent >= this.LEVEL4) {
                modifier = this.LEVEL4_t;
            }
            else if (this.nbQuestionsSent >= this.LEVEL3) {
                modifier = this.LEVEL3_t;
            }
            else if (this.nbQuestionsSent >= this.LEVEL2) {
                modifier = this.LEVEL2_t;
            }
            else if (this.nbQuestionsSent >= this.LEVEL1) {
                modifier = this.LEVEL1_t;
            }
            setTimeout(async () => {
                await this.sendTimedQuestion();
            }, this.TIME_BETWEEN_QUESTION * modifier);
        }
    }
    isQueueFull(player) {
        return player.getNbQuestionsInQueue() >= this.SIZE_OF_QUESTION_QUEUE;
    }
    endGame() {
        this.players.forEach((player) => {
            if (player.alive()) {
                player.unalive(1);
                this.leaderboard.push(new Rank(player, 1));
            }
        });
        this.server.emit("endGame");
        this.hasStarted = false;
        this.hasEnded = true;
        this.stopGame();
    }
    hasGameEnded() {
        return this.hasEnded;
    }
    async addQuestionToPlayer(id, question) {
        let player = this.players.get(id);
        if (!this.isQueueFull(player)) {
            player.addQuestion(question);
            let info = player.getUserInfo();
            this.server.to(player.getSocket().id).emit("userInfo", info);
            await this.waitForTheGameToBeStarted();
            this.emitCurrentQuestionOf(player);
            this.server.to(player.getSocket().id).emit("userInfo", info);
        }
        else {
            this.eliminatePlayer(player);
        }
    }
    emitCurrentQuestionOf(player) {
        if (player.getCurrentQuestion() !== undefined) {
            this.server
                .to(player.getSocket().id)
                .emit("newQuestion", this.qManager.get(player.getCurrentQuestion()));
        }
        else {
            this.server.to(player.getSocket().id).emit("noMoreQuestions");
        }
    }
    async attack(attacker) {
        let target = this.getRandomPlayer(attacker);
        await this.addQuestionToPlayer(target.getId(), await this.qManager.newQuestion(true));
        this.sendFeedUpdate("You have been attacked by " + attacker.getName(), target);
        this.server
            .to(target.getSocket().id)
            .emit("userInfo", target.getUserInfo());
    }
    checkPlayerAnswer(player, answer) {
        if (this.qManager.check(player.getCurrentQuestion(), answer)) {
            player.correctAnswer();
            this.server
                .to(player.getSocket().id)
                .emit("userInfo", player.getUserInfo());
            this.emitCurrentQuestionOf(player);
            return true;
        }
        else {
            player.badAnswer();
            this.server
                .to(player.getSocket().id)
                .emit("userInfo", player.getUserInfo());
            return false;
        }
    }
    getPlayerById(id) {
        return this.players.get(id);
    }
    sendLeaderboard() {
        this.server.emit("ranking", this.leaderboard);
    }
    emitLeaderboardToPlayer(player) {
        player.getSocket().emit("ranking", this.leaderboard.reverse());
    }
    getRandomPlayer(attacker) {
        let availablePlayers;
        availablePlayers = [];
        this.players.forEach((player) => {
            if (player.alive() && player.getId() != attacker.getId()) {
                availablePlayers.push(player);
            }
        });
        const rnd = Math.floor(Math.random() * availablePlayers.length);
        return availablePlayers.at(rnd);
    }
    async waitForTheGameToBeStarted() {
        if (this.questionLoaded)
            return true;
        return new Promise((resolve) => {
            this.eventEmitter.once("loaded", () => resolve(true));
        });
    }
    eliminatePlayer(player) {
        if (player.alive()) {
            player.unalive(this.nbPlayerAlive);
            this.sendFeedUpdate(player.getName() + " has been eliminated");
            const rank = new Rank(player, this.nbPlayerAlive);
            this.leaderboard.push(rank);
            this.server.to(player.getSocket().id).emit("gameOver", rank.rank);
            this.server.emit("elimination", player.getName());
            if (--this.nbPlayerAlive === 1) {
                this.endGame();
            }
        }
    }
    sendFeedUpdate(text, player = undefined) {
        if (player != undefined) {
            this.server.to(player.getSocket().id).emit("feedUpdate", text);
        }
        else {
            this.server.emit("feedUpdate", text);
        }
    }
};
exports.Game = Game;
exports.Game = Game = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [socket_io_1.Server,
        config_1.ConfigService,
        gameManager_1.GameManager])
], Game);
//# sourceMappingURL=game.js.map