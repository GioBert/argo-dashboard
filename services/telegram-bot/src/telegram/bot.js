const normalizeText = (text) => String(text ?? "").trim().toLowerCase();

const isAuthorizedChat = (config, chatId) =>
	config.telegram.allowedChatIds.includes(String(chatId));

const isAdminUser = (config, userId) =>
	config.telegram.adminUserIds.includes(String(userId));

const isRefreshUser = (config, userId) =>
	config.telegram.refreshUserIds.length
		? config.telegram.refreshUserIds.includes(String(userId))
		: isAdminUser(config, userId);

const getCommand = (text) => normalizeText(text).split(/\s+/)[0];

export const createTelegramBot = ({
	config,
	telegramApi,
	editorial,
	stateStore,
	getHomeworkContext,
	getCapabilities,
}) => {
	const sendText = async (chatId, text) =>
		telegramApi.sendMessage({
			chat_id: String(chatId),
			text,
		});

	const handleCommand = async (message) => {
		const chatId = message.chat?.id;
		const userId = message.from?.id;
		const text = message.text;

		if (!chatId || !text) return;
		if (!isAuthorizedChat(config, chatId)) {
			await sendText(chatId, editorial.unauthorizedChatMessage);
			return;
		}

		const command = getCommand(text);
		if (command === "/start" || command === "/help") {
			await sendText(chatId, editorial.welcomeMessage);
			await sendText(chatId, editorial.helpMessage);
			return;
		}

		if (command === "/stato") {
			if (!isAdminUser(config, userId)) {
				await sendText(chatId, editorial.unauthorizedUserMessage);
				return;
			}
			const capabilities = await getCapabilities();

			await sendText(
				chatId,
				editorial.statusMessage({
					...capabilities,
					allowedChats: config.telegram.allowedChatIds.join(", "),
				})
			);
			return;
		}

		if (
			command === "/oggi" ||
			command === "/domani" ||
			command === "/dopodomani" ||
			command === "/aggiorna"
		) {
			if (command === "/aggiorna" && !isRefreshUser(config, userId)) {
				await sendText(chatId, editorial.unauthorizedUserMessage);
				return;
			}
			const context = await getHomeworkContext();
			const key =
				command === "/oggi"
					? "today"
					: command === "/domani"
						? "tomorrow"
						: command === "/dopodomani"
							? "dayAfterTomorrow"
							: "tomorrow";
			const label =
				command === "/oggi"
					? "oggi"
					: command === "/domani"
						? "domani"
						: command === "/dopodomani"
							? "dopodomani"
							: "domani";
			const dayKey =
				key === "today"
					? context.labels.today
					: key === "tomorrow"
						? context.labels.tomorrow
						: context.labels.dayAfterTomorrow;

			await sendText(
				chatId,
				editorial.reportMessage({
					label,
					items: context[key],
					dayKey,
				})
			);
		}
	};

	return {
		pollOnce: async () => {
			const state = await stateStore.read();
			const updates = await telegramApi.getUpdates({
				offset: state.telegram.lastUpdateId + 1,
				timeout: 25,
				allowed_updates: ["message"],
			});

			if (!updates.length) return;
			let maxUpdateId = state.telegram.lastUpdateId;

			for (const update of updates) {
				maxUpdateId = Math.max(maxUpdateId, update.update_id);
				if (update.message?.text) await handleCommand(update.message);
			}

			await stateStore.update((current) => ({
				...current,
				telegram: {
					...current.telegram,
					lastUpdateId: maxUpdateId,
				},
			}));
		},
	};
};
