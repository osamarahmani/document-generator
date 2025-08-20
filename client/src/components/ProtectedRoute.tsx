import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [, setLocation] = useLocation();
  const token = sessionStorage.getItem("token"); // use sessionStorage

  if (!token) {
    setLocation("/login"); // redirect to login
    return null; // don't render protected content
  }

  return children;
};
