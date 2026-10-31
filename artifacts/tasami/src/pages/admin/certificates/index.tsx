import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListCertificates } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";
import { Search, Award } from "lucide-react";

export default function AdminCertificates() {
  const { t, isEnglish } = useLanguage();
  const { data: rawCertificates, isLoading } = useListCertificates();
  
  // حماية البيانات والتأكد من أنها مصفوفة دائماً
  const certificates = Array.isArray(rawCertificates) 
    ? rawCertificates 
    : ((rawCertificates as any)?.items || []);

  const [searchQuery, setSearchQuery] = useState("");

  // فلترة الشهادات بناءً على بحث المستفيد أو رمز التحقق
  const filteredCertificates = certificates.filter((cert: any) => 
    cert.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.verifyCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.workshopTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Award className="h-6 w-6" /> {t("الشهادات")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("سجل بجميع الشهادات الصادرة للأعضاء مع إمكانية البحث والمتابعة")}</p>
        </div>
      </div>

      {/* شريط البحث والفلترة السريعة */}
      <Card className="mb-6 shadow-sm border-border/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="بحث باسم المستفيد، رمز التحقق، أو اسم البرنامج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 shadow-none text-base"
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
              {searchQuery ? t("لا توجد نتائج مطابقة للبحث") : t("لا توجد شهادات صادرة حتى الآن")}
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
                  {filteredCertificates.map((cert: any) => (
                    <TableRow key={cert.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        {cert.issuedAt ? format(new Date(cert.issuedAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar }) : '-'}
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
                      <TableCell className="font-mono text-xs">{cert.verifyCode}</TableCell>
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