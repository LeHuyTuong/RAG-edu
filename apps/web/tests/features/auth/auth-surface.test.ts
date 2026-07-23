import { API_ENDPOINTS } from "@/shared/constants";
import { AUTH_ROUTES } from "@/routes/user/user.auth.routes";

test("exposes only backend-supported auth endpoints and routes", () => {
  expect(Object.keys(API_ENDPOINTS.AUTH)).toEqual([
    "LOGIN",
    "REGISTER",
    "LOGOUT",
    "REFRESH",
    "ME",
  ]);
  expect(AUTH_ROUTES).toEqual(["/login", "/register"]);
});
