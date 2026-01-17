import { handleSearchTrainTickets } from './tools/TrainTicketTool';

const test = async () => {
    console.log("Testing Train Ticket Tool...");

    // 1. Search Beijing -> Shanghai
    // Use a date slightly in the future
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const dateStr = today.toISOString().split('T')[0];

    console.log(`\n--- 1. Search Beijing -> Shanghai (${dateStr}) ---`);
    const res = await handleSearchTrainTickets({ from: '北京', to: '上海', date: dateStr });

    if (res.isError) {
        console.error("Search Error:", res.content[0].text);
    } else {
        try {
            const data = JSON.parse(res.content[0].text);
            if (Array.isArray(data)) {
                console.log(`Found ${data.length} trains.`);
                if (data.length > 0) {
                    console.log("First train:", data[0]);
                }
            } else {
                console.log("Result:", res.content[0].text);
            }
        } catch (e) {
            console.log("Result (Raw):", res.content[0].text);
        }
    }

    // 2. Search Unknown Station
    console.log(`\n--- 2. Search Unknown -> Shanghai ---`);
    const res2 = await handleSearchTrainTickets({ from: 'Mars', to: 'Shanghai', date: dateStr }); // 'Shanghai' English might fail if map expects Chinese keys
    console.log("Result:", res2.content[0].text);
};

test().catch(console.error);
