"use client";

import { ClientContext } from "@/components/dashboard/ClientProvider";
import { useContext } from "react";

const DownloadDebugPayload = () => {
	const {
		client: { dashboard, loginData, profile, token },
	} = useContext(ClientContext);

	return (
		<button
			className="relative w-full max-w-56 px-4 py-3 whitespace-normal break-words text-center rounded duration-500 bg-zinc-300 dark:bg-zinc-700 text-sm leading-tight lg:text-base focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-600 enabled:hover:scale-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-200 dark:disabled:bg-zinc-800"
			disabled={!dashboard}
			onClick={() => {
				const payload = {
					generatedAt: new Date().toISOString(),
					loginData,
					profile,
					token,
					dashboard,
				};
				const blob = new Blob([JSON.stringify(payload, null, 2)], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");

				link.href = url;
				link.download = "argo-dashboard-debug-payload.json";
				link.click();
				URL.revokeObjectURL(url);
			}}
		>
			Scarica payload
		</button>
	);
};

export default DownloadDebugPayload;
