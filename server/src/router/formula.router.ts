import { Hono } from "hono";
import {
  getFormulasController,
  identifyFormulasController,
  seedAllController,
  seedTopicController,
} from "../controller/formula.controller";

export const formulaRouter = new Hono();

formulaRouter.get("/", getFormulasController);
formulaRouter.post("/identify", identifyFormulasController);
formulaRouter.post("/seed", seedAllController);
formulaRouter.post("/seed/:subject/:topic", seedTopicController);
