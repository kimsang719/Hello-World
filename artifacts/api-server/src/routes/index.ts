import { Router, type IRouter } from "express";
import healthRouter from "./health";
import translatorRouter from "./translator";

const router: IRouter = Router();

router.use(healthRouter);
router.use(translatorRouter);

export default router;
