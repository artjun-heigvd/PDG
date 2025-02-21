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
exports.GameManager = void 0;
const game_1 = require("./game");
const socket_io_1 = require("socket.io");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
let GameManager = class GameManager {
    constructor(server, configService) {
        this.howManyGamesHaveFinished = 0;
        this.hasGameFinishedResetting = false;
        this.game = new game_1.Game(server, configService, this);
        this.server = server;
        this.configService = configService;
        this.END_OF_GAME_RANKING_COOLDOWN = parseInt(configService.get("END_OF_GAME_RANKING_COOLDOWN"));
    }
    getHowManyGamesHaveFinished() {
        return this.howManyGamesHaveFinished;
    }
    resetGame() {
        this.game = new game_1.Game(this.server, this.configService, this);
        ++this.howManyGamesHaveFinished;
        this.hasGameFinishedResetting = true;
        this.server.emit("gameReset");
    }
    resetGameInSomeTime() {
        setTimeout(() => {
            this.resetGame();
        }, this.END_OF_GAME_RANKING_COOLDOWN * 1000);
    }
};
exports.GameManager = GameManager;
exports.GameManager = GameManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [socket_io_1.Server, config_1.ConfigService])
], GameManager);
//# sourceMappingURL=gameManager.js.map