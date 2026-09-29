export class ApiError extends Error {
  constructor(status, data = {}) {
    super(data.message || "Something went wrong. Please try again.");
    this.status = status;
    this.code = data.code;
    this.fieldErrors = data.fieldErrors || {};
    this.requestId = data.requestId;
  }
}
async function readResponse(response) {
  if (response.status === 204) return null;
  const data = response.headers.get("content-type")?.includes("json")
    ? await response.json()
    : null;
  if (!response.ok) throw new ApiError(response.status, data || {});
  return data;
}
export async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const csrf = await readResponse(
        await fetch("/api/auth/csrf", { credentials: "include" }),
      );
      headers.set(csrf.headerName, csrf.token);
    }
    return await readResponse(
      await fetch(url, { ...options, method, headers, credentials: "include" }),
    );
  } catch (error) {
    if (error.status === 401 && !url.startsWith("/api/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw error;
  }
}
export function send(url, method = "POST", body) {
  return apiRequest(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}
