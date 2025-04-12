import { supabase } from "../../../../lib/supabase";

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
}
