import execa from "execa";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { transparentBackground } from "./main";
import { venvDir } from "./utils";

async function findSystemPython() {
	const findPath = os.platform() == "win32" ? "where" : "which";
	const pythonNames = ["python3", "python"];

	for (const pythonName of pythonNames) {
		const pythonPath = (await execa(findPath, [pythonName])).stdout;
		if (pythonPath.includes("not found")) continue; // linux or mac
		if (pythonPath.includes("not find")) continue; // windows

		const pythonVersion = (await execa(pythonPath, ["--version"])).stdout;
		if (!pythonVersion.includes("Python ")) continue;

		return pythonPath;
	}

	return null;
}

async function exists(filePath: string) {
	try {
		await fs.stat(filePath);
		return true;
	} catch (error) {
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

	await fs.mkdir(venvDir, { recursive: true });

	// setup venv dir

	await execa(systemPythonPath, ["-m", "venv", venvDir], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// install package

	const pipPath = path.resolve(venvDir, "bin/pip");

	await execa(pipPath, ["install", "-U", "transparent-background==1.2.9"], {
		stdout: "inherit",
		stderr: "inherit",
		env: {
			VIRTUAL_ENV: venvDir,
		},
	});

	// modify python file

	for (const libVersion of ["lib", "lib64"]) {
		const venvLibDir = path.resolve(venvDir, libVersion);
		if (!(await exists(venvLibDir))) continue;

		const venvLibFiles = await fs.readdir(venvLibDir);

		for (const pythonVersion of venvLibFiles) {
			const removerPyPath = path.resolve(
				venvLibDir,
				pythonVersion,
				"site-packages/transparent_background/Remover.py",
			);

			if (!(await exists(removerPyPath))) continue;

			let removerPy = await fs.readFile(removerPyPath, "utf8");

			removerPy = removerPy.replaceAll(
				/home_dir = [^]+?\n/gi,
				"home_dir = os.getenv('MODELS_DIR')\n",
			);

			await fs.writeFile(removerPyPath, removerPy);
		}
	}

	// lib/python3.11/site-packages/transparent_background/Remover.py

	// download models and test
	// if fails then installation will fail too
	// would be nice if we could move ~/.transparent-background inside here

	const tinyPng = await fs.readFile(path.resolve(__dirname, "../tiny.png"));

	await transparentBackground(tinyPng, "png");
	await transparentBackground(tinyPng, "png", { fast: true });
})();
