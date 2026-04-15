import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RequireRole({ roles = [], children }) {
	const { isLoadingProfile, oauth2Enabled, isAuthenticated, hasAnyRole } = useAuth();

	if (isLoadingProfile) {
		return <p>Checking your access rights...</p>;
	}

	if (oauth2Enabled && !isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (roles.length > 0 && !hasAnyRole(roles)) {
		return <Navigate to="/" replace />;
	}

	return children;
}

export default RequireRole;
