import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import SetPassword from "@/pages/set-password";
import ForgotPassword from "@/pages/forgot-password";
import PasswordReset from "@/pages/password-reset";
import LocalAdmin from "@/pages/local-admin";
import About from "@/pages/about";
import Initiative from "@/pages/initiative";
import Departments from "@/pages/departments";
import Join from "@/pages/join";
import Events from "@/pages/events";
import Workshops from "@/pages/workshops";
import NewsList from "@/pages/news/index";
import NewsDetail from "@/pages/news/id";
import Board from "@/pages/board";
import Gallery from "@/pages/gallery";
import Partners from "@/pages/partners";
import Contact from "@/pages/contact";
import CertificateVerify from "@/pages/certificate/verify";

import PortalIndex from "@/pages/portal/index";
import PortalProfile from "@/pages/portal/profile";
import PortalCertificates from "@/pages/portal/certificates";
import PortalVolunteerHours from "@/pages/portal/volunteer-hours";

import AdminIndex from "@/pages/admin/index";
import AdminMembers from "@/pages/admin/members/index";
import AdminMemberDetail from "@/pages/admin/members/id";
import AdminJoinRequests from "@/pages/admin/join-requests/index";
import AdminDepartments from "@/pages/admin/departments/index";
import AdminEvents from "@/pages/admin/events/index";
import AdminWorkshops from "@/pages/admin/workshops/index";
import AdminCertificates from "@/pages/admin/certificates/index";
import AdminVolunteerHours from "@/pages/admin/volunteer-hours/index";
import AdminMeetings from "@/pages/admin/meetings/index";
import AdminTasks from "@/pages/admin/tasks/index";
import AdminNews from "@/pages/admin/news/index";
import AdminPartners from "@/pages/admin/partners/index";
import AdminGallery from "@/pages/admin/gallery/index";
import AdminUsers from "@/pages/admin/users/index";
import AdminReports from "@/pages/admin/reports/index";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/set-password" component={SetPassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={PasswordReset} />
      {import.meta.env.DEV && <Route path="/local-admin" component={LocalAdmin} />}
      <Route path="/about" component={About} />
      <Route path="/initiative" component={Initiative} />
      <Route path="/departments" component={Departments} />
      <Route path="/join" component={Join} />
      <Route path="/events" component={Events} />
      <Route path="/workshops" component={Workshops} />
      <Route path="/news" component={NewsList} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/board" component={Board} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/partners" component={Partners} />
      <Route path="/contact" component={Contact} />
      <Route path="/certificate/verify/:code" component={CertificateVerify} />
      <Route path="/certificate/verify" component={CertificateVerify} />
      
      <Route path="/portal" component={PortalIndex} />
      <Route path="/portal/profile" component={PortalProfile} />
      <Route path="/portal/certificates" component={PortalCertificates} />
      <Route path="/portal/volunteer-hours" component={PortalVolunteerHours} />
      
      <Route path="/admin" component={AdminIndex} />
      <Route path="/admin/members" component={AdminMembers} />
      <Route path="/admin/members/:id" component={AdminMemberDetail} />
      <Route path="/admin/join-requests" component={AdminJoinRequests} />
      <Route path="/admin/departments" component={AdminDepartments} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/workshops" component={AdminWorkshops} />
      <Route path="/admin/certificates" component={AdminCertificates} />
      <Route path="/admin/volunteer-hours" component={AdminVolunteerHours} />
      <Route path="/admin/meetings" component={AdminMeetings} />
      <Route path="/admin/tasks" component={AdminTasks} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/gallery" component={AdminGallery} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/reports" component={AdminReports} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
