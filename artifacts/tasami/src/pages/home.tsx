import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Heart, Target, Lightbulb, CalendarDays } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useListEvents } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Home() {
  const { t, isEnglish } = useLanguage();
  const [registeredVolunteers, setRegisteredVolunteers] = useState<number | null>(null);
  const [volunteerCountError, setVolunteerCountError] = useState(false);
  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useListEvents();
  const upcomingEvents = events
    .filter((event) => event.status === "upcoming" && new Date(event.eventDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 3);

  useEffect(() => {
    let active = true;
    const statsUrl = import.meta.env.DEV
      ? "/local-api/public/stats"
      : "/api/public/stats";

    const loadStats = async () => {
      try {
        const response = await fetch(statsUrl);
        if (!response.ok) {
          throw new Error(`Could not load public stats: ${response.status}`);
        }
        const data: unknown = await response.json();
        if (
          typeof data !== "object" ||
          data === null ||
          !("registeredVolunteers" in data) ||
          typeof data.registeredVolunteers !== "number" ||
          !Number.isSafeInteger(data.registeredVolunteers) ||
          data.registeredVolunteers < 0
        ) {
          throw new Error("The public stats response is invalid");
        }
        if (active) {
          setRegisteredVolunteers(data.registeredVolunteers);
          setVolunteerCountError(false);
        }
      } catch (error) {
        console.error("Failed to load registered volunteer count:", error);
        if (active) setVolunteerCountError(true);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadStats();
    };

    void loadStats();
    const intervalId = window.setInterval(loadStats, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return (
    <PublicLayout>
      <section className="relative flex min-h-[460px] items-center overflow-hidden text-center" style={{ background: "linear-gradient(115deg, #602531 0%, #7a3342 55%, #602531 100%)" }}>
        <div className="container mx-auto px-4 py-16 md:px-8">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
            {isEnglish ? (
              <>Tasami <span style={{ color: "#d5b976" }}>Volunteer</span> Initiative</>
            ) : (
              <>مبادرة <span style={{ color: "#d5b976" }}>تسامي</span> التطوعية</>
            )}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-white/90 md:text-2xl">
            {t("نسمو بالعمل التطوعي لنصنع أثراً مستداماً ومجتمعاً متكافلاً.")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="px-8 text-lg font-bold"
              style={{ background: "#d5b976", color: "#382a20" }}
              asChild
            >
              <Link href="/join">{t("انضم إلينا")}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 px-8 text-lg font-bold text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/about">{t("اكتشف المزيد")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-12">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 text-center sm:grid-cols-2">
            {[
              {
                number: volunteerCountError
                  ? "تعذر التحميل"
                  : registeredVolunteers === null
                    ? "..."
                    : new Intl.NumberFormat("en", { useGrouping: false }).format(registeredVolunteers),
                label: t("متطوع مسجل"),
              },
              { number: eventsLoading ? "..." : String(events.length), label: t("فعالية منشورة") },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card px-5 py-6 shadow-sm"
              >
                <div
                  className="mb-1 text-4xl font-bold"
                  style={{ color: index % 2 === 0 ? "#702632" : "#a27a37" }}
                >
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
            {[
              { icon: Target, label: t("أثر مستدام"), desc: t("نهدف إلى أثر حقيقي مستمر") },
              { icon: Heart, label: t("العمل التطوعي"), desc: t("نعزز ثقافة العطاء") },
              { icon: Users, label: t("تمكين الشباب"), desc: t("نطور مهارات الشباب") },
              { icon: Lightbulb, label: t("الابتكار"), desc: t("نشجع التفكير الإبداعي") },
              { icon: Star, label: t("التميز"), desc: t("نسعى للتميز دائماً") },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                style={{ borderColor: "rgba(112,38,50,0.14)" }}
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "rgba(112,38,50,0.08)" }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: "#702632" }} />
                </div>
                <div className="mb-1 font-bold" style={{ color: "#702632" }}>
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-muted/40 py-20">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="flex items-center justify-between mb-10 gap-4">
            <Button variant="outline" className="border-primary text-primary" asChild>
              <Link href="/events">{t("عرض الكل")}</Link>
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">{t("الفعاليات القادمة")}</h2>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => <div key={item} className="h-56 rounded-2xl bg-background animate-pulse border" />)}
            </div>
          ) : eventsError ? (
            <div className="rounded-2xl border border-dashed bg-background px-6 py-10 text-center text-muted-foreground">
              {t("تعذر تحميل الفعاليات حالياً. يرجى المحاولة لاحقاً.")}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-background px-6 py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-primary/50" />
              <h3 className="font-semibold text-lg text-primary">{t("لا توجد فعاليات قادمة حالياً")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("تابعونا للاطلاع على الفعاليات الجديدة.")}</p>
              <Button className="mt-5" variant="outline" asChild><Link href="/events">{t("تصفح جميع الفعاليات")}</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <article key={event.id} className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-lg">
                  {event.imageUrl ? <img src={event.imageUrl} alt={event.title} loading="lazy" className="h-44 w-full object-cover" /> : (
                    <div className="flex h-44 items-center justify-center bg-primary/5"><CalendarDays className="h-14 w-14 text-primary/30" /></div>
                  )}
                  <div className="p-5">
                    <h3 className="mb-3 line-clamp-2 text-lg font-bold text-primary">{event.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                      <span>{format(new Date(event.eventDate), "dd MMMM yyyy - hh:mm a", { locale: isEnglish ? undefined : ar })}</span>
                    </div>
                    {event.location && <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="line-clamp-1">{event.location}</span></div>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
// update Mon Jun 29 10:46:38 PM UTC 2026
