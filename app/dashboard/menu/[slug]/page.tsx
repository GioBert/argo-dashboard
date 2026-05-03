"use client";
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-type-assertion */
import { bold, regularItalic } from "@/app/fonts";
import { State } from "@/app/utils";
import Allegato from "@/components/dashboard/Allegato";
import { ClientContext } from "@/components/dashboard/ClientProvider";
import ListElement from "@/components/dashboard/ListElement";
import PopupMessaggio from "@/components/dashboard/PopupMessaggio";
import attivitaSvolta from "@/icons/attivita-svolta.svg";
import bachecaAlunno from "@/icons/bacheca-alunno.svg";
import bacheca from "@/icons/bacheca.svg";
import compitiAssegnati from "@/icons/compiti-assegnati.svg";
import condivisioneDocumenti from "@/icons/condivisione-documenti.svg";
import curriculumIcon from "@/icons/curriculum.svg";
import orarioIcon from "@/icons/orario.svg";
import pagamentiIcon from "@/icons/tasse-icon.svg";
import promemoriaClasse from "@/icons/promemoria-classe.svg";
import ricevimentoDocenti from "@/icons/ricevimento-docenti.svg";
import votiScrutinioIcon from "@/icons/voti-scrutinio.svg";
import { useParams } from "next/navigation";
import type { ComponentType, Dispatch, SetStateAction, SVGProps } from "react";
import { useContext, useEffect, useMemo, useState } from "react";

type DashboardLike = Record<string, any>;
type IconComponent = ComponentType<SVGProps<SVGElement>>;
type PopupProps = { setOpen: Dispatch<SetStateAction<boolean>> };
type Item = {
	key: string;
	date: Date;
	header: string;
	content: string;
	icon: IconComponent;
	headerTitle?: string;
	title?: string;
	popup?: ComponentType<PopupProps>;
	defaultExpanded?: boolean;
};
type Section = {
	title: string;
	emptyMessage: string;
	notImplementedMessage?: string;
	items: (dashboard: DashboardLike | undefined) => Item[];
};
type RemoteState = {
	loading: boolean;
	error?: string;
	data?: unknown;
};

const firstString = (...values: unknown[]): string | undefined => {
	for (const value of values)
		if (typeof value === "string" && value.trim()) return value.trim();
	return undefined;
};

const parseDate = (...values: unknown[]): Date | undefined => {
	for (const value of values) {
		if (typeof value !== "string" || !value.trim()) continue;
		const time = Date.parse(value);

		if (!Number.isNaN(time)) return new Date(time);
	}
	return undefined;
};

const fallbackDate = new Date(0);
const addSection = (
	title: string,
	items: Item[],
	emptyMessage: string
): {
	title: string;
	items: Item[];
	emptyMessage: string;
} => ({
	title,
	items,
	emptyMessage,
});

const renderItemList = (items: Item[]) =>
	items
		.sort((a, b) => b.date.getTime() - a.date.getTime())
		.map((item) => (
			<ListElement
				key={item.key}
				content={item.content}
				date={item.date}
				header={item.header}
				headerTitle={item.headerTitle}
				icon={item.icon}
				title={item.title}
				popup={item.popup}
				defaultExpanded={item.defaultExpanded}
			/>
		));

const itemToLines = (entry: Record<string, any>): string[] =>
	Object.values(entry)
		.filter((value) => typeof value === "string" && value.trim())
		.map((value) => value.trim())
		.filter((value, index, array) => array.indexOf(value) === index);

const formatUnknownContent = (entry: Record<string, any>) =>
	itemToLines(entry).slice(0, 4).join(" - ") || "Dettaglio non disponibile";
const uniqueBy = <T,>(items: T[], keyBuilder: (item: T) => string) => {
	const seen = new Set<string>();
	return items.filter((item) => {
		const key = keyBuilder(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};
const looksOpaque = (value: string) =>
	value.length > 32 && /^[A-Z0-9 -]+$/i.test(value);
const formatDateLabel = (value: unknown) => {
	const date = parseDate(value);
	return date
		? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
				.toString()
				.padStart(2, "0")}/${date.getFullYear()}`
		: undefined;
};
const teacherName = (entry: Record<string, any>) =>
	firstString(
		entry.desDocente,
		entry.docente,
		entry.nomeDocente,
		entry.desCognome && entry.desNome
			? `${entry.desNome} ${entry.desCognome}`
			: undefined,
		entry.desCognome,
		entry.cognome
	);
const subjectName = (entry: Record<string, any>) =>
	firstString(
		entry.desMateria,
		entry.materia,
		entry.desDisciplina,
		entry.desMateriaBreve
	);

const createCompitiItems = (dashboard: DashboardLike | undefined): Item[] =>
	(dashboard?.registro ?? []).flatMap((entry: Record<string, any>) =>
		(entry.compiti ?? []).map((homework: Record<string, any>, index: number) => ({
			key: `${entry.pk ?? entry.datGiorno ?? "registro"}-compito-${index}`,
			date: parseDate(homework.dataConsegna) ?? fallbackDate,
			header:
				firstString(entry.materia, entry.docente, "Compito assegnato") ??
				"Compito assegnato",
			headerTitle: firstString(entry.docente),
			content:
				firstString(
					homework.compito,
					homework.desCompito,
					"Compito senza dettaglio"
				) ?? "Compito senza dettaglio",
			icon: compitiAssegnati,
			defaultExpanded: true,
		}))
	);

const sections: Record<string, Section> = {
	compitiAssegnati: {
		title: "Compiti assegnati",
		emptyMessage: "Nessun compito assegnato disponibile.",
		items: createCompitiItems,
	},
	promemoria: {
		title: "Promemoria",
		emptyMessage: "Nessun promemoria disponibile.",
		items: (dashboard) =>
			(dashboard?.promemoria ?? []).map((entry: Record<string, any>, index: number) => ({
				key: `${entry.pk ?? "promemoria"}-${index}`,
				date: parseDate(entry.datGiorno) ?? fallbackDate,
				header: firstString(entry.docente, "Promemoria") ?? "Promemoria",
				content:
					firstString(
						entry.desAnnotazioni,
						entry.desEvento,
						entry.titolo,
						"Promemoria senza dettaglio"
					) ?? "Promemoria senza dettaglio",
				title:
					entry.oraInizio && entry.oraInizio !== "00:00"
						? `${entry.oraInizio} - ${entry.oraFine ?? ""}`.trim()
						: undefined,
				icon: promemoriaClasse,
			})),
	},
	attivitaSvolta: {
		title: "Attivita svolta",
		emptyMessage: "Nessuna attivita disponibile.",
		items: (dashboard) =>
			(dashboard?.registro ?? [])
				.filter((entry: Record<string, any>) => firstString(entry.attivita))
				.map((entry: Record<string, any>, index: number) => ({
					key: `${entry.pk ?? "attivita"}-${index}`,
					date: parseDate(entry.datGiorno) ?? fallbackDate,
					header:
						firstString(entry.materia, entry.docente, "Attivita svolta") ??
						"Attivita svolta",
					headerTitle: firstString(entry.docente),
					title: firstString(entry.ora),
					content: firstString(entry.attivita, "Attivita senza dettaglio") ?? "Attivita senza dettaglio",
					icon: attivitaSvolta,
				})),
	},
	ricevimentoDocenti: {
		title: "Ricevimento docenti",
		emptyMessage: "Nessun ricevimento disponibile.",
		items: (dashboard) =>
			(dashboard?.prenotazioniAlunni ?? [])
				.filter(
					(entry: Record<string, any>) => entry.prenotazione?.flgAnnullato !== "E"
				)
				.map((entry: Record<string, any>, index: number) => ({
					key: `${entry.prenotazione?.pk ?? "ricevimento"}-${index}`,
					date:
						parseDate(
							`${entry.disponibilita?.datDisponibilita ?? ""} ${entry.disponibilita?.ora_Inizio ?? ""}`.trim(),
							entry.disponibilita?.datDisponibilita
						) ?? fallbackDate,
					header:
						firstString(
							entry.docente?.desNome && entry.docente?.desCognome
								? `${entry.docente.desNome[0]}. ${entry.docente.desCognome}`
								: undefined,
							entry.docente?.desCognome,
							"Ricevimento docente"
						) ?? "Ricevimento docente",
					headerTitle: firstString(entry.docente?.desEmail),
					content:
						firstString(
							[
								entry.disponibilita?.ora_Inizio,
								entry.disponibilita?.ora_Fine,
								entry.disponibilita?.desLuogoRicevimento,
								entry.disponibilita?.desNota,
							]
								.filter((value) => typeof value === "string" && value.trim())
								.join(" - "),
							"Ricevimento senza dettaglio"
						) ?? "Ricevimento senza dettaglio",
					icon: ricevimentoDocenti,
				})),
	},
	bacheca: {
		title: "Bacheca",
		emptyMessage: "Nessuna comunicazione disponibile.",
		items: (dashboard) =>
			(dashboard?.bacheca ?? []).map((entry: Record<string, any>, index: number) => ({
				key: `${entry.pk ?? "bacheca"}-${index}`,
				date: parseDate(entry.data, entry.datEvento, entry.datGiorno) ?? fallbackDate,
				header: firstString(entry.autore, "Comunicazione") ?? "Comunicazione",
				title: firstString(entry.categoria, entry.desCategoria),
				content:
					firstString(
						entry.messaggio,
						entry.oggetto,
						entry.desEvento,
						"Comunicazione senza dettaglio"
					) ?? "Comunicazione senza dettaglio",
				icon: bacheca,
			})),
	},
	bachecaAlunno: {
		title: "Bacheca alunno",
		emptyMessage: "Nessuna comunicazione alunno disponibile.",
		items: (dashboard) =>
			(dashboard?.bachecaAlunno ?? []).map((entry: Record<string, any>, index: number) => ({
				key: `${entry.pk ?? "bacheca-alunno"}-${index}`,
				date: parseDate(entry.data, entry.datEvento, entry.datGiorno) ?? fallbackDate,
				header: firstString(entry.messaggio, "Comunicazione alunno") ?? "Comunicazione alunno",
				title: firstString(entry.nomeFile),
				content:
					firstString(entry.nomeFile, entry.messaggio, "Comunicazione senza dettaglio") ??
					"Comunicazione senza dettaglio",
				icon: bachecaAlunno,
			})),
	},
	condivisione: {
		title: "Condivisione documenti",
		emptyMessage: "Nessun file condiviso disponibile.",
		items: (dashboard) =>
			(dashboard?.fileCondivisi?.listaFile ?? []).map(
				(entry: Record<string, any>, index: number) => ({
					key: `${entry.pk ?? "file"}-${index}`,
					date:
						parseDate(
							entry.datEvento,
							entry.datPubblicazione,
							entry.dataPubblicazione,
							entry.datGiorno
						) ?? fallbackDate,
					header:
						firstString(
							entry.desNomeFile,
							entry.nomeFile,
							entry.fileName,
							entry.desFile,
							"File condiviso"
						) ?? "File condiviso",
					content:
						firstString(
							entry.desAnnotazioni,
							entry.desDescrizione,
							entry.desCategoria,
							entry.oggetto,
							"File condiviso senza dettaglio"
						) ?? "File condiviso senza dettaglio",
					icon: condivisioneDocumenti,
				})
			),
	},
	votiScrutinio: {
		title: "Voti scrutinio",
		emptyMessage: "Nessun dato disponibile.",
		notImplementedMessage: undefined,
		items: () => [],
	},
	orario: {
		title: "Orario",
		emptyMessage: "Nessun dato disponibile.",
		notImplementedMessage: undefined,
		items: () => [],
	},
	pagamenti: {
		title: "Pagamenti",
		emptyMessage: "Nessun dato disponibile.",
		notImplementedMessage: undefined,
		items: () => [],
	},
	curriculum: {
		title: "Curriculum",
		emptyMessage: "Nessun dato disponibile.",
		notImplementedMessage: undefined,
		items: () => [],
	},
};

const MenuFallbackPage = () => {
	const {
		client,
		state,
	} = useContext(ClientContext);
	const { dashboard } = client;
	const params = useParams() as { slug?: string | string[] };
	const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
	const section = slug ? sections[slug] : undefined;
	const items = useMemo(() => section?.items(dashboard) ?? [], [dashboard, section]);
	const [remoteState, setRemoteState] = useState<RemoteState>({ loading: false });

	useEffect(() => {
		if (!slug) return;
		if (state !== State.Ready) {
			setRemoteState({ loading: false });
			return;
		}
		if (!["orario", "pagamenti", "curriculum", "votiScrutinio"].includes(slug)) {
			setRemoteState({ loading: false });
			return;
		}
		let active = true;
		setRemoteState({ loading: true });
		const loader = async () => {
			try {
				let data: unknown;

				switch (slug) {
					case "orario":
						data = await client.getOrarioGiornaliero();
						break;
					case "pagamenti":
						data = await client.getTasse();
						break;
					case "curriculum":
						data = await client.getCurriculum();
						break;
					case "votiScrutinio":
						data = await client.getVotiScrutinio();
						break;
					default:
						data = undefined;
				}
				if (active) setRemoteState({ loading: false, data });
			} catch (error) {
				if (!active) return;
				setRemoteState({
					loading: false,
					error:
						error instanceof Error
							? error.message
							: "Errore nel recupero dei dati",
				});
			}
		};
		void loader();
		return () => {
			active = false;
		};
	}, [client, slug, state]);

	const compitiSections = useMemo(() => {
		if (slug !== "compitiAssegnati") return undefined;
		const now = new Date();
		const nextDay = new Date(now);

		nextDay.setHours(0, 0, 0, 0);
		nextDay.setDate(nextDay.getDate() + 1);
		const nextDayStart = nextDay.getTime();
		const tomorrow = `${nextDay.getFullYear()}-${(nextDay.getMonth() + 1)
			.toString()
			.padStart(2, "0")}-${nextDay.getDate().toString().padStart(2, "0")}`;
		const tomorrowTime = new Date(nextDay);

		tomorrowTime.setDate(tomorrowTime.getDate() + 1);

		return [
			addSection(
				"Entro domani",
				items.filter((item) => item.date.toISOString().slice(0, 10) === tomorrow),
				"Nessun compito in scadenza entro domani."
			),
			addSection(
				"Successivi",
				items.filter((item) => item.date.getTime() >= tomorrowTime.getTime()),
				"Nessun compito successivo disponibile."
			),
			addSection(
				"Precedenti",
				items.filter((item) => item.date.getTime() < nextDayStart),
				"Nessun compito precedente disponibile."
			),
		];
	}, [items, slug]);

	const bachecaSections = useMemo(() => {
		if (!slug || !["bacheca", "bachecaAlunno"].includes(slug) || !dashboard)
			return undefined;

		if (slug === "bacheca") {
			const menuItems = (dashboard.bacheca ?? []).map(
				(entry: Record<string, any>, index: number): Item => ({
					key: `${entry.pk ?? "bacheca"}-${index}`,
					date:
						parseDate(entry.data, entry.datEvento, entry.datGiorno) ?? fallbackDate,
					header: firstString(entry.autore, "Comunicazione") ?? "Comunicazione",
					title: firstString(entry.categoria, entry.desCategoria),
					content:
						firstString(
							entry.messaggio,
							entry.oggetto,
							entry.desEvento,
							"Comunicazione senza dettaglio"
						) ?? "Comunicazione senza dettaglio",
					icon: bacheca,
					popup: ({ setOpen }: PopupProps) => (
						<PopupMessaggio
							setOpen={setOpen}
							title={
								firstString(entry.autore, "Comunicazione") ?? "Comunicazione"
							}
							subtitle={firstString(entry.categoria, entry.desCategoria)}
							dateLabel={firstString(entry.data, entry.datEvento)}
							sections={[
								{ label: "Oggetto", value: firstString(entry.oggetto) },
								{ label: "Messaggio", value: firstString(entry.messaggio) },
							]}
							attachments={
								Array.isArray(entry.listaAllegati) && entry.listaAllegati[0]
									? entry.listaAllegati
											.map<React.ReactNode>((allegato: Record<string, any>) => (
												<Allegato
													allegato={
														allegato as {
															nomeFile: string;
															descrizioneFile?: string | null;
														}
													}
													getLink={client.getLinkAllegato.bind(
														client,
														allegato.pk
													)}
													key={allegato.pk}
												/>
											))
											.reduce((prev, curr) => [prev, " - ", curr])
									: undefined
							}
						/>
					),
				})
			);

			return [
				addSection(
					"Bacheca",
					menuItems,
					"Nessuna comunicazione disponibile."
				),
			];
		}

		const menuItems = (dashboard.bachecaAlunno ?? []).map(
			(entry: Record<string, any>, index: number): Item => ({
				key: `${entry.pk ?? "bacheca-alunno"}-${index}`,
				date:
					parseDate(entry.data, entry.datEvento, entry.datGiorno) ?? fallbackDate,
				header:
					firstString(entry.messaggio, "Comunicazione alunno") ??
					"Comunicazione alunno",
				title: firstString(entry.nomeFile),
				content:
					firstString(
						entry.nomeFile,
						entry.messaggio,
						"Comunicazione senza dettaglio"
					) ?? "Comunicazione senza dettaglio",
				icon: bachecaAlunno,
				popup: ({ setOpen }: PopupProps) => (
					<PopupMessaggio
						setOpen={setOpen}
						title={
							firstString(entry.messaggio, "Comunicazione alunno") ??
							"Comunicazione alunno"
						}
						subtitle={firstString(entry.nomeFile)}
						dateLabel={firstString(entry.data, entry.datEvento)}
						sections={[
							{ label: "Messaggio", value: firstString(entry.messaggio) },
							{ label: "File", value: firstString(entry.nomeFile) },
						]}
						attachments={
							<Allegato
								allegato={
									entry as {
										nomeFile: string;
										descrizioneFile?: string | null;
									}
								}
								getLink={client.getLinkAllegatoStudente.bind(client, entry.pk)}
							/>
						}
					/>
				),
			})
		);

		return [
			addSection(
				"Bacheca alunno",
				menuItems,
				"Nessuna comunicazione alunno disponibile."
			),
		];
	}, [client, dashboard, slug]);

	const remoteSections = useMemo(() => {
		if (!slug || remoteState.loading || remoteState.error || remoteState.data == null)
			return undefined;
		switch (slug) {
			case "orario": {
				const entries = Array.isArray(remoteState.data)
					? (remoteState.data as Record<string, any>[])
					: [];
				const todayItems = uniqueBy(
					entries.map((entry, index) => {
						const date =
							parseDate(entry.datGiorno, entry.data, entry.date) ?? new Date();
						const header = subjectName(entry) ?? "Lezione";
						const teacher = teacherName(entry);
						const room = firstString(
							entry.desAula,
							entry.aula,
							entry.desLuogo,
							entry.luogo
						);
						const note = firstString(
							entry.desNota,
							entry.note,
							entry.desAnnotazioni
						);
						const content = [teacher, room, note]
							.filter((value) => value && value !== header)
							.join(" - ");

						return {
							key: `orario-${index}`,
							date,
							header,
							headerTitle: teacher,
							title:
								firstString(
									entry.ora,
									entry.oraLezione,
									entry.desOra,
									entry.oraInizio &&
										entry.oraFine &&
										`${entry.oraInizio} - ${entry.oraFine}`
								) ?? undefined,
							content: content || "Dettaglio non disponibile",
							icon: orarioIcon,
						};
					}),
					(item) =>
						[
							item.date.toISOString(),
							item.header,
							item.title ?? "",
							item.content,
						].join("|")
				);

				const label =
					todayItems[0] &&
					`${todayItems[0].date
						.getDate()
						.toString()
						.padStart(2, "0")}/${(todayItems[0].date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}/${todayItems[0].date.getFullYear()}`;

				return [
					addSection(
						label ? `Orario giornaliero del ${label}` : "Orario giornaliero",
						todayItems,
						"Nessuna lezione disponibile."
					),
				];
			}
			case "pagamenti": {
				const taxes = Array.isArray((remoteState.data as Record<string, any>)?.tasse)
					? ((remoteState.data as Record<string, any>).tasse as Record<string, any>[])
					: [];
				const taxItems = taxes.map((entry, index) => ({
					key: `tassa-${index}`,
					date:
						parseDate(
							entry.datScadenza,
							entry.dataScadenza,
							entry.datPagamento,
							entry.dataPagamento
						) ?? fallbackDate,
					header:
						firstString(
							entry.desContributo,
							entry.desTassa,
							entry.causale,
							"Pagamento"
						) ?? "Pagamento",
					title: firstString(entry.stato, entry.desStato),
					content:
						[
							firstString(
								entry.importo != null ? `${entry.importo} €` : undefined,
								entry.importoPagato != null
									? `Pagato ${entry.importoPagato} €`
									: undefined
							),
							formatDateLabel(entry.dataEmissione ?? entry.datEmissione)
								? `Emesso: ${formatDateLabel(entry.dataEmissione ?? entry.datEmissione)}`
								: undefined,
							formatDateLabel(entry.dataScadenza ?? entry.datScadenza)
								? `Scadenza: ${formatDateLabel(entry.dataScadenza ?? entry.datScadenza)}`
								: undefined,
						]
							.filter(Boolean)
							.join(" - ") || formatUnknownContent(entry),
					icon: pagamentiIcon,
				}));

				return [addSection("Pagamenti", taxItems, "Nessun pagamento disponibile.")];
			}
			case "curriculum": {
				const data = remoteState.data;
				const entries = Array.isArray(data)
					? data
					: data && typeof data === "object"
						? Object.values(data as Record<string, unknown>)
						: [];
				const curriculumItems = entries.map((entry: any, index: number) => {
					const payload =
						entry && typeof entry === "object"
							? (entry as Record<string, any>)
							: { valore: String(entry) };
					const visibleValues = itemToLines(payload).filter(
						(value) => !looksOpaque(value)
					);

					return {
						key: `curriculum-${index}`,
						date:
							parseDate(
								payload.datEvento,
								payload.datGiorno,
								payload.data,
								payload.dataInizio
							) ?? fallbackDate,
					header:
						firstString(
							payload.desTitolo,
							payload.titolo,
							payload.descrizione,
							payload.categoria,
							payload.tipo,
							visibleValues[0],
							"Curriculum"
						) ?? "Curriculum",
					content:
						visibleValues.filter((value) => value !== visibleValues[0]).join(" - ") ||
						"Dettaglio curriculum non disponibile",
						icon: curriculumIcon,
					};
				});

				return [
					addSection(
						"Curriculum",
						curriculumItems,
						"Nessuna informazione di curriculum disponibile."
					),
				];
			}
			case "votiScrutinio": {
				const periods = Array.isArray(remoteState.data) ? remoteState.data : [];
				const voteItems = periods.flatMap((period: Record<string, any>, periodIndex: number) =>
					(period.voti ?? period.materie ?? []).map(
						(entry: Record<string, any>, index: number) => ({
							key: `scrutinio-${periodIndex}-${index}`,
							date: parseDate(period.datEvento, period.data, period.datGiorno) ?? fallbackDate,
							header:
								firstString(
									entry.desMateria,
									entry.materia,
									period.desPeriodo,
									"Voto scrutinio"
								) ?? "Voto scrutinio",
							title:
								firstString(entry.desPeriodo, period.desPeriodo, entry.voto, entry.giudizio) ??
								undefined,
							content: formatUnknownContent(entry),
							icon: votiScrutinioIcon,
						})
					)
				);

				return [
					addSection(
						"Voti scrutinio",
						voteItems,
						"Nessun voto di scrutinio disponibile."
					),
				];
			}
			default:
				return undefined;
		}
	}, [remoteState.data, remoteState.error, remoteState.loading, slug]);

	if (!section)
		return (
			<div className="my-2 lg:px-2 container flex flex-col justify-center h-full w-full">
				<h2 className={`${bold.className} text-2xl`}>Sezione non disponibile</h2>
				<span className={`${regularItalic.className} my-4`}>
					Questa voce del menu non esiste ancora nel fork.
				</span>
			</div>
		);

	return (
		<div className="my-2 lg:px-2 container flex flex-col h-full w-full">
			<h2 className={`${bold.className} text-2xl`}>{section.title}</h2>
			{["orario", "pagamenti", "curriculum", "votiScrutinio"].includes(slug ?? "") &&
			state !== State.Ready ? (
				<span className={`${regularItalic.className} my-4`}>
					Attendere il completamento della sincronizzazione del profilo...
				</span>
			) : remoteState.loading ? (
				<span className={`${regularItalic.className} my-4`}>
					Caricamento dati in corso...
				</span>
			) : remoteState.error ? (
				<span className={`${regularItalic.className} my-4`}>
					Errore: {remoteState.error}
				</span>
			) : compitiSections ? (
				compitiSections.map((group) => (
					<div className="my-4 flex flex-col" key={group.title}>
						<h3 className={`${bold.className} text-xl mb-2`}>{group.title}</h3>
						{group.items.length ? (
							renderItemList(group.items)
						) : (
							<span className={regularItalic.className}>{group.emptyMessage}</span>
						)}
					</div>
				))
			) : bachecaSections ? (
				bachecaSections.map((group) => (
					<div className="my-4 flex flex-col" key={group.title}>
						<h3 className={`${bold.className} text-xl mb-2`}>{group.title}</h3>
						{group.items.length ? (
							renderItemList(group.items)
						) : (
							<span className={regularItalic.className}>{group.emptyMessage}</span>
						)}
					</div>
				))
			) : remoteSections ? (
				remoteSections.map((group) => (
					<div className="my-4 flex flex-col" key={group.title}>
						<h3 className={`${bold.className} text-xl mb-2`}>{group.title}</h3>
						{group.items.length ? (
							renderItemList(group.items)
						) : (
							<span className={regularItalic.className}>{group.emptyMessage}</span>
						)}
					</div>
				))
			) : section.notImplementedMessage && !items.length ? (
				<span className={`${regularItalic.className} my-4`}>
					{section.notImplementedMessage}
				</span>
			) : items.length ? (
				<div className="my-4 flex flex-col">{renderItemList(items)}</div>
			) : (
				<span className={`${regularItalic.className} my-4`}>
					{section.emptyMessage}
				</span>
			)}
		</div>
	);
};

export default MenuFallbackPage;
