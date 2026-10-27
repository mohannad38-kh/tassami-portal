import { useState } from "react";
import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  getVerifyCertificateQueryKey,
  useVerifyCertificate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Search, Award } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function CertificateVerify() {
  const { t, isEnglish } = useLanguage();
  const params = useParams();
  const [inputCode, setInputCode] = useState(params.code || "");
  const [activeCode, setActiveCode] = useState(params.code || "");

  const { data, isLoading, isError } = useVerifyCertificate(activeCode, {
    query: {
      enabled: !!activeCode,
      queryKey: getVerifyCertificateQueryKey(activeCode),
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setActiveCode(inputCode.trim());
  };

  return (
    <PublicLayout>
      <div className="container py-16 px-4 md:px-8 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 mb-4">
            <Award className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">{t("التحقق من الشهادات")}</h1>
          <p className="text-muted-foreground text-lg">
            {t("أدخل رمز التحقق الموجود على الشهادة للتأكد من صحتها")}
          </p>
        </div>

        <Card className="shadow-lg border-primary/20 mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">{t("رمز التحقق")}</Label>
                <Input
                  id="code"
                  placeholder={t("أدخل رمز التحقق (مثل: CERT-XXXXXX)")}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  dir="ltr"
                  className="text-center text-lg h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading}>
                <Search className="h-5 w-5 mr-2 rtl:ml-2" />
                {t("تحقق")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            {t("جاري التحقق من صحة الشهادة...")}
          </div>
        )}

        {data && (
          <Card className="border-green-500/50 shadow-md bg-green-50/50 dark:bg-green-950/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-green-500 h-2 w-full"></div>
            <CardHeader className="text-center pb-2">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">{t("الشهادة موثقة وصحيحة")}</CardTitle>
              <CardDescription className="text-base">
                {t("تم إصدار هذه الشهادة من مبادرة تسامي التطوعية")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-8 pb-8">
              <div className="grid grid-cols-3 gap-4 border-b border-green-200 dark:border-green-800/50 pb-4">
                <div className="col-span-1 text-muted-foreground text-sm font-medium">{t("اسم المستفيد:")}</div>
                <div className="col-span-2 font-bold text-foreground text-lg">{data.recipientName}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-green-200 dark:border-green-800/50 pb-4">
                <div className="col-span-1 text-muted-foreground text-sm font-medium">{t("نوع الشهادة:")}</div>
                <div className="col-span-2 font-medium">
                  {data.type === 'event' ? t("شهادة مشاركة في فعالية") : t("شهادة حضور ورشة تدريبية")}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-green-200 dark:border-green-800/50 pb-4">
                <div className="col-span-1 text-muted-foreground text-sm font-medium">{t("البرنامج:")}</div>
                <div className="col-span-2 font-medium">
                  {data.eventTitle || data.workshopTitle || '-'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-green-200 dark:border-green-800/50 pb-4">
                <div className="col-span-1 text-muted-foreground text-sm font-medium">{t("تاريخ الإصدار:")}</div>
                <div className="col-span-2 font-medium" dir="ltr">
                  {format(new Date(data.issuedAt), 'dd MMMM yyyy', { locale: isEnglish ? undefined : ar })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-muted-foreground text-sm font-medium">{t("رمز التحقق:")}</div>
                <div className="col-span-2 font-mono text-lg">{data.verifyCode}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {isError && activeCode && (
          <Card className="border-destructive/50 shadow-md bg-destructive/5 dark:bg-destructive/10 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="text-center">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl text-destructive">{t("شهادة غير صحيحة")}</CardTitle>
              <CardDescription className="text-base text-destructive/80">
                {t("عذراً، رمز التحقق الذي أدخلته غير موجود في سجلاتنا. يرجى التأكد من كتابة الرمز بشكل صحيح والمحاولة مرة أخرى.")}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
