import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ROLE_HOME } from "../config/roles";
export default function RoleHome(){ const {user}=useAuth(); return <Navigate to={user?ROLE_HOME[user.role]:"/login"} replace/>; }
