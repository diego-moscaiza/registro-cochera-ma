import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

const handleErrorResponse = (message: string, status: number): Response => {
	return new Response(message, { status });
};

const setAuthCookies = (cookies: any, accessToken: string, refreshToken: string): boolean => {
	try {
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

		const redirectToDashboard = "/panel/pagos-hoy";

		if (provider) {
			const response = await signInWithOAuth(provider as Provider, redirectToDashboard);
			if (response.status === 302) {
				return response;
			}
			console.error("OAuth sign-in error:", await response.text());
			return response;
		}

		if (!email || !password) {
			return handleErrorResponse("Email and password are required", 400);
		}

		const response = await signInWithPassword(email, password);
		if (response.status !== 200) {
			console.error("Password sign-in error:", await response.text());
			return response;
		}

		const data = JSON.parse(await response.text());
		if (!data.session) {
			return handleErrorResponse("Session not found", 500);
		}

		const { access_token, refresh_token } = data.session;
		const cookiesSet = setAuthCookies(cookies, access_token, refresh_token);

		if (!cookiesSet) {
			return handleErrorResponse("Failed to set authentication cookies", 500);
		}

		return redirect(redirectToDashboard);
	} catch (error) {
		console.error("Unexpected error in POST /signin:", error);
		return handleErrorResponse("Internal server error", 500);
	}
};
