import * as path from "path";
import * as os from "os";

export const isWindows = os.platform() == "win32";

export const venvDir = path.resolve(__dirname, "../venv");
export const modelsDir = path.resolve(__dirname, "../models");

export const transparentBackgroundPath = path.resolve(
	venvDir,
	isWindows
		? "Scripts/transparent-background.exe"
		: "bin/transparent-background",
);
