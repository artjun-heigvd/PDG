import { QuestionInQueue } from "./questionInQueue";
import { Question } from "./question";
export declare class QuestionToSend extends QuestionInQueue {
    private readonly category;
    private readonly answers;
    private readonly question;
    constructor(q: Question, attack: boolean);
    getCategory(): string;
    getAnswers(): string[];
    getQuestion(): string;
}
