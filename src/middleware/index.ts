import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { supabase } from "../lib/supabase";

const loginRedirects = ["/inicio-sesion(|/)"];
const protectedRoutes = ["/", "/panel(|/)", "/panel/**"];
const protectedAPIRoutes = ["/api/record/payment/**/", "/api/record/owner/**/"];
const redirectToDashboard = "/panel/pagos-del-dia";

// Cache para evitar múltiples renovaciones simultáneas del mismo token
// La clave es el token de acceso y el valor es una promesa que se resuelve con los datos de la sesión
const sessionRefreshCache = new Map();

const getSession = async (cookies: any) => {
	const accessToken = cookies.get("sb-access-token");
	const refreshToken = cookies.get("sb-refresh-token");

	if (!accessToken || !refreshToken) return null;

	// Si ya hay una solicitud en curso para este token, reutilizamos la promesa
	const cacheKey = accessToken.value;
	if (sessionRefreshCache.has(cacheKey)) {
		try {
			return await sessionRefreshCache.get(cacheKey);
		} catch (error) {
			// Si la promesa en caché falló, eliminamos la entrada y continuamos
			sessionRefreshCache.delete(cacheKey);
			console.log("Cached session refresh failed:", error);
		}
	}

	// Creamos una nueva promesa para esta renovación
	const sessionPromise = (async () => {
		try {
			const { data, error } = await supabase.auth.setSession({
				refresh_token: refreshToken.value,
				access_token: accessToken.value,
			});

			if (error) {
				// Si el error es de refresh token usado, simplemente dejamos que el usuario vuelva a iniciar sesión
				if (error.message?.includes("Invalid Refresh Token") || error.code === 'refresh_token_already_used') {
					console.log("Refresh token error, redirecting to login:", error.message);
					return null;
				}
				console.log("Error setting session:", error);
				return null;
			}

			const user = data.user;
			if (!user) return null;

			return {
				session: data.session,
				email: user?.email,
				displayName: user?.user_metadata?.display_name ?? "Usuario",
				phone: user?.user_metadata?.phone ?? "Sin número",
				otherInfo: user?.user_metadata,
			};
		} catch (error) {
			console.log("Unexpected error in getSession:", error);
			return null;
		}
	})();

	// Almacenamos la promesa en la caché
	sessionRefreshCache.set(cacheKey, sessionPromise);

	// Configuramos un timeout para eliminar la entrada de la caché después de completarse
	sessionPromise
		.finally(() => {
			// Eliminar de la caché después de 5 segundos para permitir que otras solicitudes simultáneas la utilicen
			setTimeout(() => {
				sessionRefreshCache.delete(cacheKey);
			}, 5000);
		});

	return sessionPromise;
};

const handleSession = async ({ cookies, locals }: any) => {
	const sessionData = await getSession(cookies);

	if (!sessionData?.session) {
		// Eliminar cookies si la sesión no es válida, especificando path
		if (cookies.has("sb-access-token")) cookies.delete("sb-access-token", { path: "/" });
		if (cookies.has("sb-refresh-token")) cookies.delete("sb-refresh-token", { path: "/" });
		return null;
	}

	// Guardar datos del usuario en locals
	locals.email = sessionData.email;
	locals.displayName = sessionData.displayName;
	locals.phone = sessionData.phone;
	locals.otherInfo = sessionData.otherInfo;

	// Obtener la duración actual de las cookies para mantenerla
	const accessTokenCookie = cookies.get("sb-access-token");
	const maxAge = accessTokenCookie?.maxAge || 60 * 60 * 24; // Default: 1 día

	// Actualizar cookies con los nuevos tokens pero manteniendo la duración
	cookies.set("sb-access-token", sessionData.session.access_token, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: maxAge,
	});
	cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
		sameSite: "strict",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: maxAge,
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
	const isLogin = micromatch.isMatch(pathname, loginRedirects);
	const isProtectedAPI = micromatch.isMatch(pathname, protectedAPIRoutes);

	// Manejar rutas relacionadas con el inicio de sesión
	if (isLogin) {
		await handleSession({ cookies, locals });
	}

	// Manejar rutas protegidas
	if (!response && isProtected) {
		response = await handleProtectedRoute({ cookies, redirect, locals });
	}

	// Manejar redirección para usuarios autenticados
	if (!response && isLogin) {
		response = handleRedirectRoute({ cookies, redirect });
	}

	// Manejar rutas protegidas de la API
	if (isProtectedAPI) {
		response = await handleProtectedAPI({ cookies });
	}

	return response || next();
});
