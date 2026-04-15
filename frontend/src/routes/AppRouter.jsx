import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../app/AppLayout";
import BookingsPage from "../pages/BookingsPage";
import CataloguePage from "../pages/CataloguePage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import NotificationsPage from "../pages/NotificationsPage";
import SignupPage from "../pages/SignupPage";
import TicketsPage from "../pages/TicketsPage";
import RequireAuth from "./RequireAuth";

function AppRouter() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/signup" element={<SignupPage />} />
			<Route element={<RequireAuth />}>
				<Route element={<AppLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/catalogue" element={<CataloguePage />} />
					<Route path="/bookings" element={<BookingsPage />} />
					<Route path="/tickets" element={<TicketsPage />} />
					<Route path="/notifications" element={<NotificationsPage />} />
				</Route>
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default AppRouter;
