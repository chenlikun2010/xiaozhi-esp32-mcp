import { handleStartMbtiTest, handleAnswerQuestion, handleCalculateResult } from './tools/MbtiTool';

const test = async () => {
    console.log("Testing MBTI Refactored Flow...");

    // 1. Start Test
    console.log("\n--- 1. Start Test ---");
    const startRes = await handleStartMbtiTest({ mode: 'simple' });
    const startData = JSON.parse(startRes.content[0].text);
    console.log("Started:", startData.message);

    let currentSession = startData.session;
    let currentQ = startData.question;

    console.log("Q1:", currentQ);

    // 2. Answer Loop (Simulate INTJ - High Score on I, N, T, J = Low Score on E, S, T, J in updated logic?)
    // Wait, in my logic:
    // EI: 5=E, 1=I. So for INTJ, I need 1s.
    // SN: 5=S, 1=N. So for INTJ, I need 1s.
    // TF: 5=T, 1=F. So for INTJ, I need 5s.
    // JP: 5=J, 1=P. So for INTJ, I need 5s.

    // Let's answer 28 questions
    // Q1-Q7 (EI): Answer 1 (Introvert)
    // Q8-Q14 (SN): Answer 1 (Intuitive)
    // Q15-Q21 (TF): Answer 5 (Thinking)
    // Q22-Q28 (JP): Answer 5 (Judging)

    const answers = [
        ...Array(7).fill(1), // EI -> I
        ...Array(7).fill(1), // SN -> N
        ...Array(7).fill(5), // TF -> T
        ...Array(7).fill(5)  // JP -> J
    ];

    for (let i = 0; i < answers.length; i++) {
        const val = answers[i];
        // console.log(`Answering Q${i+1} with ${val}...`);
        const ansRes = await handleAnswerQuestion({ session: currentSession, answer: val });
        const ansData = JSON.parse(ansRes.content[0].text);

        currentSession = ansData.session;

        if (ansData.isFinished) {
            console.log("Test Finished!");
            break;
        } else {
            // console.log(`Next Q: ${ansData.question}`);
        }
    }

    // 3. Calculate
    console.log("\n--- 3. Calculate Result ---");
    const finalRes = await handleCalculateResult({ session: currentSession });
    console.log("Final Report:");
    console.log(finalRes.content[0].text);

    if (finalRes.content[0].text.includes("**INTJ**")) {
        console.log("\nSUCCESS: Correctly identified INTJ.");
    } else {
        console.error("\nFAILURE: Wrong Type.");
    }
};

test().catch(console.error);
