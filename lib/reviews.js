import "server-only";
import path from "node:path";
import { FileReviewRepository } from "./review-repository.js";

export const reviewRepository = new FileReviewRepository(path.join(process.cwd(), ".reviews"));
