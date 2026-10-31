import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
import logoUrl from "@assets/image_1782739252068.png";
import { KeyRound, Mail, ArrowRight, ArrowLeft } from "lucide-react";

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
        if (result?.error === "Password reset email is not configured") {
          throw new Error(t("استعادة كلمة المرور غير مفعّلة حالياً. تواصل مع إدارة الموقع."));
        }
        if (result?.error === "Password reset email could not be sent") {
          throw new Error(t("تعذر إرسال الرسالة. تحقق من مفتاح Resend وعنوان المرسل الموثق."));
        }
        throw new Error(t("تعذر إرسال رابط الاستعادة. حاول مرة أخرى لاحقاً."));
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
            <CardTitle className="text-2xl font-bold text-primary">{t("استعادة كلمة المرور")}</CardTitle>
            <CardDescription className="text-sm">
              {submitted
                ? t("إذا كان البريد مرتبطاً بحساب نشط، فستصلك رسالة برابط صالح لمدة ساعة.")
                : t("أدخل بريد حسابك لإرسال رابط آمن لإعادة تعيين كلمة المرور.")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!submitted ? (
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
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    dir="ltr"
                    className="text-left px-10 rtl:pr-10 rtl:pl-3"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 gap-2" disabled={isSubmitting}>
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? t("جارٍ إرسال الرابط...") : t("إرسال رابط الاستعادة")}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("تم إرسال تعليمات الاستعادة إلى بريدك الإلكتروني بنجاح.")}
              </p>
              <Button asChild className="w-full h-11">
                <Link href="/login">{t("العودة لتسجيل الدخول")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <Button variant="link" asChild className="text-muted-foreground gap-1 text-sm">
            <Link href="/login">
              {isEnglish ? <ArrowLeft className="h-3.5 w-3.5 mr-1" /> : <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              {t("العودة لتسجيل الدخول")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
