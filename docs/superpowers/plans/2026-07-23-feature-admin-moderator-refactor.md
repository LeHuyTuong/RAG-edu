# Admin Feature and Moderator Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all backend-supported administration screens into a feature-owned React Query slice and remove the unsupported Moderator surface from the application.

**Architecture:** `src/features/admin` owns admin endpoint functions, response normalization, query keys and React Query hooks. Admin pages retain their presentational markup and UI-only `useState`, while document review actions are owned by `src/features/documents` because they operate on the document resource. Route files remain thin re-exports. The dashboard is copied with the user's null-safe API fallbacks and the edited legacy source is left untouched.

**Tech Stack:** Next.js App Router, TypeScript, TanStack React Query, Axios shared client, Zustand auth state, Vitest, Testing Library.

## Global Constraints

- Preserve the visual structure and Vietnamese UI copy of supported Admin screens.
- Do not place server fetching or endpoint calls in display components.
- Use React Query for every Admin server-state read and mutation; keep dialog, filters, pagination, and drafts in local React state.
- Do not display product functionality without a backend endpoint.
- Keep shared infrastructure under `src/shared` and global CSS under `src/styles`.
- Do not stage the user's existing `apps/web/src/modules/admin/pages/AdminDashboardPage.tsx` change.

---

### Task 1: Create the Admin API and query boundary

**Files:**

- Create: `apps/web/src/features/admin/api/admin.api.ts`
- Create: `apps/web/src/features/admin/api/admin.mapper.ts`
- Create: `apps/web/src/features/admin/hooks/use-admin-dashboard.ts`
- Create: `apps/web/src/features/admin/hooks/use-admin-accounts.ts`
- Create: `apps/web/src/features/admin/hooks/use-admin-subjects.ts`
- Create: `apps/web/src/features/admin/hooks/use-admin-billing-plans.ts`
- Create: `apps/web/src/features/admin/hooks/use-admin-config.ts`
- Create: `apps/web/src/features/admin/index.ts`
- Test: `apps/web/tests/features/admin/admin.api.test.ts`
- Test: `apps/web/tests/features/admin/admin-hooks.test.tsx`

**Interfaces:**

- Consumes: `apiClient`, `API_ENDPOINTS`, existing backend payloads from `modules/admin/api.ts`.
- Produces: `adminApi`, `adminQueryKeys`, query hooks and mutation hooks for dashboard, accounts, subjects, billing plans and config.

- [ ] **Step 1: Write failing API-boundary tests**

```ts
it("maps the dashboard endpoint through the shared client", async () => {
  mockedApiClient.get.mockResolvedValue(dashboardResponse);

  await expect(adminApi.getDashboard()).resolves.toEqual(dashboardResponse);
  expect(mockedApiClient.get).toHaveBeenCalledWith(
    API_ENDPOINTS.ADMIN.DASHBOARD,
  );
});

it("invalidates the account list after toggling a ban", async () => {
  const { result } = renderHook(() => useToggleAdminAccountBan(), { wrapper });
  await result.current.mutateAsync("7");
  expect(queryClient.getQueryState(adminQueryKeys.accounts())).toBeUndefined();
});
```

- [ ] **Step 2: Run the tests and verify red**

Run: `pnpm --filter web test -- admin.api admin-hooks`

Expected: FAIL because `features/admin` API and hooks do not exist.

- [ ] **Step 3: Implement the API and React Query hooks**

```ts
export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  accounts: (params = {}) =>
    [...adminQueryKeys.all, "accounts", params] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: adminApi.getDashboard,
  });
}

export function useToggleAdminAccountBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.toggleAccountBan,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }),
  });
}
```

- [ ] **Step 4: Run focused tests and typecheck**

Run: `pnpm --filter web test -- admin.api admin-hooks; pnpm --filter web check-types`

Expected: tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/admin apps/web/tests/features/admin
git commit -m "refactor(web): add admin feature api"
```

### Task 2: Move the Admin dashboard to the feature slice

**Files:**

- Create: `apps/web/src/features/admin/pages/AdminDashboardPage.tsx`
- Modify: `apps/web/src/app/(main)/admin/page.tsx`
- Test: `apps/web/tests/features/admin/admin-dashboard-page.test.tsx`

**Interfaces:**

- Consumes: `useAdminDashboard` and `AdminDashboardStats` from Task 1.
- Produces: a route-facing Admin dashboard with no direct API import or fetch effect.

- [ ] **Step 1: Write a failing component-boundary test**

```ts
it("renders dashboard data supplied by the admin query hook", () => {
  mockUseAdminDashboard.mockReturnValue({ data: dashboardResponse, isLoading: false, isError: false });
  render(<AdminDashboardPage />);
  expect(screen.getByText("Tổng tài khoản")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify red**

Run: `pnpm --filter web test -- admin-dashboard-page`

Expected: FAIL because the feature page does not exist.

- [ ] **Step 3: Copy the current dashboard markup into the feature page**

Use `useAdminDashboard()` for server data and `refetch()` for the existing refresh action. Preserve the user's `?.` / `?? 0` fallback behavior in stat cards, CSV export and chart data. Do not edit or stage `modules/admin/pages/AdminDashboardPage.tsx`.

- [ ] **Step 4: Make the app route a thin re-export and verify**

```ts
export { default } from "@/features/admin/pages/AdminDashboardPage";
```

Run: `pnpm --filter web test -- admin-dashboard-page; pnpm --filter web lint; pnpm --filter web check-types`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/admin/pages/AdminDashboardPage.tsx 'apps/web/src/app/(main)/admin/page.tsx' apps/web/tests/features/admin/admin-dashboard-page.test.tsx
git commit -m "refactor(web): move admin dashboard into feature"
```

### Task 3: Move supported Admin management screens

**Files:**

- Create: `apps/web/src/features/admin/pages/AdminUserManagementPage.tsx`
- Create: `apps/web/src/features/admin/pages/AdminSubjectManagementPage.tsx`
- Create: `apps/web/src/features/admin/pages/AdminBillingPlanManagementPage.tsx`
- Create: `apps/web/src/features/admin/pages/AdminSystemSettingsPage.tsx`
- Create: `apps/web/src/features/admin/components/AdminPrimitives.tsx`
- Create: `apps/web/src/features/admin/components/AdminShell.tsx`
- Modify: corresponding `apps/web/src/app/(main)/admin/**/page.tsx` routes and `layout.tsx`
- Test: `apps/web/tests/features/admin/admin-management-pages.test.tsx`

**Interfaces:**

- Consumes: query/mutation hooks from Task 1.
- Produces: supported Admin screens without `modules/admin/api.ts`, `useEffect` fetches or component-owned request state.

- [ ] **Step 1: Write failing management-page tests**

```ts
it("shows only backend-supported account roles", () => {
  render(<AdminUserManagementPage />);
  expect(screen.queryByText("Kiểm duyệt viên")).not.toBeInTheDocument();
});

it("uses the billing plan query result for the plan table", () => {
  mockUseAdminBillingPlans.mockReturnValue({ data: [plan], isLoading: false });
  render(<AdminBillingPlanManagementPage />);
  expect(screen.getByText(plan.name)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests and verify red**

Run: `pnpm --filter web test -- admin-management-pages`

Expected: FAIL because feature pages and query dependencies do not exist.

- [ ] **Step 3: Move each page and replace request state with query state**

Keep drafts, modal visibility, table filters and client pagination in `useState`. Replace direct `fetchAdmin*` calls with hooks. Use mutation `isPending` for buttons and invalidate affected query keys on success. Keep only `ADMIN` and `USER` in account controls; omit Moderator from labels and create options.

- [ ] **Step 4: Keep only backend-supported fields**

Retain all six config fields from `SettingUpdateRequest`, all backend billing fields, and Subject name/code. Do not render school, moderator, analytics, or other unsupported controls.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `pnpm --filter web test -- admin-management-pages; pnpm --filter web lint; pnpm --filter web check-types`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/admin 'apps/web/src/app/(main)/admin' apps/web/tests/features/admin/admin-management-pages.test.tsx
git commit -m "refactor(web): move admin management into feature"
```

### Task 4: Move Admin document review to feature-owned data hooks

**Files:**

- Create: `apps/web/src/features/admin/pages/AdminDocumentManagementPage.tsx`
- Create: `apps/web/src/features/admin/pages/AdminDocumentDetailPage.tsx`
- Create: `apps/web/src/features/documents/components/RejectDocumentModal.tsx`
- Create: `apps/web/src/features/documents/hooks/use-document-moderation.ts`
- Modify: `apps/web/src/features/documents/api/document.api.ts`
- Modify: `apps/web/src/features/documents/index.ts`
- Modify: Admin document route wrappers
- Test: `apps/web/tests/features/admin/admin-document-management.test.tsx`

**Interfaces:**

- Consumes: `useLibraryDocuments`, document detail hooks and new `useApproveDocument`, `useRejectDocument`, `useReclassifyDocument`, delete/restore mutations.
- Produces: document review UI with no `fetchDocuments` or direct API import in a page component.

- [ ] **Step 1: Write failing mutation/cache test**

```ts
it("invalidates document queries after approving a document", async () => {
  const { result } = renderHook(() => useApproveDocument(), { wrapper });
  await result.current.mutateAsync("9");
  expect(mockedApiClient.post).toHaveBeenCalledWith(
    "/api/v1/documents/9/approve",
  );
});
```

- [ ] **Step 2: Run the test and verify red**

Run: `pnpm --filter web test -- admin-document-management`

Expected: FAIL because moderation hooks do not exist.

- [ ] **Step 3: Add resource-owned document moderation API/hooks**

```ts
export function useApproveDocument() {
  return useDocumentMutation((id: string) => documentApi.approve(id));
}
```

Invalidate the existing document query key family after every review, reclassification, delete, restore or permanent-delete mutation.

- [ ] **Step 4: Move the pages and shared reject modal**

Use document queries/mutations in the Admin pages. Keep the RAG assistant because `/api/v1/rag/chat` exists; import it through `features/rag`, not the legacy API path. Do not retain an import from `modules/moderator`.

- [ ] **Step 5: Run focused tests and commit**

Run: `pnpm --filter web test -- admin-document-management; pnpm --filter web check-types`

```bash
git add apps/web/src/features/admin apps/web/src/features/documents 'apps/web/src/app/(main)/admin/documents' apps/web/tests/features/admin/admin-document-management.test.tsx
git commit -m "refactor(web): move admin document review into feature"
```

### Task 5: Remove unsupported Moderator routes and code

**Files:**

- Delete: `apps/web/src/app/(main)/moderator/**`
- Delete: `apps/web/src/modules/moderator/**`
- Delete: `apps/web/src/routes/moderator/**`
- Modify: `apps/web/src/constants/nav.const.ts`
- Modify: `apps/web/src/routes/router.const.ts`
- Modify: `apps/web/src/routes/index.ts`
- Modify: `apps/web/src/features/auth/lib/auth.mapper.ts`
- Modify: `apps/web/src/features/auth/lib/auth.redirect.ts`
- Modify: `apps/web/src/features/auth/guards/role.guard.ts`
- Modify: `apps/web/src/types/index.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/ui/UserInfo.tsx`
- Modify: `apps/web/src/routes/README.md`
- Test: `apps/web/tests/features/admin/moderator-surface.test.ts`

**Interfaces:**

- Consumes: backend role values `ADMIN` and `USER` and no moderator endpoint.
- Produces: no visible Moderator navigation, route wrapper, auth redirect or mock portal.

- [ ] **Step 1: Write the failing no-Moderator-surface test**

```ts
it("does not publish a Moderator route or navigation item", () => {
  expect(ROUTE_PATHS).not.toHaveProperty("MODERATOR");
  expect(ADMIN_NAV_ITEMS.map((item) => item.href)).not.toContain("/moderator");
});
```

- [ ] **Step 2: Run the test and verify red**

Run: `pnpm --filter web test -- moderator-surface`

Expected: FAIL because moderator route configuration remains.

- [ ] **Step 3: Delete unsupported UI and simplify auth routing**

Remove Moderator app routes, nav items, router exports and modules. Map backend roles only to frontend `admin` or `user` identities. Remove Moderator-specific profile badges and landing-page destinations. Preserve the Admin reject dialog through Task 4's document component.

- [ ] **Step 4: Run focused tests and source scan**

Run: `pnpm --filter web test -- moderator-surface; rg -n -i "moderator" apps/web/src`

Expected: tests pass; remaining occurrences are only intentional migration documentation, otherwise remove them.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src apps/web/tests/features/admin/moderator-surface.test.ts
git commit -m "refactor(web): remove unsupported moderator portal"
```

### Task 6: Document architecture and verify the full web application

**Files:**

- Modify: `apps/web/README.md`
- Modify: `apps/web/tests/features/feature-boundaries.test.ts`

**Interfaces:**

- Consumes: final `features/admin`, `features/documents`, `features/rag`, `features/upload` boundaries.
- Produces: documented architecture and test-enforced migration boundary.

- [ ] **Step 1: Write a failing feature-boundary assertion**

```ts
expect(readme).toContain("src/features/admin");
expect(readme).not.toContain("Moderator portal");
```

- [ ] **Step 2: Run the test and verify red**

Run: `pnpm --filter web test -- feature-boundaries`

Expected: FAIL until the README documents the Admin feature and removed Moderator surface.

- [ ] **Step 3: Update the README and test**

Document `features/admin` and state that Moderator is deliberately absent until a supported backend role/API exists.

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/README.md apps/web/tests/features/feature-boundaries.test.ts
git commit -m "docs(web): document admin feature boundary"
```
