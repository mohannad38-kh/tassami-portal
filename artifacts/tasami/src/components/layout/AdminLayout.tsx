import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@assets/image_1782739252068.png";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  LayoutGrid, 
  Calendar, 
  GraduationCap, 
  Award, 
  Clock, 
  Video, 
  CheckSquare, 
  Newspaper, 
  Handshake, 
  Image as ImageIcon, 
  Settings, 
  BarChart3,
  LogOut,
  Menu,
  ChevronDown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Check minimum role
  const isAdmin = ["super_admin", "president", "vice_president", "secretary", "dept_head"].includes(user?.role || "");
  if (!isAdmin) {
    setLocation("/portal");
    return null;
  }

  const sections = [
    {
      title: "الرئيسية",
      items: [
        { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
        { href: "/admin/reports", label: "التقارير", icon: BarChart3 },
      ]
    },
    {
      title: "الأعضاء",
      items: [
        { href: "/admin/members", label: "إدارة الأعضاء", icon: Users },
        { href: "/admin/join-requests", label: "طلبات الانضمام", icon: UserPlus },
        { href: "/admin/volunteer-hours", label: "ساعات التطوع", icon: Clock },
      ]
    },
    {
      title: "الفعاليات والبرامج",
      items: [
        { href: "/admin/events", label: "إدارة الفعاليات", icon: Calendar },
        { href: "/admin/workshops", label: "إدارة الورش", icon: GraduationCap },
        { href: "/admin/certificates", label: "الشهادات", icon: Award },
      ]
    },
    {
      title: "الإدارة",
      items: [
        { href: "/admin/departments", label: "إدارة الأقسام", icon: LayoutGrid },
        { href: "/admin/meetings", label: "الاجتماعات", icon: Video },
        { href: "/admin/tasks", label: "المهام", icon: CheckSquare },
      ]
    },
    {
      title: "المحتوى",
      items: [
        { href: "/admin/news", label: "الأخبار والإعلانات", icon: Newspaper },
        { href: "/admin/partners", label: "الشركاء", icon: Handshake },
        { href: "/admin/gallery", label: "معرض الصور", icon: ImageIcon },
      ]
    },
  ];

  if (user?.role === "super_admin") {
    sections.push({
      title: "النظام",
      items: [
        { href: "/admin/users", label: "إدارة المستخدمين", icon: Settings },
      ]
    });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border/50 flex justify-center bg-sidebar">
        <Link href="/">
          <img src={logoUrl} alt="تسامي" className="h-12 object-contain brightness-0 invert" />
        </Link>
      </div>
      <div className="p-4 border-b border-sidebar-border/50 bg-sidebar-accent/10">
        <p className="font-medium truncate">{user?.name}</p>
        <p className="text-sm text-sidebar-accent-foreground font-medium truncate">
          {user?.role === 'super_admin' ? 'مدير النظام' :
           user?.role === 'president' ? 'رئيس المبادرة' :
           user?.role === 'vice_president' ? 'نائب الرئيس' :
           user?.role === 'secretary' ? 'الأمين العام' :
           user?.role === 'dept_head' ? 'رئيس قسم' : 'إداري'}
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6 px-3">
            <h4 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-md transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                    }`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => {
            logout();
            setLocation("/login");
          }}
        >
          <LogOut className="h-5 w-5 ml-2 rtl:ml-2 rtl:mr-0" />
          تسجيل خروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 right-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-64 border-l-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-primary mr-2">الإدارة</span>
          </div>
          
          <div className="hidden md:flex items-center font-medium text-lg text-foreground/80">
            لوحة تحكم المشرفين
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">عرض الموقع</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
