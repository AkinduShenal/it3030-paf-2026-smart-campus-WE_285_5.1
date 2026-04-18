import { useEffect, useState } from "react";
import "./TicketsPage.css";
import { fetchCurrentUser } from "../features/auth/authApi";

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
	requesterEmail: "student1@smartcampus.local",
	preferredContact: "student1@smartcampus.local"
};

const initialFilters = {
	status: "",
	priority: "",
	requesterEmail: "",
	assignedTechnicianEmail: ""
};

const initialCommentForm = {
	authorEmail: "student1@smartcampus.local",
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
	const [ticketForm, setTicketForm] = useState(initialTicketForm);
	const [filters, setFilters] = useState(initialFilters);
	const [tickets, setTickets] = useState([]);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [comments, setComments] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [commentForm, setCommentForm] = useState(initialCommentForm);
	const [assignEmail, setAssignEmail] = useState("tech1@smartcampus.local");
	const [statusAction, setStatusAction] = useState("IN_PROGRESS");
	const [resolutionNotes, setResolutionNotes] = useState("");
	const [uploadBy, setUploadBy] = useState("tech1@smartcampus.local");
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
			requesterEmail: ticketForm.requesterEmail,
			preferredContact: ticketForm.preferredContact
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
		if (!selectedTicket) {
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
		if (!selectedTicket) {
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
			await addComment(selectedTicket.id, commentForm);
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
			await uploadAttachment(selectedTicket.id, uploadBy, file);
			setFeedback({ type: "success", text: "Attachment uploaded." });
			setAttachments(await fetchAttachments(selectedTicket.id));
		} catch (error) {
			setFeedback({ type: "error", text: getErrorMessage(error) });
		}
	}

	return (
		<div className="tickets-container">
			<header className="tp-header">
				<div className="tp-title-group">
					<h2>Incident Hub</h2>
					<p>Manage campus incidents with precision and care.</p>
				</div>
				<div className="tp-header-actions">
					<button className="tp-btn tp-btn-ghost" onClick={() => loadTickets()}>
						<span style={{ fontSize: "1.2rem" }}>🔄</span> Refresh
					</button>
				</div>
			</header>

			<div className="tp-dashboard-grid">
				<article className="glass-card">
					<h3 style={{ margin: 0, marginBottom: "20px" }}>Create Incident</h3>
					<form className="form-grid" onSubmit={handleCreateTicket}>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<label>
								<span>Category</span>
								<input 
									className="tp-input"
									name="category" 
									value={ticketForm.category} 
									onChange={onTicketFormChange} 
									placeholder="e.g. PROJECTOR" 
									required 
								/>
							</label>
							<label>
								<span>Priority</span>
								<select 
									className="tp-input"
									name="priority" 
									value={ticketForm.priority} 
									onChange={onTicketFormChange}
								>
									{priorities.map((priority) => (
										<option key={priority} value={priority}>
											{priority}
										</option>
									))}
								</select>
							</label>
						</div>
						<label>
							<span>Description</span>
							<input 
								className="tp-input"
								name="description" 
								value={ticketForm.description} 
								onChange={onTicketFormChange} 
								placeholder="Describe the issue..." 
								required 
							/>
						</label>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<label>
								<span>Resource ID (Optional)</span>
								<input className="tp-input" name="resourceId" value={ticketForm.resourceId} onChange={onTicketFormChange} type="number" min="1" placeholder="Resource ID" />
							</label>
							<label>
								<span>Location (Optional)</span>
								<input className="tp-input" name="location" value={ticketForm.location} onChange={onTicketFormChange} placeholder="Room 302, Lab A" />
							</label>
						</div>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<label>
								<span>Requester</span>
								<input className="tp-input" name="requesterEmail" value={ticketForm.requesterEmail} onChange={onTicketFormChange} type="email" required />
							</label>
							<label>
								<span>Contact</span>
								<input className="tp-input" name="preferredContact" value={ticketForm.preferredContact} onChange={onTicketFormChange} required />
							</label>
						</div>
						<div className="form-actions" style={{ marginTop: "12px" }}>
							<button type="submit" className="tp-btn tp-btn-primary" style={{ flex: 1 }}>
								Create Ticket
							</button>
						</div>
					</form>
				</article>

				<article className="glass-card">
					<h3 style={{ margin: 0, marginBottom: "20px" }}>Quick Filters</h3>
					<form
						className="filter-grid"
						onSubmit={(event) => {
							event.preventDefault();
							loadTickets(filters);
						}}
					>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<label>
								<span>Status</span>
								<select className="tp-input" name="status" value={filters.status} onChange={onFilterChange}>
									<option value="">All Statuses</option>
									{statuses.map((status) => (
										<option key={status} value={status}>
											{status}
										</option>
									))}
								</select>
							</label>
							<label>
								<span>Priority</span>
								<select className="tp-input" name="priority" value={filters.priority} onChange={onFilterChange}>
									<option value="">All Priorities</option>
									{priorities.map((priority) => (
										<option key={priority} value={priority}>
											{priority}
										</option>
									))}
								</select>
							</label>
						</div>
						<label>
							<span>Requester Email</span>
							<input className="tp-input" name="requesterEmail" value={filters.requesterEmail} onChange={onFilterChange} type="email" placeholder="Search by requester..." />
						</label>
						<label>
							<span>Technician Email</span>
							<input
								className="tp-input"
								name="assignedTechnicianEmail"
								value={filters.assignedTechnicianEmail}
								onChange={onFilterChange}
								type="email"
								placeholder="Search by technician..."
							/>
						</label>
						<div className="form-actions" style={{ marginTop: "12px" }}>
							<button type="submit" className="tp-btn tp-btn-primary" style={{ flex: 1 }}>
								Apply Filters
							</button>
							<button
								type="button"
								className="tp-btn tp-btn-ghost"
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

			<article className="tp-table-container fade-in">
				<div className="table-header" style={{ padding: "16px 20px" }}>
					<h3 style={{ margin: 0 }}>Active Tickets</h3>
					<span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>{tickets.length} record(s) found</span>
				</div>
				{isLoadingList ? (
					<div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
						<p>Loading tickets...</p>
					</div>
				) : tickets.length === 0 ? (
					<div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
						<p>No tickets were found matching your criteria.</p>
					</div>
				) : (
					<div className="table-wrap">
						<table className="tp-table">
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
									<tr key={ticket.id} onClick={() => loadTicketDetails(ticket.id)}>
										<td style={{ fontWeight: 800, color: "#1f3a69" }}>#{ticket.id}</td>
										<td style={{ fontWeight: 600 }}>{ticket.category}</td>
										<td>
											<span className={`tp-priority ${ticket.priority.toLowerCase()}`}>
												{ticket.priority}
											</span>
										</td>
										<td>
											<span className={`tp-chip ${ticket.status.toLowerCase().replace("_", "-")}`}>
												{ticket.status}
											</span>
										</td>
										<td>{ticket.requesterEmail}</td>
										<td>
											<button type="button" className="tp-btn tp-btn-ghost small-btn">
												Inspect
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
				<article className="tp-details-panel fade-in">
					<div className="table-header" style={{ marginBottom: "24px" }}>
						<h3 style={{ margin: 0, fontSize: "1.5rem" }}>Ticket #{selectedTicket.id} <span style={{ color: "#94a3b8", fontWeight: 400 }}>Inspection</span></h3>
						<span className={`tp-chip ${selectedTicket.status.toLowerCase().replace("_", "-")}`} style={{ padding: "6px 16px", fontSize: "0.85rem" }}>
							{selectedTicket.status}
						</span>
					</div>
					
					{isLoadingDetails ? (
						<div style={{ padding: "40px", textAlign: "center" }}>Loading details...</div>
					) : (
						<>
							<div className="tp-stepper">
								{["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((step, index) => {
									const isCompleted = statuses.indexOf(selectedTicket.status) >= statuses.indexOf(step) && selectedTicket.status !== "REJECTED";
									const isActive = selectedTicket.status === step;
									return (
										<div key={step} className={`tp-step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
											<div className="tp-step-bar">
												<div className="tp-step-progress" style={{ width: isCompleted ? "100%" : "0%" }}></div>
											</div>
											<span className="tp-step-label">{step.replace("_", " ")}</span>
										</div>
									);
								})}
							</div>

							<div className="tp-details-grid" style={{ marginBottom: "40px" }}>
								<div className="tp-detail-section">
									<h4>Categorization</h4>
									<div className="tp-detail-content" style={{ fontSize: "1.1rem", marginBottom: "8px" }}>{selectedTicket.category}</div>
									<div style={{ color: "#64748b" }}>{selectedTicket.description}</div>
								</div>
								<div className="tp-detail-section">
									<h4>Location & Asset</h4>
									<div className="tp-detail-content">{selectedTicket.location || "N/A"}</div>
									<div style={{ color: "#64748b", marginTop: "4px" }}>Resource: {selectedTicket.resourceName || "None"}</div>
								</div>
								<div className="tp-detail-section">
									<h4>Timestamps</h4>
									<div style={{ color: "#64748b" }}>Created: {formatTimestamp(selectedTicket.createdAt)}</div>
									<div style={{ color: "#64748b", marginTop: "4px" }}>Updated: {formatTimestamp(selectedTicket.updatedAt)}</div>
								</div>
							</div>

							<div className="tp-dashboard-grid">
								<div className="glass-card">
									<h4 style={{ margin: 0, marginBottom: "20px" }}>Management Actions</h4>
									<div className="form-grid">
										<div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end" }}>
											<label>
												<span>Assign Technician</span>
												<input className="tp-input" value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} type="email" placeholder="Email..." />
											</label>
											<button className="tp-btn tp-btn-primary" onClick={handleAssignTechnician} disabled={isProcessing}>
												{isProcessing ? "..." : "Assign"}
											</button>
										</div>
										
										{!isRejecting ? (
											<button
												type="button"
												className="tp-btn tp-btn-ghost"
												style={{ color: "#ef4444", borderColor: "#fecaca" }}
												onClick={() => setIsRejecting(true)}
												disabled={isProcessing}
											>
												Reject Ticket
											</button>
										) : (
											<div className="fade-in" style={{ background: "#fff1f2", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca" }}>
												<textarea
													className="tp-input"
													placeholder="Reason for rejection..."
													value={rejectionReason}
													onChange={(e) => setRejectionReason(e.target.value)}
													autoFocus
													style={{ marginBottom: "12px" }}
												/>
												<div className="form-actions">
													<button className="tp-btn tp-btn-primary" style={{ background: "#ef4444" }} onClick={handleReject} disabled={isProcessing}>
														Confirm Reject
													</button>
													<button className="tp-btn tp-btn-ghost" onClick={() => setIsRejecting(false)}>
														Cancel
													</button>
												</div>
											</div>
										)}

										<div style={{ borderTop: "1px solid #f1f5f9", margin: "10px 0", paddingTop: "20px" }}>
											<label>
												<span>Update Status</span>
												<select className="tp-input" value={statusAction} onChange={(e) => setStatusAction(e.target.value)}>
													{statuses.map((status) => (
														<option key={status} value={status}>
															{status}
														</option>
													))}
												</select>
											</label>
										</div>
										<label>
											<span>Resolution Notes</span>
											<input className="tp-input" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="What was done?" />
										</label>
										<button className="tp-btn tp-btn-primary" onClick={handleStatusUpdate} disabled={isProcessing}>
											{isProcessing ? "Updating..." : "Update Lifecycle"}
										</button>
									</div>
								</div>

								<div className="glass-card">
									<h4 style={{ margin: 0, marginBottom: "20px" }}>Attachments</h4>
									<label className="upload-area">
										<p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
											<strong>Drop or Click</strong> to upload evidence
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
											<div style={{ gridColumn: "1/-1", padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
												No files attached yet.
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="tp-comments-container">
								<h4 style={{ margin: 0, marginBottom: "24px", fontSize: "1.2rem" }}>Discussion</h4>
								<form className="form-grid" style={{ marginBottom: "32px" }} onSubmit={handleAddComment}>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "12px", alignItems: "end" }}>
										<label>
											<span>Your Email</span>
											<input className="tp-input" name="authorEmail" value={commentForm.authorEmail} onChange={onCommentChange} type="email" />
										</label>
										<label>
											<span>New Comment</span>
											<input className="tp-input" name="content" value={commentForm.content} onChange={onCommentChange} placeholder="Add a note..." required />
										</label>
										<button className="tp-btn tp-btn-primary" type="submit">Post</button>
									</div>
								</form>

								{comments.length === 0 ? (
									<div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>No comments yet. Be the first to speak!</div>
								) : (
									<div className="comment-list">
										{comments.map((comment) => (
											<div key={comment.id} className="tp-comment-card fade-in">
												<div className="tp-comment-avatar">
													{comment.authorEmail.substring(0, 1).toUpperCase()}
												</div>
												<div className="tp-comment-body">
													<div className="tp-comment-meta">{comment.authorEmail}</div>
													{editingCommentId === comment.id ? (
														<div style={{ marginTop: "8px" }}>
															<textarea
																className="tp-input"
																value={editCommentContent}
																onChange={(e) => setEditCommentContent(e.target.value)}
																autoFocus
																style={{ marginBottom: "12px" }}
															/>
															<div className="form-actions">
																<button className="tp-btn tp-btn-primary small-btn" onClick={() => handleSaveEditComment(comment)}>
																	Save
																</button>
																<button className="tp-btn tp-btn-ghost small-btn" onClick={() => setEditingCommentId(null)}>
																	Cancel
																</button>
															</div>
														</div>
													) : (
														<>
															<div className="tp-comment-text" style={{ color: "#334155", lineHeight: "1.5" }}>{comment.content}</div>
															<div className="form-actions" style={{ marginTop: "12px" }}>
																<button
																	type="button"
																	className="tp-btn tp-btn-ghost small-btn"
																	style={{ height: "28px", padding: "0 8px", fontSize: "0.75rem" }}
																	onClick={() => startEditComment(comment)}
																>
																	Edit
																</button>
																<button
																	type="button"
																	className="tp-btn tp-btn-ghost small-btn"
																	style={{ height: "28px", padding: "0 8px", fontSize: "0.75rem", border: "none", color: "#ef4444" }}
																	onClick={() => handleDeleteComment(comment)}
																>
																	Delete
																</button>
															</div>
														</>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</article>
			)}
		</div>
	);
}

export default TicketsPage;
