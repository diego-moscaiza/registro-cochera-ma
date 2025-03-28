import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
	try {
		console.log("Solicitud recibida en /api/auth/callback con URL:", url.toString());

		const authCode = url.searchParams.get("code");

		if (!authCode) {
			return new Response("No code provided", { status: 400 });
		}

		const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

		if (error) {
			console.error("Error exchanging code for session:", error);
			return new Response(error.message, { status: 500 });
		}

		const { access_token, refresh_token } = data.session;

		try {
			cookies.set("sb-access-token", access_token, {
				path: "/",
				secure: process.env.NODE_ENV === "production",
				httpOnly: true,
			});
			cookies.set("sb-refresh-token", refresh_token, {
				path: "/",
				secure: process.env.NODE_ENV === "production",
				httpOnly: true,
			});
		} catch (cookieError) {
			console.error("Error setting cookies:", cookieError);
			return new Response("Failed to set authentication cookies", { status: 500 });
		}

		// Verificar si hay un bucle de redirección
		const redirectCount = parseInt(cookies.get("redirect-count")?.value || "0", 10);
		if (redirectCount > 5) {
			console.error("Bucle de redirección detectado");
			return new Response("Too many redirects", { status: 500 });
		}

		cookies.set("redirect-count", (redirectCount + 1).toString(), {
			path: "/",
			httpOnly: true,
		});

		return redirect("/panel/pagos-hoy");
	} catch (error) {
		console.error("Unexpected error in GET /callback:", error);
		return new Response("Internal server error", { status: 500 });
	}
};
