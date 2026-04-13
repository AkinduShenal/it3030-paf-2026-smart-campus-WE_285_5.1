import httpClient from "../../api/httpClient";

function cleanParams(filters) {
	const entries = Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined);
	return Object.fromEntries(entries);
}

export async function createTicket(payload) {
	const response = await httpClient.post("/tickets", payload);
	return response.data;
}

export async function fetchTickets(filters) {
	const response = await httpClient.get("/tickets", {
		params: cleanParams(filters)
	});
	return response.data;
}

export async function deleteAttachment(ticketId, attachmentId) {
	await httpClient.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
}

export async function deleteTicket(id) {
	await httpClient.delete(`/tickets/${id}`);
}

export async function fetchTicketById(id) {
	const response = await httpClient.get(`/tickets/${id}`);
	return response.data;
}

export async function assignTechnician(id, technicianEmail) {
	const response = await httpClient.patch(`/tickets/${id}/assign`, { technicianEmail });
	return response.data;
}

export async function updateTicketStatus(id, status, resolutionNotes) {
	const payload = { status, resolutionNotes: resolutionNotes || null };
	const response = await httpClient.patch(`/tickets/${id}/status`, payload);
	return response.data;
}

export async function rejectTicket(id, reason) {
	const response = await httpClient.patch(`/tickets/${id}/reject`, { reason });
	return response.data;
}

export async function fetchComments(ticketId) {
	const response = await httpClient.get(`/tickets/${ticketId}/comments`);
	return response.data;
}

export async function addComment(ticketId, payload) {
	const response = await httpClient.post(`/tickets/${ticketId}/comments`, payload);
	return response.data;
}

export async function updateComment(ticketId, commentId, payload) {
	const response = await httpClient.put(`/tickets/${ticketId}/comments/${commentId}`, payload);
	return response.data;
}

export async function deleteComment(ticketId, commentId, actorEmail) {
	await httpClient.delete(`/tickets/${ticketId}/comments/${commentId}`, {
		params: { actorEmail }
	});
}

export async function fetchAttachments(ticketId) {
	const response = await httpClient.get(`/tickets/${ticketId}/attachments`);
	return response.data;
}

export async function uploadAttachment(ticketId, uploadedBy, file) {
	const formData = new FormData();
	formData.append("uploadedBy", uploadedBy);
	formData.append("file", file);

	const response = await httpClient.post(`/tickets/${ticketId}/attachments`, formData, {
		headers: { "Content-Type": "multipart/form-data" }
	});
	return response.data;
}