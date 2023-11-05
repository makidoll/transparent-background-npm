import execa = require("execa");
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

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

(async () => {
	const systemPythonPath = await findSystemPython();
	if (systemPythonPath == null) {
		throw new Error("Python not found. Please make sure its installed");
	}

	// make venv dir

	const venvDir = path.resolve(__dirname, "../venv");

	try {
		const stat = await fs.stat(venvDir);
		if (stat.isDirectory()) {
			fs.rm(venvDir, { recursive: true });
		}
	} catch (error) {}

	fs.mkdir(venvDir, { recursive: true });

	// setup venv dir

	await execa(systemPythonPath, ["-m", "venv", venvDir], {
		stdout: "inherit",
		stderr: "inherit",
	});

	// install package

	// const pythonPath = path.resolve(venvDir, "bin/python");
	const pipPath = path.resolve(venvDir, "bin/pip");

	await execa(pipPath, ["install", "transparent-background"], {
		stdout: "inherit",
		stderr: "inherit",
		env: {
			VIRTUAL_ENV: venvDir,
		},
	});
})();
