"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exists = exports.findSystemPython = exports.transparentBackgroundPath = exports.modelsDir = exports.venvDir = exports.isWindows = void 0;
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
exports.isWindows = os.platform() == "win32";
exports.venvDir = path.resolve(__dirname, "../venv");
exports.modelsDir = path.resolve(__dirname, "../models");
exports.transparentBackgroundPath = path.resolve(exports.venvDir, exports.isWindows
    ? "Scripts/transparent-background.exe"
    : "bin/transparent-background");
async function findSystemPython() {
    const findPath = exports.isWindows ? "where" : "which";
    const pythonNames = ["python3", "python"];
    // windows has python3 in path but does microsoft store funny
    // which does stderr so lets try catch
    for (const pythonName of pythonNames) {
        try {
            const pythonPath = (await (0, execa_1.default)(findPath, [pythonName])).stdout.split("\n")[0]; // windows shows multiple lines
            if (pythonPath.includes("not found"))
                continue; // linux or mac
            if (pythonPath.includes("not find"))
                continue; // windows
            const pythonVersion = (await (0, execa_1.default)(pythonPath, ["--version"]))
                .stdout;
            if (!pythonVersion.includes("Python 3."))
                continue;
            return pythonPath;
        }
        catch (error) {
            continue;
        }
    }
    return null;
}
exports.findSystemPython = findSystemPython;
async function exists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.exists = exists;
