import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Mail, Phone, Building, QrCode } from "lucide-react";
import logoUrl from "@assets/image_1782739252068.png";
import { useLanguage } from "@/hooks/use-language";

export default function PortalProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const userIdFormatted = user?.id ? String(user.id).padStart(4, '0') : '0000';

  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
        <UserIcon className="h-6 w-6" /> {t("ملفي الشخصي")}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("البيانات الشخصية")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    {t("الاسم")}
                  </div>
                  <div className="font-medium text-base">{user?.name || "-"}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {t("البريد الإلكتروني")}
                  </div>
                  <div className="font-medium text-base font-mono" dir="ltr">{user?.email || "-"}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {t("رقم الجوال")}
                  </div>
                  <div className="font-medium text-base" dir="ltr">{user?.phone || "-"}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    {t("القسم")}
                  </div>
                  <div className="font-medium text-base">{user?.departmentName || t("غير محدد")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          {/* Membership Card */}
          <div className="bg-gradient-to-br from-primary to-primary/85 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-[400px] flex flex-col justify-between border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-tr-full -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-4">
              <img src={logoUrl} alt="تسامي" className="h-10 brightness-0 invert object-contain" />
              <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">{t("عضوية نشطة")}</div>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
              <div className="bg-white p-3 rounded-2xl mb-3 shadow-md">
                <QrCode className="h-28 w-28 text-primary" />
              </div>
              <div className="font-mono text-lg tracking-wider bg-white/10 px-4 py-1 rounded-full border border-white/10">
                MEM-{userIdFormatted}
              </div>
            </div>
            
            <div className="relative z-10 mt-4 pt-3 border-t border-white/20">
              <div className="font-bold text-base truncate">{user?.name || t("عضو المبادرة")}</div>
              <div className="text-xs text-white/80 truncate mt-0.5">{user?.departmentName || t("متطوع")}</div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}