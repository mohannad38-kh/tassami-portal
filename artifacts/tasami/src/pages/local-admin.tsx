import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  Clock3,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import type { LanguageContextValue } from "@/hooks/use-language";

type LocalJoinRequest = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  departmentId: number | null;
  departmentName: string | null;
  status: string;
  createdAt: string;
  approvalEmailSentAt: string | null;
};

type LocalAdminSession = {
  token: string;
  email: string;
};

type AdminStatus = {
  needsSetup: boolean;
  email: string;
};

async function readResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "تعذر إكمال الطلب.";
    throw new Error(message);
  }
  return data as T;
}

function formatDate(value: string, isEnglish: boolean): string {
  const date = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  return new Intl.DateTimeFormat(isEnglish ? "en" : "ar-JO-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string, t: LanguageContextValue["t"]): string {
  if (status === "approved") return t("مقبول");
  if (status === "rejected") return t("مرفوض");
  return t("قيد المراجعة");
}

export default function LocalAdmin() {
  const [session, setSession] = useState<LocalAdminSession | null>(() => {
    const token = sessionStorage.getItem("tasami_local_admin_token");
    const email = sessionStorage.getItem("tasami_local_admin_email");
    return token && email ? { token, email } : null;
  });
  const [requests, setRequests] = useState<LocalJoinRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [email, setEmail] = useState("mohannadkhaloof38@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();
  const { t, direction, isEnglish, toggleLanguage } = useLanguage();

  useEffect(() => {
    let active = true;
    void fetch("/local-api/admin/status")
      .then((response) => readResponse<AdminStatus>(response))
      .then((status) => {
        if (!active) return;
        setNeedsSetup(status.needsSetup);
        if (status.email) setEmail(status.email);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoginError(error instanceof Error ? error.message : "تعذر الاتصال بالموقع المحلي.");
          setNeedsSetup(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const fetchRequests = useCallback(async (token: string) => {
    const response = await fetch("/local-api/admin/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return readResponse<LocalJoinRequest[]>(response);
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      setRequests(await fetchRequests(session.token));
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تحميل الطلبات.";
      if (message.includes("sign in")) {
        sessionStorage.removeItem("tasami_local_admin_token");
        sessionStorage.removeItem("tasami_local_admin_email");
        setSession(null);
      } else {
        toast({ title: "تعذر تحميل الطلبات", description: message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRequests, session, toast]);

  useEffect(() => {
    if (session) void refreshRequests();
  }, [refreshRequests, session]);

  const visibleRequests = useMemo(
    () => (filter === "all" ? requests : requests.filter((request) => request.status === filter)),
    [filter, requests],
  );

  const authenticate = async (
    event: React.FormEvent<HTMLFormElement>,
    setup: boolean,
  ) => {
    event.preventDefault();
    setLoginError("");
    if (setup && password !== confirmPassword) {
      setLoginError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        setup ? "/local-api/admin/setup" : "/local-api/admin/login",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        },
      );
      const result = await readResponse<LocalAdminSession>(response);
      sessionStorage.setItem("tasami_local_admin_token", result.token);
      sessionStorage.setItem("tasami_local_admin_email", result.email);
      setSession(result);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    void authenticate(event, false);
  };

  const setup = (event: React.FormEvent<HTMLFormElement>) => {
    void authenticate(event, true);
  };

  const logout = async () => {
    if (session) {
      await fetch("/local-api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
      });
    }
    sessionStorage.removeItem("tasami_local_admin_token");
    sessionStorage.removeItem("tasami_local_admin_email");
    setSession(null);
    setRequests([]);
  };

  const updateStatus = async (request: LocalJoinRequest, status: "approved" | "rejected") => {
    if (!session) return;
    setBusyId(request.id);
    try {
      const response = await fetch(`/local-api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = await readResponse<{ emailSent: boolean; message?: string }>(response);
      await refreshRequests();
      if (status === "approved" && !result.emailSent) {
        toast({
          title: t("تم قبول الطلب، لكن تعذّر إرسال الرسالة"),
          description: result.message || t("راجعي إعدادات بريد Gmail، ثم حاولي إعادة الإرسال."),
          variant: "destructive",
        });
      } else {
        toast({
          title: status === "approved" ? t("تم قبول الطلب وإرسال رسالة القبول") : t("تم رفض الطلب"),
          description:
            status === "approved"
              ? `${t("أُرسلت رسالة إلى")} ${request.email}.`
              : t("تم تحديث حالة طلب الانضمام."),
        });
      }
    } catch (error) {
      toast({
        title: t("تعذر تحديث الطلب"),
        description: error instanceof Error ? error.message : t("حاولي مرة أخرى."),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir={direction}>
        <Button variant="outline" size="sm" className="absolute top-4 right-4" onClick={toggleLanguage}>
          {isEnglish ? "العربية" : "English"}
        </Button>
        <Card className="w-full max-w-md border-primary/10 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">{t("إدارة طلبات تسامي")}</CardTitle>
            <CardDescription>
              {needsSetup
                ? t("أنشئي كلمة مرور المسؤول لأول مرة. ستُحفظ مشفّرة على هذا الجهاز.")
                : t("سجّلي الدخول لعرض الطلبات وإدارتها على هذا الجهاز.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {needsSetup === null ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("جارٍ تجهيز لوحة الإدارة...")}</p>
            ) : (
            <form className="space-y-4" onSubmit={needsSetup ? setup : login}>
              {loginError && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {loginError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-email">{t("البريد الإلكتروني")}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">{t("كلمة مرور المدير المحلية")}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  required
                  minLength={needsSetup ? 12 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              {needsSetup && (
                <div className="space-y-2">
                  <Label htmlFor="admin-password-confirm">{t("تأكيد كلمة المرور")}</Label>
                  <Input
                    id="admin-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("اختاري 12 حرفاً أو أكثر. لا تستخدمي كلمة مرور Gmail.")}
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t("جارٍ التحقق...")
                  : needsSetup
                    ? t("إنشاء حساب المسؤول")
                    : t("دخول لوحة الإدارة")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("لوحة الإدارة متاحة محلياً على جهازك فقط.")}
              </p>
            </form>
            )}
          </CardContent>
          <div className="px-6 pb-5 text-center">
            <Button variant="link" asChild>
              <Link href="/">{t("العودة إلى الموقع")}</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const counts = {
    pending: requests.filter((request) => request.status === "pending").length,
    approved: requests.filter((request) => request.status === "approved").length,
    rejected: requests.filter((request) => request.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-muted/30" dir={direction}>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">{t("إدارة طلبات تسامي")}</h1>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{session.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void refreshRequests()} disabled={loading}>
              <RefreshCw className={`ms-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("تحديث")}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {isEnglish ? "العربية" : "English"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut className="ms-2 h-4 w-4" />
              {t("خروج")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="rounded-xl bg-secondary/15 p-3 text-secondary-foreground"><Clock3 className="h-5 w-5" /></span>
              <div><p className="text-2xl font-bold" dir="ltr">{counts.pending}</p><p className="text-sm text-muted-foreground">{t("بانتظار المراجعة")}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></span>
              <div><p className="text-2xl font-bold" dir="ltr">{counts.approved}</p><p className="text-sm text-muted-foreground">{t("طلبات مقبولة")}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="rounded-xl bg-muted p-3 text-muted-foreground"><UserRound className="h-5 w-5" /></span>
              <div><p className="text-2xl font-bold" dir="ltr">{requests.length}</p><p className="text-sm text-muted-foreground">{t("إجمالي الطلبات")}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("طلبات الانضمام")}</CardTitle>
              <CardDescription>{t("راجعي الطلب ثم اقبليه أو ارفضي؛ عند القبول يحاول الموقع إرسال بريد إلكتروني.")}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "pending", label: t("قيد المراجعة") },
                { value: "approved", label: t("مقبولة") },
                { value: "rejected", label: t("مرفوضة") },
                { value: "all", label: t("الكل") },
              ].map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={filter === item.value ? "default" : "outline"}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                  <span className="ms-2 tabular-nums" dir="ltr">
                    {item.value === "all" ? requests.length : counts[item.value as keyof typeof counts]}
                  </span>
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && requests.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">{t("جارٍ تحميل الطلبات...")}</p>
            ) : visibleRequests.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">{t("لا توجد طلبات في هذا القسم حالياً")}</p>
            ) : (
              visibleRequests.map((request) => (
                <article key={request.id} className="rounded-xl border bg-card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{request.name}</h2>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {statusLabel(request.status, t)}
                        </span>
                      </div>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
                        <Mail className="h-4 w-4 shrink-0" />{request.email}
                      </p>
                      {request.phone && (
                        <p className="text-sm text-muted-foreground" dir="ltr">{request.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(request.createdAt, isEnglish)}</p>
                      {request.departmentName && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">{t("القسم المختار:")}</span>{" "}
                          {t(request.departmentName)}
                        </p>
                      )}
                      {request.message && <p className="whitespace-pre-wrap text-sm leading-7">{request.message}</p>}
                      {request.status === "approved" && (
                        <p className={`text-sm ${request.approvalEmailSentAt ? "text-primary" : "text-destructive"}`}>
                          {request.approvalEmailSentAt ? t("أُرسلت رسالة القبول") : t("لم تُرسل رسالة القبول بعد")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {(request.status === "pending" || (request.status === "approved" && !request.approvalEmailSentAt)) && (
                        <Button
                          size="sm"
                          onClick={() => void updateStatus(request, "approved")}
                          disabled={busyId === request.id}
                        >
                          <Check className="ms-1 h-4 w-4" />
                          {request.status === "approved" ? t("إعادة الإرسال") : t("قبول وإرسال")}
                        </Button>
                      )}
                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void updateStatus(request, "rejected")}
                          disabled={busyId === request.id}
                        >
                          <X className="ms-1 h-4 w-4" />
                          {t("رفض")}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
