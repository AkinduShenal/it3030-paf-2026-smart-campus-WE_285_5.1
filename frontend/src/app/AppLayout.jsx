import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import {
	FaArrowRightFromBracket,
	FaBell,
	FaCalendarCheck,
	FaHouse,
	FaLayerGroup,
	FaScrewdriverWrench
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

const baseNavItems = [
	{ label: "Dashboard", to: "/", icon: FaHouse },
	{ label: "Catalogue", to: "/catalogue", icon: FaLayerGroup },
	{ label: "Bookings", to: "/bookings", icon: FaCalendarCheck },
	{ label: "Tickets", to: "/tickets", icon: FaScrewdriverWrench },
	{ label: "Notifications", to: "/notifications", icon: FaBell }
];

const roleLabelMap = {
	USER: "Student / User",
	TECHNICIAN: "Technician",
	ADMIN: "Administrator"
};

function AppLayout() {
	const { profile, oauth2Enabled, logoutUrl, signOutLocal } = useAuth();
	const navItems = baseNavItems;
	const [isSigningOut, setIsSigningOut] = useState(false);
	const profileInitial = (profile?.email || "U").trim().charAt(0).toUpperCase();
	const mappedRoles = Array.isArray(profile?.roles)
		? profile.roles
			.map((role) => String(role || "").trim().toUpperCase())
			.filter((role) => roleLabelMap[role])
			.map((role) => roleLabelMap[role])
		: [];
	const displayRoles = mappedRoles.length > 0 ? mappedRoles : profile?.email ? [roleLabelMap.USER] : [];

	async function handleSignOut() {
		if (isSigningOut) {
			return;
		}

		setIsSigningOut(true);
		try {
			await signOutLocal({ skipRefresh: true });
			if (oauth2Enabled) {
				window.location.replace(logoutUrl);
				return;
			}
			window.location.replace("/login");
		} catch (_error) {
			window.location.replace("/login");
		}
	}

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<div className="sidebar-brand">
					<h1>Smart Campus Hub</h1>
					<p className="sidebar-tagline">Operations Console</p>
				</div>
				{profile && (
					<div className="profile-card">
						<span className="profile-avatar" aria-hidden="true">
							{profileInitial}
						</span>
						<div className="profile-meta">
							<p className="profile-email">{profile.email}</p>
							{displayRoles.length > 0 && (
								<p className="profile-roles">{displayRoles.join(" • ")}</p>
							)}
						</div>
					</div>
				)}
				<nav className="sidebar-nav">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
						>
							<span className="nav-icon" aria-hidden="true">
								<Icon />
							</span>
							<span>{item.label}</span>
						</NavLink>
						);
					})}
				</nav>
				<div className="sidebar-auth-actions">
					<button type="button" className="ghost-btn" onClick={handleSignOut} disabled={isSigningOut}>
						<FaArrowRightFromBracket />
						{isSigningOut ? "Signing out..." : "Sign out"}
					</button>
				</div>
			</aside>
			<main className="content">
				<Outlet />
			</main>
		</div>
	);
}

export default AppLayout;
