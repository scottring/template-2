"use strict";
"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTranscriptionEvents = exports.SOCKET_STATES = exports.DeepgramContextProvider = void 0;
exports.useDeepgram = useDeepgram;
const sdk_1 = require("@deepgram/sdk");
Object.defineProperty(exports, "SOCKET_STATES", { enumerable: true, get: function () { return sdk_1.SOCKET_STATES; } });
Object.defineProperty(exports, "LiveTranscriptionEvents", { enumerable: true, get: function () { return sdk_1.LiveTranscriptionEvents; } });
const react_1 = require("react");
const DeepgramContext = (0, react_1.createContext)(undefined);
const getApiKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch("/api/deepgram", { cache: "no-store" });
    const result = yield response.json();
    return result.key;
});
const DeepgramContextProvider = ({ children }) => {
    const [connection, setConnection] = (0, react_1.useState)(null);
    const [connectionState, setConnectionState] = (0, react_1.useState)(sdk_1.SOCKET_STATES.closed);
    const [realtimeTranscript, setRealtimeTranscript] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)(null);
    const audioRef = (0, react_1.useRef)(null);
    const connectToDeepgram = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setError(null);
            setRealtimeTranscript("");
            const stream = yield navigator.mediaDevices.getUserMedia({ audio: true });
            audioRef.current = new MediaRecorder(stream);
            const apiKey = yield getApiKey();
            console.log("Opening WebSocket connection...");
            const socket = new WebSocket("wss://api.deepgram.com/v1/listen", ["token", apiKey]);
            socket.onopen = () => {
                setConnectionState(sdk_1.SOCKET_STATES.open);
                console.log("WebSocket connection opened");
                audioRef.current.addEventListener("dataavailable", (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        socket.send(event.data);
                    }
                });
                audioRef.current.start(250);
            };
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
                    const newTranscript = data.channel.alternatives[0].transcript;
                    setRealtimeTranscript((prev) => prev + " " + newTranscript);
                }
            };
            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                setError("Error connecting to Deepgram. Please try again.");
                disconnectFromDeepgram();
            };
            socket.onclose = (event) => {
                setConnectionState(sdk_1.SOCKET_STATES.closed);
                console.log("WebSocket connection closed:", event.code, event.reason);
            };
            setConnection(socket);
        }
        catch (error) {
            console.error("Error starting voice recognition:", error);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
            setConnectionState(sdk_1.SOCKET_STATES.closed);
        }
    });
    const disconnectFromDeepgram = () => {
        if (connection) {
            connection.close();
            setConnection(null);
        }
        if (audioRef.current) {
            audioRef.current.stop();
        }
        setRealtimeTranscript("");
        setConnectionState(sdk_1.SOCKET_STATES.closed);
    };
    return (<DeepgramContext.Provider value={{
            connectToDeepgram,
            disconnectFromDeepgram,
            connectionState,
            realtimeTranscript,
            error,
        }}>
      {children}
    </DeepgramContext.Provider>);
};
exports.DeepgramContextProvider = DeepgramContextProvider;
// Use the useDeepgram hook to access the deepgram context and use the deepgram in any component.
// This allows you to connect to the deepgram and disconnect from the deepgram via a socket.
// Make sure to wrap your application in a DeepgramContextProvider to use the deepgram.
function useDeepgram() {
    const context = (0, react_1.useContext)(DeepgramContext);
    if (context === undefined) {
        throw new Error("useDeepgram must be used within a DeepgramContextProvider");
    }
    return context;
}
