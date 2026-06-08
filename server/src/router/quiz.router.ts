import { Hono } from "hono";
import { generateQuizController } from "../controller/quiz.controller";

export const quizRouter = new Hono();

quizRouter.post("/", generateQuizController);
