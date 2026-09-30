import { useCallback, useEffect, useState } from "react";

export function useResource(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(loader)
      .then(
        (data) => active && setState({ data, error: null, loading: false }),
        (error) => active && setState((current) => ({ ...current, error, loading: false }))
      );
    return () => { active = false; };
    // Callers explicitly provide the primitive dependencies used by loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision]);

  return { ...state, reload, setData: (data) => setState({ data, error: null, loading: false }) };
}
