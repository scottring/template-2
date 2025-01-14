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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
const anthropic_1 = require("@ai-sdk/anthropic");
const ai_1 = require("ai");
exports.runtime = "edge";
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const { messages } = yield req.json();
        const result = yield (0, ai_1.streamText)({
            model: (0, anthropic_1.anthropic)("claude-3-5-sonnet-20240620"),
            messages: (0, ai_1.convertToCoreMessages)(messages),
            system: "You are a helpful AI assistant",
        });
        return result.toDataStreamResponse();
    });
}
