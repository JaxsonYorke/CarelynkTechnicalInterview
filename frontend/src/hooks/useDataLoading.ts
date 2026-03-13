import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface DataLoadingError {
  status: number;
  message: string;
}

interface UseDataLoadingOptions<T, E> {
  initialData: T;
  enabled?: boolean;
  mapError?: (error: unknown) => E;
}

interface UseDataLoadingResult<T, E> {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  loading: boolean;
  error: E | null;
  setError: Dispatch<SetStateAction<E | null>>;
  reload: () => Promise<void>;
}

export const toDataLoadingError = (
  error: unknown,
  fallbackMessage: string
): DataLoadingError => {
  if (error instanceof Error) {
    const typedError = error as Error & { status?: number };
    return {
      status: typedError.status ?? 500,
      message: typedError.message || fallbackMessage,
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
};

const defaultErrorMapper = (error: unknown): DataLoadingError =>
  toDataLoadingError(error, 'Failed to load data');

export const useDataLoading = <T, E = DataLoadingError>(
  fetchData: () => Promise<T>,
  options: UseDataLoadingOptions<T, E>
): UseDataLoadingResult<T, E> => {
  const {
    initialData,
    enabled = true,
    mapError = defaultErrorMapper as (error: unknown) => E,
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<E | null>(null);
  const mapErrorRef = useRef(mapError);

  useEffect(() => {
    mapErrorRef.current = mapError;
  }, [mapError]);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData();
      setData(result);
    } catch (fetchError) {
      setError(mapErrorRef.current(fetchError));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    setData,
    loading,
    error,
    setError,
    reload,
  };
};
