declare module 'pdf-parse' {
    function PDFParse(dataBuffer: Buffer | Uint8Array, options?: any): Promise<{
        numpages: number;
        numrender: number;
        info: any;
        metadata: any;
        text: string;
        version: string;
    }>;
    namespace PDFParse { }
    export = PDFParse;
}
