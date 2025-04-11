import { supabase } from "../../../../lib/supabase";

// Insert new owner
export const apiInsertOwner = async (id: string, nombre_dueno: string, monto_diario: number, guarda_carreta: boolean) => {
    const { data, error } = await supabase
        .from("dueno_carreta")
        .insert([
            { nombre_dueno, montoDiario: monto_diario, guarda_carreta, id: id + 1 },
        ])

    if (error == null) {
        // Si no hay errores, se recarga la pagina
        window.location.href = `/panel/propietarios-carretas`;
        return data;
    }

    return new Response(
        JSON.stringify({
            error: error?.message || "No se enviaron datos.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
    );
};
