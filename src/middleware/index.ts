import { defineMiddleware } from "astro:middleware";
import micromatch from "micromatch";
import { supabase } from "../lib/supabase";

const protectedRoutes = ["/payments(|/)", "/payments/**"];
const redirectRoutes = ["/signin(|/)", "/register(|/)"];
const protectedAPIRoutes = ["/api/guestbook(|/)"];

const getSession = async (cookies: any) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    refresh_token: refreshToken.value,
    access_token: accessToken.value,
  });

  if (error) return null;

  return { session: data.session, email: data.user?.email };
};

const handleProtectedRoute = async ({ cookies, redirect, locals }: any) => {
  const sessionData = await getSession(cookies);

  if (!sessionData) {
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect("/signin");
  }

  locals.email = sessionData.email;
  cookies.set("sb-access-token", sessionData?.session?.access_token ?? "", {
    sameSite: "strict",
    path: "/",
    secure: true,
  });
  cookies.set("sb-refresh-token", sessionData?.session?.refresh_token ?? "", {
    sameSite: "strict",
    path: "/",
    secure: true,
  });
  return null;
};

const handleRedirectRoute = ({ cookies, redirect }: any) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (accessToken && refreshToken) {
    return redirect("/payments");
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

  if (sessionData) {
    return redirect("/payments");
  } else {
    return redirect("/signin");
  }
};

export const onRequest = defineMiddleware(async (context: any, next: any) => {
  const { url, cookies, redirect, locals } = context;

  let response;
  if (url.pathname === "/") {
    response = await handleIndexRedirect({ cookies, redirect });
  }
  if (!response && micromatch.isMatch(url.pathname, protectedRoutes)) {
    response = await handleProtectedRoute({ cookies, redirect, locals });
  }
  if (!response && micromatch.isMatch(url.pathname, redirectRoutes)) {
    response = handleRedirectRoute({ cookies, redirect });
  }
  if (!response && micromatch.isMatch(url.pathname, protectedAPIRoutes)) {
    response = await handleProtectedAPI({ cookies });
  }

  return response || next();
});
