"use client";

import DownloadDebugPayload from "@/components/dashboard/DownloadDebugPayload";
import { bold, regularItalic } from "@/app/fonts";
import { ClientContext } from "@/components/dashboard/ClientProvider";
import Link from "next/link";
import { useContext, useMemo } from "react";

const DebugPage = () => {
	const {
		client: { dashboard, loginData, profile, token },
	} = useContext(ClientContext);

	const summary = useMemo(
		() => ({
			hasDashboard: Boolean(dashboard),
			hasLoginData: Boolean(loginData),
			hasProfile: Boolean(profile),
			hasToken: Boolean(token),
			mediaGenerale: dashboard?.mediaGenerale ?? null,
			mediaMaterieKeys: dashboard?.mediaMaterie
				? Object.keys(dashboard.mediaMaterie)
				: [],
			mediaPerPeriodoKeys: dashboard?.mediaPerPeriodo
				? Object.keys(dashboard.mediaPerPeriodo)
				: [],
			votiCount: dashboard?.voti?.length ?? 0,
			registroCount: dashboard?.registro?.length ?? 0,
			bachecaCount: dashboard?.bacheca?.length ?? 0,
			promemoriaCount: dashboard?.promemoria?.length ?? 0,
			listaMaterieCount: dashboard?.listaMaterie?.length ?? 0,
		}),
		[dashboard, loginData, profile, token]
	);

	const payload = useMemo(
		() =>
			JSON.stringify(
				{
					summary,
					mediaGenerale: dashboard?.mediaGenerale ?? null,
					mediaMaterie: dashboard?.mediaMaterie ?? null,
					mediaPerPeriodo: dashboard?.mediaPerPeriodo ?? null,
					voti: dashboard?.voti ?? null,
					listaMaterie: dashboard?.listaMaterie ?? null,
				},
				null,
				2
			),
		[dashboard, summary]
	);

	return (
		<div className="container px-2 lg:px-8 my-4 text-left">
			<div className="flex items-center justify-between gap-4">
				<h2 className={`${bold.className} text-2xl`}>Debug dati dashboard</h2>
				<div className="flex items-center gap-4">
					<DownloadDebugPayload />
					<Link href="/dashboard/options" className="link">
						Torna alle opzioni
					</Link>
				</div>
			</div>
			<p className="mt-3">
				Questa pagina mostra cosa e&apos; realmente disponibile nel payload gia&apos;
				caricato nel browser. Serve a distinguere tra dato assente e problema di
				rendering.
			</p>
			<div className="border rounded-lg mt-6 p-4">
				<h3 className={`${bold.className} text-xl`}>Sintesi</h3>
				<div className="mt-3 grid gap-2">
					<div>`hasDashboard`: {String(summary.hasDashboard)}</div>
					<div>`hasLoginData`: {String(summary.hasLoginData)}</div>
					<div>`hasProfile`: {String(summary.hasProfile)}</div>
					<div>`hasToken`: {String(summary.hasToken)}</div>
					<div>`mediaGenerale`: {String(summary.mediaGenerale)}</div>
					<div>`votiCount`: {summary.votiCount}</div>
					<div>`registroCount`: {summary.registroCount}</div>
					<div>`bachecaCount`: {summary.bachecaCount}</div>
					<div>`promemoriaCount`: {summary.promemoriaCount}</div>
					<div>`listaMaterieCount`: {summary.listaMaterieCount}</div>
					<div>`mediaMaterieKeys`: {summary.mediaMaterieKeys.join(", ") || "-"}</div>
					<div>
						`mediaPerPeriodoKeys`: {summary.mediaPerPeriodoKeys.join(", ") || "-"}
					</div>
				</div>
			</div>
			<div className="border rounded-lg mt-6 p-4">
				<h3 className={`${bold.className} text-xl`}>Payload rilevante</h3>
				{dashboard ? (
					<pre className="mt-3 overflow-auto text-sm whitespace-pre-wrap break-all">
						{payload}
					</pre>
				) : (
					<span className={regularItalic.className}>
						Nessun payload dashboard disponibile nel client.
					</span>
				)}
			</div>
		</div>
	);
};

export default DebugPage;
