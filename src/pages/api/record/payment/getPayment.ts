import { supabase } from "../../../../lib/supabase";

// This function retrieves all payments from the "pagos_diarios" table
export const getAllPayments = async () => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.select("*")
		.order("fecha_pago", { ascending: false })
		.order("id", { ascending: false });

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

// This function retrieves all payments for a specific user from the "pagos_diarios" table
export const getAllPaymentsById = async ({ id }: { id: string }) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.select("*")
		.eq("dueno_id", id)
		.order("id", { ascending: false })
		.order("fecha_pago", { ascending: false });

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

// This function retrieves all payments for a specific user and date from the "pagos_diarios" table
export const getAllPaymentsByIdAndDate = async (id: string, date: string) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.select("*")
		.eq("dueno_id", id)
		.eq("fecha_pago", date)
		.order("fecha_pago", { ascending: false });
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
