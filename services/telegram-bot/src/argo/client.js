import {
	Client,
	getCode,
	getToken,
} from "../../../../vendors/portaleargo-api/dist/index.js";

const createCredentials = (config) => ({
	username: config.argo.username,
	password: config.argo.password,
	schoolCode: config.argo.schoolCode,
});

const ensureObject = (value, message) => {
	if (!value || typeof value !== "object") throw new Error(message);
	return value;
};

export const createArgoClient = (config) => {
	let tokenPromise;

	const getAccessToken = async () => {
		tokenPromise ??= (async () => {
			const code = await getCode(createCredentials(config)).catch(() => null);

			if (!code) throw new Error("Argo authorization code request failed");
			const token = await getToken(code).catch((error) => String(error));

			if (typeof token === "string")
				throw new Error(`Argo token request failed: ${token}`);
			return ensureObject(token, "Argo token payload is not an object");
		})();
		return tokenPromise;
	};

	return {
		getCapabilities: async () => {
			return {
				canLogin: true,
				canFetchDashboard: true,
				strategy: "vendored-dist-client",
			};
		},
		getDashboard: async () => {
			const token = await getAccessToken();
			const client = new Client({
				schoolCode: config.argo.schoolCode,
				username: config.argo.username,
				password: config.argo.password,
				dataProvider: null,
			});

			client.token = token;
			await client.login();
			const dashboard = client.dashboard;

			return ensureObject(dashboard, "Argo dashboard payload is not an object");
		},
	};
};
