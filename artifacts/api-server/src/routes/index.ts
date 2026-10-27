import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import departmentsRouter from "./departments";
import membersRouter from "./members";
import joinRequestsRouter from "./join_requests";
import eventsRouter from "./events";
import workshopsRouter from "./workshops";
import certificatesRouter from "./certificates";
import volunteerRouter from "./volunteer";
import meetingsRouter from "./meetings";
import tasksRouter from "./tasks";
import newsRouter from "./news";
import publicRouter from "./public";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(departmentsRouter);
router.use(membersRouter);
router.use(joinRequestsRouter);
router.use(eventsRouter);
router.use(workshopsRouter);
router.use(certificatesRouter);
router.use(volunteerRouter);
router.use(meetingsRouter);
router.use(tasksRouter);
router.use(newsRouter);
router.use(publicRouter);
router.use(dashboardRouter);

export default router;
