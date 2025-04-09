import { supabase } from "../../../../lib/supabase";

// Get all owners
export const getAllOwners = async () => {
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
export const getOwnerById = async (id: string) => {
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

// Insert new owner
export const insertOwner = async (id: string, nombre_dueno: string) => {
	const { data, error } = await supabase
		.from("dueno_carreta")
		.insert({ id, nombre_dueno })
		.select();
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

// Update an existing owner
export const updateOwner = async (id: string, nombre_dueno: string) => {
	const { data, error } = await supabase
		.from("dueno_carreta")
		.update({ nombre_dueno })
		.eq("id", id)
		.select();
	if (error || !data) {
		return new Response(
			JSON.stringify({
				error: error?.message || "No se encontraron datos.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
	return data;
};

// Delete an existing owner
export const deleteOwner = async (id: string) => {
	const { data, error } = await supabase
		.from("dueno_carreta")
		.delete()
		.eq("id", id)
		.select();
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

// export const GET: APIRoute = async () => {
// 	const { data, error } = await supabase
// 		.rpc("obtener_duenos_carretas");

// 	if (error || !data) {
// 		return new Response(
// 			JSON.stringify({
// 				error: error?.message || "No se encontraron datos.",
// 			}),
// 			{ status: 500, headers: { "Content-Type": "application/json" } }
// 		);
// 	}

// 	return new Response(JSON.stringify(data ?? []), {
// 	});
// };

// export const POST: APIRoute = async ({ request }) => {
// 	const { id, nombre_dueno } = await request.json();
// 	const { data, error } = await supabase
// 		.from("dueno_carreta")
// 		.insert({ id, nombre_dueno })
// 		.select();

// 	if (error) {
// 		return new Response(
// 			JSON.stringify({
// 				error: error.message,
// 			}),
// 			{ status: 500 },
// 		);
// 	}

// 	return new Response(JSON.stringify(data), {
// 		headers: {
// 			"Content-Type": "application/json",
// 			"Cache-Control": "no-store", // Evita el almacenamiento en caché de datos sensibles
// 		},
// 	});
// };
