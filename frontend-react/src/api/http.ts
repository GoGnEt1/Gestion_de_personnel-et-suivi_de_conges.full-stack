export const API_URL = "http://127.0.0.1:8000/api";

export function authHeaders(access: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access}`,
  };
}
