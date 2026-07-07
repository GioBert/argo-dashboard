const requiredKeys = [
	"TELEGRAM_BOT_TOKEN",
	"TELEGRAM_ALLOWED_CHAT_IDS",
	"TELEGRAM_ADMIN_USER_IDS",
	"ARGO_USERNAME",
	"ARGO_PASSWORD",
	"ARGO_SCHOOL_CODE",
	"ARGO_SECRET_KEY",
];

const parseList = (value) =>
	value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);

const getRequired = (key) => {
	const value = process.env[key]?.trim();

	if (!value) throw new Error(`Missing required environment variable: ${key}`);
	return value;
};

const getOptional = (key, fallback) => {
	const value = process.env[key]?.trim();

	return value || fallback;
};

const getNumber = (key, fallback) => {
	const raw = getOptional(key, String(fallback));
	const parsed = Number(raw);

	if (!Number.isFinite(parsed))
		throw new Error(`Invalid numeric environment variable: ${key}`);
	return parsed;
};

const getBoolean = (key, fallback) => {
	const raw = getOptional(key, fallback ? "true" : "false").toLowerCase();

	if (raw !== "true" && raw !== "false")
		throw new Error(`Invalid boolean environment variable: ${key}`);
	return raw === "true";
};

export const loadConfig = () => {
	for (const key of requiredKeys) getRequired(key);

	return {
		nodeEnv: getOptional("NODE_ENV", "development"),
		tz: getOptional("TZ", "Europe/Rome"),
		dailyReportTime: getOptional("DAILY_REPORT_TIME", "18:30"),
		logLevel: getOptional("LOG_LEVEL", "info"),
		botStatePath: getOptional("BOT_STATE_PATH", "./data/state.json"),
		telegram: {
			botToken: getRequired("TELEGRAM_BOT_TOKEN"),
			allowedChatIds: parseList(getRequired("TELEGRAM_ALLOWED_CHAT_IDS")),
			adminUserIds: parseList(getRequired("TELEGRAM_ADMIN_USER_IDS")),
			refreshUserIds: parseList(getOptional("TELEGRAM_REFRESH_USER_IDS", "")),
		},
		argo: {
			username: getRequired("ARGO_USERNAME"),
			password: getRequired("ARGO_PASSWORD"),
			schoolCode: getRequired("ARGO_SCHOOL_CODE"),
			secretKey: getRequired("ARGO_SECRET_KEY"),
			httpTimeoutMs: getNumber("ARGO_HTTP_TIMEOUT_MS", 15000),
			maxRetries: getNumber("ARGO_MAX_RETRIES", 2),
		},
		features: {
			skipDuplicateReports: getBoolean("SKIP_DUPLICATE_REPORTS", true),
		},
	};
};
