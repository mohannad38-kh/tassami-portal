import { ReactNode } from "react";
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
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/use-language";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // التحقق من الصلاحيات الأدنى للمستخدم
  const isJoinManager = user?.role === "join_manager";
  const isAdmin = isJoinManager || [
    "super_admin", 
    "president", 
    "vice_president", 
    "secretary", 
    "dept_head"
  ].includes(user?.role || "");

  if (!isAdmin) {
    setLocation("/portal");
    return null;
  }

  const sections = isJoinManager
    ? [
        {
          title: t("إدارة الطلبات"),
          items: [
            { href: "/admin/join-requests", label: t("طلبات الانضمام"), icon: UserPlus },
          ],
        },
      ]
    : [
        {
          title: t("الرئيسية"),
          items: [
            { href: "/admin", label: t("لوحة التحكم"), icon: LayoutDashboard },
            { href: "/admin/reports", label: t("التقارير"), icon: BarChart3 },
          ],
        },
        {
          title: t("الأعضاء"),
          items: [
            { href: "/admin/members", label: t("إدارة الأعضاء"), icon: Users },
            { href: "/admin/join-requests", label: t("طلبات الانضمام"), icon: UserPlus },
            { href: "/admin/volunteer-hours", label: t("ساعات التطوع"), icon: Clock },
          ],
        },
        {
          title: t("الفعاليات والبرامج"),
          items: [
            { href: "/admin/events", label: t("إدارة الفعاليات"), icon: Calendar },
            { href: "/admin/workshops", label: t("إدارة الورش"), icon: GraduationCap },
            { href: "/admin/certificates", label: t("الشهادات"), icon: Award },
          ],
        },
        {
          title: t("الإدارة"),
          items: [
            { href: "/admin/departments", label: t("إدارة الأقسام"), icon: LayoutGrid },
            { href: "/admin/meetings", label: t("الاجتماعات"), icon: Video },
            { href: "/admin/tasks", label: t("المهام"), icon: CheckSquare },
          ],
        },
        {
          title: t("المحتوى"),
          items: [
            { href: "/admin/news", label: t("الأخبار والإعلانات"), icon: Newspaper },
            { href: "/admin/partners", label: t("الشركاء"), icon: Handshake },
            { href: "/admin/gallery", label: t("معرض الصور"), icon: ImageIcon },
          ],
        },
      ];

  if (user?.role === "super_admin") {
    sections.push({
      title: t("النظام"),
      items: [
        { href: "/admin/users", label: t("إدارة المستخدمين"), icon: Settings },
      ],
    });
  }

  const getRoleLabel = () => {
    switch (user?.role) {
      case "super_admin": return t("مدير النظام");
      case "president": return t("رئيس المبادرة");
      case "vice_president": return t("نائب الرئيس");
      case "secretary": return t("الأمين العام");
      case "dept_head": return t("رئيس قسم");
      case "join_manager": return t("مسؤول طلبات الانضمام");
      default: return t("إداري");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border/50 flex justify-center bg-sidebar">
        <Link href="/">
          <img src={logoUrl} alt="تسامي" className="h-12 object-contain brightness-0 invert" />
        </Link>
      </div>
      <div className="p-4 border-b border-sidebar-border/50 bg-sidebar-accent/10">
        <p className="font-semibold truncate text-sm">{user?.name}</p>
        <p className="text-xs text-sidebar-accent-foreground/80 font-medium truncate mt-0.5">
          {getRoleLabel()}
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
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm ${
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                    }`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
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
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            logout();
            setLocation("/login");
          }}
        >
          <LogOut className="h-4 w-4 me-2" />
          <span>{t("تسجيل خروج")}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row font-sans" dir={direction}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex w-64 flex-col fixed inset-y-0 ${isEnglish ? "left-0" : "right-0"} z-50 border-e`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${isEnglish ? "md:ml-64" : "md:mr-64"} flex flex-col min-h-screen transition-all`}>
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isEnglish ? "left" : "right"} className="p-0 w-64 border-none">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-primary ms-2">{isEnglish ? "Admin" : "الإدارة"}</span>
          </div>
          
          <div className="hidden md:flex items-center font-semibold text-base text-foreground/80">
            {isEnglish ? "Administration Dashboard" : "لوحة تحكم المشرفين"}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">{t("عرض الموقع")}</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {isEnglish ? "العربية" : "English"}
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