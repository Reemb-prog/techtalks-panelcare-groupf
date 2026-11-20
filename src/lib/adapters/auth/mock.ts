/** MOCK sign-in for S1 (PC-S1-05). Demo accounts only; any non-empty password is accepted. Not real authentication. */
import type { AuthAdapter, Profile, Session } from "../../../types";
import { failure, simulate, success, type MockContext } from "../mock/runtime";

const SESSION_HOURS = 8;

export function sessionFor(profile: Profile, now: Date): Session {
  return {
    userId: profile.id,
    displayName: profile.displayName,
    role: profile.role,
    expiresAt: new Date(now.getTime() + SESSION_HOURS * 3600_000).toISOString(),
  };
}

export function createMockAuthAdapter(ctx: MockContext): AuthAdapter {
  return {
    source: "mock",

    getSession: () => simulate(ctx, { requireSession: false }, () => success(ctx.session)),

    signIn: (request) =>
      simulate(ctx, { requireSession: false }, () => {
        const email = request.email?.trim().toLowerCase();
        const profile = ctx.store.profiles.find((candidate) => candidate.email.toLowerCase() === email);
        // One generic message for every failure, so the form does not reveal which emails exist.
        if (!email || !request.password || !profile || !profile.active) {
          return failure("UNAUTHENTICATED", "Email or password is incorrect.");
        }
        ctx.session = sessionFor(profile, ctx.now());
        return success(ctx.session);
      }),

    signOut: () =>
      simulate(ctx, { requireSession: false }, () => {
        ctx.session = null;
        return success(null);
      }),

    getProfile: () =>
      simulate(ctx, {}, (session) => {
        const profile = ctx.store.profiles.find((candidate) => candidate.id === session.userId);
        return profile ? success(profile) : failure("NOT_FOUND", "Profile not found.");
      }),
  };
}
