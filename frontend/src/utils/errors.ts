export interface NormalizedApiError extends Error {
  status: number;
  details?: string;
}

interface ErrorLike {
  message?: unknown;
  status?: unknown;
  details?: unknown;
}

interface NormalizeApiErrorOptions {
  defaultMessage?: string;
  defaultStatus?: number;
}

const resolveMessage = (message: unknown, fallback: string): string => {
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return fallback;
};

const resolveStatus = (status: unknown, fallback: number): number => {
  if (typeof status === 'number' && Number.isFinite(status)) {
    return status;
  }

  return fallback;
};

export const createApiError = (
  message: string,
  status = 500,
  details?: string
): NormalizedApiError => {
  const error = new Error(message) as NormalizedApiError;
  error.status = status;
  error.details = details;
  return error;
};

export const normalizeApiError = (
  error: unknown,
  options: NormalizeApiErrorOptions = {}
): NormalizedApiError => {
  const defaultMessage = options.defaultMessage ?? 'An unexpected error occurred';
  const defaultStatus = options.defaultStatus ?? 500;

  if (error instanceof Error) {
    const errorLike = error as ErrorLike;
    const normalizedError = createApiError(
      resolveMessage(errorLike.message, defaultMessage),
      resolveStatus(errorLike.status, defaultStatus),
      typeof errorLike.details === 'string' ? errorLike.details : undefined
    );

    normalizedError.name = error.name;
    normalizedError.stack = error.stack;
    return normalizedError;
  }

  if (typeof error === 'string') {
    return createApiError(resolveMessage(error, defaultMessage), defaultStatus);
  }

  if (typeof error === 'object' && error !== null) {
    const errorLike = error as ErrorLike;
    return createApiError(
      resolveMessage(errorLike.message, defaultMessage),
      resolveStatus(errorLike.status, defaultStatus),
      typeof errorLike.details === 'string' ? errorLike.details : undefined
    );
  }

  return createApiError(defaultMessage, defaultStatus);
};
