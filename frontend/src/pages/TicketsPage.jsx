import { useEffect, useState } from "react";
import {
	addComment,
	assignTechnician,
	createTicket,
	deleteAttachment,
	deleteComment,
	deleteTicket,
	fetchAttachments,
	fetchComments,
	fetchTicketById,
	fetchTickets,
	rejectTicket,
	updateComment,
	updateTicketStatus,
	uploadAttachment
} from "../features/tickets/ticketApi";
import "../styles/TicketStyles.css";

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

const initialTicketForm = {
	category: "",
	description: "",
	priority: "MEDIUM",
	resourceId: "",
	location: "",
	requesterEmail: "user@smartcampus.local",
	preferredContact: "user@smartcampus.local"
};

const initialFilters = {
	status: "",
	priority: "",
	requesterEmail: "",
	assignedTechnicianEmail: ""
};

function formatDateTime(dateString) {
	if (!dateString) return "-";
	return new Date(dateString).toLocaleString();
}

/** 
 * Member 3: Incident Ticketing Module UI
 * Features: High-end Glassmorphism UI, Componentized structure, SLA Tracking, Attachment Gallery, Comment system.
 */
function TicketsPage() {
	const [ticketForm, setTicketForm] = useState(initialTicketForm);
	const [filters, setFilters] = useState(initialFilters);
	const [tickets, setTickets] = useState([]);
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [comments, setComments] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [feedback, setFeedback] = useState({ type: "", text: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("NEW_TICKET"); // NEW_TICKET, LIST

	useEffect(() => {
		loadTickets();
	}, []);

	async function loadTickets(activeFilters = filters) {
		try {
			setIsLoading(true);
			const data = await fetchTickets(activeFilters);
			setTickets(data);
		} catch (error) {
			showFeedback("error", error.message);
		} finally {
			setIsLoading(false);
		}
	}

	async function loadTicketDetails(ticketId) {
		try {
			const [ticket, commentData, attachmentData] = await Promise.all([
				fetchTicketById(ticketId),
				fetchComments(ticketId),
				fetchAttachments(ticketId)
			]);
			setSelectedTicket(ticket);
			setComments(commentData);
			setAttachments(attachmentData);
		} catch (error) {
			showFeedback("error", "Failed to load ticket details");
		}
	}

	async function handleCreateTicket(e) {
		e.preventDefault();
		try {
			const created = await createTicket(ticketForm);
			showFeedback("success", `Ticket #${created.id} created successfully.`);
			setTicketForm(initialTicketForm);
			loadTickets();
			setActiveTab("LIST");
		} catch (error) {
			showFeedback("error", error.message);
		}
	}

	async function handleDeleteTicket(id) {
		if (!window.confirm("Are you sure you want to delete this ticket? This action is irreversible.")) return;
		try {
			await deleteTicket(id);
			showFeedback("success", "Ticket deleted successfully.");
			setSelectedTicket(null);
			loadTickets();
		} catch (error) {
			showFeedback("error", "Only Admins can delete tickets.");
		}
	}

	async function handleDeleteAttachment(attId) {
		if (!window.confirm("Delete this attachment?")) return;
		try {
			await deleteAttachment(selectedTicket.id, attId);
			setAttachments(attachments.filter(a => a.id !== attId));
			showFeedback("success", "Attachment removed.");
		} catch (error) {
			showFeedback("error", "Failed to delete attachment.");
		}
	}

	function showFeedback(type, text) {
		setFeedback({ type, text });
		setTimeout(() => setFeedback({ type: "", text: "" }), 5000);
	}

	return (
		<div className="tickets-container animate-in">
			<header className="section-header">
				<h1>Smart Campus Operations Hub</h1>
				<p>Manage campus incidents with premium precision and efficiency.</p>
			</header>

			<nav className="filter-grid" style={{ marginBottom: '24px' }}>
				<button 
					className={activeTab === "NEW_TICKET" ? "primary-btn" : "ghost-btn"}
					onClick={() => setActiveTab("NEW_TICKET")}
				>
					Report Incident
				</button>
				<button 
					className={activeTab === "LIST" ? "primary-btn" : "ghost-btn"}
					onClick={() => setActiveTab("LIST")}
				>
					Incident Dashboard
				</button>
			</nav>

			{feedback.text && (
				<div className={`feedback ${feedback.type === "error" ? "error" : "success"}`} style={{ marginBottom: '20px' }}>
					{feedback.text}
				</div>
			)}

			<div className="catalogue-grid">
				{/* LEFT PANEL: Form or List */}
				<div className="main-column">
					{activeTab === "NEW_TICKET" ? (
						<article className="ticket-panel">
							<h3>New Incident Report</h3>
							<form className="ticket-form" onSubmit={handleCreateTicket}>
								<div className="form-grid">
									<label>
										<span>Category</span>
										<input 
											placeholder="e.g. Projector Hub, AC Unit, Wifi" 
											value={ticketForm.category} 
											onChange={e => setTicketForm({...ticketForm, category: e.target.value})} 
											required 
										/>
									</label>
									<label>
										<span>Priority</span>
										<select 
											value={ticketForm.priority} 
											onChange={e => setTicketForm({...ticketForm, priority: e.target.value})}
										>
											{priorities.map(p => <option key={p} value={p}>{p}</option>)}
										</select>
									</label>
									<label style={{ gridColumn: 'span 2' }}>
										<span>Detailed Description</span>
										<textarea 
											rows="4"
											value={ticketForm.description} 
											onChange={e => setTicketForm({...ticketForm, description: e.target.value})} 
											required 
										/>
									</label>
									<label>
										<span>Location</span>
										<input 
											placeholder="e.g. Lab 01, Block A" 
											value={ticketForm.location} 
											onChange={e => setTicketForm({...ticketForm, location: e.target.value})} 
										/>
									</label>
									<label>
										<span>Requester Email</span>
										<input 
											type="email" 
											value={ticketForm.requesterEmail} 
											onChange={e => setTicketForm({...ticketForm, requesterEmail: e.target.value})} 
											required
										/>
									</label>
								</div>
								<button type="submit" className="primary-btn" style={{ marginTop: '20px', width: '100%' }}>
									Submit Incident
								</button>
							</form>
						</article>
					) : (
						<div className="ticket-list-wrapper">
							<article className="ticket-panel">
								<h3>Filters</h3>
								<div className="filter-grid">
									<select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
										<option value="">All Statuses</option>
										{statuses.map(s => <option key={s} value={s}>{s}</option>)}
									</select>
									<select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
										<option value="">All Priorities</option>
										{priorities.map(p => <option key={p} value={p}>{p}</option>)}
									</select>
									<button className="ghost-btn" onClick={() => loadTickets()}>Search</button>
								</div>
							</article>

							<div className="ticket-grid">
								{tickets.map(ticket => (
									<div 
										key={ticket.id} 
										className={`ticket-card priority-${ticket.priority} animate-in`}
										onClick={() => loadTicketDetails(ticket.id)}
									>
										<h4>
											{ticket.category}
											<span className="status-pill">{ticket.status}</span>
										</h4>
										<p className="description">{ticket.description}</p>
										<div className="meta">
											<span>📍 {ticket.location || "On-site"}</span>
											<span>🕒 {formatDateTime(ticket.createdAt)}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* RIGHT PANEL: Details */}
				<aside className="details-column">
					{selectedTicket ? (
						<article className="ticket-panel">
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
								<h3>INCIDENT #{selectedTicket.id}</h3>
								<button className="small-btn danger" onClick={() => handleDeleteTicket(selectedTicket.id)}>Delete</button>
							</div>
							
							<div className="ticket-details-content" style={{ marginTop: '16px' }}>
								<div className="sla-banner" style={{ 
									background: 'rgba(99, 102, 241, 0.1)', 
									padding: '12px', 
									borderRadius: '10px',
									border: '1px solid var(--ticket-accent)',
									marginBottom: '16px'
								}}>
									<strong>SLA Target:</strong> {formatDateTime(selectedTicket.resolveBy)}
								</div>

								<p><strong>Reporter:</strong> {selectedTicket.requesterEmail}</p>
								<p><strong>Assignment:</strong> {selectedTicket.assignedTechnicianEmail || "Unassigned"}</p>
								
								{selectedTicket.status !== "CLOSED" && (
									<div className="technician-actions" style={{ borderTop: '1px solid #333', marginTop: '20px', paddingTop: '20px' }}>
										<h4>Technician Console</h4>
										<div className="form-grid" style={{ gap: '10px' }}>
											<button className="ghost-btn small-btn" onClick={() => {
												const mail = window.prompt("Assign To (Email):");
												if (mail) assignTechnician(selectedTicket.id, mail).then(() => loadTicketDetails(selectedTicket.id));
											}}>Quick Assign</button>
											
											<select className="small-btn" onChange={(e) => {
												const notes = window.prompt("Resolution Notes (Required for RESOLVED):");
												updateTicketStatus(selectedTicket.id, e.target.value, notes).then(() => loadTicketDetails(selectedTicket.id));
											}}>
												<option value="">Update Status...</option>
												{statuses.map(s => <option key={s} value={s}>{s}</option>)}
											</select>
										</div>
									</div>
								)}

								<div style={{ marginTop: '24px' }}>
									<h4>Attachments</h4>
									<div className="attachment-grid">
										{attachments.map(att => (
											<div key={att.id} className="attachment-preview">
												<img src={`/api/v1/tickets/attachments/${att.storedFileName}`} alt={att.fileName} />
												<button className="attachment-delete" onClick={() => handleDeleteAttachment(att.id)}>×</button>
											</div>
										))}
										{attachments.length < 3 && (
											<label className="attachment-preview" style={{ cursor: 'pointer', borderStyle: 'dashed' }}>
												<span style={{ fontSize: '24px' }}>+</span>
												<input 
													type="file" 
													hidden 
													onChange={(e) => {
														const file = e.target.files[0];
														if (file) uploadAttachment(selectedTicket.id, "technician@smartcampus.local", file).then(() => loadTicketDetails(selectedTicket.id));
													}} 
												/>
											</label>
										)}
									</div>
								</div>

								<div style={{ marginTop: '24px' }}>
									<h4>Interaction History</h4>
									<div className="comment-list">
										{comments.map(c => (
											<div key={c.id} className="comment-item">
												<div className="comment-header">
													<span className="comment-author">{c.authorEmail}</span>
													<span>{formatDateTime(c.createdAt)}</span>
												</div>
												<div className="comment-content">{c.content}</div>
											</div>
										))}
										<button 
											className="ghost-btn small-btn" 
											style={{ width: '100%', marginTop: '10px' }}
											onClick={() => {
												const txt = window.prompt("Your comment:");
												if (txt) addComment(selectedTicket.id, { authorEmail: "user@smartcampus.local", content: txt }).then(() => loadTicketDetails(selectedTicket.id));
											}}
										>
											Add Comment
										</button>
									</div>
								</div>
							</div>
						</article>
					) : (
						<article className="ticket-panel" style={{ textAlign: 'center', opacity: 0.6 }}>
							<p>Select an incident from the dashboard to view full lifecycle details, comments, and evidence.</p>
						</article>
					)}
				</aside>
			</div>
		</div>
	);
}

export default TicketsPage;
