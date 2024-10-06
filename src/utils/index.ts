export * from "./logger";

export function is_debug_mode(): boolean {
	return process.env.VSCODE_DEBUG_MODE === "true";
}
