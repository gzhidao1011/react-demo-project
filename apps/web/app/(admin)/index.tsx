import { Navigate } from "react-router";

/**
 * /admin 重定向到 /admin/users
 */
export default function AdminIndex() {
  return <Navigate to="/admin/users" replace />;
}
