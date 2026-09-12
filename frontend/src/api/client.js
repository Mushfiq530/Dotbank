const BASE = "/api";

// Cached in memory for the life of the tab. Refetched automatically if a
// request comes back 403 (e.g. token expired because the session did).
let csrfToken = null;

async function fetchCsrfToken() {
  const res = await fetch(`${BASE}/csrf-token`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  csrfToken = data.csrfToken ?? null;
  return csrfToken;
}

async function request(path, options = {}, _retried = false) {
  const method = (options.method || "GET").toUpperCase();
  const isMutating = method !== "GET" && method !== "HEAD";

  if (isMutating && !csrfToken) {
    await fetchCsrfToken();
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // send the PHP session cookie
    headers: {
      "Content-Type": "application/json",
      ...(isMutating && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    ...options,
  });

  // If the token was stale (e.g. session just started, or expired),
  // refetch once and retry the request a single time.
  if (res.status === 403 && isMutating && !_retried) {
    await fetchCsrfToken();
    return request(path, options, true);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// Separate from request() because file uploads use multipart/form-data —
// the browser needs to set its own Content-Type header (with the boundary),
// so we must NOT send the JSON Content-Type the other methods use.
async function upload(path, formData, _retried = false) {
  if (!csrfToken) {
    await fetchCsrfToken();
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
    body: formData,
  });

  if (res.status === 403 && !_retried) {
    await fetchCsrfToken();
    return upload(path, formData, true);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => upload(path, formData),
};
