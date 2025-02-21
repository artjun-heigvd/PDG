export declare class Question {
    private readonly id;
    private readonly category;
    private readonly answers;
    private readonly correctAnsw;
    private readonly question;
    private readonly difficulty;
    constructor(data: any);
    getId(): string;
    getDifficulty(): string;
    getCategory(): string;
    getAnswers(): string[];
    getCorrectAnswer(): number;
    getQuestion(): string;
}
