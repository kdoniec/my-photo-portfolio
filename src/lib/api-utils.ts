import type { ErrorResponseDTO } from "../types";

/**
 * Creates a JSON response with proper headers
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponseDTO = {
    error: { code, message, ...(details && { details }) },
  };
  return jsonResponse(body, status);
}
