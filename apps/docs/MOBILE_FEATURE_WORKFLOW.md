# Mobile Feature Development Workflow

Tài liệu này là checklist ngắn giúp dev bắt đầu và hoàn thành một task phát triển tính năng cho app di động trong repo.

## Mục tiêu

- Đảm bảo route/screens trong `src/app` chỉ chứa UI mỏng.
- Di chuyển logic vào `src/features/<domain>` và API vào `src/services`.
- Có checklist kiểm thử và quality checks trước khi PR.

## Khi nhận task

1. Xác định phạm vi: màn hình mới hay thay đổi flow; liệt kê API cần (endpoint, method, payload). Nếu backend chưa rõ, yêu cầu contract hoặc mock.
2. Tạo route UI mỏng trong `src/app` (ví dụ: `src/app/(auth)/login.tsx`).
3. Viết logic trong `src/features/<domain>`:
   - Hook: `use<Feature>` (ví dụ `useAuth`).
   - Validator: `zod`/`yup` cho form.
   - View-model / adapters nếu cần.
4. Tạo API client trong `src/services` (fetch/axios) và sử dụng `EXPO_PUBLIC_API_URL`.
5. Lưu token an toàn bằng `expo-secure-store` (nếu có auth) và expose `useAuth` / Context.
6. Bảo vệ route trong `_layout.tsx` hoặc bằng wrapper (redirect nếu không authenticated).
7. UI/UX: thêm loading, thông báo lỗi, accessibility, và validation.

## Testing & Quality

- Viết unit tests cho hook/service.
- Viết một UI test (RNTL) cho màn quan trọng.
- Chạy:

```bash
pnpm -F mobile lint
pnpm -F mobile check-types
pnpm -F mobile test
```

## PR checklist (trước khi request review)

- [ ] Lint và typecheck xanh.
- [ ] Unit tests có coverage cho logic mới hoặc mocks.
- [ ] Manual test: happy path + error path + token persistence (nếu có).
- [ ] Cập nhật `apps/mobile/README.md` nếu cần hoặc thêm hướng dẫn dev-specific.
- [ ] Mô tả rõ steps để test trong PR description.

## Ví dụ file/folder gợi ý

- Route: `src/app/(auth)/login.tsx`
- Feature logic: `src/features/auth/useAuth.ts`
- API client: `src/services/authClient.ts`
- Storage: `src/store/` hoặc `expo-secure-store` usage inside `useAuth`

## Ghi chú

- Follow team conventions in `apps/docs/CONTRIBUTING.md` and `apps/docs/NAMING_CONVENTIONS.md`.
- Nếu cần refresh-token flow, thảo luận với backend và implement interceptor (axios) ở `src/services`.
