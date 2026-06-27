import { NextRequest, NextResponse } from "next/server";
import {
  getNotaApiToken,
  getNotaAuthHeaders,
  getNotaServerBaseUrl,
  isNotaApiBaseConfigured,
} from "@/lib/server/nota-api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyNotaRequest(request: NextRequest, context: RouteContext) {
  try {
    if (!isNotaApiBaseConfigured()) {
      return NextResponse.json({ error: "NOTA API base URL is not configured" }, { status: 503 });
    }

    const token = await getNotaApiToken();
    if (!token) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { path: pathSegments } = await context.params;
    const path = pathSegments.join("/");
    const baseUrl = getNotaServerBaseUrl();
    const targetUrl = `${baseUrl}/${path}${request.nextUrl.search}`;

    const headers: Record<string, string> = {
      ...(await getNotaAuthHeaders()),
    };

    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
    });

    const responseContentType = response.headers.get("content-type") ?? "";
    const body = await response.text();

    if (response.status === 204 || !body) {
      return new NextResponse(null, { status: response.status });
    }

    if (responseContentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(body), {
          status: response.status,
          headers: responseContentType ? { "Content-Type": responseContentType } : undefined,
        });
      } catch {
        return new NextResponse(body, {
          status: response.status,
          headers: responseContentType ? { "Content-Type": responseContentType } : undefined,
        });
      }
    }

    return new NextResponse(body, {
      status: response.status,
      headers: responseContentType ? { "Content-Type": responseContentType } : undefined,
    });
  } catch (error) {
    console.error("[nota proxy]", error);
    return NextResponse.json({ error: "NOTA proxy request failed" }, { status: 502 });
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}

export function HEAD(request: NextRequest, context: RouteContext) {
  return proxyNotaRequest(request, context);
}
