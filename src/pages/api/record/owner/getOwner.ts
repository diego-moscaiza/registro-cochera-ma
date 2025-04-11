import { supabase } from "../../../../lib/supabase";

// Get all owners
export const apiGetAllOwners = async () => {
	const { data, error } = await supabase
		.rpc("obtener_duenos_carretas");

	if (error || !data) {
		return new Response(
			JSON.stringify({
				error: error?.message || "No se encontraron datos.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
	return data ?? [];
};

// Get owners by Id
export const apiGetOwnerById = async (id: string) => {
	const { data, error } = await supabase
		.from("dueno_carreta")
		.select("id, nombre_dueno")
		.eq("id", id)
		.single();
	if (error || !data) {
		return new Response(
			JSON.stringify({
				error: error?.message || "No se encontraron datos.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
	return data ?? [];
};
