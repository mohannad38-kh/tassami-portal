import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
import logoUrl from "@assets/image_1782739252068.png";
import { KeyRound, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SetPassword() {
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error || t("تعذر إنشاء كلمة المرور. اطلب رابطاً جديداً من إدارة المبادرة."),
        );
      }
      setComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("تعذر إنشاء كلمة المرور. اطلب رابطاً جديداً من إدارة المبادرة."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative" dir={direction}>
      <Button variant="outline" size="sm" className="absolute top-4 right-4 rtl:right-auto rtl:left-4" onClick={toggleLanguage}>
        {isEnglish ? "العربية" : "English"}
      </Button>
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-4 items-center text-center pb-2">
          <Link href="/">
            <img src={logoUrl} alt="تسامي" className="h-16 object-contain mx-auto" />
          </Link>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">
              {complete ? t("تم إنشاء كلمة المرور") : t("إنشاء كلمة مرور حسابك")}
            </CardTitle>
            <CardDescription className="text-sm">
              {complete
                ? t("أصبح بإمكانك تسجيل الدخول إلى بوابة المتطوعين.")
                : t("اختر كلمة مرور لا تقل عن 12 حرفاً للدخول إلى بوابة المتطوعين.")}
            </CardDescription>
          </div>
        </CardHeader>
        {!complete ? (
          <CardContent className="pt-4">
            {!token ? (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-center space-y-2">
                <AlertTriangle className="h-8 w-8 mx-auto" />
                <p className="text-sm font-medium">
                  {t("رابط إنشاء كلمة المرور غير صالح. اطلب رابطاً جديداً من إدارة المبادرة.")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("كلمة المرور")}</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 rtl:right-auto rtl:left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      dir="ltr"
                      className="text-left px-10 rtl:pr-10 rtl:pl-3"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("تأكيد كلمة المرور")}</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 rtl:right-auto rtl:left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      dir="ltr"
                      className="text-left px-10 rtl:pr-10 rtl:pl-3"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 gap-2" disabled={isSubmitting}>
                  <KeyRound className="h-4 w-4" />
                  {isSubmitting ? t("جاري حفظ كلمة المرور...") : t("حفظ كلمة المرور")}
                </Button>
              </form>
            )}
          </CardContent>
        ) : (
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("تم إعداد كلمة المرور الخاصة بحسابك بنجاح. يمكنك الآن الانتقال لتسجيل الدخول.")}
            </p>
          </CardContent>
        )}
        {complete && (
          <CardFooter className="flex justify-center border-t p-4">
            <Button asChild className="w-full h-11">
              <Link href="/login">{t("تسجيل الدخول")}</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}