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
exports.QuestionManager = void 0;
const question_1 = require("./question");
const questionToSend_1 = require("./questionToSend");
const questionInQueue_1 = require("./questionInQueue");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const events_1 = require("events");
let QuestionManager = class QuestionManager {
    constructor(configService) {
        this.configService = configService;
        this.isFetching = false;
        this.isFetchingEasy = false;
        this.isFetchingMedium = false;
        this.isFetchingHard = false;
        this.qPool = new Map();
        this.easy_questions = [];
        this.medium_questions = [];
        this.hard_questions = [];
        this.QUESTION_MIN = parseInt(this.configService.get("QUESTION_MIN"));
        this.Q_FETCH_SIZE = parseInt(this.configService.get("Q_FETCH_SIZE"));
        this.HARD_Q = parseInt(this.configService.get("HARD_QUESTION"));
        this.MEDIUM_Q = parseInt(this.configService.get("MEDIUM_QUESTION"));
        this.API_URL = this.configService.get("API_URL");
        this.eventEmitter = new events_1.EventEmitter();
    }
    async initializeQuestions() {
        this.easy_questions = await this.fetchQuestions("easy");
        this.medium_questions = await this.fetchQuestions("medium");
        this.hard_questions = await this.fetchQuestions("hard");
        this.eventEmitter.emit("questionsFetched");
    }
    async waitForEasyQuestionsToBeFetched() {
        if (!this.isFetchingEasy) {
            return Promise.resolve();
        }
        console.log("Waiting for easy questions to be fetched");
        return new Promise((resolve) => {
            this.eventEmitter.once('easyQuestionsFetched', () => {
                console.log("Easy questions fetched");
                resolve();
            });
        });
    }
    async waitForMediumQuestionsToBeFetched() {
        if (!this.isFetchingMedium) {
            return Promise.resolve();
        }
        console.log("Waiting for medium questions to be fetched");
        return new Promise((resolve) => {
            this.eventEmitter.once('mediumQuestionsFetched', () => {
                console.log("Medium questions fetched");
                resolve();
            });
        });
    }
    async waitForHardQuestionsToBeFetched() {
        if (!this.isFetchingHard) {
            return Promise.resolve();
        }
        console.log("Waiting for hard questions to be fetched");
        return new Promise((resolve) => {
            this.eventEmitter.once('hardQuestionsFetched', () => {
                console.log("Hard questions fetched");
                resolve();
            });
        });
    }
    async waitForQuestionsToBeFetched() {
        if (!this.isFetching) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.eventEmitter.once('questionFetched', () => resolve());
        });
    }
    getUnusedQuestions() {
        return (this.easy_questions.length +
            this.medium_questions.length +
            this.hard_questions.length);
    }
    check(q, answer) {
        if (!this.qPool.has(q.getId())) {
            throw new Error("Question is not yet present in the game");
        }
        let question = this.qPool.get(q.getId());
        return question.getCorrectAnswer() == answer;
    }
    get(q) {
        if (!this.qPool.has(q.getId())) {
            return;
        }
        return new questionToSend_1.QuestionToSend(this.qPool.get(q.getId()), q.getIsAttack());
    }
    async newQuestion(isAttack) {
        let rnd = Math.floor(Math.random() * 10);
        let q;
        const fetchAndGetQuestion = async (questionArray, difficulty) => {
            if (questionArray.length < this.QUESTION_MIN) {
                if (difficulty == "hard") {
                    this.isFetchingHard = true;
                }
                else if (difficulty == "medium") {
                    this.isFetchingMedium = true;
                }
                else {
                    this.isFetchingEasy = true;
                }
                questionArray = await this.fetchQuestions(difficulty);
            }
            return questionArray.shift();
        };
        do {
            if ((rnd >= this.HARD_Q || isAttack) && this.isFetchingHard) {
                await this.waitForHardQuestionsToBeFetched();
            }
            else if ((rnd >= this.MEDIUM_Q) && this.isFetchingMedium) {
                await this.waitForMediumQuestionsToBeFetched();
            }
            else if (this.isFetchingEasy) {
                await this.waitForEasyQuestionsToBeFetched();
            }
            if (rnd >= this.HARD_Q || isAttack) {
                if (this.isFetchingHard)
                    continue;
                q = await fetchAndGetQuestion(this.hard_questions, "hard");
            }
            else if (rnd >= this.MEDIUM_Q) {
                if (this.isFetchingMedium)
                    continue;
                q = await fetchAndGetQuestion(this.medium_questions, "medium");
            }
            else {
                if (this.isFetchingEasy)
                    continue;
                q = await fetchAndGetQuestion(this.easy_questions, "easy");
            }
            if (!q) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } while (!q || this.qPool.has(q.getId()));
        this.qPool.set(q.getId(), q);
        return new questionInQueue_1.QuestionInQueue(q, isAttack);
    }
    async fetchQuestions(difficulty = undefined) {
        let url = this.API_URL + "?limit=" + this.Q_FETCH_SIZE;
        if (difficulty != undefined) {
            url += "&difficulties=" + difficulty;
        }
        let list = [];
        this.isFetching = true;
        try {
            const response = await fetch(url);
            const json = await response.json();
            list = json.map((question) => new question_1.Question(question));
            if (difficulty == "easy") {
                this.isFetchingEasy = false;
                this.eventEmitter.emit("easyQuestionsFetched");
            }
            else if (difficulty == "medium") {
                this.isFetchingMedium = false;
                this.eventEmitter.emit("mediumQuestionsFetched");
            }
            else if (difficulty == "hard") {
                this.isFetchingHard = false;
                this.eventEmitter.emit("hardQuestionsFetched");
            }
            return list;
        }
        catch (err) {
            console.error("Error fetching or parsing questions:", err);
            return [];
        }
        finally {
            this.isFetching = false;
        }
    }
};
exports.QuestionManager = QuestionManager;
exports.QuestionManager = QuestionManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QuestionManager);
//# sourceMappingURL=questionManager.js.map