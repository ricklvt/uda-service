export class HttpError extends Error {
  private readonly statusCode: number;

  constructor(msg: string, statusCode: number, options?: ErrorOptions) {
    super(msg, options);
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(msg: string, options?: ErrorOptions) {
    super(msg, 401, options);
  }
}

export class ForbiddenError extends HttpError {
  constructor(msg: string, options?: ErrorOptions) {
    super(msg, 403, options);
  }
}

export class InternalError extends HttpError {
  constructor(msg: string, options?: ErrorOptions) {
    super(msg, 500, options);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(msg: string, options?: ErrorOptions) {
    super(msg, 503, options);
  }
}
