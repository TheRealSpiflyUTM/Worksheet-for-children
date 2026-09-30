import { createContext, useContext } from "react";

export const PlatformStateContext = createContext(null);

export function usePlatform() {
  const value = useContext(PlatformStateContext);
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider.");
  return value;
}
