import axios from "axios";

/**
 * getErrorMessage
 * ─────────────────────────────────────────────────────────────────────────
 * Maps any caught error (Axios or otherwise) to a fixed, user-facing
 * Vietnamese message based on the HTTP status code.
 *
 * Why this exists:
 *   Raw backend error messages (e.g. "Request failed with status code 401",
 *   or a Prisma/Nest validation string) are technical, inconsistent, and
 *   sometimes leak implementation details. They should never be shown
 *   directly to the user.
 *
 * Why axios.isAxiosError() instead of `instanceof AxiosError`:
 *   In a monorepo with multiple packages, more than one copy of `axios`
 *   can end up in node_modules. `instanceof` compares against a specific
 *   class reference and silently returns false if the error was thrown by
 *   a *different* copy of axios than the one imported here — causing this
 *   function to fall through to DEFAULT_MESSAGE (or worse, the caller's
 *   raw err.message gets shown instead). `axios.isAxiosError()` is a
 *   duck-typed static check (`error?.isAxiosError === true`) that works
 *   correctly regardless of which axios instance threw the error.
 *
 * Usage:
 *   try {
 *     await someApiCall();
 *   } catch (err) {
 *     console.error("someApiCall failed:", err); // for debugging only
 *     setError(getErrorMessage(err, { 401: "Email hoặc mật khẩu không đúng." }));
 *   }
 *
 * @param err - the caught error (unknown)
 * @param overrides - optional per-status overrides for this specific call site.
 *   Use this when the same status code means something different depending
 *   on context (e.g. 401 on login = "wrong credentials", but 401 elsewhere
 *   = "session expired").
 */

/** Generic fallback messages by HTTP status code. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
  401: "Bạn cần đăng nhập để thực hiện hành động này.",
  403: "Bạn không có quyền thực hiện hành động này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  409: "Dữ liệu đã tồn tại hoặc bị xung đột.",
  413: "Tệp tải lên quá lớn.",
  422: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  429: "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.",
  500: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
  502: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
  503: "Hệ thống đang bảo trì. Vui lòng thử lại sau.",
};

/** Used when nothing else matches. */
const DEFAULT_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại.";

/** Used when the request never reached the server. */
const NETWORK_MESSAGE =
  "Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.";

export function getErrorMessage(
  err: unknown,
  overrides: Partial<Record<number, string>> = {},
): string {
  if (axios.isAxiosError(err)) {
    // Request was made but no response was received (offline, CORS, timeout...)
    if (!err.response) {
      return NETWORK_MESSAGE;
    }

    const status = err.response.status;
    return overrides[status] ?? STATUS_MESSAGES[status] ?? DEFAULT_MESSAGE;
  }

  return DEFAULT_MESSAGE;
}
