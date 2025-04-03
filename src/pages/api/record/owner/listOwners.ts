import { baseUrl } from "../../../../config";

export async function getPropietarios() {
	const res = await fetch(`${baseUrl}/api/record/owner/apiOwners`);
	return res.json();
}
