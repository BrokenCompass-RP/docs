import "server-only";
import { createReviewService } from "./review-service.js";
import { reviewRepository } from "./reviews.js";

export const reviewService = createReviewService({ repository: reviewRepository });
