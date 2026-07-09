import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROLES } from "../config/roles";
import ProtectedRoute from "./ProtectedRoute";
import RoleHome from "./RoleHome";
import PortalLayout from "../../layouts/PortalLayout";

const LandingPage = lazy(() => import("../../domains/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("../../domains/auth/pages/LoginPage"));
const SignupPage = lazy(() => import("../../domains/auth/pages/SignupPage"));
const OAuthCallbackPage = lazy(() => import("../../domains/auth/pages/OAuthCallbackPage"));
const ManagerDashboardPage = lazy(() => import("../../domains/dashboard/pages/ManagerDashboardPage"));
const IntegrationPage = lazy(() => import("../../domains/integration/pages/IntegrationPage"));
const IntegrationMonitorPage = lazy(() => import("../../domains/integration/pages/IntegrationMonitorPage"));
const ExternalBenchmarkPage = lazy(() => import("../../domains/benchmark/pages/ExternalBenchmarkPage"));
const SocialDataPage = lazy(() => import("../../domains/social/pages/SocialDataPage"));
const GovernanceDataPage = lazy(() => import("../../domains/governance/pages/GovernanceDataPage"));
const MetricListPage = lazy(() => import("../../domains/metric/pages/MetricListPage"));
const MetricDetailPage = lazy(() => import("../../domains/metric/pages/MetricDetailPage"));
const PerformancePage = lazy(() => import("../../domains/metric/pages/PerformancePage"));
const DocumentAiPage = lazy(() => import("../../domains/document/pages/DocumentAiPage"));
const ApprovalListPage = lazy(() => import("../../domains/approval/pages/ApprovalListPage"));
const ApprovalDetailPage = lazy(() => import("../../domains/approval/pages/ApprovalDetailPage"));
const ReportBuilderPage = lazy(() => import("../../domains/report/pages/ReportBuilderPage"));
const PublicReportsPage = lazy(() => import("../../domains/report/pages/PublicReportsPage"));
const CompanyProfilePage = lazy(() => import("../../domains/company/pages/CompanyProfilePage"));
const PublicComparePage = lazy(() => import("../../domains/company/pages/PublicComparePage"));
const UserAdminPage = lazy(() => import("../../domains/admin/pages/UserAdminPage"));
const IndicatorAdminPage = lazy(() => import("../../domains/admin/pages/IndicatorAdminPage"));
const AuditLogPage = lazy(() => import("../../domains/admin/pages/AuditLogPage"));

const layout = (roles) => (
  <ProtectedRoute allowedRoles={roles}>
    <PortalLayout />
  </ProtectedRoute>
);

const guard = (roles, element) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

const fallback = <div className="route-loading">화면을 불러오는 중입니다.</div>;

export default function AppRouter() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/home" element={<RoleHome />} />

        <Route
          path="/manager"
          element={layout([ROLES.COMPANY_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.EXTERNAL_USER])}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="integrations" element={<IntegrationPage />} />
          <Route path="social" element={<SocialDataPage />} />
          <Route path="governance" element={<GovernanceDataPage />} />
          <Route path="benchmarks" element={<ExternalBenchmarkPage />} />
          <Route path="company" element={<CompanyProfilePage />} />

          <Route path="metrics" element={guard([ROLES.COMPANY_MANAGER], <MetricListPage />)} />
          <Route path="metrics/:metricId" element={guard([ROLES.COMPANY_MANAGER], <MetricDetailPage />)} />
          <Route path="documents" element={guard([ROLES.COMPANY_MANAGER], <DocumentAiPage />)} />
          <Route path="performance" element={guard([ROLES.COMPANY_MANAGER], <PerformancePage />)} />
          <Route path="reports" element={guard([ROLES.COMPANY_MANAGER], <ReportBuilderPage />)} />
        </Route>

        <Route path="/admin" element={layout([ROLES.SYSTEM_ADMIN])}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="approvals" element={<ApprovalListPage />} />
          <Route path="approvals/:metricId" element={<ApprovalDetailPage />} />
          <Route path="users" element={<UserAdminPage />} />
          <Route path="indicators" element={<IndicatorAdminPage />} />
          <Route path="integrations" element={<IntegrationMonitorPage />} />
          <Route path="audit" element={<AuditLogPage />} />
        </Route>

        <Route path="/public" element={layout([ROLES.EXTERNAL_USER])}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="compare" element={<PublicComparePage />} />
          <Route path="reports" element={<PublicReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
