
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Public Pages
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import PortalPage from "@/pages/portal";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin";
import MembersPage from "@/pages/admin/members";
import MemberDetailPage from "@/pages/admin/members/id";
import JoinRequestsPage from "@/pages/admin/join-requests/JoinRequestsPage";
import EventsPage from "@/pages/admin/events";
import WorkshopsPage from "@/pages/admin/workshops";
import CertificatesPage from "@/pages/admin/certificates";
import DepartmentsPage from "@/pages/admin/departments";
import MeetingsPage from "@/pages/admin/meetings";
import TasksPage from "@/pages/admin/tasks";
import NewsPage from "@/pages/admin/news";
import PartnersPage from "@/pages/admin/partners";
import GalleryPage from "@/pages/admin/gallery";
import UsersPage from "@/pages/admin/users";
import ReportsPage from "@/pages/admin/reports";
import VolunteerHoursPage from "@/pages/admin/volunteer-hours";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/portal" component={PortalPage} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/members" component={MembersPage} />
      <Route path="/admin/members/:id" component={MemberDetailPage} />
      <Route path="/admin/join-requests" component={JoinRequestsPage} />
      <Route path="/admin/events" component={EventsPage} />
      <Route path="/admin/workshops" component={WorkshopsPage} />
      <Route path="/admin/certificates" component={CertificatesPage} />
      <Route path="/admin/departments" component={DepartmentsPage} />
      <Route path="/admin/meetings" component={MeetingsPage} />
      <Route path="/admin/tasks" component={TasksPage} />
      <Route path="/admin/news" component={NewsPage} />
      <Route path="/admin/partners" component={PartnersPage} />
      <Route path="/admin/gallery" component={GalleryPage} />
      <Route path="/admin/users" component={UsersPage} />
      <Route path="/admin/reports" component={ReportsPage} />
      <Route path="/admin/volunteer-hours" component={VolunteerHoursPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}
