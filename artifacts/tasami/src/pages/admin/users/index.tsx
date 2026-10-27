import { AdminLayout } from "@/components/layout/AdminLayout";
import { useCreateUser, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

export default function AdminUsers() {
  const { t, isEnglish } = useLanguage();
  const { data: users, isLoading, refetch } = useListUsers();
  const createUser = useCreateUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "super_admin",
  });

  const prepareAdmin = (name: string, email: string) => {
    setFormData({ name, email, password: "", role: "super_admin" });
    setIsOpen(true);
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createUser.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({
            title: t("تم إنشاء حساب مدير النظام"),
            description: `${formData.email} ${t("أصبح قادراً على تسجيل الدخول وإدارة الموقع.")}`,
          });
          setIsOpen(false);
          setFormData({ name: "", email: "", password: "", role: "super_admin" });
          void refetch();
        },
        onError: () => {
          toast({
            title: t("تعذر إنشاء الحساب"),
            description: t("تحقق من صلاحية مدير النظام وأن البريد غير مسجل مسبقاً."),
            variant: "destructive",
          });
        },
      },
    );
  };

  const adminCandidates = [
    { name: "شروق أمين أبو عكاز", email: "Shorooqaboukaz020@gmail.com" },
    { name: "ألين محمود البشتاوي", email: "aleen05zx@gmail.com" },
  ].filter(
    (candidate) =>
      !users?.some(
        (user) => user.email.toLowerCase() === candidate.email.toLowerCase(),
      ),
  );

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'super_admin': return t('مدير النظام');
      case 'president': return t('رئيس المبادرة');
      case 'vice_president': return t('نائب الرئيس');
      case 'secretary': return t('الأمين العام');
      case 'dept_head': return t('رئيس قسم');
      case 'member': return t('عضو');
      default: return t('زائر');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("إدارة المستخدمين")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("إدارة حسابات مستخدمي النظام والصلاحيات")}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({ name: "", email: "", password: "", role: "super_admin" })}>
              <Plus className="h-4 w-4 mr-2 rtl:ml-2" /> {t("إضافة مستخدم")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("إنشاء حساب مدير نظام")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="admin-name">{t("الاسم")}</Label>
                <Input
                  id="admin-name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t("البريد الإلكتروني")}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  dir="ltr"
                  className="text-left"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">{t("كلمة مرور أولية")}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("استخدم كلمة مرور مختلفة لكل حساب وشاركها مع صاحبته بطريقة آمنة.")}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t("إلغاء")}</Button>
                </DialogClose>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? t("جاري الإنشاء...") : t("إنشاء الحساب")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {adminCandidates.length > 0 && (
        <Card className="mb-6 border-primary/10">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="font-semibold text-primary">{t("مديرو النظام المطلوب إضافتهم")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("بعد نشر الموقع وتسجيل الدخول بحساب مدير نظام، أنشئ لكل شخص حساباً مستقلاً وكلمة مرور خاصة.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {adminCandidates.map((candidate) => (
                <Button
                  key={candidate.email}
                  variant="outline"
                  onClick={() => prepareAdmin(candidate.name, candidate.email)}
                >
                  <Plus className="me-2 h-4 w-4" />
                  {t("إضافة")} {candidate.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {t("لا يوجد مستخدمين مسجلين")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("الاسم")}</TableHead>
                    <TableHead>{t("البريد الإلكتروني")}</TableHead>
                    <TableHead>{t("الصلاحية")}</TableHead>
                    <TableHead>{t("تاريخ التسجيل")}</TableHead>
                    <TableHead>{t("الحالة")}</TableHead>
                    <TableHead className="text-left"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: isEnglish ? undefined : ar })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? t('نشط') : t('غير نشط')}
                        </Badge>
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
