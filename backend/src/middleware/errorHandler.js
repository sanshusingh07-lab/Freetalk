import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'req-unknown';

  // Server-side diagnostic logging (full stack and context preserved internally)
  console.error(`[Error ${requestId}] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack
  });

  // Zod schema validation errors
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: errorDetails[0]?.message || "Validation failed.",
      code: "VALIDATION_ERROR",
      requestId,
      errors: errorDetails
    });
  }

  // Authentication & token errors
  if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: "Authentication required or token invalid.",
      code: "UNAUTHORIZED",
      requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
      code: "TOKEN_EXPIRED",
      requestId
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `Uploaded file exceeds maximum allowed size.`,
      code: "FILE_TOO_LARGE",
      requestId
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message?.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid file uploaded.",
      code: "INVALID_FILE",
      requestId
    });
  }

  // Prisma Database Errors — Mask all internal table/column details
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: "A resource with these unique credentials or identifiers already exists.",
      code: "CONFLICT",
      requestId
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: "The requested record could not be found.",
      code: "NOT_FOUND",
      requestId
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: "Operation could not be completed due to related entity dependencies.",
      code: "RELATION_CONSTRAINT",
      requestId
    });
  }

  if (err.name?.includes('Prisma') || (typeof err.code === 'string' && err.code.startsWith('P'))) {
    return res.status(500).json({
      success: false,
      message: "A database error occurred. Your discussions are safe. Please try again later.",
      code: "DATABASE_ERROR",
      requestId
    });
  }

  // Generic and Custom Errors
  const statusCode = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  // Mask 500 messages to prevent stack traces, file paths, or internal leakages
  const message = statusCode === 500
    ? "An unexpected error occurred. Your discussions are safe. Please try again later."
    : (err.message || "An error occurred processing your request.");

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || (statusCode === 500 ? "SERVER_ERROR" : "REQUEST_ERROR"),
    requestId
  });
}
