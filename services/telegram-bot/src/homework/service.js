const dayFormatterCache = new Map();
const displayDateFormatterCache = new Map();

const getDateFormatter = (timeZone) => {
	if (!dayFormatterCache.has(timeZone)) {
		dayFormatterCache.set(
			timeZone,
			new Intl.DateTimeFormat("en-CA", {
				timeZone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
		);
	}
	return dayFormatterCache.get(timeZone);
};

const getDisplayDateFormatter = (timeZone) => {
	if (!displayDateFormatterCache.has(timeZone)) {
		displayDateFormatterCache.set(
			timeZone,
			new Intl.DateTimeFormat("it-IT", {
				timeZone,
				weekday: "long",
				day: "2-digit",
				month: "2-digit",
			})
		);
	}
	return displayDateFormatterCache.get(timeZone);
};

const toDayKey = (value, timeZone) => {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) return undefined;
	return getDateFormatter(timeZone).format(date);
};

const addDays = (date, days) => {
	const result = new Date(date);

	result.setDate(result.getDate() + days);
	return result;
};

const compactText = (value) =>
	String(value ?? "")
		.replace(/\r/g, "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.join(" | ");

const compareHomework = (left, right) =>
	left.subject.localeCompare(right.subject, "it") ||
	left.dueDate.localeCompare(right.dueDate) ||
	left.text.localeCompare(right.text, "it");

const groupBySubject = (items) => {
	const groups = new Map();

	for (const item of items) {
		const key = item.subject || "Materia non disponibile";
		const group = groups.get(key) ?? [];

		group.push(item);
		groups.set(key, group);
	}
	return [...groups.entries()].sort(([left], [right]) =>
		left.localeCompare(right, "it")
	);
};

const capitalize = (value) =>
	value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

const formatDisplayDate = (dayKey, timeZone) => {
	if (!dayKey) return undefined;
	const date = new Date(`${dayKey}T12:00:00`);

	if (Number.isNaN(date.getTime())) return undefined;
	return capitalize(getDisplayDateFormatter(timeZone).format(date));
};

export const createHomeworkHash = (items) =>
	JSON.stringify(
		items.map((item) => ({
			dueDate: item.dueDate,
			subject: item.subject,
			text: item.text,
			teacher: item.teacher,
		}))
	);

export const extractHomeworkItems = (dashboard) =>
	(dashboard?.registro ?? []).flatMap((entry, index) =>
		(entry.compiti ?? [])
			.map((homework, homeworkIndex) => {
				const dueDate = String(homework.dataConsegna ?? "").trim();

				if (!dueDate) return undefined;
				return {
					id: `${entry.pk ?? entry.datGiorno ?? index}-compito-${homeworkIndex}`,
					dueDate,
					subject: String(entry.materia ?? "Materia non disponibile").trim(),
					teacher: String(entry.docente ?? "").trim() || undefined,
					text:
						compactText(homework.compito ?? homework.desCompito) ||
						"Compito senza dettaglio",
					sourcePk: entry.pk ? String(entry.pk) : undefined,
					assignedAt: String(entry.datGiorno ?? "").trim() || undefined,
				};
			})
			.filter(Boolean)
	);

export const getHomeworkBuckets = (dashboard, now = new Date(), timeZone = "Europe/Rome") => {
	const todayKey = toDayKey(now, timeZone);
	const tomorrowKey = toDayKey(addDays(now, 1), timeZone);
	const dayAfterTomorrowKey = toDayKey(addDays(now, 2), timeZone);
	const items = extractHomeworkItems(dashboard).sort(compareHomework);

	return {
		labels: {
			today: todayKey,
			tomorrow: tomorrowKey,
			dayAfterTomorrow: dayAfterTomorrowKey,
		},
		today: items.filter((item) => item.dueDate === todayKey),
		tomorrow: items.filter((item) => item.dueDate === tomorrowKey),
		dayAfterTomorrow: items.filter((item) => item.dueDate === dayAfterTomorrowKey),
		upcoming: items.filter(
			(item) =>
				item.dueDate !== todayKey &&
				item.dueDate !== tomorrowKey &&
				item.dueDate !== dayAfterTomorrowKey
		),
		all: items,
	};
};

export const formatHomeworkDigest = (
	label,
	items,
	dayKey,
	timeZone = "Europe/Rome"
) => {
	const displayDate = formatDisplayDate(dayKey, timeZone);
	const lines = [
		`Compiti per ${label}`,
		displayDate ? displayDate : undefined,
		"",
	];

	if (!items.length) return [...lines, "Nessun compito assegnato."].filter(Boolean).join("\n");

	lines.push(`${items.length} ${items.length === 1 ? "compito" : "compiti"}`);
	lines.push("");

	for (const [subject, group] of groupBySubject(items)) {
		lines.push(subject);
		for (const item of group) lines.push(`- ${item.text}`);
		lines.push("");
	}

	return lines.join("\n").trim();
};
