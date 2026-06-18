"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ROUTE_PATHS } from "@/routes/router.const";
import { useAuthStore } from "@/stores/auth/store";
import { deleteAccount } from "../api";

export function DangerSection(): React.JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  async function handleDelete() {
    if (!user) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount(user.id);
      logout();
      router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa tài khoản. Vui lòng thử lại.",
      );
      setIsDeleting(false);
    }
  }

  function openModal() {
    setError(null);
    setModalOpen(true);
  }

  return (
    <>
      <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-error">
            delete_forever
          </span>
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              Vùng nguy hiểm
            </h2>
            <p className="text-sm text-on-surface-variant">
              Các thao tác sau không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-error/30 bg-error-container/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label-md text-label-md tracking-normal text-on-surface">
                Xóa tài khoản
              </p>
              <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={openModal}>
              Xóa tài khoản
            </Button>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Modal renders in a fixed overlay so it covers the full viewport */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50">
          <Modal
            open={modalOpen}
            title="Xóa tài khoản?"
            description={`Toàn bộ dữ liệu của tài khoản "${user?.email ?? ""}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
            confirmLabel={isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
            cancelLabel="Hủy"
            onCancel={() => setModalOpen(false)}
            onConfirm={() => void handleDelete()}
          />
        </div>
      ) : null}
    </>
  );
}
