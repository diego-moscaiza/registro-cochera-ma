import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { baseUrl } from "../../../config";
import { supabase } from "../../../lib/supabase";

const handleErrorResponse = (message: string, status: number) => {
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

const signInWithOAuth = async (provider: Provider, redirectTo: string) => {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: { redirectTo },
	});
	return { data, error };
};

const signInWithPassword = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	return { data, error };
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const formData = await request.formData();
	const email = formData.get("email")?.toString() || ""; // Valor predeterminado
	const password = formData.get("password")?.toString() || ""; // Valor predeterminado
	const provider = formData.get("provider")?.toString();

	const redirectTo = `${baseUrl}/dashboard/payments`;

	if (provider) {
		const { data, error }: any = await signInWithOAuth(provider as Provider, redirectTo);
		if (error) {
			return handleErrorResponse(error.message, 500);
		}
		return redirect(data.url);
	}

	if (!email || !password) {
		return handleErrorResponse("Email and password are required", 400);
	}

	const { data, error } = await signInWithPassword(email, password);
	if (error) {
		return handleErrorResponse(error.message, 500);
	}

	// Verificar que data.session no sea null
	if (!data.session) {
		return handleErrorResponse("Session not found", 500);
	}

	const { access_token, refresh_token } = data.session;
	setAuthCookies(cookies, access_token, refresh_token);

	return redirect("/dashboard/payments");
};
