import type { APIRoute } from "astro";
import { supabase } from "../../../../lib/supabase";

export const GET: APIRoute = async () => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.select("*")
		.order("fecha_pago", { ascending: false });

	if (error || !data) {
		return new Response(
			JSON.stringify({
				error: error?.message || "No se encontraron datos.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	return new Response(JSON.stringify(data ?? []), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Evita el almacenamiento en caché de datos sensibles
		},
	});
};

export const POST: APIRoute = async ({ request }) => {
	const { dueno_id, nombre_dueno } = await request.json();
	const { data, error } = await supabase
		.from("pagos_diarios")
		.insert({ dueno_id, nombre_dueno })
		.select();

	if (error) {
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{ status: 500 },
		);
	}

	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Evita el almacenamiento en caché de datos sensibles
		},
	});
};
