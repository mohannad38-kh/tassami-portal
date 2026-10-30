import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Public Pages
import HomePage from "@/pages/home";
import AboutPage from "@/pages/about";
import InitiativePage from "@/pages/initiative";
import DepartmentsPage from "@/pages/departments";
import EventsPage from "@/pages/events";
import GalleryPage from "@/pages/gallery";
import PartnersPage from "@/pages/partners";
import BoardPage from "@/pages/board";
import ContactPage from "@/pages/contact";
import LoginPage from "@/pages/login";
import JoinPage from "@/pages/join";
import PortalPage from "@/pages/portal";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin";
import MembersPage from "@/pages/admin/members";
import MemberDetailPage from "@/pages/admin/members/id";
import JoinRequestsPage from "@/pages/admin/join-requests/JoinRequestsPage";
import AdminEventsPage from "@/pages/admin/events";
import WorkshopsPage from "@/pages/admin/workshops";
import CertificatesPage from "@/pages/admin/certificates";
import AdminDepartmentsPage from "@/pages/admin/departments";
import MeetingsPage from "@/pages/admin/meetings";
import TasksPage from "@/pages/admin/tasks";
import AdminNewsPage from "@/pages/admin/news";
import AdminPartnersPage from "@/pages/admin/partners";
import AdminGalleryPage from "@/pages/admin/gallery";
import UsersPage from "@/pages/admin/users";
import ReportsPage from "@/pages/admin/reports";
import VolunteerHoursPage from "@/pages/admin/volunteer-hours";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/initiative" component={InitiativePage} />
      <Route path="/departments" component={DepartmentsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/board" component={BoardPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/join" component={JoinPage} />
      <Route path="/portal" component={PortalPage} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/members" component={MembersPage} />
      <Route path="/admin/members/:id" component={MemberDetailPage} />
      <Route path="/admin/join-requests" component={JoinRequestsPage} />
      <Route path="/admin/events" component={AdminEventsPage} />
      <Route path="/admin/workshops" component={WorkshopsPage} />
      <Route path="/admin/certificates" component={CertificatesPage} />
      <Route path="/admin/departments" component={AdminDepartmentsPage} />
      <Route path="/admin/meetings" component={MeetingsPage} />
      <Route path="/admin/tasks" component={TasksPage} />
      <Route path="/admin/news" component={AdminNewsPage} />
      <Route path="/admin/partners" component={AdminPartnersPage} />
      <Route path="/admin/gallery" component={AdminGalleryPage} />
      <Route path="/admin/users" component={UsersPage} />
      <Route path="/admin/reports" component={ReportsPage} />
      <Route path="/admin/volunteer-hours" component={VolunteerHoursPage} />

      {/* 404 */}
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
