"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DocumentDetail } from "@/types/document.type";

import {
  useDisableShareLink,
  useEnableShareLink,
} from "../../hooks/use-document-mutations";

interface ShareCardProps {
  document: DocumentDetail;
}

export function ShareCard({
  document,
}: ShareCardProps): React.JSX.Element | null {
  const enableShareLink = useEnableShareLink();
  const disableShareLink = useDisableShareLink();
  const shareToken = document.shareEnabled
    ? (document.shareToken ?? null)
    : null;
  const loading = enableShareLink.isPending || disableShareLink.isPending;

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`
    : null;

  const handleEnable = useCallback(async () => {
    try {
      await enableShareLink.mutateAsync(document.id);
      toast.success("Đã tạo link chia sẻ");
    } catch {
      toast.error("Không thể tạo link chia sẻ");
    }
  }, [document.id, enableShareLink]);

  const handleDisable = useCallback(async () => {
    try {
      await disableShareLink.mutateAsync(document.id);
      toast.success("Đã tắt chia sẻ");
    } catch {
      toast.error("Không thể tắt chia sẻ");
    }
  }, [disableShareLink, document.id]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép link chia sẻ");
    } catch {
      toast.error("Không thể sao chép link");
    }
  }, [shareUrl]);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-primary">
          share
        </span>
        <h3 className="text-lg font-semibold">Chia sẻ</h3>
      </div>

      {shareUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-outline bg-surface-variant/40 px-3 py-2">
            <span className="flex-1 truncate text-sm text-on-surface-variant">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">
                content_copy
              </span>
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisable}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Đang xử lý..." : "Tắt chia sẻ"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Tạo link chia sẻ để người khác có thể xem tài liệu này mà không cần
            đăng nhập.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleEnable}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Đang tạo..." : "Tạo link chia sẻ"}
          </Button>
        </div>
      )}
    </Card>
  );
}
