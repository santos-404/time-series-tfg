import { useState, useEffect, useCallback } from "react";

type Data<T> = T | null;
type ErrorType = Error | null;

interface Params<T> {
  data: Data<T>;
  loading: boolean;
  error: ErrorType;
  refetch: () => Promise<void>;
}

// just added url and jwt. but if more params are
// needed they can be added as params of the hook as well.
export const useFetch = <T,>(url: string, jwt?: string): Params<T> => {
  const [data, setData] = useState<Data<T>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorType>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    // The example of the auth here is a bearer token
    // Obviously this may be used with any type of auth.
    // (even with no auth :v)
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      // This error can be managed as wanted
      if (!response.ok)
        throw new Error(`Error on the response from ${url}`)

      const responseJson: T = await response.json();
      setData(responseJson);
      setError(null);

    } catch (err){
      setError(err as Error)
    } finally {
      setLoading(false);
    }
  }, [url, jwt]);

  useEffect(() => {
    fetchData();
  }, [fetchData])

  return { data, loading, error, refetch: fetchData};
}

