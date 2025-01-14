"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
const react_1 = require("react");
const AuthContext_1 = require("../contexts/AuthContext");
const useAuth = () => (0, react_1.useContext)(AuthContext_1.AuthContext);
exports.useAuth = useAuth;
