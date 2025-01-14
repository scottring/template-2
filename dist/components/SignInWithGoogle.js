"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignInWithGoogle;
const useAuth_1 = require("../lib/hooks/useAuth");
function SignInWithGoogle() {
    const { signInWithGoogle } = (0, useAuth_1.useAuth)();
    return (<button onClick={signInWithGoogle} className="flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2"/>
      Sign in with Google
    </button>);
}
