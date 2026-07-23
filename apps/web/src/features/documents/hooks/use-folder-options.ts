import { useQuery } from "@tanstack/react-query";

import { listFolders } from "@/apis/folder.api";

const folderOptionKey = ["folders", "options"] as const;

export function useFolderOptions() {
  return useQuery({
    queryKey: folderOptionKey,
    queryFn: listFolders,
  });
}
