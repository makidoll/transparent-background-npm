import execa from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import { transparentBackground } from "./main";
import { exists, findSystemPython, isWindows, venvDir } from "./utils";

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

	const venvPythonPath = path.resolve(
		venvDir,
		isWindows ? "Scripts/python.exe" : "bin/python",
	);

	await execa(
		venvPythonPath,
		["-m", "pip", "install", "-U", "transparent-background"], // 1.2.12
		{
			stdout: "inherit",
			stderr: "inherit",
			env: {
				VIRTUAL_ENV: venvDir,
			},
		},
	);

	// modify python file

	for (const libVersion of ["lib", "lib64", "Lib"]) {
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

	console.log("Downloading InSPyReNet models and testing them...");

	const tinyPng = await fs.readFile(path.resolve(__dirname, "../tiny.png"));

	await transparentBackground(tinyPng, "png");
	await transparentBackground(tinyPng, "png", { fast: true });
})();
