import { useState } from "react";

const ExpandText = ({
	title,
	content,
	defaultExpanded = false,
}: {
	title?: string;
	content: string;
	defaultExpanded?: boolean;
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const long = content.length > 100;
	const preview = `${content.slice(0, 180).trimEnd()}...`;

	return (
		<span title={title}>
			{long && !expanded ? preview : content}
			{long && (
				<button
					className="ml-2 text-cyan-500 underline underline-offset-2"
					onClick={setExpanded.bind(null, (value) => !value)}
					type="button"
				>
					{expanded ? "Riduci" : "Espandi"}
				</button>
			)}
		</span>
	);
};

export default ExpandText;
