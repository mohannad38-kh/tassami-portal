import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useSubmitJoinRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { useDepartments } from "@/hooks/use-departments";

function normalizeJordanMobile(value: string): string | null {
  const digits = value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .trim()
    .replace(/[\s()-]/g, "");
  if (/^07[789]\d{7}$/.test(digits)) return `+962${digits.slice(1)}`;
  if (/^\+9627[789]\d{7}$/.test(digits)) return digits;
  return null;
}

export default function Join() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "", departmentId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRequest = useSubmitJoinRequest();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: departments, isLoading: isLoadingDepartments, isError: departmentsError } = useDepartments();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let normalizedPhone: string | null = null;
    if (formData.phone.trim()) {
      normalizedPhone = normalizeJordanMobile(formData.phone);
      if (!normalizedPhone) {
        toast({
          title: t("رقم الهاتف غير صحيح"),
          description: t("أدخلي رقم أردني يبدأ بـ 07 أو +962، مثل 079 123 4567."),
          variant: "destructive",
        });
        return;
      }
    }
    const submission = {
      ...formData,
      phone: normalizedPhone ?? "",
      departmentId: Number(formData.departmentId),
    };

    if (!import.meta.env.DEV) {
      submitRequest.mutate(
        { data: submission },
        {
          onSuccess: () => {
            toast({
              title: t("تم إرسال طلبك بنجاح"),
              description: t("سنتواصل معك قريباً، شكراً لاهتمامك بالانضمام لتسامي."),
            });
            setFormData({ name: "", email: "", phone: "", message: "", departmentId: "" });
          },
          onError: () => {
            toast({
              title: t("حدث خطأ"),
              description: t("لم نتمكن من إرسال طلبك. يرجى المحاولة لاحقاً."),
              variant: "destructive",
            });
          },
        },
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/local-api/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (!response.ok) {
        throw new Error(`Join request failed with status ${response.status}`);
      }

      toast({
        title: t("تم حفظ طلبك بنجاح"),
        description: t("تم حفظ الطلب في قاعدة البيانات المحلية على هذا الجهاز."),
      });
      setFormData({ name: "", email: "", phone: "", message: "", departmentId: "" });
    } catch (error) {
      console.error("Failed to submit local join request:", error);
      toast({
        title: t("تعذر حفظ الطلب"),
        description: t("تأكدي من تشغيل الموقع محلياً ثم حاولي مرة أخرى."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container py-16 px-4 md:px-8 mx-auto max-w-2xl">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-primary mb-2">{t("نموذج الانضمام")}</CardTitle>
            <CardDescription className="text-lg">
              {t("انضم إلى نخبة المتطوعين في مبادرة تسامي وكن جزءاً من التغيير الإيجابي.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("الاسم الثلاثي")}</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("أدخل اسمك الكامل")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">{t("القسم الذي ترغب بالانضمام إليه")}</Label>
                <select
                  id="department"
                  required
                  value={formData.departmentId}
                  onChange={(event) => setFormData({ ...formData, departmentId: event.target.value })}
                  disabled={isLoadingDepartments || departmentsError || !departments?.length}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingDepartments
                      ? t("جارٍ تحميل الأقسام...")
                      : departmentsError
                        ? t("تعذر تحميل الأقسام، حاولي تحديث الصفحة.")
                        : t("اختاري القسم")}
                  </option>
                  {departments?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {t(department.name)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("البريد الإلكتروني")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@domain.com"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("رقم الجوال (اختياري)")}</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="079 123 4567"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("رقم أردني: 07xxxxxxxx أو +962 7x xxx xxxx")}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">{t("لماذا ترغب بالانضمام إلينا؟ (اختياري)")}</Label>
                <Textarea 
                  id="message" 
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t("حدثنا عن مهاراتك واهتماماتك التطوعية...")}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full text-lg h-12" 
                disabled={isSubmitting || submitRequest.isPending || isLoadingDepartments || departmentsError || !departments?.length}
              >
                {isSubmitting || submitRequest.isPending ? t("جاري الإرسال...") : t("إرسال طلب الانضمام")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
