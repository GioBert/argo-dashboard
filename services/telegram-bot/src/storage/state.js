import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const defaultState = {
	telegram: {
		lastUpdateId: 0,
	},
	reports: {},
};

const cloneDefaultState = () => JSON.parse(JSON.stringify(defaultState));

export const createStateStore = (statePath) => {
	const read = async () => {
		try {
			const content = await readFile(statePath, "utf8");
			const parsed = JSON.parse(content);

			return {
				...cloneDefaultState(),
				...parsed,
				telegram: {
					...cloneDefaultState().telegram,
					...parsed.telegram,
				},
				reports: {
					...cloneDefaultState().reports,
					...parsed.reports,
				},
			};
		} catch (error) {
			if (error && typeof error === "object" && "code" in error && error.code === "ENOENT")
				return cloneDefaultState();
			throw error;
		}
	};

	const write = async (state) => {
		await mkdir(dirname(statePath), { recursive: true });
		await writeFile(statePath, JSON.stringify(state, null, 2));
	};

	return {
		read,
		write,
		update: async (updater) => {
			const current = await read();
			const next = await updater(current);

			await write(next);
			return next;
		},
	};
};
