import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RequireAuth() {
	const location = useLocation();
	const { isLoadingProfile, isAuthenticated } = useAuth();

	if (isLoadingProfile) {
		return <p>Checking your sign-in session...</p>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}

export default RequireAuth;
