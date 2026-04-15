import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	clearLocalAuthProfile,
	fetchCurrentUser,
	getDefaultLoginUrl,
	getDefaultLogoutUrl,
	getLocalAuthProfile,
	loginLocal,
	setLocalAuthProfile,
	signupLocal
} from "../features/auth/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [profile, setProfile] = useState(null);
	const [localSession, setLocalSession] = useState(() => getLocalAuthProfile());
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const [error, setError] = useState("");

	const refreshProfile = useCallback(async () => {
		setIsLoadingProfile(true);
		try {
			const data = await fetchCurrentUser();
			setProfile(data);
			setLocalSession(getLocalAuthProfile());
			setError("");
			return data;
		} catch (requestError) {
			setProfile(null);
			setLocalSession(getLocalAuthProfile());
			setError(requestError?.message || "Unable to load current user profile.");
			return null;
		} finally {
			setIsLoadingProfile(false);
		}
	}, []);

	useEffect(() => {
		refreshProfile();
	}, [refreshProfile]);

	const oauth2Enabled = Boolean(profile?.oauth2Enabled);
	const isOauthAuthenticated = Boolean(profile?.authenticated);
	const isLocalAuthenticated = Boolean(localSession?.email);

	useEffect(() => {
		if (oauth2Enabled && localSession?.email) {
			clearLocalAuthProfile();
			setLocalSession(null);
		}
	}, [oauth2Enabled, localSession]);

	const roles = oauth2Enabled
		? (isOauthAuthenticated ? profile?.roles || [] : [])
		: (isOauthAuthenticated ? profile?.roles || [] : localSession?.roles || []);
	const isAuthenticated = oauth2Enabled
		? isOauthAuthenticated
		: (isOauthAuthenticated || isLocalAuthenticated);

	const signInLocal = useCallback(
		async ({ email, password, role }) => {
			const session = await loginLocal({ email, password, role });
			const normalizedEmail = String(session?.email || email || "").trim().toLowerCase();
			const normalizedRoles = Array.from(
				new Set((session?.roles || ["USER"]).map((candidateRole) => String(candidateRole).trim().toUpperCase()))
			);
			setLocalAuthProfile({ email: normalizedEmail, roles: normalizedRoles });
			setLocalSession({ email: normalizedEmail, roles: normalizedRoles });
			return refreshProfile();
		},
		[refreshProfile]
	);

	const signInDemo = useCallback(
		async ({ email, role }) => {
			const normalizedEmail = String(email || "").trim().toLowerCase();
			const normalizedRole = String(role || "USER").trim().toUpperCase();
			const normalizedRoles = Array.from(new Set(["USER", normalizedRole]));
			setLocalAuthProfile({ email: normalizedEmail, roles: normalizedRoles });
			setLocalSession({ email: normalizedEmail, roles: normalizedRoles });
			return refreshProfile();
		},
		[refreshProfile]
	);

	const signUpLocal = useCallback(
		async ({ email, password, role }) => {
			const session = await signupLocal({ email, password, role });
			const normalizedEmail = String(session?.email || email || "").trim().toLowerCase();
			const normalizedRoles = Array.from(
				new Set((session?.roles || ["USER"]).map((candidateRole) => String(candidateRole).trim().toUpperCase()))
			);
			setLocalAuthProfile({ email: normalizedEmail, roles: normalizedRoles });
			setLocalSession({ email: normalizedEmail, roles: normalizedRoles });
			return refreshProfile();
		},
		[refreshProfile]
	);

	const signOutLocal = useCallback(async ({ skipRefresh = false } = {}) => {
		clearLocalAuthProfile();
		setLocalSession(null);
		setProfile(null);
		if (skipRefresh) {
			setIsLoadingProfile(false);
			setError("");
			return null;
		}
		return refreshProfile();
	}, [refreshProfile]);

	const value = useMemo(
		() => ({
			profile,
			roles,
			error,
			isLoadingProfile,
			oauth2Enabled,
			isAuthenticated,
			loginUrl: profile?.loginUrl || getDefaultLoginUrl(),
			logoutUrl: profile?.logoutUrl || getDefaultLogoutUrl(),
			refreshProfile,
			signInLocal,
			signInDemo,
			signUpLocal,
			signOutLocal,
			hasRole: (role) => roles.includes(role),
			hasAnyRole: (candidateRoles = []) => candidateRoles.some((role) => roles.includes(role))
		}),
		[profile, roles, error, isLoadingProfile, oauth2Enabled, isAuthenticated, refreshProfile, signInLocal, signInDemo, signUpLocal, signOutLocal]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider.");
	}
	return context;
}
