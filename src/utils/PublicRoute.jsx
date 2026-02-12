import { Navigate, useLocation } from "react-router-dom";

const PublicRoute = ({ children, isAuthenticated }) => {
    const location = useLocation();

    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default PublicRoute;