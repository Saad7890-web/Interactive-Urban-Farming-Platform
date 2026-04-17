import rateLimit from "express-rate-limit";

const sharedOptions = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

export const strictAuthRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const authRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const writeRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: {
    success: false,
    message: "Too many write actions. Please slow down.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const bookingRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many booking actions. Please slow down.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const forumRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: "Too many forum actions. Please slow down.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const trackingRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    message: "Too many tracking updates. Please slow down.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});

export const adminRateLimit = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 100,
  message: {
    success: false,
    message: "Too many admin actions. Please slow down.",
    error: {
      code: "RATE_LIMITED",
    },
  },
});