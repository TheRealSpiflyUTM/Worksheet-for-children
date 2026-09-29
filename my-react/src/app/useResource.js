import { useCallback, useEffect, useState } from "react";
export function useResource(loader, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setState((s) => ({ ...s, error: null, loading: true }));
        return loader();
      })
      .then(
        (data) => {
          if (active) setState({ data, error: null, loading: false });
        },
        (error) => {
          if (active) setState((s) => ({ ...s, error, loading: false }));
        },
      );
    return () => {
      active = false;
    };
    // Callers declare the primitive values their loader depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision]);
  return {
    ...state,
    reload,
    setData: (data) => setState((s) => ({ ...s, data })),
  };
}
