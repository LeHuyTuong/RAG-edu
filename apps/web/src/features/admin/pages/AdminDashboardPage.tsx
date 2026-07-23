"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/Button";
import {
  AdminCard,
  AdminToneIcon,
  MaterialIcon,
} from "@/features/admin/components/AdminPrimitives";

import type { AdminDashboardStats } from "../api/admin.api";
import { useAdminDashboard } from "../hooks/use-admin-dashboard";

const formatCount = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

const buildStats = (stats: AdminDashboardStats) => [
  {
    label: "Tổng tài khoản",
    value: formatCount(stats.accounts?.total ?? 0),
    caption: `${formatCount(stats.accounts?.active ?? 0)} đang hoạt động · ${formatCount(
      stats.accounts?.unverified ?? 0,
    )} chưa xác thực`,
    icon: "group",
    tone: "primary" as const,
    trend: "API",
  },
  {
    label: "Tài khoản bị khóa",
    value: formatCount(stats.accounts?.banned ?? 0),
    caption: "Không bao gồm tài khoản admin và tài khoản đã xóa",
    icon: "block",
    tone: "error" as const,
    trend: "API",
  },
  {
    label: "Giai đoạn",
    value: formatCount(stats.subjects?.total ?? 0),
    caption: "Tổng giai đoạn lịch sử hiện có trong hệ thống",
    icon: "history_edu",
    tone: "secondary" as const,
    trend: "API",
  },
  {
    label: "Tài liệu",
    value: formatCount(stats.documents?.total ?? 0),
    caption: `${formatCount(stats.documents?.pending ?? 0)} chờ duyệt · ${formatCount(
      stats.documents?.rejected ?? 0,
    )} bị từ chối`,
    icon: "description",
    tone: "neutral" as const,
    trend: `${formatCount(stats.documents?.active ?? 0)} active`,
  },
  {
    label: "Doanh thu",
    value: `${formatCount(stats.billing?.totalRevenue ?? 0)} ₫`,
    caption: `${formatCount(stats.billing?.activeSubscriptions ?? 0)} gói đang hoạt động`,
    icon: "payments",
    tone: "tertiary" as const,
    trend: "API",
  },
];

export default function AdminDashboardPage(): React.JSX.Element {
  const {
    data: dashboardStats,
    isError,
    isLoading,
    refetch,
  } = useAdminDashboard();

  const adminStats = useMemo(
    () => (dashboardStats ? buildStats(dashboardStats) : []),
    [dashboardStats],
  );

  const handleExportReport = () => {
    if (!dashboardStats) return;

    const rows = [
      ["Nhóm thống kê", "Chỉ số", "Giá trị"],
      [
        "Tài khoản",
        "Tổng tài khoản",
        (dashboardStats.accounts?.total ?? 0).toString(),
      ],
      [
        "Tài khoản",
        "Đang hoạt động",
        (dashboardStats.accounts?.active ?? 0).toString(),
      ],
      [
        "Tài khoản",
        "Tài khoản bị khóa",
        (dashboardStats.accounts?.banned ?? 0).toString(),
      ],
      [
        "Tài khoản",
        "Chưa xác thực",
        (dashboardStats.accounts?.unverified ?? 0).toString(),
      ],
      [
        "Tài liệu",
        "Tổng tài liệu",
        (dashboardStats.documents?.total ?? 0).toString(),
      ],
      [
        "Tài liệu",
        "Sẵn sàng tra cứu",
        (dashboardStats.documents?.active ?? 0).toString(),
      ],
      [
        "Tài liệu",
        "Đang xử lý/Chờ duyệt",
        (dashboardStats.documents?.pending ?? 0).toString(),
      ],
      [
        "Tài liệu",
        "Bị từ chối",
        (dashboardStats.documents?.rejected ?? 0).toString(),
      ],
      [
        "Giai đoạn",
        "Tổng số giai đoạn",
        (dashboardStats.subjects?.total ?? 0).toString(),
      ],
      [
        "Doanh thu",
        "Tổng doanh thu",
        (dashboardStats.billing?.totalRevenue ?? 0).toString(),
      ],
      [
        "Doanh thu",
        "Gói đang hoạt động",
        (dashboardStats.billing?.activeSubscriptions ?? 0).toString(),
      ],
    ];

    dashboardStats.billing?.revenueChart?.forEach((item) => {
      rows.push(["Doanh thu theo tháng", item.name, item.revenue.toString()]);
    });

    const csvContent =
      "\uFEFF" + rows.map((entry) => entry.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `bao-cao-thong-ke-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-on-surface">
            Bảng điều khiển hệ thống
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Theo dõi người dùng, phiên hoạt động, sức khỏe hệ thống và các tác
            vụ quản trị quan trọng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="inline-flex items-center gap-2 rounded"
            disabled={isLoading}
            onClick={() => void refetch()}
            size="sm"
          >
            <MaterialIcon className="text-[18px]" name="refresh" />
            Đồng bộ
          </Button>
          <Button
            className="inline-flex items-center gap-2 rounded"
            disabled={!dashboardStats || isLoading}
            onClick={handleExportReport}
            size="sm"
            variant="outline"
          >
            <MaterialIcon className="text-[18px]" name="download" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <AdminCard className="p-6" key={index}>
                <div className="flex items-start justify-between gap-4">
                  <div className="h-10 w-10 animate-pulse rounded bg-surface-variant/40" />
                  <div className="h-4 w-12 animate-pulse rounded bg-surface-variant/40" />
                </div>
                <div className="mt-6 h-4 w-28 animate-pulse rounded bg-surface-variant/40" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-surface-variant/30" />
              </AdminCard>
            ))}
          </>
        ) : null}

        {isError ? (
          <div className="rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error md:col-span-2 lg:col-span-3">
            Không thể tải số liệu dashboard.
          </div>
        ) : null}

        {!isLoading && !isError
          ? adminStats.map((stat) => (
              <AdminCard className="p-6" key={stat.label}>
                <div className="flex items-start justify-between gap-4">
                  <AdminToneIcon icon={stat.icon} tone={stat.tone} />
                  <span className="font-label-sm text-label-sm text-primary">
                    {stat.trend}
                  </span>
                </div>
                <p className="mt-6 font-label-md text-label-md text-on-surface-variant tracking-normal">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-normal text-on-surface">
                  {stat.value}
                </p>
                <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant tracking-normal">
                  {stat.caption}
                </p>
              </AdminCard>
            ))
          : null}

        <AdminCard className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-normal text-on-surface">
              Tác vụ nhanh
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              Lối tắt cho các thao tác quản trị thường dùng.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              className="flex min-h-28 flex-col justify-between rounded border border-outline-variant bg-surface p-4 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
              href="/admin/users?action=add"
            >
              <MaterialIcon className="text-primary" name="person_add" />
              <span className="font-label-md text-label-md tracking-normal">
                Thêm người dùng
              </span>
            </Link>
            <Link
              className="flex min-h-28 flex-col justify-between rounded border border-outline-variant bg-surface p-4 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
              href="/admin/settings"
            >
              <MaterialIcon className="text-primary" name="security" />
              <span className="font-label-md text-label-md tracking-normal">
                Cấu hình bảo mật
              </span>
            </Link>
          </div>
        </AdminCard>
      </div>

      <div className="mt-8">
        <AdminCard className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-on-surface">
                Tăng trưởng doanh thu
              </h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
                Thống kê doanh thu theo tháng (Demo).
              </p>
            </div>
            <div className="flex h-10 items-center justify-center rounded-full bg-primary/10 px-4 font-label-sm text-label-sm font-semibold text-primary">
              <MaterialIcon className="mr-2 text-[18px]" name="trending_up" />
              +24% so với tháng trước
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={dashboardStats?.billing?.revenueChart || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={(value: number) =>
                    `${(value / 1000).toLocaleString()}k ₫`
                  }
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} ₫`,
                    "Doanh thu",
                  ]}
                />
                <Area
                  dataKey="revenue"
                  fill="url(#colorRevenue)"
                  fillOpacity={1}
                  stroke="#4F46E5"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
