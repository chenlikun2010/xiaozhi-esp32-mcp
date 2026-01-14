import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import WebSocket from "ws";

export class WebSocketClientTransport implements Transport {
    private _ws?: WebSocket;
    private _url: string;
    private _tkn?: string; // Optional token if needed in headers or query params

    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;

    constructor(url: string) {
        this._url = url;
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._ws = new WebSocket(this._url);

            this._ws.onopen = () => {
                console.log(`Connected to ${this._url}`);
                resolve();
            };

            this._ws.onclose = () => {
                console.log("WebSocket closed");
                this.onclose?.();
            };

            this._ws.onerror = (err) => {
                console.error("WebSocket error", err);
                this.onerror?.(err instanceof Error ? err : new Error(String(err)));
                // If error happens during connection phase
                if (this._ws?.readyState !== WebSocket.OPEN) {
                    reject(err);
                }
            };

            this._ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data.toString());
                    this.onmessage?.(data);
                } catch (error) {
                    console.error("Failed to parse message", error);
                }
            };
        });
    }

    async close(): Promise<void> {
        this._ws?.close();
    }

    async send(message: JSONRPCMessage): Promise<void> {
        if (this._ws?.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not open");
        }
        this._ws.send(JSON.stringify(message));
    }
}
