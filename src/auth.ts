import NextAuth, { NextAuthConfig, User } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";

// CHANGE THIS VALUE TO INVALIDATE ALL SESSIONS
const SESSION_VERSION = "v3";

// Allow self-signed certificates for .NET backend in development
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function getApiUrl() {
  return (
    process.env.NEXT_PRIVATE_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "https://localhost:7007"
  );
}

async function backendRegister(user: any) {
  const apiUrl = getApiUrl();
  const provider = user.provider || "email";
  const password =
    user.password ||
    Array(16)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("") + "Aa1";

  try {
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: user.email,
        DisplayName: user.name,
        AvatarUrl: user.image,
        Password: password,
        Provider: provider,
      }),
    });

    if (!res.ok) {
      if (res.status === 409)
        return { success: false, error: "User already exists" };

      const text = await res.text();
      let errorDetail = text;
      try {
        const json = JSON.parse(text);
        errorDetail = json.message || json.title || JSON.stringify(json);
      } catch {}

      return {
        success: false,
        error: `Backend Error ${res.status}: ${errorDetail}`,
      };
    }

    const result = await res.json();
    return { success: true, user: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Connection failed" };
  }
}

async function backendOAuthMap(data: {
  provider: string;
  providerUserId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/auth/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Provider: data.provider,
        ProviderUserId: data.providerUserId,
        Email: data.email,
        DisplayName: data.displayName,
        AvatarUrl: data.avatarUrl,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorDetail = text;
      try {
        const json = JSON.parse(text);
        errorDetail = json.message || json.title || JSON.stringify(json);
      } catch {}
      return {
        success: false,
        error: `Backend Error ${res.status}: ${errorDetail}`,
      };
    }

    const result = await res.json();
    return { success: true, user: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Connection failed" };
  }
}

async function backendLogin(credentials: any) {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: credentials.email,
        Password: credentials.password,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // Try to parse JSON error if possible
      let errorMessage = text;
      try {
        const json = JSON.parse(text);
        errorMessage =
          json.message || json.error_description || json.title || text;
      } catch (e) {}

      console.error("Backend login failed:", res.status, errorMessage);
      return { success: false, error: errorMessage };
    }
    return { success: true, user: await res.json() };
  } catch (error: any) {
    console.error("Backend login error:", error);
    return { success: false, error: error.message || "Connection error" };
  }
}

async function getBackendProfile(email: string, provider?: string) {
  const apiUrl = getApiUrl();
  try {
    let url = `${apiUrl}/api/profiles/email/${encodeURIComponent(email)}`;
    if (provider) {
      url += `?provider=${encodeURIComponent(provider)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export const config = {
  providers: [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.announcements.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await backendLogin(credentials);

        if (result.success && result.user) {
          const user = result.user;
          return {
            id: user.id || user.Id,
            name: user.displayName || user.DisplayName,
            email: user.email || user.Email,
            image: user.avatarUrl || user.AvatarUrl,
            provider: "email",
          };
        }

        // Throw specific error message if available
        if (result.error) {
          throw new Error(result.error);
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        try {
          const oauthResult = await backendOAuthMap({
            provider: "google",
            providerUserId: account.providerAccountId,
            email,
            displayName: user.name || undefined,
            avatarUrl: user.image || undefined,
          });

          if (oauthResult.success && oauthResult.user) {
            user.id = oauthResult.user.id || oauthResult.user.Id;
            return true;
          }

          const retryUser = await getBackendProfile(email, "google");
          if (retryUser) {
            user.id = retryUser.id || retryUser.Id;
            return true;
          }

          return `/auth/error?error=${encodeURIComponent(oauthResult.error || "OAuth registration failed")}`;
        } catch (e: any) {
          return `/auth/error?error=${encodeURIComponent(e.message || "Authentication exception")}`;
        }
      }
      return true;
    },
    // ... rest of callbacks
    async jwt({ token, user, account }) {
      if (token && token.version !== SESSION_VERSION && !user) {
        return {};
      }

      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
        token.version = SESSION_VERSION;

        if (account?.provider === "google" && account.access_token) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
        }

        if (account?.provider === "google" && user.email) {
          try {
            const backendUser = await getBackendProfile(user.email, "google");
            if (backendUser && (backendUser.id || backendUser.Id)) {
              token.id = backendUser.id || backendUser.Id;
            }
          } catch (e) {
            console.error("Auth: Failed to resolve backend ID in JWT", e);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || Object.keys(token).length === 0) {
        // @ts-ignore
        return { expires: "now" };
      }

      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.provider = token.provider as string;
        // @ts-ignore
        session.user.accessToken = token.accessToken as string;
        // @ts-ignore
        session.user.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Show login modal on home? Or just redirect home.
    error: "/", // Redirect to home on error for now
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
