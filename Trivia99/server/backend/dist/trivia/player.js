"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(name, id, socket, configService) {
        this.configService = configService;
        this.name = name;
        this.queue = [];
        this.streak = 0;
        this.isAlive = true;
        this.isReady = false;
        this.nbBadAnswers = 0;
        this.nbGoodAnswers = 0;
        this.id = id;
        this.rank = 0;
        this.currentSocket = socket;
        this.lastWrongAnswerTime = 0;
        this.configService = configService;
        this.STREAK = parseInt(this.configService.get("STREAK"));
    }
    getId() {
        return this.id;
    }
    updateWrongAnswerTime() {
        this.lastWrongAnswerTime = Date.now();
    }
    getWrongAnswerTime() {
        return this.lastWrongAnswerTime;
    }
    getCurrentQuestion() {
        return this.currentQuestion;
    }
    nextQuestion() {
        if (this.queue.length > 0) {
            this.currentQuestion = this.queue.shift();
            return this.getCurrentQuestion();
        }
        else {
            this.currentQuestion = undefined;
        }
    }
    getNbQuestionsInQueue() {
        return this.queue.length;
    }
    unalive(rank) {
        this.isAlive = false;
        this.rank = rank;
    }
    resetStreak() {
        this.streak = 0;
    }
    incrementStreak() {
        ++this.streak;
    }
    getStreak() {
        return this.streak;
    }
    addQuestion(question) {
        if (this.currentQuestion == undefined) {
            this.currentQuestion = question;
        }
        else {
            this.queue.push(question);
        }
    }
    removeQuestion() {
        this.queue.shift();
    }
    getUserInfo() {
        return {
            streak: this.streak,
            canAttack: this.streak >= this.STREAK,
            isAlive: this.isAlive,
            nbBadAnswers: this.nbBadAnswers,
            nbGoodAnswers: this.nbGoodAnswers,
            rank: this.rank,
            questions: this.queue,
        };
    }
    correctAnswer() {
        this.nextQuestion();
        this.addGoodAnswer();
        this.incrementStreak();
    }
    badAnswer() {
        this.addBadAnswer();
        this.resetStreak();
    }
    changeSocket(socket) {
        this.currentSocket = socket;
    }
    getSocket() {
        return this.currentSocket;
    }
    getName() {
        return this.name;
    }
    getScore() {
        return this.nbGoodAnswers;
    }
    alive() {
        return this.isAlive;
    }
    getGoodAnswers() {
        return this.nbGoodAnswers;
    }
    getBadAnswers() {
        return this.nbBadAnswers;
    }
    addBadAnswer() {
        this.nbBadAnswers++;
    }
    addGoodAnswer() {
        this.nbGoodAnswers++;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map