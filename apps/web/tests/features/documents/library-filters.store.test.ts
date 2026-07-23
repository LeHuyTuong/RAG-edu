import { useLibraryFiltersStore } from "@/features/documents/store/library-filters.store";

beforeEach(() => {
  useLibraryFiltersStore.setState({
    filters: {
      search: "",
      subjectId: "",
      format: "",
      sortBy: "newest",
      page: 1,
    },
  });
});

test("keeps library documents out of the Zustand filter store", () => {
  const state = useLibraryFiltersStore.getState();

  expect(state).toHaveProperty("filters");
  expect(state).not.toHaveProperty("documents");
  expect(state).not.toHaveProperty("isLoading");
  expect(state).not.toHaveProperty("fetchDocuments");
});

test("resets the page when a server-side library filter changes", () => {
  useLibraryFiltersStore.getState().setPage(3);
  useLibraryFiltersStore.getState().setSearch("kháng chiến");

  expect(useLibraryFiltersStore.getState().filters).toMatchObject({
    search: "kháng chiến",
    page: 1,
  });
});
