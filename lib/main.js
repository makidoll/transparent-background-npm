"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transparentBackground = void 0;
const execa = require("execa");
const fs = require("fs/promises");
const path = require("path");
const tmp = require("tmp-promise");
const transparentBackgroundPath = path.resolve(__dirname, "../venv/bin/transparent-background");
async function transparentBackground(file, fileExt, fast = false) {
    if (!fileExt.startsWith("."))
        fileExt = "." + fileExt;
    const inputFile = await tmp.file({ postfix: fileExt });
    await fs.writeFile(inputFile.path, file);
    const outputDir = await tmp.dir({
        unsafeCleanup: true, // recursive
    });
    const { stdout, stderr } = await execa(transparentBackgroundPath, [
        "--source",
        inputFile.path,
        "--dest",
        outputDir.path,
        ...(fast ? ["--fast"] : []),
    ], {
        reject: false,
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
    await outputDir.cleanup();
    return outputBuffer;
}
exports.transparentBackground = transparentBackground;
