import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Invalidar la sesión en Supabase
    await supabase.auth.signOut();

    // Eliminar cookies con las mismas opciones que al crearlas
    cookies.delete("sb-access-token", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    });

    return redirect("/inicio-sesion");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return new Response("Error al cerrar sesión", { status: 500 });
  }
};
