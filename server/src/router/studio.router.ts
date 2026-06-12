import { Hono } from "hono";
import {
  getStudioTitlesController,
  searchStudioController,
} from "../controller/studio.controller";

export const studioRouter = new Hono();

studioRouter.get("/search", searchStudioController);
studioRouter.get("/titles", getStudioTitlesController);
