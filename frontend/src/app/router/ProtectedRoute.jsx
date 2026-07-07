import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
export default function ProtectedRoute({allowedRoles,children}){ const {user}=useAuth(); if(!user)return <Navigate to="/login" replace/>; if(allowedRoles&&!allowedRoles.includes(user.role))return <Navigate to="/home" replace/>; return children; }
