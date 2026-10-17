import { TIME_ZONE } from "../config/constants.js";

const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

// Calendar day in Bangladesh as "YYYY-MM-DD" (en-CA formats dates that way).
export function dhakaDay(date = new Date()) {
  return formatter.format(date);
}

// "YYYY-MM-DD" of the Bangladesh calendar day `days` after today.
export function dhakaDayPlus(days) {
  return dhakaDay(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}
