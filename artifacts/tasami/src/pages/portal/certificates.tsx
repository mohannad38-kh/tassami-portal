import { PortalLayout } from "@/components/layout/PortalLayout";
import { useListCertificates } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function PortalCertificates() {
  const { t, isEnglish } = useLanguage();
  const { data: rawCertificates, isLoading } = useListCertificates();

  // حماية صارمة لضمان أن البيانات دائماً مصفوفة لتجنب أخطاء وقت التشغيل (TypeError)
  const certificates = Array.isArray(rawCertificates)
    ? rawCertificates
    : ((rawCertificates as any)?.items || []);

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Award className="h-6 w-6" /> {t("شهاداتي")}
        </h1>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border/60">
          <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="text-xl font-medium text-foreground">{t("لا توجد شهادات بعد")}</h3>
          <p className="text-muted-foreground mt-2 text-sm">{t("ستظهر شهادات مشاركتك في الفعاليات والورش هنا بمجرد إصدارها.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="overflow-hidden border-primary/10 hover:shadow-md transition-all group">
              <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary mb-2">
                    <Award className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cert.type === 'event' ? t('مشاركة فعالية') : t('حضور ورشة')}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {cert.eventTitle || cert.workshopTitle || t("شهادة تقديرية")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t("تاريخ الإصدار:")} {cert.issuedAt ? format(new Date(cert.issuedAt), 'dd MMMM yyyy', { locale: isEnglish ? undefined : ar }) : '-'}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1 gap-1" asChild>
                    <Link href={`/certificate/verify/${cert.verifyCode}`}>
                      <Eye className="h-4 w-4 ml-1 rtl:ml-0 rtl:mr-1" />
                      {t("عرض")}
                    </Link>
                  </Button>
                  <Button className="flex-1 gap-1" onClick={() => window.open(`/api/certificates/${cert.id}/download`, '_blank')}>
                    <Download className="h-4 w-4 ml-1 rtl:ml-0 rtl:mr-1" />
                    {t("تحميل")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}