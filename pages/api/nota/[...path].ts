import type { NextApiRequest, NextApiResponse } from "next";
import {
  getNotaApiTokenFromRequest,
  getNotaAuthHeaders,
  getNotaServerBaseUrl,
  isNotaApiBaseConfigured,
} from "@/lib/server/nota-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isNotaApiBaseConfigured()) {
    return res.status(503).json({ error: "NOTA API base URL is not configured" });
  }

  const token = await getNotaApiTokenFromRequest(req, res);
  if (!token) {
    return res.status(401).json({ error: "Not signed in" });
  }

  const baseUrl = getNotaServerBaseUrl();
  const pathParam = req.query.path;
  const path = Array.isArray(pathParam) ? pathParam.join("/") : (pathParam ?? "");
  const queryIndex = req.url?.indexOf("?") ?? -1;
  const query = queryIndex >= 0 ? req.url!.slice(queryIndex) : "";
  const targetUrl = `${baseUrl}/${path}${query}`;

  const headers: Record<string, string> = {
    ...(await getNotaAuthHeaders(req, res)),
  };

  if (typeof req.headers["content-type"] === "string") {
    headers["Content-Type"] = req.headers["content-type"];
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: hasBody ? JSON.stringify(req.body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  res.status(response.status);
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }

  if (response.status === 204 || !body) {
    return res.end();
  }

  if (contentType.includes("application/json")) {
    try {
      return res.json(JSON.parse(body));
    } catch {
      return res.send(body);
    }
  }

  return res.send(body);
}
