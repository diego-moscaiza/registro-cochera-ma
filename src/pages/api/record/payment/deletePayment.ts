import { supabase } from "../../../../lib/supabase";

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
