import { Router, type IRouter } from "express";
import { db, membersTable, eventsTable, workshopsTable, departmentsTable, joinRequestsTable, volunteerHoursTable, tasksTable, activityLogTable, newsTable, announcementsTable, usersTable } from "@workspace/db";
import { count, sum, eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", authMiddleware, requireRole("member"), async (_req, res): Promise<void> => {
  const [{ totalMembers }] = await db.select({ totalMembers: count() }).from(membersTable);
  const [{ totalEvents }] = await db.select({ totalEvents: count() }).from(eventsTable);
  const [{ totalWorkshops }] = await db.select({ totalWorkshops: count() }).from(workshopsTable);
  const [{ totalDepartments }] = await db.select({ totalDepartments: count() }).from(departmentsTable);
  const pendingMembers = await db.select().from(membersTable).where(eq(membersTable.status, "pending"));
  const pendingJoin = await db.select().from(joinRequestsTable).where(eq(joinRequestsTable.status, "pending"));
  const [{ totalHours }] = await db.select({ totalHours: sum(volunteerHoursTable.hours) }).from(volunteerHoursTable);
  const upcomingEventsRows = await db.select().from(eventsTable).where(eq(eventsTable.status, "upcoming"));
  const activeTasks = await db.select().from(tasksTable).where(eq(tasksTable.status, "in_progress"));

  res.json({
    totalMembers: Number(totalMembers),
    totalEvents: Number(totalEvents),
    totalWorkshops: Number(totalWorkshops),
    totalDepartments: Number(totalDepartments),
    pendingRequests: pendingMembers.length + pendingJoin.length,
    totalVolunteerHours: Number(totalHours ?? 0),
    upcomingEvents: upcomingEventsRows.length,
    activeTasks: activeTasks.length,
  });
});

router.get("/dashboard/activity", authMiddleware, requireRole("member"), async (_req, res): Promise<void> => {
  const activities = await db.select().from(activityLogTable).orderBy(activityLogTable.createdAt);
  res.json(activities.slice(-20).reverse().map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    actorName: a.actorName ?? null,
    createdAt: a.createdAt,
  })));
});

router.get("/dashboard/reports", authMiddleware, requireRole("secretary"), async (_req, res): Promise<void> => {
  // Members by department
  const departments = await db.select().from(departmentsTable);
  const membersByDepartment = await Promise.all(
    departments.map(async (dept) => {
      const [{ cnt }] = await db.select({ cnt: count() }).from(membersTable).where(eq(membersTable.departmentId, dept.id));
      return { departmentName: dept.name, count: Number(cnt) };
    })
  );
  const [{ unassigned }] = await db.select({ unassigned: count() }).from(membersTable).where(eq(membersTable.departmentId, null as unknown as number));
  if (Number(unassigned) > 0) membersByDepartment.push({ departmentName: "غير محدد", count: Number(unassigned) });

  // Events by month (last 6 months)
  const events = await db.select().from(eventsTable);
  const monthMap: Record<string, number> = {};
  events.forEach((e) => {
    const month = new Date(e.eventDate).toLocaleDateString("ar-SA", { month: "short", year: "numeric" });
    monthMap[month] = (monthMap[month] ?? 0) + 1;
  });
  const eventsByMonth = Object.entries(monthMap).map(([month, count]) => ({ month, count })).slice(-6);

  // Volunteer hours summary
  const members = await db.select().from(membersTable);
  const volunteerHoursByMember = await Promise.all(
    members.slice(0, 10).map(async (member) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));
      const [{ total }] = await db.select({ total: sum(volunteerHoursTable.hours) }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      const [{ cnt }] = await db.select({ cnt: count() }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      return { memberId: member.id, memberName: user?.name ?? "Unknown", totalHours: Number(total ?? 0), eventCount: Number(cnt) };
    })
  );

  res.json({
    membersByDepartment,
    eventsByMonth,
    volunteerHoursByMember: volunteerHoursByMember.sort((a, b) => b.totalHours - a.totalHours),
    attendanceRate: 75,
  });
});

export default router;
