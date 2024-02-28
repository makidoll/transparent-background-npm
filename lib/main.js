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
Object.defineProperty(exports, "__esModule", { value: true });
exports.transparentBackground = void 0;
const execa = require("execa");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const tmp = __importStar(require("tmp-promise"));
const utils_1 = require("./utils");
async function transparentBackground(file, fileExt, options = {}) {
    if (!fileExt.startsWith("."))
        fileExt = "." + fileExt;
    const inputFile = await tmp.file({ postfix: fileExt });
    await fs.writeFile(inputFile.path, file);
    const outputDir = await tmp.dir({
        unsafeCleanup: true, // recursive
    });
    const { stdout, stderr } = await execa(utils_1.transparentBackgroundPath, [
        ...(options.fast ? ["-m", "fast"] : []),
        "--source",
        inputFile.path,
        "--dest",
        outputDir.path,
    ], {
        reject: false,
        env: {
            VIRTUAL_ENV: utils_1.venvDir,
            MODELS_DIR: utils_1.modelsDir,
        },
    });
    await inputFile.cleanup();
    const outputFilenames = await fs.readdir(outputDir.path);
    if (outputFilenames.length == 0) {
        await outputDir.cleanup();
        console.log(stdout);
        console.log(stderr);
        throw new Error("No output files");
    }
    const outputPath = path.resolve(outputDir.path, outputFilenames[0]);
    const outputBuffer = await fs.readFile(outputPath);
    outputDir.cleanup().catch(() => {
        fs.rm(outputDir.path, { recursive: true, force: true }).catch(() => {
            // dont wanna throw since the operation was successful
            console.log("Transparent background, failed to cleanup: " + outputDir.path);
        });
    });
    return outputBuffer;
}
exports.transparentBackground = transparentBackground;
