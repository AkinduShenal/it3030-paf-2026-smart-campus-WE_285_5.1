import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../features/auth/authApi";
import { useAuth } from "../context/AuthContext";

import {
	addComment,
	assignTechnician,
	createTicket,
	deleteComment,
	fetchAttachments,
	fetchComments,
	fetchTicketById,
	fetchTickets,
	rejectTicket,
	updateComment,
	updateTicketStatus,
	uploadAttachment
} from "../features/tickets/ticketApi";

function formatTimestamp(value) {
	if (!value) {
		return "-";
	}
	return new Date(value).toLocaleString();
}

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

const initialTicketForm = {
	category: "PROJECTOR",
	description: "",
	priority: "MEDIUM",
	resourceId: "",
	location: "",
	requesterEmail: "",
	preferredContact: ""
};

const initialFilters = {
	status: "",
	priority: "",
	requesterEmail: "",
	assignedTechnicianEmail: ""
};

const initialCommentForm = {
	authorEmail: "",
	content: ""
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

function TicketsPage() {
	const { profile, hasAnyRole } = useAuth();
	const canManageTickets = hasAnyRole(["ADMIN", "TECHNICIAN"]);
	const [ticketForm, setTicketForm] = useState(initialTicketForm);
	const [filters, setFilters] = useState(initialFilters);
	const [tickets, setTickets] = useState([]);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [comments, setComments] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [commentForm, setCommentForm] = useState(initialCommentForm);
	const [assignEmail, setAssignEmail] = useState("");
	const [statusAction, setStatusAction] = useState("IN_PROGRESS");
	const [resolutionNotes, setResolutionNotes] = useState("");
	const [uploadBy, setUploadBy] = useState("");
	const [feedback, setFeedback] = useState({ type: "", text: "" });
	const [isLoadingList, setIsLoadingList] = useState(false);
	const [isLoadingDetails, setIsLoadingDetails] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editCommentContent, setEditCommentContent] = useState("");

	useEffect(() => {
		let active = true;

		async function hydrateUser() {
			try {
				const user = await fetchCurrentUser();
				if (active && user?.email) {
					setTicketForm((prev) => ({
						...prev,
						requesterEmail: user.email,
						preferredContact: user.email
					}));
					setUploadBy(user.email);
					setCommentForm((prev) => ({ ...prev, authorEmail: user.email }));
					setFilters((prev) => ({ ...prev, requesterEmail: user.email }));
				}
			} catch (_e) {
				// Fallback to defaults
			}
		}

		hydrateUser();
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (!profile?.email) {
			return;
		}
		setTicketForm((prev) => ({
			...prev,
			requesterEmail: profile.email,
			preferredContact: prev.preferredContact || profile.email
		}));
		setCommentForm((prev) => ({ ...prev, authorEmail: profile.email }));
		setAssignEmail((prev) => prev || profile.email);
		setUploadBy((prev) => prev || profile.email);
	}, [profile]);

	function onTicketFormChange(event) {
		const { name, value } = event.target;
		setTicketForm((prev) => ({ ...prev, [name]: value }));
	}

	function onFilterChange(event) {
		const { name, value } = event.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
	}

	function onCommentChange(event) {
		const { name, value } = event.target;
		setCommentForm((prev) => ({ ...prev, [name]: value }));
	}

	async function loadTickets(activeFilters = filters) {
		try {
			setIsLoadingList(true);
			const data = await fetchTickets(activeFilters);
			setTickets(data);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoadingList(false);
		}
	}

	async function loadTicketDetails(ticketId) {
		try {
			setIsLoadingDetails(true);
			const [ticket, commentData, attachmentData] = await Promise.all([
				fetchTicketById(ticketId),
				fetchComments(ticketId),
				fetchAttachments(ticketId)
			]);
			setSelectedTicket(ticket);
			setComments(commentData);
			setAttachments(attachmentData);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsLoadingDetails(false);
		}
	}

	async function handleCreateTicket(event) {
		event.preventDefault();
		const payload = {
			category: ticketForm.category,
			description: ticketForm.description,
			priority: ticketForm.priority,
			resourceId: ticketForm.resourceId ? Number(ticketForm.resourceId) : null,
			location: ticketForm.location || null,
			requesterEmail: profile?.email || ticketForm.requesterEmail,
			preferredContact: ticketForm.preferredContact || profile?.email || ticketForm.requesterEmail
		};

		try {
			const created = await createTicket(payload);
			setFeedback({ type: "success", text: `Ticket ${created.id} created as OPEN.` });
			await loadTickets();
			await loadTicketDetails(created.id);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	async function handleAssignTechnician() {
		if (!selectedTicket || !canManageTickets) {
			return;
		}
		try {
			setIsProcessing(true);
			await assignTechnician(selectedTicket.id, assignEmail);
			setFeedback({ type: "success", text: "Technician assigned successfully." });
			await loadTickets();
			await loadTicketDetails(selectedTicket.id);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleStatusUpdate() {
		if (!selectedTicket || !canManageTickets) {
			return;
		}
		try {
			setIsProcessing(true);
			await updateTicketStatus(selectedTicket.id, statusAction, resolutionNotes);
			setFeedback({ type: "success", text: `Ticket status updated to ${statusAction}.` });
			await loadTickets();
			await loadTicketDetails(selectedTicket.id);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleReject() {
		if (!selectedTicket || !rejectionReason.trim()) {
			setFeedback({ type: "error", text: "Please provide a rejection reason." });
			return;
		}

		try {
			setIsProcessing(true);
			await rejectTicket(selectedTicket.id, rejectionReason);
			setFeedback({ type: "success", text: "Ticket rejected." });
			setIsRejecting(false);
			setRejectionReason("");
			await loadTickets();
			await loadTicketDetails(selectedTicket.id);
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleAddComment(event) {
		event.preventDefault();
		if (!selectedTicket) {
			return;
		}

		try {
			await addComment(selectedTicket.id, {
				...commentForm,
				authorEmail: profile?.email || commentForm.authorEmail
			});
			setCommentForm((prev) => ({ ...prev, content: "" }));
			setFeedback({ type: "success", text: "Comment added." });
			setComments(await fetchComments(selectedTicket.id));
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	function startEditComment(comment) {
		setEditingCommentId(comment.id);
		setEditCommentContent(comment.content);
	}

	async function handleSaveEditComment(comment) {
		if (!selectedTicket || !editCommentContent.trim()) {
			return;
		}

		try {
			setIsProcessing(true);
			await updateComment(selectedTicket.id, comment.id, {
				actorEmail: comment.authorEmail,
				content: editCommentContent
			});
			setFeedback({ type: "success", text: "Comment updated." });
			setEditingCommentId(null);
			setComments(await fetchComments(selectedTicket.id));
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleDeleteComment(comment) {
		if (!selectedTicket) {
			return;
		}

		if (!window.confirm("Are you sure you want to delete this comment?")) {
			return;
		}

		try {
			setIsProcessing(true);
			await deleteComment(selectedTicket.id, comment.id, comment.authorEmail);
			setFeedback({ type: "success", text: "Comment deleted." });
			setComments(await fetchComments(selectedTicket.id));
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleUploadAttachment(event) {
		if (!selectedTicket) {
			return;
		}
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		try {
			await uploadAttachment(selectedTicket.id, profile?.email || uploadBy, file);
			setFeedback({ type: "success", text: "Attachment uploaded." });
			setAttachments(await fetchAttachments(selectedTicket.id));
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	return (
		<section>
			<header className="section-header">
				<h2 style={{ margin: 0 }}>Maintenance and Incidents</h2>
				<p>Report issues, assign technicians, manage lifecycle, and track evidence/comments.</p>
			</header>

			<div className="catalogue-grid">
				<article className="panel-card">
					<h3 style={{ margin: 0, marginBottom: "14px" }}>Create Incident Ticket</h3>
					<form className="form-grid" onSubmit={handleCreateTicket}>
						<label>
							<span>Category</span>
							<input name="category" value={ticketForm.category} onChange={onTicketFormChange} placeholder="e.g. PROJECTOR, HVAC" required />
						</label>
						<label>
							<span>Description</span>
							<input name="description" value={ticketForm.description} onChange={onTicketFormChange} placeholder="Describe the issue..." required />
						</label>
						<label>
							<span>Priority</span>
							<select name="priority" value={ticketForm.priority} onChange={onTicketFormChange}>
								{priorities.map((priority) => (
									<option key={priority} value={priority}>
										{priority}
									</option>
								))}
							</select>
						</label>
						<label>
							<span>Resource ID (Optional)</span>
							<input name="resourceId" value={ticketForm.resourceId} onChange={onTicketFormChange} type="number" min="1" placeholder="Resource ID" />
						</label>
						<label>
							<span>Location (Optional)</span>
							<input name="location" value={ticketForm.location} onChange={onTicketFormChange} placeholder="Room 302, Lab A" />
						</label>
						<label>
							<span>Requester Email</span>
							<input name="requesterEmail" value={profile?.email || ticketForm.requesterEmail} type="email" readOnly required />
						</label>
						<label>
							<span>Preferred Contact</span>
							<input name="preferredContact" value={ticketForm.preferredContact} onChange={onTicketFormChange} required />
						</label>
						<div className="form-actions">
							<button type="submit">
								Create Ticket
							</button>
							<button type="button" className="ghost-btn" onClick={() => loadTickets()}>
								Refresh List
							</button>
						</div>
					</form>
				</article>

				<article className="panel-card">
					<h3 style={{ margin: 0, marginBottom: "14px" }}>Ticket Filters</h3>
					<form
						className="filter-grid"
						onSubmit={(event) => {
							event.preventDefault();
							loadTickets(filters);
						}}
					>
						<label>
							<span>Status</span>
							<select name="status" value={filters.status} onChange={onFilterChange}>
								<option value="">All</option>
								{statuses.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</label>
						<label>
							<span>Priority</span>
							<select name="priority" value={filters.priority} onChange={onFilterChange}>
								<option value="">All</option>
								{priorities.map((priority) => (
									<option key={priority} value={priority}>
										{priority}
									</option>
								))}
							</select>
						</label>
						<label>
							<span>Requester Email</span>
							<input name="requesterEmail" value={filters.requesterEmail} onChange={onFilterChange} type="email" />
						</label>
						<label>
							<span>Technician Email</span>
							<input
								name="assignedTechnicianEmail"
								value={filters.assignedTechnicianEmail}
								onChange={onFilterChange}
								type="email"
							/>
						</label>
						<div className="form-actions">
							<button type="submit">
								Apply
							</button>
							<button
								type="button"
								className="ghost-btn"
								onClick={() => {
									setFilters(initialFilters);
									loadTickets(initialFilters);
								}}
							>
								Reset
							</button>
						</div>
					</form>
				</article>
			</div>

			{feedback.text && (
				<p className={feedback.type === "error" ? "feedback error" : "feedback success"}>{feedback.text}</p>
			)}

			<article className="panel-card">
				<div className="table-header">
					<h3>Tickets</h3>
					<span>{tickets.length} item(s)</span>
				</div>
				{isLoadingList ? (
					<p>Loading tickets...</p>
				) : tickets.length === 0 ? (
					<p>No tickets loaded yet. Use refresh or create one.</p>
				) : (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>ID</th>
									<th>Category</th>
									<th>Priority</th>
									<th>Status</th>
									<th>Requester</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{tickets.map((ticket) => (
									<tr key={ticket.id}>
										<td style={{ fontWeight: 700, color: "#1f3a69" }}>#{ticket.id}</td>
										<td style={{ fontWeight: 600 }}>{ticket.category}</td>
										<td>
											<span className={`priority-chip ${ticket.priority.toLowerCase().replace("_", "-")}`}>
												{ticket.priority}
											</span>
										</td>
										<td>
											<span className={`status-chip ${ticket.status.toLowerCase().replace("_", "-")}`}>
												{ticket.status}
											</span>
										</td>
										<td>{ticket.requesterEmail}</td>
										<td>
											<button type="button" className="small-btn" onClick={() => loadTicketDetails(ticket.id)}>
												Open
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</article>

			{selectedTicket && (
				<article className="panel-card fade-in" style={{ marginTop: "16px" }}>
					<div className="table-header">
						<h3 style={{ margin: 0 }}>Ticket #{selectedTicket.id} Details</h3>
						<span className={`status-chip ${selectedTicket.status.toLowerCase().replace("_", "-")}`}>
							{selectedTicket.status}
						</span>
					</div>
					{isLoadingDetails ? (
						<p>Loading details...</p>
					) : (
						<>
					<div className="lifecycle-stepper">
						{["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((step, index) => {
							const isCompleted = statuses.indexOf(selectedTicket.status) >= statuses.indexOf(step) && selectedTicket.status !== "REJECTED";
							const isActive = selectedTicket.status === step;
							return (
								<div key={step} className={`step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
									{index + 1}
									<span className="step-label">{step.replace("_", " ")}</span>
								</div>
							);
						})}
					</div>

							<div className="catalogue-grid" style={{ marginTop: "32px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
								<div>
									<p style={{ margin: "0 0 4px" }}><strong>Category:</strong> {selectedTicket.category}</p>
									<p style={{ margin: 0, color: "#5b6d86" }}>{selectedTicket.description}</p>
								</div>
								<div>
									<p style={{ margin: "0 0 4px" }}><strong>Location:</strong> {selectedTicket.location || "Not specified"}</p>
									<p style={{ margin: 0 }}><strong>Resource:</strong> {selectedTicket.resourceName || "-"}</p>
								</div>
							</div>

							<div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "0.85rem", color: "#64748b" }}>
								<p style={{ margin: 0 }}>
									Created: {formatTimestamp(selectedTicket.createdAt)} | Last Updated: {formatTimestamp(selectedTicket.updatedAt)}
								</p>
							</div>

							<div className="catalogue-grid">
								{canManageTickets && (
									<div className="panel-card technician-view">
									<h4 style={{ margin: 0, marginBottom: "14px" }}>Technician + Status Actions</h4>
									<div className="form-grid">
										<label>
											<span>Technician Email</span>
											<input value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} type="email" />
										</label>
										<div className="form-actions">
											<button type="button" onClick={handleAssignTechnician} disabled={isProcessing}>
												{isProcessing ? "Processing..." : "Assign"}
											</button>
											{!isRejecting ? (
												<button
													type="button"
													className="small-btn danger"
													onClick={() => setIsRejecting(true)}
													disabled={isProcessing}
												>
													Reject
												</button>
											) : (
												<div style={{ width: "100%", display: "grid", gap: "8px", marginTop: "10px" }}>
													<textarea
														placeholder="Reason for rejection..."
														value={rejectionReason}
														onChange={(e) => setRejectionReason(e.target.value)}
														autoFocus
													/>
													<div className="form-actions">
														<button type="button" className="small-btn danger" onClick={handleReject} disabled={isProcessing}>
															Confirm Reject
														</button>
														<button type="button" className="ghost-btn" onClick={() => setIsRejecting(false)}>
															Cancel
														</button>
													</div>
												</div>
											)}
										</div>

										<label>
											<span>Next Status</span>
											<select value={statusAction} onChange={(e) => setStatusAction(e.target.value)}>
												{statuses.map((status) => (
													<option key={status} value={status}>
														{status}
													</option>
												))}
											</select>
										</label>
										<label>
											<span>Resolution Notes</span>
											<input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} />
										</label>
										<button type="button" onClick={handleStatusUpdate} disabled={isProcessing}>
											{isProcessing ? "Updating..." : "Update Status"}
										</button>
									</div>
									</div>
								)}

								<div className="panel-card">
									<h4 style={{ margin: 0, marginBottom: "14px" }}>Attachments</h4>
									<label className="upload-area">
										<p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
											<strong>Click to upload</strong> evidence images
										</p>
										<input type="file" accept="image/*" onChange={handleUploadAttachment} style={{ display: "none" }} />
									</label>

									<div className="attachment-grid">
										{attachments.map((attachment) => (
											<div key={attachment.id} className="attachment-card">
												<span className="file-icon">🖼️</span>
												<span className="file-name" title={attachment.fileName}>
													{attachment.fileName}
												</span>
												<span className="file-size">
													{Math.round((attachment.fileSize || 0) / 1024)} KB
												</span>
											</div>
										))}
										{attachments.length === 0 && (
											<p style={{ gridColumn: "1/-1", fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", margin: "10px 0" }}>
												No attachments uploaded.
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="panel-card" style={{ marginTop: "14px" }}>
								<h4 style={{ margin: 0, marginBottom: "14px" }}>Comments</h4>
								<form className="form-grid" onSubmit={handleAddComment}>
									<label>
										<span>Author Email</span>
										<input name="authorEmail" value={profile?.email || commentForm.authorEmail} type="email" readOnly />
									</label>
									<label>
										<span>Comment</span>
										<input name="content" value={commentForm.content} onChange={onCommentChange} required />
									</label>
									<button type="submit">Add Comment</button>
								</form>

								{comments.length === 0 ? (
									<p style={{ marginTop: "10px" }}>No comments yet.</p>
								) : (
									<ul className="comment-list">
										{comments.map((comment) => (
											<li key={comment.id} className="comment-item">
												<span className="comment-author">{comment.authorEmail}</span>
												{editingCommentId === comment.id ? (
													<div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
														<textarea
															value={editCommentContent}
															onChange={(e) => setEditCommentContent(e.target.value)}
															autoFocus
														/>
														<div className="form-actions">
															<button type="button" className="small-btn" onClick={() => handleSaveEditComment(comment)}>
																Save
															</button>
															<button type="button" className="ghost-btn" onClick={() => setEditingCommentId(null)}>
																Cancel
															</button>
														</div>
													</div>
												) : (
													<>
														<p className="comment-content">{comment.content}</p>
														<div className="form-actions" style={{ marginTop: "8px" }}>
															<button
																type="button"
																className="small-btn ghost-btn"
																onClick={() => startEditComment(comment)}
															>
																Edit
															</button>
															<button
																type="button"
																className="small-btn danger"
																onClick={() => handleDeleteComment(comment)}
															>
																Delete
															</button>
														</div>
													</>
												)}
											</li>
										))}
									</ul>
								)}
							</div>
						</>
					)}
				</article>
			)}
		</section>
	);
}


export default TicketsPage;
