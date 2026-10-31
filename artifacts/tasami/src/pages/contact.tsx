import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle, Send, Headphones } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: t("تم إرسال رسالتك بنجاح"),
        description: t("شكراً لتواصلك معنا، سنقوم بالرد عليك في أقرب وقت ممكن."),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <PublicLayout>
      <div className="container py-12 px-4 md:px-8 mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-primary mb-2 border-b pb-4 flex items-center gap-2">
          <Headphones className="h-8 w-8" /> {t("تواصل معنا")}
        </h1>
        <p className="text-muted-foreground mb-8 mt-2 text-lg">
          {t("نحن هنا دائماً للإجابة على استفساراتكم وتلقي مقترحاتكم لتعزيز العمل التطوعي.")}
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-md">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-bold mb-4 border-b border-primary-foreground/20 pb-3">{t("معلومات التواصل")}</h3>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("العنوان")}</p>
                    <p className="text-sm opacity-90">{t("الأردن — إربد")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("رقم الهاتف")}</p>
                    <a className="text-sm opacity-90 hover:underline font-mono" href="https://wa.me/962781386264" dir="ltr">
                      +962 7 8138 6264
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("البريد الإلكتروني")}</p>
                    <p className="text-sm opacity-90 font-mono" dir="ltr">info@tasami.org</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("ساعات العمل")}</p>
                    <p className="text-sm opacity-90">{t("الأحد - الخميس: 9 ص - 5 م")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("إنستغرام")}</p>
                    <a
                      className="text-sm opacity-90 hover:underline font-mono"
                      href="https://www.instagram.com/tasami.jo/"
                      target="_blank"
                      rel="noreferrer"
                      dir="ltr"
                    >
                      @tasami.jo
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
                  <div>
                    <p className="font-medium">{t("واتساب")}</p>
                    <a className="text-sm opacity-90 hover:underline font-mono" href="https://wa.me/962781386264" dir="ltr" target="_blank" rel="noreferrer">
                      +962 7 8138 6264
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{t("أرسل رسالة")}</CardTitle>
                <CardDescription>
                  {t("يسعدنا استقبال استفساراتكم واقتراحاتكم من خلال النموذج التالي وسنوافيكم بالرد سريعاً")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("الاسم")}</Label>
                      <Input 
                        id="name" 
                        required 
                        placeholder={t("أدخل اسمك الكامل...")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("البريد الإلكتروني")}</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        dir="ltr"
                        className="text-left"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("الموضوع")}</Label>
                    <Input 
                      id="subject" 
                      required 
                      placeholder={t("موضوع الرسالة...")}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t("الرسالة")}</Label>
                    <Textarea 
                      id="message" 
                      rows={5} 
                      required 
                      placeholder={t("اكتب تفاصيل استفسارك أو اقتراحك هنا...")}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full md:w-auto px-8 h-11 gap-2" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? t("جاري الإرسال...") : t("إرسال الرسالة")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}