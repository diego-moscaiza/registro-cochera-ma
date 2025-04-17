import { supabase } from "../../../../lib/supabase";

// Update new owner
export async function POST({ request }: { request: Request }) {
	const body = await request.json();
	const { id, dueno_id, monto_total, retiro_coche, estado_pago, nota_adicional } = body;

	const { data, error } = await supabase
		.from("pagos_diarios")
		.update([
			{ dueno_id, monto_total, retiro_coche, estado_pago, nota_adicional },
		])
		.eq("id", id)
		.select();

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}

	return new Response(JSON.stringify(data), { status: 200 });
}

