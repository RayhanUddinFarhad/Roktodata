// An error that is safe to show to the client as-is. `code` lets the frontend react to
// specific cases (e.g. "DUPLICATE_REQUEST") without parsing the message.
export class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
