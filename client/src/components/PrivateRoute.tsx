import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [, setLocation] = useLocation();
  const token = sessionStorage.getItem("token");

  if (!token) {
    setLocation("/login");
    return null;
  }

  return children;
};
