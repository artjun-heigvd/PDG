import { Player } from "./player";
import { Server } from "socket.io";
import { QuestionInQueue } from "./questionInQueue";
import { ConfigService } from "@nestjs/config";
import { GameManager } from "./gameManager";
export declare class Game {
    private readonly TIME_BETWEEN_QUESTION;
    private readonly READY_PLAYERS_THRESHOLD;
    private readonly NB_MIN_READY_PLAYERS;
    private readonly SIZE_OF_QUESTION_QUEUE;
    private readonly LEVEL1;
    private readonly LEVEL2;
    private readonly LEVEL3;
    private readonly LEVEL4;
    private readonly LEVEL1_t;
    private readonly LEVEL2_t;
    private readonly LEVEL3_t;
    private readonly LEVEL4_t;
    nbReady: number;
    private nbPlayerAlive;
    private nbQuestionsSent;
    private hasStarted;
    private hasEnded;
    private questionLoaded;
    private continueSending;
    private players;
    private leaderboard;
    private qManager;
    private server;
    private eventEmitter;
    private readonly configService;
    private gameManager;
    constructor(server: Server, configService: ConfigService, gameManager: GameManager);
    hasGameStarted(): boolean;
    stopGame(): Promise<void>;
    forceStopGame(): Promise<void>;
    getNbQuestions(): number;
    checkAndStartGame(): void;
    addPlayer(id: string, name: string, socket: any): Player;
    removePlayer(player: Player): void;
    getPlayers(): Map<string, Player>;
    getNbPlayers(): number;
    getNbPlayerAlive(): number;
    getNbReady(): number;
    getGameStatus(): string;
    startGame(): Promise<void>;
    getAllPlayerList(): Object[];
    private sendQuestionToEveryone;
    sendTimedQuestionToEveryone(): Promise<void>;
    private sendTimedQuestion;
    isQueueFull(player: Player): boolean;
    endGame(): void;
    hasGameEnded(): boolean;
    addQuestionToPlayer(id: string, question: QuestionInQueue): Promise<void>;
    emitCurrentQuestionOf(player: Player): void;
    attack(attacker: Player): Promise<void>;
    checkPlayerAnswer(player: Player, answer: number): boolean;
    getPlayerById(id: string): Player;
    sendLeaderboard(): void;
    emitLeaderboardToPlayer(player: Player): void;
    getRandomPlayer(attacker: Player): Player;
    waitForTheGameToBeStarted(): Promise<boolean>;
    private eliminatePlayer;
    sendFeedUpdate(text: string, player?: any): void;
}
