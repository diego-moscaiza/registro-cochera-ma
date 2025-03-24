import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { baseUrl } from "../../../config";
import { supabase } from "../../../lib/supabase";

const handleErrorResponse = (message: string, status: number): Response => {
	return new Response(message, { status });
};

const setAuthCookies = (cookies: any, accessToken: string, refreshToken: string) => {
	cookies.set("sb-access-token", accessToken, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
	cookies.set("sb-refresh-token", refreshToken, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
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
	const formData = await request.formData();
	const email = formData.get("email")?.toString() || ""; // Valor predeterminado
	const password = formData.get("password")?.toString() || ""; // Valor predeterminado
	const provider = formData.get("provider")?.toString();

	const redirectTo = `${baseUrl}/dashboard/payments`;
	const relativeRedirectTo = "/dashboard/payments";

	if (provider) {
		const response = await signInWithOAuth(provider as Provider, redirectTo);
		if (response.status === 302) {
			return response; // Redirigir si es un Response de redirección
		}
		return response; // Devuelve la respuesta de error si existe
	}

	if (!email || !password) {
		return handleErrorResponse("Email and password are required", 400);
	}

	const response = await signInWithPassword(email, password);
	if (response.status !== 200) {
		return response; // Devuelve la respuesta de error si existe
	}

	const data = JSON.parse(await response.text());
	if (!data.session) {
		return handleErrorResponse("Session not found", 500);
	}

	const { access_token, refresh_token } = data.session;
	setAuthCookies(cookies, access_token, refresh_token);

	return redirect(relativeRedirectTo);
};
