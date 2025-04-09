import { baseUrl } from "../../../../config";

export async function getPropietarios() {
	return await fetch(`${baseUrl}/api/record/owner/apiOwners`)
		.then((response) => response.json());
}
