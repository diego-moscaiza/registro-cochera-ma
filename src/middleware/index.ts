import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { supabase } from "../lib/supabase";

const protectedRoutes = ["/panel(|/)", "/panel/**"];
const redirectRoutes = ["/inicio-sesion(|/)"];
const protectedAPIRoutes = ["/api/record/payment/**/", "/api/record/owner/**/"];
const redirectToDashboard = "/panel/pagos-del-dia";

const getSession = async (cookies: any) => {
	const accessToken = cookies.get("sb-access-token");
	const refreshToken = cookies.get("sb-refresh-token");

	if (!accessToken || !refreshToken) return null;

	const { data, error } = await supabase.auth.setSession({
		refresh_token: refreshToken.value,
		access_token: accessToken.value,
	});

	if (error) {
		console.log("Error setting session:", error);
		return null;
	};

	// Extraer más datos del usuario
	const user = data.user;
	return {
		session: data.session,
		email: user?.email,
		displayName: user?.user_metadata?.display_name ?? "Usuario",
		phone: user?.user_metadata?.phone ?? "Sin número",
		otherInfo: user?.user_metadata // Guarda todos los datos adicionales en caso de necesitarlos
	};
};


const handleProtectedRoute = async ({ cookies, redirect, locals }: any) => {
	const sessionData = await getSession(cookies);

	if (!sessionData?.session) {
		// Evita redirecciones repetitivas eliminando cookies solo si existen
		if (cookies.has("sb-access-token")) {
			cookies.delete("sb-access-token");
		}
		if (cookies.has("sb-refresh-token")) {
			cookies.delete("sb-refresh-token");
		}
		return redirect("/inicio-sesion");
	}

	// Guardamos los datos en locals para usarlos en cualquier parte del servidor
	locals.email = sessionData.email;
	locals.displayName = sessionData.displayName;
	locals.phone = sessionData.phone;
	locals.otherInfo = sessionData.otherInfo; // Todos los metadatos

	// Guardar los tokens en cookies para mantener la sesión
	cookies.set("sb-access-token", sessionData?.session?.access_token ?? "", {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
	cookies.set("sb-refresh-token", sessionData?.session?.refresh_token ?? "", {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
	return null;
};

const handleRedirectRoute = ({ cookies, redirect }: any) => {
	const accessToken = cookies.get("sb-access-token");
	const refreshToken = cookies.get("sb-refresh-token");

	// Evita redirecciones innecesarias si ya estás en el dashboard
	if (accessToken && refreshToken && redirectToDashboard !== "/panel/pagos-del-dia") {
		return redirect(redirectToDashboard);
	}
	return null;
};

const handleProtectedAPI = async ({ cookies }: any) => {
	const sessionData = await getSession(cookies);
	if (!sessionData) {
		return new Response(
			JSON.stringify({ error: "Unauthorized" }),
			{ status: 401 }
		);
	}
	return null;
};

export const onRequest = defineMiddleware(async (context: any, next: any) => {
	const { url, cookies, redirect, locals } = context;

	let response;

	// Manejar la ruta "/"
	if (url.pathname === "/") {
		return new Response(null, { status: 204 });
	}

	// Manejar rutas protegidas
	if (!response && micromatch.isMatch(url.pathname, protectedRoutes)) {
		response = await handleProtectedRoute({ cookies, redirect, locals });
	}

	// Manejar rutas de redirección
	if (!response && micromatch.isMatch(url.pathname, redirectRoutes)) {
		response = handleRedirectRoute({ cookies, redirect });
	}

	// Manejar rutas protegidas de la API
	if (!response && micromatch.isMatch(url.pathname, protectedAPIRoutes)) {
		response = await handleProtectedAPI({ cookies });
	}

	return response || next();
});
