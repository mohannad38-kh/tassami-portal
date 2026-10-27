import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
import logoUrl from "@assets/image_1782739252068.png";

export default function ForgotPassword() {
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error === "Password reset email is not configured"
            ? t("استعادة كلمة المرور غير مفعّلة حالياً. تواصل مع إدارة الموقع.")
            : t("تعذر إرسال رابط الاستعادة. حاول مرة أخرى لاحقاً."),
        );
      }
      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("تعذر إرسال رابط الاستعادة. حاول مرة أخرى لاحقاً."),
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
            <CardTitle className="text-2xl font-bold">{t("استعادة كلمة المرور")}</CardTitle>
            <CardDescription>
              {submitted
                ? t("إذا كان البريد مرتبطاً بحساب نشط، فستصلك رسالة برابط صالح لمدة ساعة.")
                : t("أدخل بريد حسابك لإرسال رابط آمن لإعادة تعيين كلمة المرور.")}
            </CardDescription>
          </div>
        </CardHeader>
        {!submitted && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("البريد الإلكتروني")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("جارٍ إرسال الرابط...") : t("إرسال رابط الاستعادة")}
              </Button>
            </form>
          </CardContent>
        )}
        <CardFooter className="flex justify-center border-t p-4">
          <Button variant="link" asChild className="text-muted-foreground">
            <Link href="/login">{t("العودة لتسجيل الدخول")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
