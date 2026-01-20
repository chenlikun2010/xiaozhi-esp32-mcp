import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

const pdfParse = require('pdf-parse');

async function testPdfParse() {
    const userDir = './uploads/user_kb/5';
    const files = fs.readdirSync(userDir);

    console.log('Files found:', files);

    const pdfFile = files.find(f => f.endsWith('.pdf'));
    if (!pdfFile) {
        console.log('No PDF file found');
        return;
    }

    const filePath = path.join(userDir, pdfFile);
    console.log('Testing PDF:', filePath);

    try {
        const buffer = fs.readFileSync(filePath);
        console.log('Buffer size:', buffer.length);

        const result = await pdfParse(buffer);
        console.log('✅ Success! Text length:', result.text.length);
        console.log('Sample text:', result.text.substring(0, 500));
    } catch (err: any) {
        console.error('❌ PDF Parse Error:', err.message);
        console.error('Stack:', err.stack);
    }
}

testPdfParse().then(() => process.exit(0));
