import httpClient from "../../api/httpClient";

export async function fetchNotifications(recipientEmail, unreadOnly = false) {
	const response = await httpClient.get("/notifications", {
		params: { recipientEmail, unreadOnly }
	});
	return response.data;
}

export async function fetchNotificationSummary(recipientEmail) {
	const response = await httpClient.get("/notifications/summary", {
		params: { recipientEmail }
	});
	return response.data;
}

export async function markNotificationAsRead(id, recipientEmail) {
	const response = await httpClient.patch(`/notifications/${id}/read`, null, {
		params: { recipientEmail }
	});
	return response.data;
}

export async function markNotificationAsUnread(id, recipientEmail) {
	const response = await httpClient.patch(`/notifications/${id}/unread`, null, {
		params: { recipientEmail }
	});
	return response.data;
}

export async function deleteNotification(id, recipientEmail) {
	await httpClient.delete(`/notifications/${id}`, {
		params: { recipientEmail }
	});
}
