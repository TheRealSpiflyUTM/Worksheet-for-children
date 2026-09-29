import { createContext, useContext } from "react";
export const Context = createContext(null);
export function useApp() {
  return useContext(Context);
}
