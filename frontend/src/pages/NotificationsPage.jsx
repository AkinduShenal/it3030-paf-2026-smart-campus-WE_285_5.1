import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheckCircle, FaTrashAlt, FaUndoAlt } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
	deleteNotification,
	fetchNotifications,
	fetchNotificationSummary,
	markNotificationAsRead,
	markNotificationAsUnread
} from "../features/notifications/notificationApi";

const smoothEase = [0.22, 1, 0.36, 1];

const containerVariants = {
	hidden: { opacity: 0, y: 14 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.65,
			ease: smoothEase,
			staggerChildren: 0.12
		}
	}
};

const sectionVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.62,
			ease: smoothEase
		}
	}
};

const listVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.06
		}
	}
};

const itemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.48,
			ease: smoothEase
		}
	},
	exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: "easeOut" } }
};

function formatTimestamp(value) {
	if (!value) {
		return "-";
	}
	return new Date(value).toLocaleString();
}

function getErrorMessage(error) {
	const apiError = error?.response?.data;
	return apiError?.message || error.message || "Request failed";
}

function getAccentColor(type) {
	if (!type) {
		return "#94a3b8";
	}

	if (type.startsWith("BOOKING")) {
		return "#2563eb";
	}

	if (type.startsWith("TICKET")) {
		return "#f59e0b";
	}

	return "#94a3b8";
}

function getTypeLabel(type) {
	if (!type) {
		return "GENERAL";
	}
	return type.replaceAll("_", " ");
}

function getTypeGroup(type) {
	if (!type) {
		return "OTHER";
	}

	if (type.startsWith("BOOKING")) {
		return "BOOKING";
	}

	if (type.startsWith("TICKET")) {
		return "TICKET";
	}

	return "OTHER";
}

const typeFilterOptions = [
	{ value: "ALL", label: "All", tone: "slate" },
	{ value: "BOOKING", label: "Bookings", tone: "blue" },
	{ value: "TICKET", label: "Tickets", tone: "amber" },
	{ value: "OTHER", label: "Other", tone: "indigo" }
];

const INITIAL_VISIBLE_NOTIFICATIONS = 6;

function NotificationsPage() {
	const { profile } = useAuth();
	const [recipientEmail, setRecipientEmail] = useState("");
	const [notifications, setNotifications] = useState([]);
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [typeFilter, setTypeFilter] = useState("ALL");
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [showAllNotifications, setShowAllNotifications] = useState(false);
	const [actionInProgress, setActionInProgress] = useState({});

	useEffect(() => {
		if (profile?.email) {
			setRecipientEmail(profile.email);
		}
	}, [profile]);

	useEffect(() => {
		if (!recipientEmail) {
			return;
		}
		loadNotifications({ email: recipientEmail, unreadOnly });
	}, [recipientEmail]);

	useEffect(() => {
		setShowAllNotifications(false);
	}, [recipientEmail, unreadOnly, typeFilter]);

	useEffect(() => {
		if (!recipientEmail) {
			return;
		}

		const intervalId = window.setInterval(() => {
			loadNotifications({ email: recipientEmail, unreadOnly, silent: true });
		}, 6000);

		return () => window.clearInterval(intervalId);
	}, [recipientEmail, unreadOnly]);

	async function loadNotifications(options = {}) {
		const email = options.email ?? recipientEmail;
		const unreadFilter = options.unreadOnly ?? unreadOnly;
		const silent = Boolean(options.silent);

		if (!email) {
			toast.error("Recipient email is required.");
			return;
		}

		try {
			if (!silent) {
				setIsLoading(true);
			}
			const [list, summary] = await Promise.all([
				fetchNotifications(email, unreadFilter),
				fetchNotificationSummary(email)
			]);
			setNotifications(list);
			setUnreadCount(summary?.unreadCount || 0);
		} catch (error) {
			if (!silent) {
				toast.error(getErrorMessage(error));
			}
		} finally {
			if (!silent) {
				setIsLoading(false);
			}
		}
	}

	async function handleMarkAsRead(notificationId) {
		setActionInProgress((currentState) => ({ ...currentState, [`read-${notificationId}`]: true }));
		try {
			await markNotificationAsRead(notificationId, recipientEmail);
			toast.success("Notification marked as read.");
			await loadNotifications({ silent: true });
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setActionInProgress((currentState) => ({ ...currentState, [`read-${notificationId}`]: false }));
		}
	}

	async function handleMarkAsUnread(notificationId) {
		setActionInProgress((currentState) => ({ ...currentState, [`unread-${notificationId}`]: true }));
		try {
			await markNotificationAsUnread(notificationId, recipientEmail);
			toast.success("Notification marked as unread.");
			await loadNotifications({ silent: true });
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setActionInProgress((currentState) => ({ ...currentState, [`unread-${notificationId}`]: false }));
		}
	}

	async function handleDeleteNotification(notificationId) {
		setActionInProgress((currentState) => ({ ...currentState, [`delete-${notificationId}`]: true }));
		try {
			await deleteNotification(notificationId, recipientEmail);
			toast.success("Notification deleted.");
			await loadNotifications({ silent: true });
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setActionInProgress((currentState) => ({ ...currentState, [`delete-${notificationId}`]: false }));
		}
	}

	async function handleUnreadOnlyChange(checked) {
		setUnreadOnly(checked);
		await loadNotifications({ unreadOnly: checked });
	}

	const filteredNotifications = notifications.filter((notification) => {
		if (typeFilter === "ALL") {
			return true;
		}
		return getTypeGroup(notification.type) === typeFilter;
	});

	const sortedFilteredNotifications = [...filteredNotifications].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	const hasMoreThanInitial = sortedFilteredNotifications.length > INITIAL_VISIBLE_NOTIFICATIONS;
	const visibleNotifications = showAllNotifications
		? sortedFilteredNotifications
		: sortedFilteredNotifications.slice(0, INITIAL_VISIBLE_NOTIFICATIONS);
	const hiddenNotificationsCount = Math.max(
		sortedFilteredNotifications.length - visibleNotifications.length,
		0
	);

	const typeCounts = notifications.reduce(
		(accumulator, notification) => {
			const group = getTypeGroup(notification.type);
			accumulator[group] = (accumulator[group] || 0) + 1;
			return accumulator;
		},
		{ ALL: notifications.length, BOOKING: 0, TICKET: 0, OTHER: 0 }
	);

	const loadedReadCount = notifications.filter((notification) => notification.read).length;

	return (
		<motion.section className="grid gap-4" variants={containerVariants} initial="hidden" animate="visible">
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 2600,
					style: {
						borderRadius: "12px",
						fontSize: "0.88rem",
						fontWeight: 600
					}
				}}
			/>

			{/* ── HEADER (redesigned) ───────────────────────────────────────── */}
			<motion.header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-7 shadow-2xl" variants={sectionVariants}>
				{/* Decorative blobs */}
				<div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-10 right-0 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl" />

				<div className="relative flex flex-wrap items-center justify-between gap-4">
					<div>
						{/* Live badge */}
						<div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
							<span className="relative flex h-2.5 w-2.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
							</span>
							<span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-emerald-300">
								Live · Active Center
							</span>
						</div>
						<h2 className="m-0 text-[2.1rem] font-black leading-tight tracking-tight text-white">
							Notifications
						</h2>
						<p className="m-0 mt-1 text-sm text-slate-400">
							Review booking and ticket alerts, then mark updates as read.
						</p>
					</div>

					{/* Unread count pill */}
					<div className="flex flex-col items-end gap-1">
						<span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
							Unread
						</span>
						<span className="rounded-2xl bg-blue-500/20 px-5 py-2 text-[2rem] font-black tabular-nums text-blue-300 ring-1 ring-blue-400/20">
							{unreadCount}
						</span>
					</div>
				</div>
			</motion.header>

			{/* ── CONTROL PANEL (redesigned) ────────────────────────────────── */}
			<motion.article className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm ring-1 ring-black/[0.04]" variants={sectionVariants}>
				{/* Top gradient stripe */}
				<div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

				<div className="p-6">
					<p className="mb-4 text-[0.72rem] font-black uppercase tracking-[0.15em] text-slate-400">
						Fetch Settings
					</p>

					{/* Input row */}
					<div className="flex flex-wrap items-stretch gap-3">

						{/* Email input with icon */}
						<div className="relative flex min-w-[260px] flex-1 items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white transition-all duration-200 hover:border-slate-300 focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
							<div className="pointer-events-none flex h-12 w-12 flex-shrink-0 items-center justify-center border-r border-slate-200/80 text-slate-400">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							</div>
							<input
								id="recipientEmail"
								type="email"
								value={recipientEmail}
								onChange={(event) => setRecipientEmail(event.target.value)}
								placeholder="student1@smartcampus.local"
								className="h-12 flex-1 border-0 bg-transparent px-3 text-[0.95rem] font-medium text-slate-800 shadow-none outline-none ring-0 caret-blue-600 transition-colors duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-0 focus:outline-none focus-visible:outline-none focus:ring-0"
							/>
						</div>

						{/* Unread toggle */}
						<label
							className={`flex h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 transition-all duration-200 ${
								unreadOnly
									? "border-indigo-200 bg-indigo-50 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
									: "border-slate-200 bg-slate-50 hover:border-slate-300"
							}`}
						>
							<input
								type="checkbox"
								checked={unreadOnly}
								onChange={(event) => handleUnreadOnlyChange(event.target.checked)}
								className="peer sr-only"
							/>
							{/* Animated toggle track */}
							<span
								className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-all duration-300 ${
									unreadOnly ? "bg-indigo-500" : "bg-slate-300"
								}`}
							>
								<span
									className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${
										unreadOnly ? "translate-x-[18px]" : "translate-x-[3px]"
									}`}
								/>
							</span>
							<span
								className={`select-none whitespace-nowrap text-[0.88rem] font-semibold transition-colors ${
									unreadOnly ? "text-indigo-700" : "text-slate-600"
								}`}
							>
								Unread only
							</span>
						</label>

						{/* Load Notifications button */}
						<button
							type="button"
							onClick={() => loadNotifications()}
							className="group relative h-12 min-w-[170px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[0.9rem] font-bold text-white shadow-md transition-all duration-200 hover:shadow-[0_4px_20px_rgba(79,70,229,0.4)] active:scale-[0.98]"
						>
							<span className="relative z-10 flex items-center justify-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
									<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
								</svg>
								Load Notifications
							</span>
							{/* Shimmer sweep on hover */}
							<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
						</button>
					</div>

					<p className="mt-2.5 text-[0.8rem] text-slate-400">
						Use your account email to fetch personal updates.
					</p>

					<div className="mt-4">
						<p className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-slate-400">
							Type filter
						</p>
						<div className="w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-1.5 shadow-sm">
							<div className="grid grid-cols-2 gap-1 md:grid-cols-4">
							{typeFilterOptions.map((option) => {
								const isActive = typeFilter === option.value;
								const count = typeCounts[option.value] || 0;
								return (
									<button
										key={option.value}
										type="button"
										onClick={() => setTypeFilter(option.value)}
										aria-pressed={isActive}
										className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[0.88rem] font-semibold transition-all duration-200 ${
											isActive
												? "border-indigo-200 bg-white text-indigo-700 shadow-[0_6px_16px_rgba(99,102,241,0.18)]"
												: "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
										}`}
									>
										<span className="inline-flex items-center gap-2">
											<span
												className={`h-2.5 w-2.5 rounded-full ${
													option.tone === "blue"
														? "bg-blue-500"
														: option.tone === "amber"
															? "bg-amber-500"
															: option.tone === "indigo"
																? "bg-indigo-500"
																: "bg-slate-500"
												}`}
											/>
											<span className="whitespace-nowrap">{option.label}</span>
										</span>
										<span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-[0.72rem] font-bold ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
											{count}
										</span>
									</button>
								);
							})}
							</div>
						</div>
					</div>

					{/* Feedback now uses toast notifications */}
				</div>

				{/* Stat cards — separated by hairline grid */}
				<div className="grid grid-cols-3 divide-x divide-slate-300 border-t border-slate-300">
					<div className="p-5">
						<div className="rounded-2xl border border-blue-400 bg-blue-100 p-4 transition-transform duration-200 hover:-translate-y-0.5">
							<p className="m-0 mb-3 text-[0.7rem] font-black uppercase tracking-[0.14em] text-blue-700">Unread</p>
							<p className="m-0 text-[2rem] font-black leading-none tabular-nums text-blue-800">{unreadCount}</p>
						</div>
					</div>
					<div className="p-5">
						<div className="rounded-2xl border border-slate-400 bg-slate-100 p-4 transition-transform duration-200 hover:-translate-y-0.5">
							<p className="m-0 mb-3 text-[0.7rem] font-black uppercase tracking-[0.14em] text-slate-700">Loaded</p>
							<p className="m-0 text-[2rem] font-black leading-none tabular-nums text-slate-900">{notifications.length}</p>
						</div>
					</div>
					<div className="p-5">
						<div className="rounded-2xl border border-emerald-400 bg-emerald-100 p-4 transition-transform duration-200 hover:-translate-y-0.5">
							<p className="m-0 mb-3 text-[0.7rem] font-black uppercase tracking-[0.14em] text-emerald-700">Read (loaded)</p>
							<p className="m-0 text-[2rem] font-black leading-none tabular-nums text-emerald-800">{loadedReadCount}</p>
						</div>
					</div>
				</div>
			</motion.article>

			{/* ── NOTIFICATIONS LIST (unchanged) ───────────────────────────── */}
			<motion.article className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm" variants={sectionVariants}>
				<div className="mb-3 flex flex-wrap items-center justify-end gap-2">
					<span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.78rem] font-semibold ${unreadOnly ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"}`}>
						{unreadOnly ? "Unread only" : "All read states"}
					</span>
					<span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-[0.78rem] font-semibold text-indigo-800">
						Type: {typeFilterOptions.find((option) => option.value === typeFilter)?.label}
					</span>
					<span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.78rem] font-semibold text-slate-700">
						Showing {visibleNotifications.length}/{sortedFilteredNotifications.length}
					</span>
				</div>

				<p className="mb-3 text-[0.78rem] font-semibold text-slate-500">
					Sorted by newest first
				</p>

				{isLoading ? (
					<motion.div className="rounded-xl border border-slate-300 bg-slate-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
						<p className="m-0 text-slate-600">Loading notifications...</p>
					</motion.div>
				) : sortedFilteredNotifications.length === 0 ? (
					<motion.div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 p-6 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: smoothEase }}>
						<p className="m-0 mb-1 text-2xl">🔔</p>
						<p className="m-0 mb-1 text-[1.25rem] font-bold text-slate-700">
							No matching notifications
						</p>
						<p className="m-0 text-slate-500">
							Try another type filter or trigger a new booking/ticket update.
						</p>
					</motion.div>
				) : (
					<>
						<motion.ul className="grid gap-3" variants={listVariants} initial="hidden" animate="visible">
							<AnimatePresence initial={false}>
								{visibleNotifications.map((notification, index) => (
									<Fragment key={notification.id}>
										{index === 1 && (
											<li className="flex items-center gap-3 px-1 py-1">
												<span className="h-px flex-1 bg-slate-200" />
												<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
													Earlier
												</span>
												<span className="h-px flex-1 bg-slate-200" />
											</li>
										)}
										<motion.li
										key={`${notification.id}-item`}
									layout
									variants={itemVariants}
									initial="hidden"
									animate="visible"
									exit="exit"
										className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-4 shadow-sm transition-all duration-200 ${
											notification.read
												? "border-slate-400 bg-slate-100/80"
												: "border-slate-500 bg-white hover:-translate-y-[1px] hover:border-slate-600 hover:shadow-md"
										}`}
										style={{ borderLeft: `4px solid ${getAccentColor(notification.type)}` }}
									>
										<div className="min-w-0 flex-1">
											<div className="mb-1.5 flex flex-wrap items-center gap-2">
												<span
													className="inline-flex rounded-full px-2 py-1 text-[0.72rem] font-bold uppercase tracking-wide"
													style={{ background: `${getAccentColor(notification.type)}20`, color: getAccentColor(notification.type) }}
												>
													{getTypeLabel(notification.type)}
												</span>
												{index === 0 && (
													<span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-emerald-700">
														Latest
													</span>
												)}
											</div>
											<p className="m-0 mb-1 text-[1.02rem] font-semibold text-slate-900">
												{notification.title}
											</p>
											<p className="m-0 mb-2 text-slate-700">
												{notification.message}
											</p>
											<p className="m-0 text-[0.85rem] text-slate-500">
												{notification.type} • {formatTimestamp(notification.createdAt)}
											</p>
										</div>
										{notification.read ? (
											<div className="flex flex-col items-end gap-2">
												<span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[0.75rem] font-bold text-emerald-700">
													Read
												</span>
												<div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
												<button
													type="button"
													onClick={() => handleMarkAsUnread(notification.id)}
													disabled={Boolean(actionInProgress[`unread-${notification.id}`] || actionInProgress[`delete-${notification.id}`])}
													className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
													title="Mark as unread"
													aria-label="Mark notification as unread"
												>
													<FaUndoAlt />
													<span className="text-[0.75rem] font-semibold">Unread</span>
												</button>
												<button
													type="button"
													onClick={() => handleDeleteNotification(notification.id)}
													disabled={Boolean(actionInProgress[`delete-${notification.id}`] || actionInProgress[`unread-${notification.id}`])}
													className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
													title="Delete notification"
													aria-label="Delete notification"
												>
													<FaTrashAlt />
													<span className="text-[0.75rem] font-semibold">Delete</span>
												</button>
												</div>
											</div>
										) : (
											<button
												type="button"
												disabled={Boolean(actionInProgress[`read-${notification.id}`])}
												className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[0.85rem] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
												onClick={() => handleMarkAsRead(notification.id)}
											>
												<FaCheckCircle className="text-[0.9rem]" />
												Mark as Read
											</button>
										)}
										</motion.li>
									</Fragment>
								))}
							</AnimatePresence>
						</motion.ul>

						{hasMoreThanInitial && (
							<div className="mt-4 flex justify-center">
								<button
									type="button"
									onClick={() => setShowAllNotifications((currentValue) => !currentValue)}
									className="group inline-flex h-11 items-center gap-2 rounded-full border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-5 text-[0.86rem] font-bold text-indigo-700 transition-all duration-200 hover:-translate-y-[1px] hover:border-indigo-300 hover:shadow-[0_8px_20px_rgba(79,70,229,0.16)]"
								>
									{showAllNotifications ? (
										<>
											<span>Show less</span>
											<span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.72rem] font-extrabold text-indigo-700">
												Back to {INITIAL_VISIBLE_NOTIFICATIONS}
											</span>
										</>
									) : (
										<>
											<span>See more notifications</span>
											<span className="rounded-full bg-white/90 px-2 py-0.5 text-[0.72rem] font-extrabold text-indigo-700">
												+{hiddenNotificationsCount}
											</span>
										</>
									)}
								</button>
							</div>
						)}
					</>
				)}
			</motion.article>
		</motion.section>
	);
}

export default NotificationsPage;