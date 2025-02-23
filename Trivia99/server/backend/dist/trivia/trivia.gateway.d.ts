import { Server } from "socket.io";
import { OnModuleInit } from "@nestjs/common";
import { GameManager } from "./gameManager";
import { ConfigService } from "@nestjs/config";
export declare class TriviaGateway implements OnModuleInit {
    configService: ConfigService;
    server: Server;
    gameManager: GameManager;
    private STREAK;
    private WRONG_ANSWER_COOLDOWN;
    private MAX_PLAYER;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private generateAndSetCookie;
    sendReadyInfo(): void;
    getIdFromHeaders(socket: any): string | null;
    onIsUserLogged(socket: any): void;
    onLogin(name: string, socket: any): void;
    onReady(socket: any): void;
    onUnready(socket: any): void;
    onQuestion(socket: any): void;
    onAttack(socket: any): void;
    onGetAllInfo(socket: any): void;
    onAnswer(body: any, socket: any): void;
    onDeathUpdate(body: any, socket: any): void;
    getReadyInfo(socket: any): void;
    getStreak(socket: any): void;
    getRanking(socket: any): void;
    deleteUser(socket: any): void;
    getGameStatus(socket: any): void;
    isGameFull(socket: any): void;
}
