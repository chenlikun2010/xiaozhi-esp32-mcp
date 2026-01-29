
import { handleReportExpert } from "./tools/ReportExpertTool";
import { ReportService } from "../services/ReportService";

// Mock ReportService manually
// (Since we are running via ts-node, we can't easily mock imports unless we use a library or are careful)
// Instead of mocking the import, we'll try to run the tool and handle the error gracefully, 
// OR we can rely on the fact that the tool calls ReportService methods.
// For this simple test, passing the extra argument and verifying it's called is key.
// We can override the methods on the actual imported object if it's configurable, but imports are read-only bindings in ESM/Babel usually.
// However, ts-node w/ CommonJS often allows overwriting if it's an object property.

// Actually, let's just make the script robust to failure. The notification happens *before* ReportService calls.
// So we don't *need* to mock ReportService success. We just need to catch the failure.
// But wait, the tool imports ReportService. 


async function testNotification() {
    console.log("=== Testing Report Expert Notification ===");

    let messageSent = false;
    let messageContent = "";

    const mockExtra = {
        sendLoggingMessage: async (params: any) => {
            console.log("[Mock] sendLoggingMessage called with:", params);
            messageSent = true;
            messageContent = params.data;
        }
    };

    const args = { query: "Test query", reportId: 100 };

    // We need to temporarily mock ReportService functions if we weren't using jest (which we aren't running via jest CLI here probably)
    // So let's manually mock ReportService methods for this script run using simple assignment if possible, 
    // or just rely on the real service failing gracefully or being fast.
    // Actually, to make it robust, let's just run it. The real service might fail if no DB, but that's fine as long as notification is sent FIRST.
    // Notification is sent BEFORE try/catch block? No, it's inside or before.
    // In ReportExpertTool.ts:
    // console.log(...)
    // if (extra && extra.sendLoggingMessage) { ... }
    // try { ... }

    // So it sends BEFORE any heavy lifting. This is good.

    try {
        console.log("Invoking handleReportExpert...");
        // We expect it to fail later due to missing DB connection, but notification should fire first.
        await handleReportExpert(args, mockExtra);
    } catch (e) {
        console.log("Tool execution finished (likely with error, which is expected without DB):", (e as any).message);
    }

    if (messageSent) {
        console.log("[PASS] Notification was sent.");
        if (messageContent.includes("放松一下")) {
            console.log("[PASS] Notification content is correct.");
        } else {
            console.error("[FAIL] Notification content mismatch:", messageContent);
        }
    } else {
        console.error("[FAIL] Notification was NOT sent.");
    }
}

testNotification();
