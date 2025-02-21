"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionInQueue = void 0;
class QuestionInQueue {
    constructor(q, attack) {
        this.id = q.getId();
        this.difficulty = q.getDifficulty();
        this.isAttack = attack;
    }
    getId() {
        return this.id;
    }
    getDifficulty() {
        return this.difficulty;
    }
    getIsAttack() {
        return this.isAttack;
    }
}
exports.QuestionInQueue = QuestionInQueue;
//# sourceMappingURL=questionInQueue.js.map