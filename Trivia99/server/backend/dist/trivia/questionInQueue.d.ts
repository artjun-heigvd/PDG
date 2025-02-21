import { Question } from "./question";
export declare class QuestionInQueue {
    private readonly id;
    private readonly difficulty;
    private readonly isAttack;
    constructor(q: Question, attack: boolean);
    getId(): string;
    getDifficulty(): string;
    getIsAttack(): boolean;
}
