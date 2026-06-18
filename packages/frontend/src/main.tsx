import './index.css';
import './i18n/index.js';
import { StrictMode } from 'react';
/**
 * Application bootstrap entry point. Mounts the React root with Mantine theming,
 * global toast notifications, React Query provider, client-side routing, and the
 * global app shell layout.
 */

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
  ColorSchemeScript,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from './hooks/useAuth.js';
import { Dashboard } from './pages/Dashboard.js';
import { ContractList } from './pages/ContractList.js';
import { ContractNew } from './pages/ContractNew.js';
import { ContractEdit } from './pages/ContractEdit.js';
import { ContractImport } from './pages/ContractImport.js';
import { AuthPage } from './pages/AuthPage.js';
import { AcceptInvitation } from './pages/AcceptInvitation.js';
import { EmailVerifyConfirm } from './pages/EmailVerifyConfirm.js';
import { ResetPassword } from './pages/ResetPassword.js';
import { AccountSettings } from './pages/AccountSettings.js';
import { Faq } from './pages/Faq.js';
import { AccountsAdmin } from './pages/admin/AccountsAdmin.js';
import { AppShell } from './components/AppShell/AppShell.js';
import { PublicLayout } from './components/PublicLayout.js';
import { RequireAdmin } from './components/RequireAdmin.js';

/**
 * Passes the active i18next language to Mantine's DatesProvider so the calendar
 * popover shows localised month and weekday names.
 */
function LocalizedDatesProvider({ children }: { readonly children: React.ReactNode }) {
  const { i18n } = useTranslation();
  return <DatesProvider settings={{ locale: i18n.language }}>{children}</DatesProvider>;
}

/** Routes accessible without a session; all other routes redirect to sign-in. */
const PUBLIC_PATHS = ['/faq'];

/**
 * Wraps the entire app route tree in the appropriate shell based on auth state.
 * Authenticated users always see a single AppShell instance (sidebar stays mounted
 * across navigations). Unauthenticated users see PublicLayout for designated public
 * paths and are redirected to sign-in for everything else.
 */
function AuthenticatedShell({ children }: { readonly children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    if (PUBLIC_PATHS.some((p) => location.pathname.startsWith(p))) {
      return <PublicLayout>{children}</PublicLayout>;
    }
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return <AppShell>{children}</AppShell>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const theme = createTheme({ primaryColor: 'teal' });
const colorSchemeManager = localStorageColorSchemeManager({ key: 'pcm-color-scheme' });

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      <Notifications position="top-right" />
      <LocalizedDatesProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/sign-in" element={<AuthPage initialView="sign-in" />} />
              <Route path="/invitations/:token" element={<AcceptInvitation />} />
              <Route path="/email-change/confirm/:token" element={<EmailVerifyConfirm />} />
              <Route path="/forgot-password" element={<AuthPage initialView="forgot-password" />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route
                path="*"
                element={
                  <AuthenticatedShell>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/contracts" element={<ContractList />} />
                      <Route path="/contracts/new" element={<ContractNew />} />
                      <Route path="/contracts/import" element={<ContractImport />} />
                      <Route path="/contracts/:id/edit" element={<ContractEdit />} />
                      <Route path="/account" element={<AccountSettings />} />
                      <Route path="/faq" element={<Faq />} />
                      <Route
                        path="/admin/accounts"
                        element={
                          <RequireAdmin>
                            <AccountsAdmin />
                          </RequireAdmin>
                        }
                      />
                    </Routes>
                  </AuthenticatedShell>
                }
              />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </LocalizedDatesProvider>
    </MantineProvider>
  </StrictMode>,
);
