import { Hono } from "hono";
import {
  createFormulaController,
  createManyFormulasController,
  deleteFormulaController,
  detectFormulasController,
  getFormulasController,
  seedAllController,
  seedTopicController,
  updateFormulaController,
} from "../controller/formula.controller";

export const formulaRouter = new Hono();

formulaRouter.get("/", getFormulasController);
formulaRouter.post("/", createFormulaController);
formulaRouter.post("/bulk", createManyFormulasController);
formulaRouter.patch("/:id", updateFormulaController);
formulaRouter.delete("/:id", deleteFormulaController);
formulaRouter.post("/detect", detectFormulasController);
formulaRouter.post("/seed", seedAllController);
formulaRouter.post("/seed/:subject/:topic", seedTopicController);
