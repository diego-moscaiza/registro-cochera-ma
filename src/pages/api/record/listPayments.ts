import { baseUrl } from "../../../config";

export async function getPagos() {
	const res = await fetch(`${baseUrl}/api/record/payments`);
	return res.json();
}

