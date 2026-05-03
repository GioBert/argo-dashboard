"use client";
import { light, medium, semiBold } from "@/app/fonts";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Dispatch, SetStateAction } from "react";

const PopupMessaggio = ({
	setOpen,
	title,
	subtitle,
	dateLabel,
	sections,
	attachments,
}: {
	setOpen: Dispatch<SetStateAction<boolean>>;
	title: string;
	subtitle?: string;
	dateLabel?: string;
	sections: { label: string; value?: string }[];
	attachments?: React.ReactNode;
}) => (
	<>
		<div className="flex flex-row w-full justify-between gap-4">
			<div className="flex flex-col">
				<span className={`${medium.className} uppercase`}>{title}</span>
				{subtitle && (
					<span className="text-cyan-500 text-base py-1">{subtitle}</span>
				)}
				{dateLabel && (
					<span
						className={`${light.className} text-sm text-opacity-70 text-black dark:text-white dark:text-opacity-70`}
					>
						{dateLabel}
					</span>
				)}
			</div>
			<FontAwesomeIcon
				icon={faXmark}
				className="w-8 h-8 p-2 rounded-lg hover:bg-zinc-400 dark:hover:bg-zinc-600 hover:bg-opacity-65 dark:hover:bg-opacity-65 cursor-pointer"
				onClick={setOpen.bind(null, false)}
			/>
		</div>
		<div className="flex flex-col my-6 gap-4">
			{sections.map((section) => (
				<div className="flex flex-col" key={section.label}>
					<span className={light.className}>{section.label}</span>
					<span className={section.value ? undefined : "italic"}>
						{section.value || "Dato non disponibile"}
					</span>
				</div>
			))}
			{attachments && (
				<div className="flex flex-col">
					<span className={light.className}>Allegati</span>
					<div className={`${semiBold.className} text-cyan-500`}>
						{attachments}
					</div>
				</div>
			)}
		</div>
	</>
);

export default PopupMessaggio;
