import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/hooks/use-auth";
import { useGetMember } from "@workspace/api-client-react";
import { getGetMemberQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, Mail, Phone, Building, Hash, Calendar, QrCode } from "lucide-react";
import logoUrl from "@assets/image_1782739252068.png";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/hooks/use-language";

export default function PortalProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // We need the member details. Assuming user.id corresponds to member.userId
  // Usually there would be an endpoint to get current member profile, but we'll use useGetMember assuming id is the member id or we just display user info.
  // We'll display user info and mock member info if not fully available, or we assume the API handles it.
  
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold text-primary mb-6">{t("ملفي الشخصي")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("البيانات الشخصية")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 rtl:ml-2" />
                    {t("الاسم")}
                  </div>
                  <div className="font-medium">{user?.name}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-4 w-4 mr-2 rtl:ml-2" />
                    {t("البريد الإلكتروني")}
                  </div>
                  <div className="font-medium" dir="ltr">{user?.email}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Phone className="h-4 w-4 mr-2 rtl:ml-2" />
                    {t("رقم الجوال")}
                  </div>
                  <div className="font-medium" dir="ltr">{user?.phone || "-"}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Building className="h-4 w-4 mr-2 rtl:ml-2" />
                    {t("القسم")}
                  </div>
                  <div className="font-medium">{user?.departmentName || t("غير محدد")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          {/* Membership Card */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-[400px] flex flex-col justify-between border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-tr-full -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
              <img src={logoUrl} alt="تسامي" className="h-12 brightness-0 invert" />
              <div className="text-xs font-medium px-2 py-1 rounded bg-white/20 backdrop-blur-sm">{t("عضوية نشطة")}</div>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
              <div className="bg-white p-2 rounded-xl mb-4 shadow-inner">
                <QrCode className="h-32 w-32 text-primary" />
              </div>
              <div className="font-mono text-xl tracking-widest bg-white/10 px-4 py-1 rounded-full">
                MEM-{user?.id.toString().padStart(4, '0')}
              </div>
            </div>
            
            <div className="relative z-10 mt-6 pt-4 border-t border-white/20">
              <div className="font-bold text-lg">{user?.name}</div>
              <div className="text-sm text-white/80">{user?.departmentName || t("عضو")}</div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
