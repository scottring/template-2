"use strict";
'use client';
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
exports.default = VoiceRecorder;
const react_1 = require("react");
const DeepgramContext_1 = require("../lib/contexts/DeepgramContext");
const firebaseUtils_1 = require("../lib/firebase/firebaseUtils");
const framer_motion_1 = require("framer-motion");
function VoiceRecorder() {
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = (0, DeepgramContext_1.useDeepgram)();
    const handleStartRecording = () => __awaiter(this, void 0, void 0, function* () {
        yield connectToDeepgram();
        setIsRecording(true);
    });
    const handleStopRecording = () => __awaiter(this, void 0, void 0, function* () {
        disconnectFromDeepgram();
        setIsRecording(false);
        // Save the note to Firebase
        if (realtimeTranscript) {
            yield (0, firebaseUtils_1.addDocument)('notes', {
                text: realtimeTranscript,
                timestamp: new Date().toISOString(),
            });
        }
    });
    return (<div className="w-full max-w-md">
      <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`w-full py-2 px-4 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold`}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && (<div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <framer_motion_1.motion.div animate={{
                scale: [1, 1.2, 1],
            }} transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
            }} className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-4"/>
          <p className="text-sm text-gray-600">{realtimeTranscript}</p>
        </div>)}
    </div>);
}
