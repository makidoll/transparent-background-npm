import execa from "execa";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

export const isWindows = os.platform() == "win32";

export const venvDir = path.resolve(__dirname, "../venv");
export const modelsDir = path.resolve(__dirname, "../models");

export const transparentBackgroundPath = path.resolve(
	venvDir,
	isWindows
		? "Scripts/transparent-background.exe"
		: "bin/transparent-background",
);

export async function findSystemPython() {
	const findPath = isWindows ? "where" : "which";
	const pythonNames = ["python3", "python"];

	// windows has python3 in path but does microsoft store funny
	// which does stderr so lets try catch

	for (const pythonName of pythonNames) {
		try {
			const pythonPath = (
				await execa(findPath, [pythonName])
			).stdout.split("\n")[0]; // windows shows multiple lines

			if (pythonPath.includes("not found")) continue; // linux or mac
			if (pythonPath.includes("not find")) continue; // windows

			const pythonVersion = (await execa(pythonPath, ["--version"]))
				.stdout;

			if (!pythonVersion.includes("Python 3.")) continue;

			return pythonPath;
		} catch (error) {
			continue;
		}
	}

	return null;
}

export async function exists(filePath: string) {
	try {
		await fs.stat(filePath);
		return true;
	} catch (error) {
		return false;
	}
}
