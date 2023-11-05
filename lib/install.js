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
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const main_1 = require("./main");
const utils_1 = require("./utils");
async function findSystemPython() {
    const findPath = os.platform() == "win32" ? "where" : "which";
    const pythonNames = ["python3", "python"];
    for (const pythonName of pythonNames) {
        const pythonPath = (await (0, execa_1.default)(findPath, [pythonName])).stdout;
        if (pythonPath.includes("not found"))
            continue; // linux or mac
        if (pythonPath.includes("not find"))
            continue; // windows
        const pythonVersion = (await (0, execa_1.default)(pythonPath, ["--version"])).stdout;
        if (!pythonVersion.includes("Python "))
            continue;
        return pythonPath;
    }
    return null;
}
async function exists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
(async () => {
    const systemPythonPath = await findSystemPython();
    if (systemPythonPath == null) {
        throw new Error("Python not found. Please make sure its installed");
    }
    // make venv dir
    // this fails for some reasons
    // try {
    // 	await fs.rm(venvDir, { recursive: true, force: true });
    // } catch (error) {}
    await fs.mkdir(utils_1.venvDir, { recursive: true });
    // setup venv dir
    await (0, execa_1.default)(systemPythonPath, ["-m", "venv", utils_1.venvDir], {
        stdout: "inherit",
        stderr: "inherit",
    });
    // install package
    const pipPath = path.resolve(utils_1.venvDir, "bin/pip");
    await (0, execa_1.default)(pipPath, ["install", "-U", "transparent-background==1.2.9"], {
        stdout: "inherit",
        stderr: "inherit",
        env: {
            VIRTUAL_ENV: utils_1.venvDir,
        },
    });
    // modify python file
    for (const libVersion of ["lib", "lib64"]) {
        const venvLibDir = path.resolve(utils_1.venvDir, libVersion);
        const venvLibFiles = await fs.readdir(venvLibDir);
        for (const pythonVersion of venvLibFiles) {
            const removerPyPath = path.resolve(venvLibDir, pythonVersion, "site-packages/transparent_background/Remover.py");
            if (!(await exists(removerPyPath)))
                continue;
            let removerPy = await fs.readFile(removerPyPath, "utf8");
            removerPy = removerPy.replaceAll(/home_dir = [^]+?\n/gi, "home_dir = os.getenv('MODELS_DIR')\n");
            await fs.writeFile(removerPyPath, removerPy);
        }
    }
    // lib/python3.11/site-packages/transparent_background/Remover.py
    // download models and test
    // if fails then installation will fail too
    // would be nice if we could move ~/.transparent-background inside here
    const tinyPng = await fs.readFile(path.resolve(__dirname, "../tiny.png"));
    await (0, main_1.transparentBackground)(tinyPng, "png");
    await (0, main_1.transparentBackground)(tinyPng, "png", { fast: true });
})();
