import { AdminLayout } from "@/components/layout/DashboardLayout";
import { useListCertificates } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function AdminCertificates() {
  const { t, isEnglish } = useLanguage();
  const { data: certificates, isLoading } = useListCertificates();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("الشهادات")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("سجل بجميع الشهادات الصادرة للأعضاء")}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : certificates?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا توجد شهادات صادرة حتى الآن")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("تاريخ الإصدار")}</TableHead>
                    <TableHead>{t("المستفيد")}</TableHead>
                    <TableHead>{t("نوع الشهادة")}</TableHead>
                    <TableHead>{t("البرنامج")}</TableHead>
                    <TableHead>{t("رمز التحقق")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        {format(new Date(cert.issuedAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                      </TableCell>
                      <TableCell className="font-medium">{cert.recipientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cert.type === 'event' ? t('مشاركة فعالية') : t('حضور ورشة')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={cert.eventTitle || cert.workshopTitle || ''}>
                        {cert.eventTitle || cert.workshopTitle || '-'}
                      </TableCell>
                      <TableCell className="font-mono">{cert.verifyCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
