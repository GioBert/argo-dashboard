import { createHash } from "node:crypto";

import { createHomeworkHash } from "../homework/service.js";

const toDateKey = (date, timeZone) =>
	new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);

const hashText = (value) =>
	createHash("sha256").update(value).digest("hex");

const shouldSendNow = (config, now) => {
	const [hoursRaw, minutesRaw] = config.dailyReportTime.split(":");
	const hours = Number(hoursRaw);
	const minutes = Number(minutesRaw);
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: config.tz,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(now);
	const currentHours = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
	const currentMinutes = Number(
		parts.find((part) => part.type === "minute")?.value ?? "0"
	);

	return currentHours === hours && currentMinutes === minutes;
};

export const createDailyReporter = ({
	config,
	stateStore,
	telegramApi,
	editorial,
	getHomeworkContext,
}) => ({
	runIfDue: async (now = new Date()) => {
		if (!shouldSendNow(config, now)) return false;

		const context = await getHomeworkContext();
		const reportText = editorial.reportMessage({
			label: "domani",
			items: context.tomorrow,
			dayKey: context.labels.tomorrow,
		});
		const reportHash = hashText(createHomeworkHash(context.tomorrow));
		const reportDate = toDateKey(now, config.tz);
		const state = await stateStore.read();
		const previous = state.reports.dailyTomorrow;
		const alreadySentToday = previous?.date === reportDate;
		const duplicateContent = previous?.hash === reportHash;

		if (
			alreadySentToday ||
			(config.features.skipDuplicateReports && duplicateContent)
		)
			return false;

		for (const chatId of config.telegram.allowedChatIds)
			await telegramApi.sendMessage({
				chat_id: chatId,
				text: reportText,
			});

		await stateStore.update((current) => ({
			...current,
			reports: {
				...current.reports,
				dailyTomorrow: {
					date: reportDate,
					hash: reportHash,
					sentAt: now.toISOString(),
				},
			},
		}));
		return true;
	},
});
