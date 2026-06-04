import { Hono } from "hono";
import {
  generateExampleController,
  generatePracticeController,
  getTutorHistoryController,
  solveTutorController,
} from "../controller/tutor.controller";

export const tutorRouter = new Hono();

tutorRouter.post("/solve", solveTutorController);
tutorRouter.get("/history", getTutorHistoryController);
tutorRouter.post("/example", generateExampleController);
tutorRouter.post("/practice", generatePracticeController);
