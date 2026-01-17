import dotenv from 'dotenv';
dotenv.config();

import { handleHowToCook } from './tools/HowToCookTool';

const test = async () => {
    console.log("Testing HowToCook Tool...");

    // Test Case 1: Simple Dish
    console.log("\n--- Case 1: Scrambled Eggs with Tomato ---");
    const result1 = await handleHowToCook({ dish_name: "西红柿炒鸡蛋" });
    console.log("Result:", JSON.stringify(result1, null, 2));

    // Test Case 2: Complex Dish
    console.log("\n--- Case 2: Red Braised Pork ---");
    const result2 = await handleHowToCook({ dish_name: "红烧肉" });
    console.log("Result:", JSON.stringify(result2, null, 2));
};

test().catch(console.error);
