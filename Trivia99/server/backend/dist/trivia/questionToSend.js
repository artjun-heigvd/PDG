"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionToSend = void 0;
const questionInQueue_1 = require("./questionInQueue");
class QuestionToSend extends questionInQueue_1.QuestionInQueue {
    constructor(q, attack) {
        super(q, attack);
        this.category = q.getCategory();
        this.answers = q.getAnswers();
        this.question = q.getQuestion();
    }
    getCategory() {
        return this.category;
    }
    getAnswers() {
        return this.answers;
    }
    getQuestion() {
        return this.question;
    }
}
exports.QuestionToSend = QuestionToSend;
//# sourceMappingURL=questionToSend.js.map