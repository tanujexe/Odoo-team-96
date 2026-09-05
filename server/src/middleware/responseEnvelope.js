import { ZodError } from 'zod';

export function responseEnvelopeMiddleware(req, res, next) {
  res.success = (data, meta = undefined, statusCode = 200) => {
    const payload = { data };
    if (meta !== undefined) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  };

  res.fail = (code, message, statusCode = 400, fields = undefined, warnings = undefined) => {
    const errorObj = {
      code,
      message,
    };
    if (fields) errorObj.fields = fields;
    if (warnings) errorObj.warnings = warnings;

    return res.status(statusCode).json({ error: errorObj });
  };

  next();
}

export function notFoundHandler(req, res) {
  return res.fail('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
}

export function errorHandler(err, req, res, next) {
  // Handle malformed JSON body from Express body-parser
  if ((err instanceof SyntaxError || err?.type === 'entity.parse.failed') && err?.status === 400 && 'body' in err) {
    return res.fail('INVALID_JSON', 'Malformed JSON payload provided', 400);
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    const fields = {};
    err.errors.forEach((e) => {
      const fieldName = e.path.join('.');
      fields[fieldName] = e.message;
    });
    return res.fail('VALIDATION_ERROR', 'Invalid request parameters', 400, fields);
  }

  // Custom application error
  if (err.statusCode && err.code) {
    return res.fail(err.code, err.message, err.statusCode, err.fields, err.warnings);
  }

  // Generic server error
  console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err);
  return res.fail('INTERNAL_SERVER_ERROR', 'An unexpected error occurred on the server', 500);
}

