import { FanQieApi } from './FanQieApi.js';

const test = async () => {
    console.log("Testing FanQie Novel API...");
    const api = new FanQieApi();

    try {
        // 1. Search
        console.log("\n--- 1. Search Books ---");
        const searchRes = await api.searchBooks("三体");

        let bookId = "";
        if (searchRes.search_tabs) {
            const novelTab = searchRes.search_tabs.find((t: any) => t.data && t.data.length > 0);
            if (novelTab && novelTab.data && novelTab.data.length > 0) {
                bookId = novelTab.data[0].book_data[0].book_id;
                console.log("Found Book ID:", bookId);
            }
        }

        if (!bookId) {
            console.error("Could not find book ID. Aborting.");
            return;
        }

        // 2. Get Directory
        console.log("\n--- 3. Get Directory ---");
        const dirRes = await api.getBookDirectory(bookId);
        // console.log("Directory Result Keys:", Object.keys(dirRes));

        const dirData = dirRes.data || dirRes;

        let firstItemId = "";

        if (dirData.allItemIds && dirData.allItemIds.length > 0) {
            // Try first 3 chapters
            for (let i = 0; i < Math.min(3, dirData.allItemIds.length); i++) {
                const itemId = dirData.allItemIds[i];
                console.log(`\n--- Testing Chapter [${i}] (item_id: ${itemId}) ---`);
                try {
                    const contentRes = await api.getContent("novel", itemId, undefined, bookId);
                    if (contentRes.content) {
                        console.log(`Content Preview: ${contentRes.content.substring(0, 100).replace(/\n/g, ' ')}...`);
                    } else {
                        console.log("No content found");
                    }
                } catch (e: any) {
                    console.log(`Failed to get content for chapter ${i}: ${e.message}`);
                }
            }

            firstItemId = dirData.allItemIds[0];
        }
        else if (dirData.item_list && dirData.item_list.length > 0) {
            firstItemId = dirData.item_list[0].item_id;
            // console.log("Found item_id in item_list");
        }
        else if (dirData.chapter_list && dirData.chapter_list.length > 0) {
            firstItemId = dirData.chapter_list[0].item_id;
            // console.log("Found item_id in chapter_list");
        }

        if (!firstItemId) {
            console.error("No chapter ID found.");
            return;
        }
        console.log("Found Chapter ID:", firstItemId);

        // 4. Get Content
        console.log(`\n--- 4. Get Content (item_id: ${firstItemId}, book_id: ${bookId}) ---`);
        try {
            const contentRes = await api.getContent("novel", firstItemId, undefined, bookId);
            console.log("Content Result Keys:", Object.keys(contentRes));
            // Check if content is cleaned (no HTML tags)
            if (contentRes.content) {
                console.log("Content Preview (First 200 chars):", contentRes.content.substring(0, 200));
                const hasHtml = /<[^>]+>/.test(contentRes.content);
                console.log("Has HTML tags:", hasHtml);
            }
        } catch (e: any) {
            console.log("getContent failed:", e.message);
        }

        // 5. Get Chapter (Simple)
        console.log(`\n--- 5. Get Chapter Simple (item_id: ${firstItemId}) ---`);
        try {
            const chapRes = await api.getChapter(firstItemId);
            console.log("Chapter Result Keys:", Object.keys(chapRes));
            console.log("Chapter Data Sample:", JSON.stringify(chapRes).substring(0, 200));
        } catch (e: any) {
            console.log("getChapter failed:", e.message);
        }

        // 6. Get Raw Content
        console.log(`\n--- 6. Get Raw Content (item_id: ${firstItemId}) ---`);
        try {
            const rawRes = await api.getRawContent(firstItemId);
            console.log("Raw Result Keys:", Object.keys(rawRes));
            console.log("Raw Data Sample:", JSON.stringify(rawRes).substring(0, 200));
        } catch (e: any) {
            console.log("getRawContent failed:", e.message);
        }

    } catch (error: any) {
        console.error("Test Failed:", error.message);
    }
};

test().catch(console.error);
