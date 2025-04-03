import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { supabase } from "../lib/supabase";

const protectedRoutes = ["/panel(|/)", "/panel/**/"];
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
		if (cookies.has("sb-access-token")) {
			cookies.delete("sb-access-token", { path: "/" });
		}
		if (cookies.has("sb-refresh-token")) {
			cookies.delete("sb-refresh-token", { path: "/" });
		}

		// Evita redirecciones repetitivas
		if (cookies.get("redirected")) {
			return null;
		}

		cookies.set("redirected", "true", { path: "/", maxAge: 5 });
		return redirect("/inicio-sesion");
	}

	// Limpia la cookie de redirección si la sesión es válida
	if (cookies.has("redirected")) {
		cookies.delete("redirected", { path: "/" });
	}

	locals.email = sessionData.email;
	locals.displayName = sessionData.displayName;
	locals.phone = sessionData.phone;
	locals.otherInfo = sessionData.otherInfo;

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
	const justLoggedIn = cookies.get("just-logged-in");

	if (accessToken && refreshToken && justLoggedIn) {
		// Eliminar la cookie después de redirigir
		cookies.delete("just-logged-in", { path: "/" });
		return redirect("/panel/pagos-del-dia");
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

// Nueva función para manejar el index "/"
const handleIndexRedirect = async ({ cookies, redirect }: any) => {
	const sessionData = await getSession(cookies);

	// Evita redirecciones repetitivas si ya estás autenticado
	if (sessionData) {
		if (cookies.get("just-logged-in")) {
			cookies.delete("just-logged-in", { path: "/" });
		}
		return redirect(redirectToDashboard);
	} else {
		return redirect("/inicio-sesion");
	}
};

export const onRequest = defineMiddleware(async (context: any, next: any) => {
	const { url, cookies, redirect, locals } = context;

	console.log("Request URL:", url.pathname);

	// Verificar si ya se realizó una redirección
	if (cookies.get("redirected")) {
		console.log("Redirección ya realizada, continuando...");
		return next();
	}

	let response;

	// Manejar la redirección para la raíz "/"
	if (url.pathname === "/") {
		response = await handleIndexRedirect({ cookies, redirect });
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

	// Si se realizó una redirección, establecer la cookie de control
	if (response) {
		cookies.set("redirected", "true", { path: "/", maxAge: 10 }); // Expira en 10 segundos
	}

	return response || next();
});
