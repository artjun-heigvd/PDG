"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
class Question {
    constructor(data) {
        this.answers = [];
        this.id = data.id;
        this.category = data.category;
        this.question = data.question;
        this.difficulty = data.difficulty;
        this.correctAnsw = Math.floor(Math.random() * 4);
        for (var n = 0; n < 3; n++) {
            if (n == this.correctAnsw)
                this.answers.push(data.correctAnswer);
            this.answers.push(data.incorrectAnswers[n]);
        }
        if (this.answers.length < 4) {
            this.answers.push(data.correctAnswer);
        }
    }
    getId() {
        return this.id;
    }
    getDifficulty() {
        return this.difficulty;
    }
    getCategory() {
        return this.category;
    }
    getAnswers() {
        return this.answers;
    }
    getCorrectAnswer() {
        return this.correctAnsw;
    }
    getQuestion() {
        return this.question;
    }
}
exports.Question = Question;
//# sourceMappingURL=question.js.map