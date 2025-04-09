import { supabase } from "../../../../lib/supabase";

// This function retrieves all payments from the "pagos_diarios" table
export const getAllPayments = async () => {
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

	return data ?? [];
};

// This function retrieves all payments for a specific user from the "pagos_diarios" table
export const getAllPaymentsById = async (id: string) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.select("*")
		.eq("dueno_id", id)
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

// This function retrieves all payments for a specific user and date from the "pagos_diarios" table
export const insertPayment = async (dueno_id: string, nombre_dueno: string) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.insert({ dueno_id, nombre_dueno })
		.select();
	if (error || !data) {
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
	return data ?? [];
};

// This function deletes a payment from the "pagos_diarios" table
export const updatePayment = async (id: string, dueno_id: string, nombre_dueno: string) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
		.update({ dueno_id, nombre_dueno })
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


// This function deletes a payment from the "pagos_diarios" table
export const deletePayment = async (id: string) => {
	const { data, error } = await supabase
		.from("pagos_diarios")
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
