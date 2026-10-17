import { AppError } from "../utils/AppError.js";

// Validates req[source] against a zod schema and merges the parsed result into req.validated
// (so a route can validate e.g. both params and body). Handlers must read from req.validated only.
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      return next(new AppError(400, result.error.issues[0]?.message ?? "অনুরোধটি সঠিক নয়।"));
    }
    req.validated = { ...req.validated, ...result.data };
    next();
  };
}
