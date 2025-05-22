import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

const handleErrorResponse = (message: string, status: number): Response => {
	return new Response(message, { status });
};

// Función actualizada para incluir duración de sesión basada en "remember"
const setAuthCookies = (cookies: any, accessToken: string, refreshToken: string, remember: boolean): boolean => {
	try {
		// Configurar la duración de la sesión: 30 días si "remember" está activo, o 1 día si no
		const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // segundos: 30 días o 1 día

		cookies.set("sb-access-token", accessToken, {
			sameSite: "strict",
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: maxAge, // Añadir maxAge para controlar cuándo expira
		});
		cookies.set("sb-refresh-token", refreshToken, {
			sameSite: "strict",
			path: "/",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: maxAge, // Añadir maxAge para controlar cuándo expira
		});
		return true;
	} catch (error) {
		console.error("Error setting auth cookies:", error);
		return false;
	}
};

const signInWithOAuth = async (provider: Provider, redirectTo: string): Promise<Response> => {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: { redirectTo },
	});
	if (error) {
		return handleErrorResponse(error.message, 500);
	}
	return new Response(null, { status: 302, headers: { Location: data.url } });
};

const signInWithPassword = async (email: string, password: string): Promise<Response> => {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	if (error) {
		return handleErrorResponse(error.message, 500);
	}
	return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	try {
		const formData = await request.formData();
		const email = formData.get("email")?.toString() || "";
		const password = formData.get("password")?.toString() || "";
		const provider = formData.get("provider")?.toString();
		// Capturar el valor del checkbox "remember" del formulario
		const remember = formData.get("remember") === "on";

		const redirectToDashboard = "/panel/pagos-del-dia";

		if (provider) {
			const response = await signInWithOAuth(provider as Provider, redirectToDashboard);
			if (response.status === 302) {
				return response;
			}
			const errorText = await response.text();
			console.error("OAuth sign-in error:", errorText);
			return handleErrorResponse(errorText, response.status);
		}

		if (!email || !password) {
			return handleErrorResponse("Email and password are required", 400);
		}

		const response = await signInWithPassword(email, password);
		if (response.status !== 200) {
			const errorText = await response.text();
			console.error("Password sign-in error:", errorText);
			return handleErrorResponse(errorText, response.status);
		}

		const data = JSON.parse(await response.text());
		if (!data.session) {
			return handleErrorResponse("Session not found", 500);
		}

		const { access_token, refresh_token } = data.session;
		// Pasar el valor de remember a la función setAuthCookies
		const cookiesSet = setAuthCookies(cookies, access_token, refresh_token, remember);

		if (!cookiesSet) {
			return handleErrorResponse("Failed to set authentication cookies", 500);
		}

		// Imprimir en consola para debugging (puedes quitar esto en producción)
		console.log(`Usuario autenticado, sesión extendida: ${remember ? 'Sí (30 días)' : 'No (1 día)'}`);

		return redirect(redirectToDashboard);
	} catch (error) {
		console.error("Unexpected error in POST /inicio-sesion:", error);
		return handleErrorResponse("Internal server error", 500);
	}
};
