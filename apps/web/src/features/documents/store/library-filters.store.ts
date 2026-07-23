import { create } from "zustand";

export type LibrarySortBy = "newest" | "oldest" | "name";

export interface LibraryFilters {
  search: string;
  subjectId: string;
  format: string;
  sortBy: LibrarySortBy;
  page: number;
}

interface LibraryFiltersState {
  filters: LibraryFilters;
  setSearch: (search: string) => void;
  setSubjectId: (subjectId: string) => void;
  setFormat: (format: string) => void;
  setSortBy: (sortBy: LibrarySortBy) => void;
  setPage: (page: number) => void;
}

const initialFilters: LibraryFilters = {
  search: "",
  subjectId: "",
  format: "",
  sortBy: "newest",
  page: 1,
};

export const useLibraryFiltersStore = create<LibraryFiltersState>((set) => ({
  filters: initialFilters,
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search, page: 1 } })),
  setSubjectId: (subjectId) =>
    set((state) => ({ filters: { ...state.filters, subjectId, page: 1 } })),
  setFormat: (format) =>
    set((state) => ({ filters: { ...state.filters, format } })),
  setSortBy: (sortBy) =>
    set((state) => ({ filters: { ...state.filters, sortBy } })),
  setPage: (page) => set((state) => ({ filters: { ...state.filters, page } })),
}));
