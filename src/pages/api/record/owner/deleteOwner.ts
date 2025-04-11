import { supabase } from "../../../../lib/supabase";

export const apiDeleteOwner = async (id: string) => {
    const { data, error } = await supabase
        .from("dueno_carreta")
        .delete()
        .eq("id", id)

    if (error || !data) {
        return new Response(
            JSON.stringify({
                error: error?.message || "No se eliminaron datos.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
    return null;
};
