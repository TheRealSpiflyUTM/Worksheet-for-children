import { apiRequest } from "./client.js";

export function login(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}