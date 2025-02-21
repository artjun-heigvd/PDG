import { Game } from "./game";
import { Server } from "socket.io";
import { ConfigService } from "@nestjs/config";
export declare class GameManager {
    game: Game;
    server: Server;
    configService: ConfigService;
    howManyGamesHaveFinished: number;
    hasGameFinishedResetting: boolean;
    END_OF_GAME_RANKING_COOLDOWN: number;
    constructor(server: Server, configService: ConfigService);
    getHowManyGamesHaveFinished(): number;
    resetGame(): void;
    resetGameInSomeTime(): void;
}
