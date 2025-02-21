"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const trivia_gateway_1 = require("./trivia/trivia.gateway");
const config_1 = require("@nestjs/config");
const game_1 = require("./trivia/game");
const socket_io_1 = require("socket.io");
const gameManager_1 = require("./trivia/gameManager");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
        ],
        providers: [
            gameManager_1.GameManager,
            {
                provide: game_1.Game,
                useValue: new game_1.Game(new socket_io_1.Server(), new config_1.ConfigService(), new gameManager_1.GameManager(new socket_io_1.Server(), new config_1.ConfigService())),
            },
            app_service_1.AppService,
            trivia_gateway_1.TriviaGateway,
            {
                provide: socket_io_1.Server,
                useValue: new socket_io_1.Server(),
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map