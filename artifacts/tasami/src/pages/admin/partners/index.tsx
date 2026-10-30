import { AdminLayout } from "@/components/layout/DashboardLayout";
import { useListPartners } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AdminPartners() {
  const { t } = useLanguage();
  const { data: partners, isLoading } = useListPartners();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("الشركاء")}</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة شريك")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : partners?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا يوجد شركاء مسجلين")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("الاسم")}</TableHead>
                    <TableHead>{t("النوع")}</TableHead>
                    <TableHead>{t("الموقع")}</TableHead>
                    <TableHead className="text-left"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners?.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        {partner.logoUrl ? (
                          <img src={partner.logoUrl} alt={partner.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-xs">{t("شريك")}</div>
                        )}
                        {partner.name}
                      </TableCell>
                      <TableCell>{partner.partnerType || "-"}</TableCell>
                      <TableCell>
                        {partner.website ? (
                          <a href={partner.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> {t("زيارة الموقع")}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
