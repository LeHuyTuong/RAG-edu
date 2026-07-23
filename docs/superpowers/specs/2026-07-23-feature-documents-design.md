# Feature-Based Documents Slice Design

## Goal

Refactor the user-facing document domain into a `src/features/documents`
boundary without changing the URLs or rendered UI of the public library,
document-detail, and my-documents screens. React Query owns document and
subject server state. Zustand is restricted to library UI filters, pagination,
and sort selection.

## Scope

Included:

- `/library`: public document listing, filters, sort controls, pagination, and
  subject list.
- `/documents/[id]`: document detail, related-document list, protected file
  preview, and the existing share control.
- `/my-documents`: the owner's list, status filter, edit, soft delete, restore,
  and hard-delete actions.

Excluded:

- Document management in the admin and moderator portals; that moves in the
  later admin/moderator vertical slice.
- Upload and Cloudinary orchestration; that belongs to the upload/RAG slice.
- The public `/share/[token]` route, folders, and home-page carousels. They may
  continue using a temporary compatibility API export until their owning slice
  is migrated.

## Backend contract

The Spring backend provides the endpoints consumed by this slice:

- `GET /api/v1/documents` with `search`, `subjectId`, `status`, `onlyMine`,
  `page`, and `limit`.
- `GET /api/v1/documents/{id}` and protected `{id}/file` / `{id}/download`.
- `GET /api/v1/documents/me`.
- `PATCH` and `DELETE /api/v1/documents/{id}`, plus `{id}/restore` and
  `{id}/hard`.
- `GET /api/v1/subjects`.
- `POST` and `DELETE /api/v1/documents/{id}/share`.

Every current document control in the three scoped screens has a matching
backend endpoint. No document UI is removed in this slice.

## Target structure

```text
src/features/documents/
├── api/documents.api.ts        # Document and subject HTTP calls
├── documents.keys.ts           # Stable React Query keys
├── hooks/
│   ├── use-library-documents.ts
│   ├── use-document-detail.ts
│   ├── use-my-documents.ts
│   ├── use-document-mutations.ts
│   └── use-subjects.ts
├── store/library-filters.store.ts
├── lib/document-list.ts        # Query normalization and display filtering
├── components/                 # Moved presentation-only library components
├── pages/LibraryPage.tsx
└── index.ts
```

`src/apis/document.api.ts` remains a compatibility re-export while consumers
outside this slice still use it. The old `modules/library/store/useLibraryStore`
is removed only after all library presentation consumers use the new UI store.

## Data flow

### Library

`library-filters.store` keeps only transient UI state: search text, subject,
format, sort order, and page. `useLibraryDocuments` turns those values into a
normalized backend query. Search and subject are sent to `GET /documents`; the
format filter and sort preserve their existing client-side behavior on the
returned page. `useSubjects` provides a shared cached subject list.

The library page and its toolbar/grid render hook results and issue only filter
actions. They do not call Axios, own a loading flag, or initiate fetches.

### Detail

`useDocumentDetail(id)` owns the document record. Related documents use the
same document-list hook keyed by the document's subject and are filtered to
preserve the current public-or-owner rule. File preview remains a local effect
because it creates and revokes an object URL; it depends on the query result and
the session access token, not on direct detail fetching. Share enable/disable
becomes a React Query mutation and updates the cached detail record.

### My documents

`useMyDocuments` owns list loading by page and status. The existing local modal
selection, confirmation dialogs, editing mode, and table search/sort remain
component state because they are UI-only. Update, soft delete, restore, and
hard-delete mutations invalidate the relevant my-documents, library, and detail
queries. This preserves the current re-fetch behavior without duplicating server
state in the page.

## Error, loading, and cache behavior

- Existing skeletons, error messages, empty states, buttons, labels, and page
  layouts are retained.
- Subjects degrade gracefully if they fail to load, exactly as today.
- Query keys distinguish public lists, owner lists, details, and subjects so an
  owner update cannot show stale data in the detail or library view.
- Mutations retain the current Vietnamese toast/dialog behavior and expose
  pending state through existing button props.

## Testing

- Unit-test query-key construction and query normalization.
- Add hook tests proving library and owner queries call their feature API with
  normalized input, and mutations invalidate document caches.
- Add a library UI boundary test proving the page reads React Query data and the
  Zustand filter store has no document array/loading/fetch methods.
- Keep existing document preview and download tests unchanged.

## Compatibility and migration order

1. Add the document feature API, keys, query hooks, and filter-only store.
2. Migrate the library route/page/components, then delete its legacy data store.
3. Migrate document detail and share controls.
4. Migrate my-documents queries and mutations.
5. Leave a narrow `src/apis/document.api.ts` re-export for non-slice consumers
   until upload/RAG and admin/moderator are migrated.

This keeps URLs and visuals stable while giving every scoped server-state path a
single React Query owner.
