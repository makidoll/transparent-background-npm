export declare const isWindows: boolean;
export declare const venvDir: string;
export declare const modelsDir: string;
export declare const transparentBackgroundPath: string;
export declare function findSystemPython(): Promise<string>;
export declare function exists(filePath: string): Promise<boolean>;
