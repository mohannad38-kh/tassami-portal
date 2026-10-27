import { AdminLayout } from "@/components/layout/AdminLayout";
import { useParams, Link } from "wouter";
import { useGetMember } from "@workspace/api-client-react";
import { getGetMemberQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, QrCode, Mail, Phone, Building, Hash } from "lucide-react";
import logoUrl from "@assets/image_1782739252068.png";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function AdminMemberDetail() {
  const { t, isEnglish } = useLanguage();
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;
  
  const { data: member, isLoading, isError } = useGetMember(id, {
    query: { enabled: !!id, queryKey: getGetMemberQueryKey(id) }
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button variant="ghost" asChild className="-ml-4 hover:bg-transparent hover:text-primary">
          <Link href="/admin/members" className="flex items-center text-muted-foreground">
            <ChevronRight className="h-4 w-4 ml-1" />
            {t("العودة للأعضاء")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      ) : isError || !member ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl">
          <h3 className="text-xl font-medium text-destructive mb-2">{t("تعذر تحميل بيانات العضو")}</h3>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">{t("تفاصيل العضو:")} {member.userName}</h1>
            <Badge variant={
              member.status === 'active' ? 'default' : 
              member.status === 'pending' ? 'secondary' : 'destructive'
            } className="text-sm px-3 py-1">
              {member.status === 'active' ? t('نشط') :
               member.status === 'pending' ? t('معلق') : t('مرفوض')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("البيانات الأساسية")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Hash className="h-4 w-4 mr-2 rtl:ml-2" /> {t("رقم العضوية")}
                      </div>
                      <div className="font-mono font-medium bg-muted px-3 py-1.5 rounded-md inline-block">
                        {member.membershipNumber}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Building className="h-4 w-4 mr-2 rtl:ml-2" /> {t("القسم")}
                      </div>
                      <div className="font-medium">{member.departmentName ? t(member.departmentName) : t("غير محدد")}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-4 w-4 mr-2 rtl:ml-2" /> {t("البريد الإلكتروني")}
                      </div>
                      <div className="font-medium" dir="ltr">{member.userEmail || "-"}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-4 w-4 mr-2 rtl:ml-2" /> {t("رقم الجوال")}
                      </div>
                      <div className="font-medium" dir="ltr">{member.userPhone || "-"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("ملخص الساعات التطوعية")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                      {new Intl.NumberFormat("en", { useGrouping: false }).format(member.totalVolunteerHours || 0)}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{t("إجمالي الساعات المعتمدة")}</div>
                      <div className="text-sm text-muted-foreground">{t("منذ الانضمام في")} {format(new Date(member.createdAt), 'MMMM yyyy', { locale: isEnglish ? undefined : ar })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-white relative h-[450px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-tr-full -ml-10 -mb-10 pointer-events-none"></div>
                
                <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <img src={logoUrl} alt="تسامي" className="h-10 brightness-0 invert" />
                    <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded backdrop-blur-sm">{t("بطاقة العضوية")}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-white p-3 rounded-xl mb-4 shadow-inner">
                      {member.qrCode ? (
                        <img src={member.qrCode} alt="QR Code" className="h-32 w-32 object-contain" />
                      ) : (
                        <QrCode className="h-32 w-32 text-primary" />
                      )}
                    </div>
                    <div className="font-mono tracking-widest text-lg bg-white/10 px-4 py-1 rounded-full">
                      {member.membershipNumber}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20">
                    <div className="font-bold text-xl mb-1">{member.userName}</div>
                    <div className="text-sm text-white/80 flex justify-between items-center">
                      <span>{member.departmentName ? t(member.departmentName) : t("عضو مبادرة تسامي")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
