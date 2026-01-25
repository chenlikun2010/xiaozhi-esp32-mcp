
import axios from 'axios';
import 'dotenv/config';

async function checkDim() {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const baseUrl = process.env.SILICONFLOW_BASE_URL;
    const model = process.env.SILICONFLOW_MODEL || 'BAAI/bge-m3';

    console.log(`Checking dimension for model: ${model}`);
    console.log(`Base URL: ${baseUrl}`);

    try {
        const response = await axios.post(
            `${baseUrl}/embeddings`,
            {
                model: model,
                input: "Test",
                encoding_format: "float"
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = response.data as any;

        if (data && data.data && data.data.length > 0) {
            const dim = data.data[0].embedding.length;
            console.log(`Dimension: ${dim}`);
        } else {
            console.error("No data returned", data);
        }

    } catch (error: any) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
    }
}

checkDim();
