import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async () => {
    const { data, error } = await supabase
        .from("pagos_diarios")
        .select("*")
        .order("id", { ascending: true })
        .order("created_at", { ascending: false });

    if (error || !data) {
        return new Response(
            JSON.stringify({
                error: error?.message || "No se encontraron datos.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(data ?? []), {
        headers: { "Content-Type": "application/json" },
    });
};


export const POST: APIRoute = async ({ request }) => {
    const { dueno_id, nombre_pagador } = await request.json();
    const { data, error } = await supabase
        .from("pagos_diarios")
        .insert({ dueno_id, nombre_pagador })
        .select();

    if (error) {
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            { status: 500 },
        );
    }

    return new Response(JSON.stringify(data));
};