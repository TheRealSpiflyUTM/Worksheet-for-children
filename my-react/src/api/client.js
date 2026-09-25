async function readResponse(response) {
    if(response.status === 204){
        return null;
    }
    
    const contentType = response.headers.get("content-type");
    const hasJason = contentType?.includes("application/json");

    const data = hasJason 
    ? await response.json()
    : null;

    if(!response.ok){
        throw new Error(data?.message || `The request failed with status ${response.status}.`);
    }

    return data;
}

async function getCsrfToken() {
    const response = await fetch(("/api/auth/csrf"), {
        method: "GET",
        credentials: "include",
    });

    return readResponse(response);
}

export async function apiRequest(url, options = {}){
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers);

    const changesServerState = !["GET", "HEAD", "OPTIONS"].includes(method);

    if(changesServerState) {
        const csrf = await getCsrfToken();
        headers.set(csrf.headerName, csrf.token);
    }

    const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: "include",
    });

    return readResponse(response);

}