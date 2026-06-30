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
  renameFolder,
  deleteFolder,
  type FolderResponse,
} from "@/apis/folder.api";

export default function FoldersPage(): React.JSX.Element {
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [renameTarget, setRenameTarget] = useState<FolderResponse | null>(null);
  const [renameName, setRenameName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FolderResponse | null>(null);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFolders();
      setFolders(data);
    } catch {
      toast.error("Không thể tải danh sách thư mục");
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
    } catch {
      toast.error("Không thể tạo thư mục");
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      await renameFolder(String(renameTarget.id), {
        folderName: renameName.trim(),
      });
      toast.success("Đã đổi tên thư mục");
      setRenameTarget(null);
      setRenameName("");
      loadFolders();
    } catch {
      toast.error("Không thể đổi tên thư mục");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFolder(String(deleteTarget.id));
      toast.success("Đã xóa thư mục");
      setDeleteTarget(null);
      loadFolders();
    } catch {
      toast.error("Không thể xóa thư mục");
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
              className="block"
            >
              <Card className="p-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      folder
                    </span>
                    <div>
                      <h3 className="font-semibold text-on-surface">
                        {folder.folderName}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {folder.documentCount} tài liệu
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant"
                      onClick={() => {
                        setRenameTarget(folder);
                        setRenameName(folder.folderName);
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-surface-variant text-error"
                      onClick={() => setDeleteTarget(folder)}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
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

      {/* Rename modal */}
      <Modal
        open={renameTarget !== null}
        title="Đổi tên thư mục"
        description="Nhập tên mới cho thư mục"
        confirmLabel="Lưu"
        cancelLabel="Hủy"
        onCancel={() => {
          setRenameTarget(null);
          setRenameName("");
        }}
        onConfirm={handleRename}
      >
        <div className="mb-4">
          <InputField
            label="Tên thư mục"
            placeholder="Tên mới"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        title="Xóa thư mục"
        description={`Bạn có chắc muốn xóa thư mục "${deleteTarget?.folderName}"? Tài liệu trong thư mục sẽ không bị xóa.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
