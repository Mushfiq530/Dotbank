import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import LandingPage from "../pages/auth/LandingPage";
import RegisterRoleSelect from "../pages/auth/RegisterRoleSelect";
import RegisterFormPage from "../pages/auth/RegisterFormPage";
import LoginRoleSelect from "../pages/auth/LoginRoleSelect";
import LoginFormPage from "../pages/auth/LoginFormPage";

// User
import OpenAccountPage from "../pages/user/OpenAccountPage";
import DashboardPage from "../pages/user/DashboardPage";
import WithdrawPage from "../pages/user/WithdrawPage";
import PayBillPage from "../pages/user/PayBillPage";
import LoanRequestPage from "../pages/user/LoanRequestPage";
import MiniStatementPage from "../pages/user/MiniStatementPage";
import ProfilePage from "../pages/user/ProfilePage";
import SecurityPage from "../pages/user/SecurityPage";
import WalletPage from "../pages/user/WalletPage";
import NotificationsPage from "../pages/user/NotificationsPage";

// Officer
import OfficerDashboardPage from "../pages/officer/OfficerDashboardPage";
import OfficerAccountsPage from "../pages/officer/OfficerAccountsPage";
import OfficerAccountRequestsPage from "../pages/officer/OfficerAccountRequestsPage";
import OfficerLoanRequestsPage from "../pages/officer/OfficerLoanRequestsPage";
import OfficerDepositRequestsPage from "../pages/officer/OfficerDepositRequestsPage";
import OfficerLargeTransactionsPage from "../pages/officer/OfficerLargeTransactionsPage";
import OfficerStatementViewerPage from "../pages/officer/OfficerStatementViewerPage";
import OfficerUserLogsPage from "../pages/officer/OfficerUserLogsPage";
import OfficerProfilePage from "../pages/officer/OfficerProfilePage";
import OfficerAlertsPage from "../pages/officer/OfficerAlertsPage";
import OfficerSupportPage from "../pages/officer/OfficerSupportPage";
import SupportPage from "../pages/user/SupportPage";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminAddOfficerPage from "../pages/admin/AdminAddOfficerPage";
import AdminManageOfficersPage from "../pages/admin/AdminManageOfficersPage";
import AdminManageUsersPage from "../pages/admin/AdminManageUsersPage";
import AdminManageAccountsPage from "../pages/admin/AdminManageAccountsPage";
import AdminLogsPage from "../pages/officer/AdminLogsPage";
import AdminStatementViewerPage from "../pages/admin/AdminStatementViewerPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth flow */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterRoleSelect />} />
      <Route path="/register/form" element={<RegisterFormPage />} />
      <Route path="/login" element={<LoginRoleSelect />} />
      <Route path="/login/form" element={<LoginFormPage />} />

      {/* User */}
      <Route path="/user/open-account" element={<OpenAccountPage />} />
      <Route path="/user/dashboard" element={<DashboardPage />} />
      <Route path="/user/withdraw" element={<WithdrawPage />} />
      <Route path="/user/pay-bill" element={<PayBillPage />} />
      <Route path="/user/loan" element={<LoanRequestPage />} />
      <Route path="/user/statement" element={<MiniStatementPage />} />
      <Route path="/user/profile" element={<ProfilePage />} />
      <Route path="/user/security" element={<SecurityPage />} />
      <Route path="/user/support" element={<SupportPage />} />
      <Route path="/user/wallet" element={<WalletPage />} />
      <Route path="/user/notifications" element={<NotificationsPage />} />

      {/* Officer */}
      <Route path="/officer/dashboard" element={<OfficerDashboardPage />} />
      <Route path="/officer/accounts" element={<OfficerAccountsPage />} />
      <Route path="/officer/account-requests" element={<OfficerAccountRequestsPage />} />
      <Route path="/officer/loan-requests" element={<OfficerLoanRequestsPage />} />
      <Route path="/officer/deposit-requests" element={<OfficerDepositRequestsPage />} />
      <Route path="/officer/large-transactions" element={<OfficerLargeTransactionsPage />} />
      <Route path="/officer/statement-viewer" element={<OfficerStatementViewerPage />} />
      <Route path="/officer/user-logs" element={<OfficerUserLogsPage />} />
      <Route path="/officer/profile" element={<OfficerProfilePage />} />
      <Route path="/officer/alerts" element={<OfficerAlertsPage />} />
      <Route path="/officer/support" element={<OfficerSupportPage />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/add-officer" element={<AdminAddOfficerPage />} />
      <Route path="/admin/manage-officers" element={<AdminManageOfficersPage />} />
      <Route path="/admin/manage-users" element={<AdminManageUsersPage />} />
      <Route path="/admin/manage-accounts" element={<AdminManageAccountsPage />} />
      <Route path="/admin/deposit-requests" element={<OfficerDepositRequestsPage />} />
      <Route path="/admin/large-transactions" element={<OfficerLargeTransactionsPage />} />
      <Route path="/admin/logs" element={<AdminLogsPage />} />
      <Route path="/admin/alerts" element={<OfficerAlertsPage />} />
      <Route path="/admin/support" element={<OfficerSupportPage />} />
      <Route path="/admin/statement-viewer" element={<AdminStatementViewerPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}