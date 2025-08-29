import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("index.ts のテスト", () => {
	let originalListeners: {
		uncaughtException: NodeJS.UncaughtExceptionListener[];
		unhandledRejection: NodeJS.UnhandledRejectionListener[];
	};

	beforeEach(() => {
		// 既存のリスナーを保存
		originalListeners = {
			uncaughtException: [
				...process.listeners("uncaughtException"),
			] as NodeJS.UncaughtExceptionListener[],
			unhandledRejection: [
				...process.listeners("unhandledRejection"),
			] as NodeJS.UnhandledRejectionListener[],
		};

		// 既存のリスナーを削除
		process.removeAllListeners("uncaughtException");
		process.removeAllListeners("unhandledRejection");
	});

	afterEach(() => {
		// リスナーを復元
		process.removeAllListeners("uncaughtException");
		process.removeAllListeners("unhandledRejection");

		for (const listener of originalListeners.uncaughtException) {
			process.on("uncaughtException", listener);
		}
		for (const listener of originalListeners.unhandledRejection) {
			process.on("unhandledRejection", listener);
		}

		vi.restoreAllMocks();
	});

	it("エラーハンドラーが正しく登録されている", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			return undefined as never;
		});
		const mockConsoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		// index.tsを動的インポート（エラーハンドラーが登録される）
		await import("../../src/index.js");

		// ハンドラーが登録されていることを確認
		const uncaughtListeners = process.listeners("uncaughtException");
		const unhandledListeners = process.listeners("unhandledRejection");

		expect(uncaughtListeners.length).toBe(1);
		expect(unhandledListeners.length).toBe(1);

		// uncaughtExceptionハンドラーのテスト
		const testError = new Error("テスト用エラー");
		(uncaughtListeners[0] as (error: Error) => void)(testError);

		expect(mockConsoleError).toHaveBeenCalledWith(
			"予期しないエラーが発生しました:",
			testError,
		);
		expect(mockExit).toHaveBeenCalledWith(1);

		// unhandledRejectionハンドラーのテスト
		const testReason = "テスト用リジェクション";
		(unhandledListeners[0] as (reason: unknown) => void)(testReason);

		expect(mockConsoleError).toHaveBeenCalledWith(
			"未処理のPromise拒否:",
			testReason,
		);
		expect(mockExit).toHaveBeenCalledWith(1);
	});
});
