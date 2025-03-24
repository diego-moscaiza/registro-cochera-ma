import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { baseUrl } from "../../../config";
import { supabase } from "../../../lib/supabase";

/**
 * Interfaz para estrategias de autenticación.
 */
interface AuthStrategy {
	authenticate(): Promise<Response>;
}

/**
 * Estrategia para autenticación con OAuth.
 */
class OAuthStrategy implements AuthStrategy {
	private provider: Provider;

	constructor(provider: Provider) {
		this.provider = provider;
	}

	async authenticate(): Promise<Response> {
		const redirectTo = `${baseUrl}/dashboard/payments`;

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: this.provider,
			options: { redirectTo },
		});

		if (error) {
			return new Response(error.message, { status: 500 });
		}

		return Response.redirect(data.url, 302);
	}
}

/**
 * Estrategia para autenticación con email y contraseña.
 */
class EmailAuthStrategy implements AuthStrategy {
	private email: string;
	private password: string;
	private cookies: any;

	constructor(email: string, password: string, cookies: any) {
		this.email = email;
		this.password = password;
		this.cookies = cookies;
	}

	async authenticate(): Promise<Response> {
		if (!this.email || !this.password) {
			return new Response("Email and password are required", { status: 400 });
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email: this.email,
			password: this.password,
		});

		if (error) {
			return new Response(error.message, { status: 500 });
		}

		const { access_token, refresh_token } = data.session;
		this.cookies.set("sb-access-token", access_token, {
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		});
		this.cookies.set("sb-refresh-token", refresh_token, {
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		});

		let redirecTo = `${baseUrl}/dashboard/payments` || "/dashboard/payments";

		return Response.redirect(redirecTo, 302);
	}
}

/**
 * Contexto para manejar estrategias de autenticación.
 */
class AuthContext {
	private strategy: AuthStrategy | null = null;

	setStrategy(strategy: AuthStrategy) {
		this.strategy = strategy;
	}

	async authenticate(): Promise<Response> {
		if (!this.strategy) {
			return new Response("No authentication strategy set", { status: 400 });
		}
		return await this.strategy.authenticate();
	}
}

/**
 * Endpoint de autenticación.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
	const formData = await request.formData();
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const provider = formData.get("provider")?.toString() as Provider | undefined;

	const authContext = new AuthContext();

	if (provider) {
		authContext.setStrategy(new OAuthStrategy(provider));
	} else if (email && password) {
		authContext.setStrategy(new EmailAuthStrategy(email, password, cookies));
	} else {
		return new Response("Invalid authentication method", { status: 400 });
	}

	return await authContext.authenticate();
};
