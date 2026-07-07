import { loadConfig } from "./config/env.js";
import { createArgoClient } from "./argo/client.js";
import { getHomeworkBuckets } from "./homework/service.js";
import { createDailyReporter } from "./scheduler/reporter.js";
import { createStateStore } from "./storage/state.js";
import { createTelegramApi } from "./telegram/api.js";
import { createTelegramBot } from "./telegram/bot.js";
import { createEditorial } from "./telegram/editorial.js";

const redact = (value, visible = 4) => {
	if (value.length <= visible) return "*".repeat(value.length);
	return `${"*".repeat(Math.max(8, value.length - visible))}${value.slice(-visible)}`;
};

const main = async () => {
	const config = loadConfig();
	const stateStore = createStateStore(config.botStatePath);
	const telegramApi = createTelegramApi(config.telegram.botToken);
	const editorial = createEditorial(config.tz);

	console.log("[telegram-bot] configuration loaded");
	console.log(`[telegram-bot] env=${config.nodeEnv} tz=${config.tz}`);
	console.log(
		`[telegram-bot] chats=${config.telegram.allowedChatIds.join(",")} admins=${config.telegram.adminUserIds.join(",")}`
	);
	console.log(
		`[telegram-bot] argoUser=${config.argo.username} school=${config.argo.schoolCode} token=${redact(config.telegram.botToken)}`
	);

	const argoClient = createArgoClient(config);

	console.log("[telegram-bot] probing Argo client adapter");
	const capabilities = await argoClient.getCapabilities();

	console.log(
		`[telegram-bot] argo adapter ready login=${capabilities.canLogin} dashboard=${capabilities.canFetchDashboard} strategy=${capabilities.strategy}`
	);

	if (!capabilities.canLogin || !capabilities.canFetchDashboard) return;

	const getHomeworkContext = async () => {
		const dashboard = await argoClient.getDashboard();
		const buckets = getHomeworkBuckets(dashboard, new Date(), config.tz);

		console.log(
			`[telegram-bot] homework loaded today=${buckets.today.length} tomorrow=${buckets.tomorrow.length} dayAfterTomorrow=${buckets.dayAfterTomorrow.length}`
		);
		return buckets;
	};
	const bot = createTelegramBot({
		config,
		telegramApi,
		editorial,
		stateStore,
		getHomeworkContext,
		getCapabilities: () => argoClient.getCapabilities(),
	});
	const reporter = createDailyReporter({
		config,
		stateStore,
		telegramApi,
		editorial,
		getHomeworkContext,
	});

	await reporter.runIfDue();
	console.log("[telegram-bot] telegram polling started");

	while (true) {
		try {
			await bot.pollOnce();
			await reporter.runIfDue();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			console.error(`[telegram-bot] runtime error: ${message}`);
			await new Promise((resolve) => setTimeout(resolve, 5_000));
		}
	}
};

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);

	console.error(`[telegram-bot] startup failed: ${message}`);
	process.exitCode = 1;
}
