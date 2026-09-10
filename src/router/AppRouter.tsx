import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary';
import PageSkeleton from '../components/PageSkeleton/PageSkeleton';

/* ── Lazy-loaded routes (each becomes its own JS chunk) ── */
const LandingPage          = lazy(() => import('../pages/landing/pages/LandingPage'));
const DashboardPage        = lazy(() => import('../pages/dashboard/pages/DashboardPage'));
const AuthPage             = lazy(() => import('../pages/auth/pages/AuthPage'));
const TypingPage           = lazy(() => import('../pages/typing/pages/TypingPage'));
const ResultsPage          = lazy(() => import('../pages/results/pages/ResultsPage'));
const MultiplayerPage      = lazy(() => import('../pages/multiplayer/pages/MultiplayerPage'));
const FindMatchPage        = lazy(() => import('../pages/multiplayer/pages/FindMatchPage'));
const CreateRoomPage       = lazy(() => import('../pages/multiplayer/pages/CreateRoomPage'));
const JoinRoomPage         = lazy(() => import('../pages/multiplayer/pages/JoinRoomPage'));
const MultiplayerMatchPage = lazy(() => import('../pages/multiplayer/pages/MultiplayerMatchPage'));
const LeaderboardPage      = lazy(() => import('../pages/leaderboard/pages/LeaderboardPage'));
const ProfilePage          = lazy(() => import('../pages/profile/pages/ProfilePage'));

/** Wraps each lazy page with its own Suspense + ErrorBoundary so one
 *  crashing route never takes down the rest of the app. */
function RouteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary inline={false}>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing — first page visitors see */}
      <Route path="/"            element={<RouteWrapper><LandingPage /></RouteWrapper>} />

      {/* Auth */}
      <Route path="/auth/login"        element={<RouteWrapper><AuthPage /></RouteWrapper>} />
      <Route path="/auth/register"     element={<RouteWrapper><AuthPage /></RouteWrapper>} />
      <Route path="/auth"              element={<Navigate to="/auth/login" replace />} />

      {/* App */}
      <Route path="/home"               element={<RouteWrapper><DashboardPage /></RouteWrapper>} />
      <Route path="/solo"               element={<RouteWrapper><TypingPage /></RouteWrapper>} />
      <Route path="/results"            element={<RouteWrapper><ResultsPage /></RouteWrapper>} />
      <Route path="/multiplayer"        element={<RouteWrapper><MultiplayerPage /></RouteWrapper>} />
      <Route path="/multiplayer/findmatch"   element={<RouteWrapper><FindMatchPage /></RouteWrapper>} />
      <Route path="/multiplayer/createroom" element={<RouteWrapper><CreateRoomPage /></RouteWrapper>} />
      <Route path="/multiplayer/joinroom"   element={<RouteWrapper><JoinRoomPage /></RouteWrapper>} />
      <Route path="/multiplayer/findmatch/:roomCode"    element={<RouteWrapper><MultiplayerMatchPage /></RouteWrapper>} />
      <Route path="/multiplayer/createroom/:roomCode"    element={<RouteWrapper><MultiplayerMatchPage /></RouteWrapper>} />
      <Route path="/multiplayer/joinroom/:roomCode"    element={<RouteWrapper><MultiplayerMatchPage /></RouteWrapper>} />
      <Route path="/leaderboard"        element={<RouteWrapper><LeaderboardPage /></RouteWrapper>} />
      <Route path="/profile"            element={<RouteWrapper><ProfilePage /></RouteWrapper>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
