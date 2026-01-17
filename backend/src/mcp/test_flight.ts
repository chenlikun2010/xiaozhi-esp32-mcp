import { handleSearchFlightTickets } from './tools/FlightTicketTool';

async function test() {
    console.log("Testing Flight Search Tool via Puppeteer...");

    try {
        // Test Case 1: Shanghai to Beijing tomorrow (or future date)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const result = await handleSearchFlightTickets({
            departure_city: "上海",
            destination_city: "北京",
            date: dateStr
        });

        console.log("Result:", JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
