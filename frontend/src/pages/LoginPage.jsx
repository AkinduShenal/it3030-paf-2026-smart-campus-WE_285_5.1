import { useEffect, useState } from "react";
import { FaApple, FaEye, FaEyeSlash, FaFacebookF, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { buildOAuthFlowUrl, fetchLocalRoleByEmail } from "../features/auth/authApi";

const demoAccounts = [
	{ label: "Student Demo", email: "student1@smartcampus.local", role: "USER" },
	{ label: "Technician Demo", email: "tech1@smartcampus.local", role: "TECHNICIAN" },
	{ label: "Admin Demo", email: "admin@smartcampus.local", role: "ADMIN" }
];

const roleLabels = {
	USER: "Student / User",
	TECHNICIAN: "Technician",
	ADMIN: "Administrator"
};

const coverImage = new URL("../assets/cover.jpg", import.meta.url).href;

function LoginPage() {
	const { oauth2Enabled, isAuthenticated, signInLocal, signInDemo, profile } = useAuth();
	const location = useLocation();
	const [email, setEmail] = useState(profile?.email && profile.email !== "guest@smartcampus.local" ? profile.email : "");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [detectedRole, setDetectedRole] = useState("USER");
	const [isDetectingRole, setIsDetectingRole] = useState(false);
	const [feedback, setFeedback] = useState("");
	const detectedRoleLabel = roleLabels[detectedRole] || detectedRole;

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const oauthError = params.get("error");
		const oauthEmail = (params.get("email") || "").trim().toLowerCase();

		if (oauthEmail) {
			setEmail(oauthEmail);
		}

		if (oauthError === "not_registered") {
			setFeedback("Google account is not registered yet. Please sign up first and select your role.");
		}
	}, [location.search]);

	useEffect(() => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			setDetectedRole("USER");
			return;
		}

		let cancelled = false;
		const timer = setTimeout(async () => {
			setIsDetectingRole(true);
			try {
				const response = await fetchLocalRoleByEmail(normalizedEmail);
				if (!cancelled) {
					setDetectedRole(String(response?.role || "USER").toUpperCase());
				}
			} catch (_error) {
				if (!cancelled) {
					setDetectedRole("USER");
				}
			} finally {
				if (!cancelled) {
					setIsDetectingRole(false);
				}
			}
		}, 350);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [email, oauth2Enabled]);

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	function getOAuthProviderUrl(provider) {
		return buildOAuthFlowUrl(provider, "login");
	}

	function handleOAuthSignIn(provider) {
		const targetUrl = getOAuthProviderUrl(provider);
		if (!targetUrl) {
			setFeedback("Login URL is not configured.");
			return;
		}
		window.location.assign(targetUrl);
	}

	function handleComingSoonProvider(providerName) {
		setFeedback(`${providerName} login is not enabled. Please use Google login.`);
	}

	function togglePasswordVisibility() {
		setShowPassword((prev) => !prev);
	}

	async function handleLocalSignIn(event) {
		event.preventDefault();
		setFeedback("");

		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			setFeedback("Email is required.");
			return;
		}

		if (!password.trim()) {
			setFeedback("Password is required.");
			return;
		}

		try {
			await signInLocal({ email: normalizedEmail, password, role: detectedRole });
		} catch (error) {
			setFeedback(error?.message || "Unable to sign in with this account.");
		}
	}

	async function handleQuickLogin(account) {
		setFeedback("");
		if (oauth2Enabled) {
			setFeedback("Demo quick login is disabled while Google sign-in is enabled.");
			return;
		}
		setEmail(account.email);
		setDetectedRole(account.role);
		try {
			await signInDemo({ email: account.email, role: account.role });
		} catch (error) {
			setFeedback(error?.message || "Demo login failed. Try signing up first.");
		}
	}

	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
			<div
				className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url('${coverImage}')` }}
			/>
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/55 to-indigo-950/60" />
			<div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

			<div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:grid-cols-[1.05fr_1.3fr]">
				<div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white sm:p-10">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-900/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
							<span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
						</span>
						Smart Campus
					</div>
					<h1 className="mt-5 text-3xl font-black leading-tight">Welcome back</h1>
					<p className="mt-3 text-sm leading-relaxed text-blue-100/90">
						Sign in to manage resources, bookings, tickets, and notifications from one place.
					</p>

					<div className="mt-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
						<p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-blue-100/80">Access Mode</p>
						<p className="m-0 mt-1 text-sm text-white">
							{oauth2Enabled ? "Secure OAuth sign-in is enabled." : "Campus account sign-in is enabled."}
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Secure access</span>
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Role based</span>
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Operations hub</span>
						</div>
					</div>
				</div>

				<div className="flex items-center bg-white/96 p-7 shadow-[-16px_0_30px_rgba(15,23,42,0.12)] sm:p-8">
					<div className="mx-auto w-full max-w-lg">
					<h2 className="m-0 text-2xl font-black tracking-tight text-slate-900">Sign In</h2>
					<p className="mt-2 text-sm text-slate-500">Sign in to manage campus resources and services.</p>

					{false ? (
						<div className="mt-7 space-y-4">
							<p className="text-sm font-semibold text-slate-600">Continue with social account</p>
							<div className="grid grid-cols-3 gap-3">
								<button
									type="button"
									onClick={() => handleOAuthSignIn("google")}
									className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
									aria-label="Login with Google"
									title="Login with Google"
								>
									<FcGoogle className="h-5 w-5" />
									Google
								</button>
								<button
									type="button"
									onClick={() => handleOAuthSignIn("facebook")}
									className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-sm font-semibold text-[#1877F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
									aria-label="Login with Facebook"
									title="Login with Facebook"
								>
									<FaFacebookF className="h-5 w-5" />
									Facebook
								</button>
								<button
									type="button"
									onClick={() => handleOAuthSignIn("apple")}
									className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-sm font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
									aria-label="Login with Apple"
									title="Login with Apple"
								>
									<FaApple className="h-5 w-5" />
									Apple
								</button>
							</div>
						</div>
					) : (
						<div className="mt-6 space-y-4">
							<div>
								<p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Quick Demo Access</p>
								<div className="grid gap-2 sm:grid-cols-3">
									{demoAccounts.map((account) => (
										<button
											key={account.email}
											type="button"
											onClick={() => handleQuickLogin(account)}
											className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[0.92rem] font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
										>
											{account.label}
										</button>
									))}
								</div>
							</div>

							<form onSubmit={handleLocalSignIn} className="grid gap-4">
								<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
									<span>Email</span>
									<input
										type="email"
										placeholder="student1@smartcampus.local"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										required
										className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_10px_rgba(15,23,42,0.08)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_8px_20px_rgba(37,99,235,0.15)]"
									/>
								</label>
								<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
									<span>Password</span>
									<div className="group relative">
										<input
											type={showPassword ? "text" : "password"}
											placeholder="Enter your password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											required
											className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_10px_rgba(15,23,42,0.08)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_8px_20px_rgba(37,99,235,0.15)]"
										/>
										<button
											type="button"
											onClick={togglePasswordVisibility}
											onMouseDown={(event) => event.preventDefault()}
											className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center appearance-none border-0 bg-transparent p-0 text-slate-500 transition-colors duration-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
											aria-label={showPassword ? "Password is visible. Hide password" : "Password is hidden. Show password"}
											title={showPassword ? "Hide password" : "Show password"}
											aria-pressed={showPassword}
										>
											{showPassword ? <FaEye className="h-4 w-4 text-slate-700" /> : <FaEyeSlash className="h-4 w-4 text-slate-700" />}
										</button>
									</div>
								</label>
								<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
									<span>Role</span>
									<div className="relative">
										<input
											type="text"
											value={isDetectingRole ? "Detecting role..." : detectedRoleLabel}
											readOnly
											className="h-10 w-full cursor-not-allowed rounded-xl border-0 bg-slate-200 px-3 pr-10 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_10px_rgba(15,23,42,0.08)] outline-none ring-0 focus:ring-0"
										/>
										<span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-500">
											<FaLock className="h-3.5 w-3.5" aria-hidden="true" />
										</span>
									</div>
								</label>

								<button
									type="submit"
									className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
								>
									Login
								</button>

								<p className="m-0 text-center text-sm text-slate-500">
									Don&apos;t have an account?{" "}
									<Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
										Create one
									</Link>
								</p>

								{oauth2Enabled ? (
									<div className="pt-1">
										<p className="mb-2 text-center text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">Or login with</p>
										<div className="grid grid-cols-3 gap-3">
											<button
												type="button"
												onClick={() => handleOAuthSignIn("google")}
												className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-[0.9rem] font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
												aria-label="Login with Google"
												title="Login with Google"
											>
												<FcGoogle className="h-5 w-5" />
												Google
											</button>
											<button
												type="button"
												onClick={() => handleComingSoonProvider("Facebook")}
												className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-[0.9rem] font-semibold text-[#1877F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
												aria-label="Login with Facebook"
												title="Login with Facebook"
											>
												<FaFacebookF className="h-5 w-5" />
												Facebook
											</button>
											<button
												type="button"
												onClick={() => handleComingSoonProvider("Apple")}
												className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 text-[0.9rem] font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_18px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
												aria-label="Login with Apple"
												title="Login with Apple"
											>
												<FaApple className="h-5 w-5" />
												Apple
											</button>
										</div>
									</div>
								) : (
									<p className="mb-0 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-700">
										Google login is not configured in this environment. Use email and password login.
									</p>
								)}
							</form>
						</div>
					)}

					{feedback && (
						<p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
							{feedback}
						</p>
					)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default LoginPage;
