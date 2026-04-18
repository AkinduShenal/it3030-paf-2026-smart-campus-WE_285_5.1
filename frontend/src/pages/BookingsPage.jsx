import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
	approveBooking,
	cancelBooking,
	createBooking,
	fetchBookings,
	fetchMyBookings,
	rejectBooking
} from "../features/bookings/bookingApi";
import { fetchResources } from "../features/catalogue/resourceApi";

const bookingStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const initialBookingForm = {
	resourceId: "",
	requesterEmail: "",
	startTime: "",
	endTime: "",
	purpose: "",
	expectedAttendees: ""
};

const initialAdminFilters = {
	resourceId: "",
	status: "",
	requesterEmail: ""
};

function getErrorMessage(error) {
	const apiError = error?.response?.data;
	if (apiError?.validationErrors) {
		const firstValidation = Object.values(apiError.validationErrors)[0];
		if (firstValidation) {
			return firstValidation;
		}
	}
	return apiError?.message || error.message || "Request failed";
}

function toDateTimeLabel(value) {
	if (!value) {
		return "-";
	}
	return value.replace("T", " ").slice(0, 16);
}

function BookingsPage() {
	const { profile, hasRole } = useAuth();
	const isAdmin = hasRole("ADMIN");

	const [bookingForm, setBookingForm] = useState(initialBookingForm);
	const [adminFilters, setAdminFilters] = useState(initialAdminFilters);
	const [myBookings, setMyBookings] = useState([]);
	const [adminBookings, setAdminBookings] = useState([]);
	const [availableResources, setAvailableResources] = useState([]);
	const [feedback, setFeedback] = useState({ type: "", text: "" });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingMy, setIsLoadingMy] = useState(false);
	const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
	const [isLoadingResources, setIsLoadingResources] = useState(false);

	const canSubmit = useMemo(
		() =>
			bookingForm.resourceId &&
			(profile?.email || bookingForm.requesterEmail) &&
			bookingForm.startTime &&
			bookingForm.endTime &&
			bookingForm.purpose,
		[bookingForm, profile]
	);

	const selectedResource = useMemo(
		() => availableResources.find((resource) => String(resource.id) === String(bookingForm.resourceId)) || null,
		[availableResources, bookingForm.resourceId]
	);

	const bookingSummary = useMemo(() => {
		const myPending = myBookings.filter((booking) => booking.status === "PENDING").length;
		const myApproved = myBookings.filter((booking) => booking.status === "APPROVED").length;
		const queuePending = adminBookings.filter((booking) => booking.status === "PENDING").length;

		return {
			resources: availableResources.length,
			myTotal: myBookings.length,
			myPending,
			myApproved,
			queuePending
		};
	}, [myBookings, adminBookings, availableResources]);

	useEffect(() => {
		if (!profile?.email) {
			return;
		}
		setBookingForm((prev) => ({ ...prev, requesterEmail: profile.email }));
	}, [profile]);

	useEffect(() => {
		loadAvailableResources();
	}, []);

	function onBookingFormChange(event) {
		const { name, value } = event.target;
		setBookingForm((prev) => ({ ...prev, [name]: value }));
	}

	function onAdminFilterChange(event) {
		const { name, value } = event.target;
		setAdminFilters((prev) => ({ ...prev, [name]: value }));
	}

	async function loadAvailableResources() {
		try {
			setIsLoadingResources(true);
			const data = await fetchResources({ status: "ACTIVE" });
			setAvailableResources(Array.isArray(data) ? data : []);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoadingResources(false);
		}
	}

	async function handleCreateBooking(event) {
		event.preventDefault();
		setFeedback({ type: "", text: "" });

		const payload = {
			resourceId: Number(bookingForm.resourceId),
			requesterEmail: profile?.email || bookingForm.requesterEmail,
			startTime: `${bookingForm.startTime}:00`,
			endTime: `${bookingForm.endTime}:00`,
			purpose: bookingForm.purpose,
			expectedAttendees: bookingForm.expectedAttendees ? Number(bookingForm.expectedAttendees) : null
		};

		try {
			setIsSubmitting(true);
			await createBooking(payload);
			setFeedback({ type: "success", text: "Booking request submitted as PENDING." });
			await loadMyBookings(payload.requesterEmail);
			if (isAdmin) {
				await loadAdminBookings(adminFilters);
			}
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsSubmitting(false);
		}
	}

	async function loadMyBookings(requesterEmail = profile?.email || bookingForm.requesterEmail) {
		if (!requesterEmail) {
			setFeedback({ type: "error", text: "Requester email is required to load your bookings." });
			return;
		}
		try {
			setIsLoadingMy(true);
			const data = await fetchMyBookings(requesterEmail);
			setMyBookings(data);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoadingMy(false);
		}
	}

	async function loadAdminBookings(filters = adminFilters) {
		try {
			setIsLoadingAdmin(true);
			const payload = {
				...filters,
				resourceId: filters.resourceId ? Number(filters.resourceId) : ""
			};
			const data = await fetchBookings(payload);
			setAdminBookings(data);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoadingAdmin(false);
		}
	}

	async function handleApprove(id) {
		if (!isAdmin) {
			return;
		}
		try {
			await approveBooking(id);
			setFeedback({ type: "success", text: `Booking ${id} approved.` });
			await loadAdminBookings(adminFilters);
			await loadMyBookings();
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	async function handleReject(id) {
		if (!isAdmin) {
			return;
		}
		const reason = window.prompt("Rejection reason:");
		if (!reason) {
			return;
		}

		try {
			await rejectBooking(id, reason);
			setFeedback({ type: "success", text: `Booking ${id} rejected.` });
			await loadAdminBookings(adminFilters);
			await loadMyBookings();
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	async function handleCancel(id) {
		try {
			await cancelBooking(id, profile?.email || bookingForm.requesterEmail);
			setFeedback({ type: "success", text: `Booking ${id} cancelled.` });
			await loadMyBookings();
			if (isAdmin) {
				await loadAdminBookings(adminFilters);
			}
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	async function handleAdminFilterSubmit(event) {
		event.preventDefault();
		await loadAdminBookings(adminFilters);
	}

	function getStatusClass(status) {
		return `status-pill ${String(status || "default").toLowerCase()}`;
	}

	return (
		<section className="booking-page booking-page--v3 booking-ui-refresh-v5 booking-page--friendly">
			<header className="section-header booking-page__header">
				<div>
					<h2>Booking Management</h2>
					<p>Create requests, monitor approvals, and manage the full booking workflow in one place.</p>
				</div>
				<div className="booking-header-chip">Smart Campus Booking Desk · 2026</div>
			</header>

			<section className="booking-stats-grid booking-stats-grid--friendly">
				<article className="booking-stat-card booking-stat-card--resources">
					<p className="booking-stat-label">Active Resources</p>
					<p className="booking-stat-value">{bookingSummary.resources}</p>
				</article>
				<article className="booking-stat-card booking-stat-card--pending">
					<p className="booking-stat-label">My Pending</p>
					<p className="booking-stat-value booking-stat-value--warning">{bookingSummary.myPending}</p>
				</article>
				<article className="booking-stat-card booking-stat-card--approved">
					<p className="booking-stat-label">My Approved</p>
					<p className="booking-stat-value booking-stat-value--success">{bookingSummary.myApproved}</p>
				</article>
				<article
					className={`booking-stat-card ${isAdmin ? "booking-stat-card--queue" : "booking-stat-card--total"}`}
				>
					<p className="booking-stat-label">{isAdmin ? "Queue Pending" : "My Total"}</p>
					<p className="booking-stat-value booking-stat-value--danger">
						{isAdmin ? bookingSummary.queuePending : bookingSummary.myTotal}
					</p>
				</article>
			</section>

			<article className="booking-quick-guide">
				<strong>Quick tip:</strong> Select a resource, pick a valid time range, and use <em>Refresh My Bookings</em>
				after submission to instantly view your latest status.
			</article>

			<div className="booking-top-grid">
				<article className="panel-card booking-request-card booking-section-card">
					<div className="booking-request-card__header">
						<h3>Create Booking Request</h3>
						<p>Choose a resource and submit your request for approval.</p>
					</div>
					<form className="booking-request-form booking-request-form--v2" onSubmit={handleCreateBooking}>
						<label className="booking-request-field">
							<span className="booking-request-label">Resource</span>
							<select
								name="resourceId"
								value={bookingForm.resourceId}
								onChange={onBookingFormChange}
								required
								disabled={isLoadingResources || availableResources.length === 0}
								className="booking-request-input"
							>
								<option value="">
									{isLoadingResources ? "Loading available resources..." : "Select an available resource"}
								</option>
								{availableResources.map((resource) => (
									<option key={resource.id} value={resource.id}>
										#{resource.id} - {resource.name} ({resource.location || "No location"})
									</option>
								))}
							</select>
							<small className="booking-help-text">
								{selectedResource
									? `Selected: ${selectedResource.name} | Capacity ${selectedResource.capacity || "-"}`
									: "Choose from active resources. ID is selected automatically."}
							</small>
						</label>

						<label className="booking-request-field">
							<span className="booking-request-label">Requester Email</span>
							<input
								name="requesterEmail"
								value={profile?.email || bookingForm.requesterEmail}
								type="email"
								className="booking-request-input"
								readOnly
							/>
						</label>

						<div className="booking-request-datetime">
							<label className="booking-request-field">
								<span className="booking-request-label">Start</span>
								<input
									name="startTime"
									value={bookingForm.startTime}
									onChange={onBookingFormChange}
									type="datetime-local"
									required
									className="booking-request-input"
								/>
							</label>
							<label className="booking-request-field">
								<span className="booking-request-label">End</span>
								<input
									name="endTime"
									value={bookingForm.endTime}
									onChange={onBookingFormChange}
									type="datetime-local"
									required
									className="booking-request-input"
								/>
							</label>
						</div>

						<label className="booking-request-field">
							<span className="booking-request-label">Purpose</span>
							<input
								name="purpose"
								value={bookingForm.purpose}
								onChange={onBookingFormChange}
								required
								className="booking-request-input"
								placeholder="Ex: Workshop, team meeting, lab session"
							/>
						</label>

						<label className="booking-request-field">
							<span className="booking-request-label">Expected Attendees</span>
							<input
								name="expectedAttendees"
								value={bookingForm.expectedAttendees}
								onChange={onBookingFormChange}
								type="number"
								min="1"
								className="booking-request-input"
							/>
						</label>

						<div className="booking-request-actions booking-request-actions--booking">
							<button
								type="submit"
								disabled={!canSubmit || isSubmitting}
								className="booking-request-btn booking-request-btn--primary booking-request-btn--submit"
							>
								{isSubmitting ? "Submitting..." : "Submit Booking"}
							</button>
							<button
								type="button"
								onClick={loadAvailableResources}
								className="booking-request-btn booking-request-btn--ghost booking-request-btn--secondary booking-request-btn--resources"
							>
								Refresh Resources
							</button>
							<button
								type="button"
								onClick={() => loadMyBookings()}
								className="booking-request-btn booking-request-btn--ghost booking-request-btn--secondary booking-request-btn--my-bookings"
							>
								Refresh My Bookings
							</button>
						</div>
					</form>
				</article>

				{isAdmin && (
					<article className="panel-card booking-section-card booking-admin-card">
						<div className="booking-request-card__header">
							<h3>Admin Review Filters</h3>
							<p>Filter booking requests by resource, status, or requester.</p>
						</div>
						<form className="booking-admin-filter-form" onSubmit={handleAdminFilterSubmit}>
							<p className="booking-admin-filter-note">Use one or more filters to narrow queue results quickly.</p>
							<label className="booking-request-field booking-admin-field booking-admin-field--resource">
								<span className="booking-request-label">Resource ID</span>
								<input
									name="resourceId"
									value={adminFilters.resourceId}
									onChange={onAdminFilterChange}
									type="number"
									min="1"
									placeholder="Ex: 101"
									className="booking-request-input"
								/>
							</label>
							<label className="booking-request-field booking-admin-field booking-admin-field--status">
								<span className="booking-request-label">Status</span>
								<select
									name="status"
									value={adminFilters.status}
									onChange={onAdminFilterChange}
									className="booking-request-input"
								>
									<option value="">All</option>
									{bookingStatuses.map((status) => (
										<option key={status} value={status}>
											{status}
										</option>
									))}
								</select>
							</label>
							<label className="booking-request-field booking-admin-field booking-admin-field--email">
								<span className="booking-request-label">Requester Email</span>
								<input
									name="requesterEmail"
									value={adminFilters.requesterEmail}
									onChange={onAdminFilterChange}
									type="email"
									className="booking-request-input"
									placeholder="student1@smartcampus.local"
								/>
							</label>
							<div className="booking-request-actions booking-request-actions--tight">
								<button
									type="submit"
									className="booking-request-btn booking-request-btn--primary booking-request-btn--load-bookings"
								>
									Load Bookings
								</button>
								<button
									type="button"
									onClick={() => loadAdminBookings({})}
									className="booking-request-btn booking-request-btn--ghost booking-request-btn--load-all"
								>
									Load All
								</button>
							</div>
						</form>
					</article>
				)}
			</div>

			{feedback.text && (
				<p
					className={
						feedback.type === "error"
							? "booking-feedback booking-feedback--error"
							: "booking-feedback booking-feedback--success"
					}
				>
					{feedback.text}
				</p>
			)}

			<article className="panel-card booking-table-card booking-table-card--my overflow-hidden">
				<div className="booking-table-head">
					<h3>My Bookings</h3>
					<span className="table-count-badge">{myBookings.length} item(s)</span>
				</div>
				<p className="booking-table-subtitle">Your personal requests and their latest booking status.</p>
				{isLoadingMy ? (
					<p className="booking-table-loading">Loading your bookings...</p>
				) : myBookings.length === 0 ? (
					<div className="booking-empty-state">
						<div className="booking-empty-state__icon" />
						<p>No bookings found. Submit a request first.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="booking-table">
							<thead>
								<tr>
									<th>ID</th>
									<th>Resource</th>
									<th>Time</th>
									<th>Status</th>
									<th>Purpose</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{myBookings.map((booking) => (
									<tr key={booking.id}>
										<td>{booking.id}</td>
										<td>{booking.resourceName} (#{booking.resourceId})</td>
										<td>
											{toDateTimeLabel(booking.startTime)} - {toDateTimeLabel(booking.endTime)}
										</td>
										<td>
											<span className={getStatusClass(booking.status)}>{booking.status}</span>
										</td>
										<td>{booking.purpose}</td>
										<td>
											{booking.status === "APPROVED" ? (
												<button
													type="button"
													onClick={() => handleCancel(booking.id)}
													className="booking-row-btn booking-row-btn--danger"
												>
													Cancel
												</button>
											) : (
												<span>-</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</article>

			{isAdmin && (
				<article className="panel-card booking-table-card booking-table-card--admin overflow-hidden">
					<div className="booking-table-head">
						<h3>Admin Booking Queue</h3>
						<span className="table-count-badge">{adminBookings.length} item(s)</span>
					</div>
					<p className="booking-table-subtitle">Pending and reviewed requests for operational follow-up.</p>
					{isLoadingAdmin ? (
						<p className="booking-table-loading">Loading admin queue...</p>
					) : adminBookings.length === 0 ? (
						<div className="booking-empty-state">
							<div className="booking-empty-state__icon" />
							<p>No bookings found. Use filters and click Load Bookings.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="booking-table">
								<thead>
									<tr>
										<th>ID</th>
										<th>Requester</th>
										<th>Resource</th>
										<th>Time</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{adminBookings.map((booking) => (
										<tr key={booking.id}>
											<td>{booking.id}</td>
											<td>{booking.requesterEmail}</td>
											<td>{booking.resourceName}</td>
											<td>{toDateTimeLabel(booking.startTime)}</td>
											<td>
												<span className={getStatusClass(booking.status)}>{booking.status}</span>
											</td>
											<td>
												{booking.status === "PENDING" ? (
													<div className="booking-row-actions">
														<button
															type="button"
															onClick={() => handleApprove(booking.id)}
															className="booking-row-btn booking-row-btn--success"
														>
															Approve
														</button>
														<button
															type="button"
															onClick={() => handleReject(booking.id)}
															className="booking-row-btn booking-row-btn--danger"
														>
															Reject
														</button>
													</div>
												) : (
													<span>-</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</article>
			)}
		</section>
	);
}

export default BookingsPage;
