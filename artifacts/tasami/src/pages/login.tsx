import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import logoUrl from "@assets/image_1782739252068.png";
import { useLanguage } from "@/hooks/use-language";
import { LogIn, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: authenticate } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          authenticate(data.token, data.user);
          const isAdmin = ["super_admin", "president", "vice_president", "secretary", "dept_head", "join_manager"].includes(data.user.role || "");
          setLocation(
            data.user.role === "join_manager"
              ? "/admin/join-requests"
              : isAdmin
                ? "/admin"
                : "/portal",
          );
        },
        onError: (error) => {
          setError(
            error instanceof Error && error.message.includes("ACCOUNT_PENDING_APPROVAL")
              ? t("طلبك قيد المراجعة، ستتمكن من الدخول بعد موافقة الإدارة.")
              : t("بيانات الدخول غير صحيحة"),
          );
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative" dir={direction}>
      <Button variant="outline" size="sm" className="absolute top-4 right-4 rtl:right-auto rtl:left-4" onClick={toggleLanguage}>
        {isEnglish ? "العربية" : "English"}
      </Button>
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-3 items-center text-center pb-2">
          <Link href="/">
            <img src={logoUrl} alt="تسامي" className="h-16 object-contain mx-auto" />
          </Link>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">{t("تسجيل الدخول")}</CardTitle>
            <CardDescription className="text-sm">
              {t("أدخل البريد الإلكتروني وكلمة المرور للوصول لحسابك")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("البريد الإلكتروني")}</Label>
              <div className="relative">
                <Mail className="absolute right-3 rtl:right-auto rtl:left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left px-10 rtl:pr-10 rtl:pl-3"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("كلمة المرور")}</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  {t("نسيت كلمة المرور؟")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 rtl:right-auto rtl:left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left px-10 rtl:pr-10 rtl:pl-3"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gap-2" disabled={loginMutation.isPending}>
              <LogIn className="h-4 w-4" />
              {loginMutation.isPending ? t("جاري الدخول...") : t("دخول")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <Button variant="link" asChild className="text-muted-foreground gap-1 text-sm">
            <Link href="/">
              {isEnglish ? <ArrowLeft className="h-3.5 w-3.5 mr-1" /> : <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              {t("العودة للرئيسية")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}