"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const fs_1 = __importDefault(require("fs"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = yield req.json();
        const base64Audio = body.audio;
        // Convert the base64 audio data to a Buffer
        const audio = Buffer.from(base64Audio, "base64");
        // Define the file path for storing the temporary WAV file
        const filePath = "tmp/input.wav";
        try {
            // Write the audio data to a temporary WAV file synchronously
            fs_1.default.writeFileSync(filePath, audio);
            // Create a readable stream from the temporary WAV file
            const readStream = fs_1.default.createReadStream(filePath);
            const data = yield openai.audio.transcriptions.create({
                file: readStream,
                model: "whisper-1",
            });
            // Remove the temporary file after successful processing
            fs_1.default.unlinkSync(filePath);
            return server_1.NextResponse.json(data);
        }
        catch (error) {
            console.error("Error processing audio:", error);
            return server_1.NextResponse.error();
        }
    });
}
