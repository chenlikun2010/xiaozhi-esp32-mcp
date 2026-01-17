import { z } from 'zod';

// --- Data Structures ---

interface Question {
    id: string;
    text: string;
    dimensionKey: 'EI' | 'SN' | 'TF' | 'JP';
}

interface TestSession {
    mode: 'simple' | 'cognitive';
    currentIndex: number;
    answers: Record<string, number>; // Question ID -> Score (1-5)
}

// --- Question Bank (28 Questions - Simplified Mode) ---
const QUESTIONS_SIMPLE: Question[] = [
    // E vs I (7 Questions) - High Score (5) = Extraversion, Low Score (1) = Introversion
    { id: "EI1", text: "You feel recharged after being around a lot of people.", dimensionKey: "EI" },
    { id: "EI2", text: "You initiate conversations with strangers easily.", dimensionKey: "EI" },
    { id: "EI3", text: "You prefer a busy, fast-paced environment.", dimensionKey: "EI" },
    { id: "EI4", text: "You tend to think out loud rather than internally.", dimensionKey: "EI" },
    { id: "EI5", text: "You enjoy being the center of attention.", dimensionKey: "EI" },
    { id: "EI6", text: "You have a wide circle of acquaintances.", dimensionKey: "EI" },
    { id: "EI7", text: "You are often described as energetic and active.", dimensionKey: "EI" },

    // S vs N (7 Questions) - High Score (5) = Sensing, Low Score (1) = Intuition
    { id: "SN1", text: "You trust facts and experience more than theories.", dimensionKey: "SN" },
    { id: "SN2", text: "You focus on the present moment rather than future possibilities.", dimensionKey: "SN" },
    { id: "SN3", text: "You prefer clear, concrete instructions.", dimensionKey: "SN" },
    { id: "SN4", text: "You notice small details that others miss.", dimensionKey: "SN" },
    { id: "SN5", text: "You are more practical than imaginative.", dimensionKey: "SN" },
    { id: "SN6", text: "You prefer to do things the established way.", dimensionKey: "SN" },
    { id: "SN7", text: "You describe things literally rather than metaphorically.", dimensionKey: "SN" },

    // T vs F (7 Questions) - High Score (5) = Thinking, Low Score (1) = Feeling
    { id: "TF1", text: "You make decisions based on logic rather than emotions.", dimensionKey: "TF" },
    { id: "TF2", text: "It is more important to be truthful than tactful.", dimensionKey: "TF" },
    { id: "TF3", text: "You value competence and efficiency over harmony.", dimensionKey: "TF" },
    { id: "TF4", text: "You can easily criticize others when necessary.", dimensionKey: "TF" },
    { id: "TF5", text: "You rely on objective criteria for judgment.", dimensionKey: "TF" },
    { id: "TF6", text: "You are not easily offended by arguments.", dimensionKey: "TF" },
    { id: "TF7", text: "You prioritize justice/fairness over mercy.", dimensionKey: "TF" },

    // J vs P (7 Questions) - High Score (5) = Judging, Low Score (1) = Perceiving
    { id: "JP1", text: "You like to have a detailed plan before starting.", dimensionKey: "JP" },
    { id: "JP2", text: "You prefer to finish work before relaxing.", dimensionKey: "JP" },
    { id: "JP3", text: "You dislike last-minute changes.", dimensionKey: "JP" },
    { id: "JP4", text: "You keep your workspace organized and tidy.", dimensionKey: "JP" },
    { id: "JP5", text: "You make decisions quickly and stick to them.", dimensionKey: "JP" },
    { id: "JP6", text: "You prefer structure and schedules.", dimensionKey: "JP" },
    { id: "JP7", text: "You feel uncomfortable without a clear goal.", dimensionKey: "JP" }
];

// --- Tool Definitions ---

export const StartMbtiTestDefinition = {
    name: "start_mbti_test",
    description: "Start a new MBTI personality test. Returns the first question and a session object.",
    schema: {
        mode: z.enum(['simple', 'cognitive']).optional().describe("Test mode. 'simple' (28 questions) or 'cognitive' (48 questions). Defaults to 'simple'.")
    }
};

export const AnswerQuestionDefinition = {
    name: "answer_question",
    description: "Submit an answer to the current question and get the next one.",
    schema: {
        session: z.string().describe("The current test session JSON string."),
        answer: z.number().min(1).max(5).describe("Your answer score (1-5). 1=Strongly Disagree, 5=Strongly Agree.")
    }
};

export const CalculateMbtiResultDefinition = {
    name: "calculate_mbti_result",
    description: "Calculate the final MBTI type based on the completed session.",
    schema: {
        session: z.string().describe("The completed test session JSON string.")
    }
};

// --- Handlers ---

export async function handleStartMbtiTest(args: { mode?: 'simple' | 'cognitive' }) {
    const mode = args.mode || 'simple';
    console.log(`[Chat Log] MBTI Start: Mode=${mode}`);

    const session: TestSession = {
        mode,
        currentIndex: 0,
        answers: {}
    };

    const firstQ = QUESTIONS_SIMPLE[0];

    return {
        content: [{
            type: "text" as const,
            text: JSON.stringify({
                message: "Test started.",
                question: firstQ.text,
                questionId: firstQ.id,
                totalQuestions: QUESTIONS_SIMPLE.length,
                progress: "1/" + QUESTIONS_SIMPLE.length,
                session: JSON.stringify(session)
            })
        }]
    };
}

export async function handleAnswerQuestion(args: { session: string, answer: number }) {
    let session: TestSession;
    try {
        session = JSON.parse(args.session);
    } catch (e) {
        throw new Error("Invalid session JSON.");
    }

    const currentQ = QUESTIONS_SIMPLE[session.currentIndex];
    if (!currentQ) {
        return { content: [{ type: "text" as const, text: "Error: Question index out of bounds." }] };
    }

    // Record answer
    session.answers[currentQ.id] = args.answer;

    // Advance
    session.currentIndex++;

    // Check if finished
    if (session.currentIndex >= QUESTIONS_SIMPLE.length) {
        return {
            content: [{
                type: "text" as const,
                text: JSON.stringify({
                    message: "All questions answered. Please call 'calculate_mbti_result'.",
                    isFinished: true,
                    session: JSON.stringify(session)
                })
            }]
        };
    }

    const nextQ = QUESTIONS_SIMPLE[session.currentIndex];

    return {
        content: [{
            type: "text" as const,
            text: JSON.stringify({
                question: nextQ.text,
                questionId: nextQ.id,
                progress: `${session.currentIndex + 1}/${QUESTIONS_SIMPLE.length}`,
                session: JSON.stringify(session)
            })
        }]
    };
}

export async function handleCalculateResult(args: { session: string }) {
    let session: TestSession;
    try {
        session = JSON.parse(args.session);
    } catch (e) {
        throw new Error("Invalid session JSON.");
    }

    console.log(`[Chat Log] MBTI Calculate`);

    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    for (const q of QUESTIONS_SIMPLE) {
        const val = session.answers[q.id];
        if (val === undefined) continue;

        // Logic: 1=Strongly Disagree (Introvert/Intuition/Feeling/Perceiving), 5=Strongly Agree (Extravert/Sensing/Thinking/Judging)
        // Midpoint is 3.

        // E/I
        if (q.dimensionKey === 'EI') {
            scores.E += val;
            scores.I += (6 - val); // Invert for I
        }
        // S/N
        else if (q.dimensionKey === 'SN') {
            scores.S += val;
            scores.N += (6 - val);
        }
        // T/F
        else if (q.dimensionKey === 'TF') {
            scores.T += val;
            scores.F += (6 - val);
        }
        // J/P
        else if (q.dimensionKey === 'JP') {
            scores.J += val;
            scores.P += (6 - val);
        }
    }

    const type = [
        scores.E >= scores.I ? 'E' : 'I',
        scores.S >= scores.N ? 'S' : 'N',
        scores.T >= scores.F ? 'T' : 'F',
        scores.J >= scores.P ? 'J' : 'P'
    ].join('');

    const description = `Your MBTI Type is **${type}**.\n\n` +
        `Scores:\n` +
        `- Extraversion vs Introversion: ${scores.E} vs ${scores.I}\n` +
        `- Sensing vs Intuition: ${scores.S} vs ${scores.N}\n` +
        `- Thinking vs Feeling: ${scores.T} vs ${scores.F}\n` +
        `- Judging vs Perceiving: ${scores.J} vs ${scores.P}`;

    return {
        content: [{ type: "text" as const, text: description }]
    };
}
