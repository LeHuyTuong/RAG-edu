"use client";

import { Pagination } from "@/components/ui/Pagination";
import { Table, type TableRow } from "@/components/ui/Table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { postModerationItems } from "../mockData";
import type { PostModerationItem, PostModerationStatus } from "../types";

import {
  EmptyState,
  IconButton,
  MaterialIcon,
  ModeratorBadge,
  ModeratorCard,
} from "../components/ModeratorPrimitives";

type ModerationTab = "pending" | "reported" | "history";

const postColumns = [
  { key: "post", label: "BÀI VIẾT" },
  { key: "author", label: "TÁC GIẢ" },
  { key: "reason", label: "LÝ DO / TRẠNG THÁI" },
  { key: "time", label: "THỜI GIAN" },
  { key: "actions", label: "THAO TÁC", align: "right" as const },
] as const;

const pageSize = 3;

const statusMeta: Record<
  PostModerationStatus,
  {
    label: string;
    tone: "primary" | "secondary" | "tertiary" | "error" | "neutral";
  }
> = {
  pending: { label: "Chờ phê duyệt", tone: "secondary" },
  reported: { label: "Đã báo cáo", tone: "tertiary" },
  approved: { label: "Đã duyệt", tone: "primary" },
  hidden: { label: "Đã ẩn", tone: "error" },
  restored: { label: "Đã khôi phục", tone: "secondary" },
  flagged: { label: "Đã gắn cờ", tone: "error" },
};

function updatePostStatus(
  items: PostModerationItem[],
  id: string,
  status: PostModerationStatus,
) {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

export default function ModeratorPostsPage(): React.JSX.Element {
  const [posts, setPosts] = useState(postModerationItems);
  const [activeTab, setActiveTab] = useState<ModerationTab>("pending");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    if (activeTab === "history") {
      return posts.filter((post) =>
        ["approved", "hidden", "restored", "flagged"].includes(post.status),
      );
    }

    return posts.filter((post) => post.status === activeTab);
  }, [activeTab, posts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const visiblePosts = useMemo(
    () =>
      filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredPosts],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const unresolvedCount = posts.filter((post) =>
    ["pending", "reported", "flagged"].includes(post.status),
  ).length;
  const responseTime = "18m";

  const handleStatusChange = useCallback(
    (id: string, status: PostModerationStatus, message: string) => {
      setPosts((current) => updatePostStatus(current, id, status));
      toast.success(message);
    },
    [],
  );

  const postRows: TableRow[] = useMemo(
    () =>
      visiblePosts.map((post) => {
        const status = statusMeta[post.status];

        return {
          id: post.id,
          cells: [
            <div className="flex items-center gap-3" key="post">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-outline-variant bg-secondary-container/20 text-secondary">
                <MaterialIcon name="article" />
              </div>
              <div>
                <p className="max-w-[260px] truncate font-label-md text-label-md text-on-surface">
                  {post.title}
                </p>
                <p className="max-w-[320px] truncate font-label-sm text-label-sm text-on-surface-variant">
                  {post.id} • {post.community}
                </p>
              </div>
            </div>,
            <div className="flex items-center gap-2" key="author">
              <img
                alt={`${post.author} avatar`}
                className="h-6 w-6 rounded-full border border-outline-variant object-cover"
                height={24}
                src={post.avatarUrl}
                width={24}
              />
              <span className="font-body-md text-body-md text-on-surface">
                {post.author}
              </span>
            </div>,
            <div className="flex flex-col gap-1" key="reason">
              <ModeratorBadge tone={status.tone}>{status.label}</ModeratorBadge>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {post.reason} • {post.reports} báo cáo
              </span>
            </div>,
            <span
              className="font-body-md text-body-md text-on-surface-variant"
              key="time"
            >
              {post.reportedAt}
            </span>,
            <div className="flex justify-end gap-2" key="actions">
              {post.status !== "approved" ? (
                <IconButton
                  icon="check_circle"
                  label={`Duyệt ${post.title}`}
                  onClick={() =>
                    handleStatusChange(
                      post.id,
                      "approved",
                      `Đã duyệt ${post.id}`,
                    )
                  }
                  tone="primary"
                />
              ) : null}
              {post.status !== "hidden" ? (
                <IconButton
                  icon="delete"
                  label={`Ẩn ${post.title}`}
                  onClick={() =>
                    handleStatusChange(post.id, "hidden", `Đã ẩn ${post.id}`)
                  }
                  tone="error"
                />
              ) : null}
              {["hidden", "flagged"].includes(post.status) ? (
                <IconButton
                  icon="restore"
                  label={`Khôi phục ${post.title}`}
                  onClick={() =>
                    handleStatusChange(
                      post.id,
                      "restored",
                      `Đã khôi phục ${post.id}`,
                    )
                  }
                  tone="secondary"
                />
              ) : null}
              {post.status !== "flagged" ? (
                <IconButton
                  icon="flag"
                  label={`Gắn cờ ${post.title}`}
                  onClick={() =>
                    handleStatusChange(
                      post.id,
                      "flagged",
                      `Đã gắn cờ ${post.id}`,
                    )
                  }
                  tone="tertiary"
                />
              ) : null}
              <IconButton
                icon="edit"
                label={`Chỉnh sửa ${post.title}`}
                onClick={() =>
                  toast.info(`Mở trạng thái chỉnh sửa cho ${post.id}`)
                }
              />
            </div>,
          ],
        };
      }),
    [handleStatusChange, visiblePosts],
  );

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Kiểm duyệt nội dung
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Quản lý các bài viết cộng đồng và xử lý báo cáo vi phạm.
          </p>
        </div>
        <div className="inline-flex w-full rounded-lg border border-outline-variant bg-surface-container-low p-1 sm:w-auto">
          {[
            { id: "pending", label: "Chờ duyệt" },
            { id: "reported", label: "Đã báo cáo" },
            { id: "history", label: "Lịch sử" },
          ].map((tab) => (
            <button
              className={`flex-1 rounded-md px-4 py-1.5 font-label-md text-label-md transition-colors sm:flex-none ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ModerationTab);
                setCurrentPage(1);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="space-y-gutter lg:col-span-4">
          <ModeratorCard className="rounded-xl p-6">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Tổng quan hôm nay
            </span>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-display text-on-surface">
                {unresolvedCount}
              </span>
              <span className="mb-2 flex items-center font-label-md text-label-md text-error">
                <MaterialIcon className="mr-1 text-[16px]" name="trending_up" />
                +12%
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Yêu cầu chưa xử lý
            </p>
          </ModeratorCard>
          <ModeratorCard className="rounded-xl p-6">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Thời gian phản hồi
            </span>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-display text-on-surface">
                {responseTime.replace("m", "")}
                <span className="text-headline-md">m</span>
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Trung bình trong 24 giờ qua
            </p>
          </ModeratorCard>
          <section className="rounded-xl bg-primary-container p-6 text-on-primary-container">
            <MaterialIcon className="text-3xl" name="lightbulb" />
            <div className="mt-8">
              <h2 className="mb-2 font-label-md text-label-md">
                Mẹo kiểm duyệt nhanh
              </h2>
              <p className="font-body-md text-body-md opacity-80">
                Dùng hàng đợi theo mức báo cáo trước, sau đó xử lý bài chờ duyệt
                thông thường.
              </p>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <ModeratorCard className="overflow-hidden rounded-xl">
            <Table columns={postColumns} rows={postRows} />
            {filteredPosts.length === 0 ? (
              <EmptyState
                description="Các hành động demo sẽ chuyển bài viết sang tab Lịch sử để bạn kiểm tra lại."
                title="Không có bài viết trong nhóm này"
              />
            ) : null}
            <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-6 py-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Hiển thị {visiblePosts.length} trên {filteredPosts.length} yêu
                cầu
              </p>
              <Pagination
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            </div>
          </ModeratorCard>
        </div>
      </div>

      <div className="mt-margin-desktop grid grid-cols-1 gap-gutter md:grid-cols-3">
        <section className="rounded-xl border border-outline-variant p-6 md:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h2 className="mb-2 font-headline-md text-headline-md text-on-surface">
                Cần hỗ trợ kỹ thuật?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Đội kỹ thuật sẵn sàng hỗ trợ các vấn đề liên quan đến hệ thống
                lọc tự động.
              </p>
            </div>
            <button
              className="rounded-lg border border-primary px-6 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary/10"
              type="button"
            >
              Liên hệ Support
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
