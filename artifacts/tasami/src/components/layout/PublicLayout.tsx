import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import logoUrl from "@assets/image_1782739252068.png";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, Instagram } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  const navItems = [
    { href: "/", label: t("الرئيسية") },
    { href: "/about", label: t("من نحن") },
    { href: "/initiative", label: t("المبادرة") },
    { href: "/departments", label: t("الأقسام") },
    { href: "/events", label: t("الفعاليات") },
    { href: "/news", label: t("الأخبار") },
    { href: "/gallery", label: t("معرض الصور") },
    { href: "/partners", label: t("شركاء النجاح") },
    { href: "/board", label: t("مجلس الإدارة") },
    { href: "/contact", label: t("تواصل معنا") },
  ];

  const handleDashboardRedirect = () => {
    const isAdmin = ["super_admin", "president", "vice_president", "secretary", "dept_head", "join_manager"].includes(
      user?.role || ""
    );
    setLocation(isAdmin ? "/admin" : "/portal");
  };

  const accountAction = isAuthenticated ? (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={handleDashboardRedirect}>
        {t("لوحة التحكم")}
      </Button>
      <Button variant="outline" onClick={logout}>
        {t("تسجيل خروج")}
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">{t("تسجيل الدخول")}</Link>
      </Button>
      <Button asChild>
        <Link href="/join">{t("انضم إلينا")}</Link>
      </Button>
    </div>
  );

  const mobileMenu = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("فتح القائمة")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isEnglish ? "left" : "right"} className="flex w-[min(20rem,85vw)] flex-col overflow-y-auto">
        <SheetTitle className="mb-3 pe-8 text-start">{t("القائمة")}</SheetTitle>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link href={item.href} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted hover:text-primary">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          {import.meta.env.DEV && (
            <SheetClose asChild>
              <Link href="/local-admin" className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted hover:text-primary">
                {t("إدارة الموقع")}
              </Link>
            </SheetClose>
          )}
          {!isAuthenticated ? (
            <>
              <SheetClose asChild>
                <Link href="/login" className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted hover:text-primary">
                  {t("تسجيل الدخول")}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/join" className="rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground">
                  {t("انضم إلينا")}
                </Link>
              </SheetClose>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <button
                  type="button"
                  className="rounded-md px-3 py-2.5 text-start text-sm font-medium hover:bg-muted hover:text-primary"
                  onClick={handleDashboardRedirect}
                >
                  {t("لوحة التحكم")}
                </button>
              </SheetClose>
              <SheetClose asChild>
                <button
                  type="button"
                  className="rounded-md px-3 py-2.5 text-start text-sm font-medium hover:bg-muted hover:text-primary"
                  onClick={logout}
                >
                  {t("تسجيل خروج")}
                </button>
              </SheetClose>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={direction}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex max-w-screen-2xl flex-col px-4 md:px-8">
          <div className="flex h-16 w-full items-center justify-between gap-3">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              {direction === "rtl" && <div className="xl:hidden">{mobileMenu}</div>}
              <Link href="/" className="flex min-w-0 shrink-0 items-center">
                <img src={logoUrl} alt="Tasami" className="h-11 max-w-[150px] object-contain" />
              </Link>
              {direction === "ltr" && <div className="xl:hidden">{mobileMenu}</div>}
            </div>

            <div className="hidden items-center gap-2 xl:flex">
              <Button variant="outline" size="sm" onClick={toggleLanguage} aria-label={isEnglish ? "Switch to Arabic" : "Switch to English"}>
                {isEnglish ? "العربية" : "English"}
              </Button>
              {import.meta.env.DEV && (
                <Button variant="outline" asChild>
                  <Link href="/local-admin">{t("إدارة الموقع")}</Link>
                </Button>
              )}
              {accountAction}
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <Button variant="outline" size="sm" onClick={toggleLanguage} aria-label={isEnglish ? "Switch to Arabic" : "Switch to English"}>
                {isEnglish ? "العربية" : "English"}
              </Button>
            </div>
          </div>

          <nav className="hidden w-full flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border/60 py-2.5 text-sm font-medium xl:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap py-1 text-foreground transition-colors hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40 py-12">
        <div className="container px-4 md:px-8 mx-auto max-w-screen-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <img src={logoUrl} alt="Tasami" className="h-16 object-contain" />
              <p className="text-sm text-muted-foreground max-w-xs">
                {isEnglish
                  ? "The Tasami Volunteer Initiative empowers youth and promotes organized, effective volunteering."
                  : "مبادرة تسامي التطوعية تهدف إلى تمكين الشباب وتعزيز العمل التطوعي المنظم والفعال."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">{isEnglish ? "Quick Links" : "روابط سريعة"}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary">{t("من نحن")}</Link></li>
                <li><Link href="/board" className="text-muted-foreground hover:text-primary">{t("مجلس الإدارة")}</Link></li>
                <li><Link href="/gallery" className="text-muted-foreground hover:text-primary">{t("معرض الصور")}</Link></li>
                <li><Link href="/partners" className="text-muted-foreground hover:text-primary">{t("شركاء النجاح")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">{t("تواصل معنا")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{isEnglish ? "Email" : "البريد"}: tasamiteamx@gmail.com</li>
                <li>
                  <a href="https://wa.me/962781386264" dir="ltr" className="inline-flex items-center gap-2 hover:text-primary">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    0781386264
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/tasami.jo/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" aria-hidden="true" />
                    Instagram: tasami.jo
                  </a>
                </li>
                <li>Facebook: {isEnglish ? "Tasami Initiative" : "مبادرة تسامي"}</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>{t("جميع الحقوق محفوظة لمبادرة تسامي ©")} {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}