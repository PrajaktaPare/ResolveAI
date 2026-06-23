/**
 * @file useFetch.js
 * @description Custom React hook to manage asynchronous data-fetching requests.
 * Tracks loading status, returned payload data, network exceptions, and returns a manual retry handler.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import logger from "@/utils/logger";

/**
 * useFetch
 * Helper hook with localized state triggers.
 * 
 * @param {() => Promise<any>} fetcher - Async data resolver function.
 * @param {Array} deps - Dependency list representing trigger configurations.
 * @returns {Object} Data, loading boolean, error context, and manual refetch handler.
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null); // Retained query payload response
  const [loading, setLoading] = useState(true); // Loading progress indicator
  const [error, setError] = useState(null); // Captured operational exceptions
  
  // Store fetcher callback in mutable ref object to avoid stale closure updates
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Stable loading wrapper function
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      logger.error("useFetch error detail:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Trigger load request upon hook mounts or dependency array modifications
  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

