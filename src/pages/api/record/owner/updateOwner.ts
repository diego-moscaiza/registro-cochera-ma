import { supabase } from "../../../../lib/supabase";

// Insert new owner
export async function POST({ request }: { request: Request }) {
    const body = await request.json();
    const { id, nombre_dueno, monto_diario, guarda_carreta } = body;

    const { data, error } = await supabase
        .from("dueno_carreta")
        .update([
            { nombre_dueno, monto_diario, guarda_carreta },
        ])
        .eq("id", id)
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
}
