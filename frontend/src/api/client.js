const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // send the PHP session cookie
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// Separate from request() because file uploads use multipart/form-data —
// the browser needs to set its own Content-Type header (with the boundary),
// so we must NOT send the JSON Content-Type the other methods use.
async function upload(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
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