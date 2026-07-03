"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import {
  createFolder,
  listFolders,
  type FolderResponse,
} from "@/apis/folder.api";
import { getErrorMessage } from "@/utils/error";

export default function FoldersPage(): React.JSX.Element {
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder({ folderName: newName.trim() });
      toast.success("Đã tạo thư mục");
      setCreateOpen(false);
      setNewName("");
      loadFolders();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thư mục</h1>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tạo thư mục
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-surface-variant animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-4">
            folder_off
          </span>
          <p className="mb-4">Chưa có thư mục nào</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Tạo thư mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/folders/${folder.id}`}
              aria-label={`Mở thư mục ${folder.folderName}`}
              className="group block cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Card className="p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/60 group-hover:bg-primary-fixed/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary transition-transform duration-200 group-hover:scale-110">
                      folder
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-on-surface">
                        {folder.folderName}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {folder.documentCount} tài liệu
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary">
                    arrow_forward
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Tạo thư mục mới"
        description="Nhập tên cho thư mục mới"
        confirmLabel="Tạo"
        cancelLabel="Hủy"
        onCancel={() => {
          setCreateOpen(false);
          setNewName("");
        }}
        onConfirm={handleCreate}
      >
        <div className="mb-4">
          <InputField
            label="Tên thư mục"
            placeholder="Ví dụ: Giải tích 1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
