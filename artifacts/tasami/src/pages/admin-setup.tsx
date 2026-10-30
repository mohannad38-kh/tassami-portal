import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

export default function AdminSetup() {
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين."));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/bootstrap-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bootstrapToken, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("تعذر إنشاء الحساب. تحقق من البريد ورمز الإعداد أو من إعدادات Render."));
      }
      setBootstrapToken("");
      setPassword("");
      setConfirmPassword("");
      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("تعذر إنشاء الحساب. تحقق من البريد ورمز الإعداد أو من إعدادات Render."),
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
        <CardHeader className="text-center">
          <CardTitle>{t("تهيئة حساب المدير")}</CardTitle>
          <CardDescription>
            {t("هذه الخطوة تحتاج رمزاً سرياً مضبوطاً في Render، وتعمل فقط للبريد المحدد كمدير أعلى.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm">{t("تم إنشاء الحساب. احذف ADMIN_BOOTSTRAP_TOKEN من Render ثم سجّل الدخول.")}</p>
              <Button asChild className="w-full">
                <Link href="/login">{t("الذهاب لتسجيل الدخول")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-name">{t("الاسم")}</Label>
                <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t("البريد الإلكتروني")}</Label>
                <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bootstrap-token">{t("رمز الإعداد السري")}</Label>
                <Input id="bootstrap-token" type="password" autoComplete="off" value={bootstrapToken} onChange={(event) => setBootstrapToken(event.target.value)} required dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">{t("كلمة مرور جديدة")}</Label>
                <Input id="admin-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password-confirm">{t("تأكيد كلمة المرور")}</Label>
                <Input id="admin-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} dir="ltr" className="text-left" />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("جارٍ إنشاء الحساب...") : t("إنشاء حساب المدير")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
