import { formatHomeworkDigest } from "../homework/service.js";

const helpMessage = [
	"Comandi disponibili",
	"",
	"/oggi",
	"/domani",
	"/dopodomani",
	"/aggiorna",
	"/stato",
].join("\n");

export const createEditorial = (timeZone) => ({
	helpMessage,
	welcomeMessage:
		"Bot compiti ARGO attivo.\n\nUsa /oggi, /domani o /dopodomani per il riepilogo aggiornato.",
	unauthorizedChatMessage:
		"Questa chat non e' autorizzata a usare il bot.",
	unauthorizedUserMessage:
		"Questo comando e' riservato agli utenti autorizzati.",
	statusMessage: ({ canFetchDashboard, strategy, allowedChats }) =>
		[
			"Stato servizio",
			"",
			`Adapter Argo: ${strategy}`,
			`Dashboard: ${canFetchDashboard ? "disponibile" : "non disponibile"}`,
			`Chat abilitate: ${allowedChats}`,
		].join("\n"),
	reportMessage: ({ label, items, dayKey }) =>
		formatHomeworkDigest(label, items, dayKey, timeZone),
});
