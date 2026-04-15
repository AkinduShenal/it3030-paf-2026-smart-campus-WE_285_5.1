import { useEffect, useState } from "react";
import { FaApple, FaChevronDown, FaEye, FaEyeSlash, FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { buildOAuthFlowUrl } from "../features/auth/authApi";

const roleOptions = [
	{ value: "USER", label: "Student / User" },
	{ value: "TECHNICIAN", label: "Technician" },
	{ value: "ADMIN", label: "Administrator" }
];

const coverImage = new URL("../assets/cover.jpg", import.meta.url).href;

function SignupPage() {
	const { oauth2Enabled, isAuthenticated, signUpLocal } = useAuth();
	const location = useLocation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState("USER");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [feedback, setFeedback] = useState("");
	const [isRoleOpen, setIsRoleOpen] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const oauthEmail = (params.get("email") || "").trim().toLowerCase();
		if (!oauthEmail) {
			return;
		}
		setEmail(oauthEmail);
		setFeedback("Google email selected. Set your password and role to complete registration.");
	}, [location.search]);

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setFeedback("");

		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail) {
			setFeedback("Email is required.");
			return;
		}
		if (password.length < 8) {
			setFeedback("Password must be at least 8 characters.");
			return;
		}
		if (password !== confirmPassword) {
			setFeedback("Password confirmation does not match.");
			return;
		}

		try {
			await signUpLocal({ email: normalizedEmail, password, role });
		} catch (error) {
			setFeedback(error?.message || "Unable to create account.");
		}
	}

	function getOAuthProviderUrl(provider) {
		return buildOAuthFlowUrl(provider, "signup");
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
					<h1 className="mt-5 text-3xl font-black leading-tight">Create your account</h1>
					<p className="mt-3 text-sm leading-relaxed text-blue-100/90">
						Register once and access bookings, ticketing, notifications, and campus resources.
					</p>

					<div className="mt-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
						<p className="m-0 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-blue-100/80">Account Setup</p>
						<p className="m-0 mt-1 text-sm text-white">Register with your campus role to continue.</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Secure access</span>
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Role based</span>
							<span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-blue-100">Operations hub</span>
						</div>
					</div>
				</div>

				<div className="flex items-center p-7 sm:p-8">
					<div className="mx-auto w-full max-w-lg">
						<h2 className="m-0 text-2xl font-black tracking-tight text-slate-900">Sign Up</h2>
						<p className="mt-2 text-sm text-slate-500">Create an account with your role and start using Smart Campus.</p>

						<form onSubmit={handleSubmit} className="mt-6 grid gap-4">
							<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
								<span>Email</span>
								<input
									type="email"
									placeholder="student1@smartcampus.local"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
									className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
								/>
							</label>

							<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
								<span>Password</span>
								<div className="group relative">
									<input
										type={showPassword ? "text" : "password"}
										placeholder="Create a password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
									/>
									<button
										type="button"
										onClick={() => setShowPassword((prev) => !prev)}
										onMouseDown={(event) => event.preventDefault()}
										className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center appearance-none border-0 bg-transparent p-0 text-slate-500 transition-colors duration-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
										aria-label={showPassword ? "Hide password" : "Show password"}
										title={showPassword ? "Hide password" : "Show password"}
										aria-pressed={showPassword}
									>
										{showPassword ? <FaEye className="h-4 w-4 text-slate-700" /> : <FaEyeSlash className="h-4 w-4 text-slate-700" />}
									</button>
								</div>
							</label>

							<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
								<span>Confirm Password</span>
								<div className="group relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Re-enter password"
										value={confirmPassword}
										onChange={(event) => setConfirmPassword(event.target.value)}
										required
										className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword((prev) => !prev)}
										onMouseDown={(event) => event.preventDefault()}
										className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center appearance-none border-0 bg-transparent p-0 text-slate-500 transition-colors duration-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
										aria-label={showConfirmPassword ? "Hide password" : "Show password"}
										title={showConfirmPassword ? "Hide password" : "Show password"}
										aria-pressed={showConfirmPassword}
									>
										{showConfirmPassword ? <FaEye className="h-4 w-4 text-slate-700" /> : <FaEyeSlash className="h-4 w-4 text-slate-700" />}
									</button>
								</div>
							</label>

							<label className="grid gap-1.5 text-sm font-semibold text-slate-700">
								<span>Role</span>
								<div className="relative z-10">
									<button
										type="button"
										onClick={() => setIsRoleOpen((prev) => !prev)}
										className="h-11 w-full rounded-2xl bg-white px-4 pr-11 text-left text-[0.93rem] font-semibold text-slate-800 outline-none shadow-[inset_0_0_0_1px_rgba(148,163,184,0.22),0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.32),0_10px_22px_rgba(15,23,42,0.08)] focus-visible:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.55),0_0_0_4px_rgba(59,130,246,0.14)]"
										aria-haspopup="listbox"
										aria-expanded={isRoleOpen}
									>
										{roleOptions.find((option) => option.value === role)?.label}
									</button>
									<span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-500">
										<FaChevronDown className="h-3.5 w-3.5" />
									</span>
									{isRoleOpen && (
										<ul className="absolute left-0 right-0 top-full z-20 mt-1.5 m-0 list-none space-y-1 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-[0_12px_24px_rgba(2,6,23,0.38)]" role="listbox">
											{roleOptions.map((option) => (
												<li key={option.value} className="list-none" role="option" aria-selected={role === option.value}>
													<button
														type="button"
														onMouseDown={(event) => {
															event.preventDefault();
															setRole(option.value);
															setIsRoleOpen(false);
														}}
														className={`w-full rounded-lg px-3.5 py-2.5 text-left text-[0.92rem] font-semibold transition-colors duration-150 ${
															role === option.value
																? "bg-slate-700 text-white"
																: "text-slate-200 hover:bg-slate-800 hover:text-white"
														}`}
													>
														{option.label}
													</button>
												</li>
											))}
										</ul>
									)}
								</div>
							</label>

							<button
								type="submit"
								className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
							>
								Create Account
							</button>

							<p className="m-0 text-center text-sm text-slate-500">
								Already have an account?{" "}
								<Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
									Login
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
									Google login is not configured in this environment. Use email and password signup.
								</p>
							)}
						</form>

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

export default SignupPage;
