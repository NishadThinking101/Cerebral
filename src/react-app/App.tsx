import { BrowserRouter as Router, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import StudioPage from "@/react-app/pages/Studio";
import ProjectPage from "@/react-app/pages/Project";
import MarketplacePage from "@/react-app/pages/Marketplace";
import ProfilePage from "@/react-app/pages/Profile";
import SuitesPage from "@/react-app/pages/Suites";
import SuitePage from "@/react-app/pages/Suite";
import LiveSessionsPage from "@/react-app/pages/LiveSessions";
import LiveSessionPage from "@/react-app/pages/LiveSession";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/suites" element={<SuitesPage />} />
            <Route path="/suite/:id" element={<SuitePage />} />
            <Route path="/live" element={<LiveSessionsPage />} />
            <Route path="/live/:id" element={<LiveSessionPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
