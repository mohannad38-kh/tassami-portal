import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  const { direction, isEnglish, t, toggleLanguage } = useLanguage();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 relative" dir={direction}>
      <Button variant="outline" size="sm" className="absolute top-4 right-4 rtl:right-auto rtl:left-4" onClick={toggleLanguage}>
        {isEnglish ? "العربية" : "English"}
      </Button>
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">{t("404 Page Not Found")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.")}
            </p>
          </div>

          <Button asChild className="w-full h-11 gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              {t("العودة للرئيسية")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}