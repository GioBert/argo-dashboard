const TELEGRAM_BASE_URL = "https://api.telegram.org";

const toFormBody = (payload) => {
	const form = new URLSearchParams();

	for (const [key, value] of Object.entries(payload)) {
		if (value == null) continue;
		form.set(key, typeof value === "string" ? value : JSON.stringify(value));
	}
	return form;
};

export const createTelegramApi = (botToken) => {
	const call = async (method, payload = {}) => {
		const response = await fetch(`${TELEGRAM_BASE_URL}/bot${botToken}/${method}`, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			body: toFormBody(payload),
		});
		const data = await response.json();

		if (!response.ok || !data.ok)
			throw new Error(
				`Telegram API ${method} failed: ${data.description ?? response.statusText}`
			);
		return data.result;
	};

	return {
		call,
		getUpdates: (payload) => call("getUpdates", payload),
		sendMessage: (payload) => call("sendMessage", payload),
	};
};
