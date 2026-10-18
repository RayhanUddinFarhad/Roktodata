import { env, isProduction } from "../config/env.js";

const SEND_URL = "https://api.sms.net.bd/sendsms";

// sms.net.bd error codes worth a clear log line (the full list is at https://sms.bd/api).
const SMS_ERRORS = {
  405: "authorization failed (check SMS_NET_BD_API_KEY)",
  410: "account expired",
  413: "sender ID not approved",
  416: "no valid number",
  417: "insufficient balance",
  420: "content blocked",
};

export class SmsError extends Error {
  constructor(code, message) {
    super(`sms.net.bd error ${code}: ${SMS_ERRORS[code] ?? message}`);
    this.smsCode = code;
  }
}

async function post(params) {
  const res = await fetch(SEND_URL, {
    method: "POST",
    body: new URLSearchParams({ api_key: env.SMS_NET_BD_API_KEY, ...params }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({ error: res.status, msg: `HTTP ${res.status}` }));
  return { error: Number(body.error), msg: body.msg, data: body.data };
}

// Sends one SMS to a local number (01XXXXXXXXX). Without an API key outside production, the
// message is printed in the server log instead so the flow can be tested locally.
export async function sendSms(phoneNumber, msg) {
  if (!env.SMS_NET_BD_API_KEY) {
    if (isProduction) throw new Error("SMS_NET_BD_API_KEY is not set");
    console.log(`[sms:dev] to ${phoneNumber}: ${msg}`);
    return;
  }

  const to = `88${phoneNumber}`;
  let result = await post(env.SMS_SENDER_ID ? { to, msg, sender_id: env.SMS_SENDER_ID } : { to, msg });
  // An unapproved sender ID shouldn't stop verification: fall back to the default sender.
  if (result.error === 413 && env.SMS_SENDER_ID) {
    console.warn(`sms.net.bd rejected sender ID "${env.SMS_SENDER_ID}"; sending from the default number.`);
    result = await post({ to, msg });
  }
  if (result.error !== 0) throw new SmsError(result.error, result.msg);
}
