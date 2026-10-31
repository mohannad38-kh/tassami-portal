import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_EVENTS = [
  {
    title: "ملتقى الشباب المبدع",
    description: "ملتقى يجمع المبدعين لعرض أفكارهم ومشاريعهم التطوعية.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 50,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 7),
  },
  {
    title: "يوم التطوع البيئي",
    description: "مبادرة ميدانية لنشر الوعي البيئي وتنظيف المساحات العامة.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 100,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 14),
  },
  {
    title: "ورشة لتعلم اساسيات البرمجة والروبوتات",
    description: "ورشة تعليمية وتطبيقية حول مفاهيم البرمجة وبناء الروبوتات.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 30,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 21),
  },
];

router.get("/events", async (_req, res): Promise<void> => {
  try {
    let events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
    
    if (events.length === 0) {
      await db.insert(eventsTable).values(DEFAULT_EVENTS);
      events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

export default router;