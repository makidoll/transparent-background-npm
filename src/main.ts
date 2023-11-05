import execa = require("execa");
import * as fs from "fs/promises";
import * as path from "path";
import * as tmp from "tmp-promise";

const transparentBackgroundPath = path.resolve(
	__dirname,
	"../venv/bin/transparent-background",
);

export async function transparentBackground(
	file: Buffer,
	fileExt: string,
	fast = false,
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
			"--source",
			inputFile.path,
			"--dest",
			outputDir.path,
			...(fast ? ["--fast"] : []),
		],
		{
			reject: false,
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

	await outputDir.cleanup();

	return outputBuffer;
}
