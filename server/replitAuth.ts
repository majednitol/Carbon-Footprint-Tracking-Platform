// server/auth.ts
import * as client from "openid-client";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import 'dotenv/config';
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Ensure required env variables
const requiredEnv = ["ISSUER_URL", "CLIENT_ID", "CLIENT_SECRET", "CALLBACK_URL", "SESSION_SECRET", "DATABASE_URL"];
requiredEnv.forEach(key => {
  if (!process.env[key]) throw new Error(`Environment variable ${key} is required`);
});

const getOidcConfig = memoize(async () => {
  const issuer = await client.discovery(
    new URL(process.env.ISSUER_URL!),
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!
  );
  return issuer;
}, { maxAge: 3600 * 1000 });

// Express session setup
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true if using HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Update session tokens
function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Save or update user in DB
async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"] || claims["first_name"],
    lastName: claims["family_name"] || claims["last_name"],
    profileImageUrl: claims["picture"] || claims["profile_image_url"],
  });
}

// Setup authentication
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    done: passport.AuthenticateCallback
  ) => {
    try {
      const user: any = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      done(null, user);
    } catch (error) {
      console.error('Verification error:', error);
      done(error);
    }
  };

  // Fixed Google strategy configuration
  const strategy = new Strategy(
    {
      name: "google",
      config,
      scope: "openid email profile",
      callbackURL: process.env.CALLBACK_URL!,
    },
    verify
  );

  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Routes - Fixed scope consistency
  app.get("/api/login", passport.authenticate("google", {
    scope: ["openid", "email", "profile"],
  }));

  app.get("/api/callback", 
    passport.authenticate("google", { failureRedirect: "/api/login" }),
    (req, res) => {
      // Successful authentication
      res.redirect(`${FRONTEND_URL}/dashboard`);
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      try {
        const logoutUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.CLIENT_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.get('host')}`,
        });
        res.redirect(logoutUrl.href);
      } catch (error) {
        console.error('End session URL error:', error);
        res.redirect("/");
      }
    });
  });
}

// Middleware to protect routes
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};