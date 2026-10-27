import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
import logoUrl from "@assets/image_1782739252068.png";

export default function PasswordReset() {
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
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        throw new Error(t("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً."));
      }
      setComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("تعذر تغيير كلمة المرور. اطلب رابطاً جديداً."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir={direction}>
      <Button variant="outline" size="sm" className="absolute top-4 right-4" onClick={toggleLanguage}>
        {isEnglish ? "العربية" : "English"}
      </Button>
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-4 items-center text-center">
          <Link href="/">
            <img src={logoUrl} alt="تسامي" className="h-20 object-contain mx-auto" />
          </Link>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {complete ? t("تم تغيير كلمة المرور") : t("تعيين كلمة مرور جديدة")}
            </CardTitle>
            <CardDescription>
              {complete
                ? t("يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.")
                : t("اختر كلمة مرور لا تقل عن 12 حرفاً. رابط الاستعادة صالح لمدة ساعة.")}
            </CardDescription>
          </div>
        </CardHeader>
        {!complete && (
          <CardContent>
            {!token ? (
              <p className="text-sm text-destructive">
                {t("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.")}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("كلمة المرور")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("تأكيد كلمة المرور")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("جارٍ تغيير كلمة المرور...") : t("حفظ كلمة المرور الجديدة")}
                </Button>
              </form>
            )}
          </CardContent>
        )}
        {complete && (
          <CardFooter className="flex justify-center border-t p-4">
            <Button asChild>
              <Link href="/login">{t("تسجيل الدخول")}</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
