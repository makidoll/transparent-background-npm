import execa = require("execa");
import * as fs from "fs/promises";
import * as path from "path";
import * as tmp from "tmp-promise";
import { modelsDir, transparentBackgroundPath, venvDir } from "./utils";

export async function transparentBackground(
	file: Buffer,
	fileExt: string,
	options: { fast?: boolean } = {},
) {
	if (!fileExt.startsWith(".")) fileExt = "." + fileExt;
	const inputFile = await tmp.file({ postfix: fileExt });

	await fs.writeFile(inputFile.path, file);

	const outputDir = await tmp.dir({
		unsafeCleanup: true, // recursive
	});

	const { stdout, stderr } = await execa(
		transparentBackgroundPath,
		[
			...(options.fast ? ["-m", "fast"] : []),
			"--source",
			inputFile.path,
			"--dest",
			outputDir.path,
		],
		{
			reject: false,
			env: {
				VIRTUAL_ENV: venvDir,
				MODELS_DIR: modelsDir,
			},
		},
	);

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
			console.log(
				"Transparent background, failed to cleanup: " + outputDir.path,
			);
		});
	});

	return outputBuffer;
}
