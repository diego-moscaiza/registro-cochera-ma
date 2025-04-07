import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { supabase } from "../lib/supabase";

const userLoginRedirects = ["/inicio-sesion(|/)"];
const protectedRoutes = ["/panel(|/)", "/panel/**"];
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
	}

	const user = data.user;
	return {
		session: data.session,
		email: user?.email,
		displayName: user?.user_metadata?.display_name ?? "Usuario",
		phone: user?.user_metadata?.phone ?? "Sin número",
		otherInfo: user?.user_metadata,
	};
};

const handleSession = async ({ cookies, locals }: any) => {
	const sessionData = await getSession(cookies);

	if (!sessionData?.session) {
		// Eliminar cookies si la sesión no es válida
		if (cookies.has("sb-access-token")) cookies.delete("sb-access-token");
		if (cookies.has("sb-refresh-token")) cookies.delete("sb-refresh-token");
		return null;
	}

	// Guardar datos del usuario en locals
	locals.email = sessionData.email;
	locals.displayName = sessionData.displayName;
	locals.phone = sessionData.phone;
	locals.otherInfo = sessionData.otherInfo;

	// Actualizar cookies con los nuevos tokens
	cookies.set("sb-access-token", sessionData.session.access_token, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
	cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});

	return sessionData;
};

const handleProtectedRoute = async ({ cookies, redirect, locals }: any) => {
	const sessionData = await handleSession({ cookies, locals });
	if (!sessionData) {
		return redirect("/inicio-sesion");
	}
	return null;
};

const handleRedirectRoute = ({ cookies, redirect }: any) => {
	const accessToken = cookies.get("sb-access-token");
	const refreshToken = cookies.get("sb-refresh-token");

	if (accessToken && refreshToken) {
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
	const pathname = url.pathname;

	let response;

	const isProtected = micromatch.isMatch(pathname, protectedRoutes);
	const isLogin = micromatch.isMatch(pathname, userLoginRedirects);
	const isProtectedAPI = micromatch.isMatch(pathname, protectedAPIRoutes);

	// Manejar la sesión para rutas de inicio de sesión
	if (isLogin) {
		await handleSession({ cookies, locals });
	}

	// Redirigir a usuarios autenticados desde rutas de inicio de sesión
	if (!response && isLogin) {
		response = handleRedirectRoute({ cookies, redirect });
	}

	// Requerir autenticación para rutas protegidas
	if (!response && isProtected) {
		response = await handleProtectedRoute({ cookies, redirect, locals });
	}

	// Requerir autenticación para rutas protegidas de la API
	if (isProtectedAPI) {
		response = await handleProtectedAPI({ cookies });
	}

	return response || next();
});
