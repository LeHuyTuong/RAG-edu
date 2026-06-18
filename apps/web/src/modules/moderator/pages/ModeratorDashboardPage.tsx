import Link from "next/link";
import {
  dashboardStats,
  recentActivities,
  weeklyDocumentFlow,
} from "../mockData";

import { MaterialIcon, ModeratorCard } from "../components/ModeratorPrimitives";

const statToneClasses = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
} as const;

const activityToneClasses = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  error: "bg-error",
  tertiary: "bg-tertiary",
} as const;

export default function ModeratorDashboardPage(): React.JSX.Element {
  return (
    <>
      <div className="mb-10">
        <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
          Tổng quan kiểm duyệt
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Chào mừng trở lại, hôm nay có{" "}
          <span className="font-bold text-primary">124</span> mục mới cần bạn
          xem xét.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {dashboardStats.map((stat) => (
          <ModeratorCard
            className="flex min-h-[220px] flex-col justify-between p-6 lg:col-span-4"
            key={stat.label}
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded p-2 ${statToneClasses[stat.tone]}`}>
                  <MaterialIcon name={stat.icon} />
                </span>
                {stat.trend ? (
                  <span className="font-label-sm text-label-sm text-primary">
                    {stat.trend}
                  </span>
                ) : null}
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {stat.label}
              </p>
            </div>
            <div>
              <p className="mt-4 font-display text-display text-on-surface">
                {stat.value}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {stat.caption}
              </p>
            </div>
          </ModeratorCard>
        ))}

        <ModeratorCard className="h-[400px] p-6 lg:col-span-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-label-md text-label-md text-on-surface">
              Lưu lượng tài liệu trong 7 ngày qua
            </h2>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 font-label-sm text-label-sm">
                <span className="h-3 w-3 bg-primary" />
                Tải lên
              </span>
              <span className="flex items-center gap-1 font-label-sm text-label-sm">
                <span className="h-3 w-3 bg-secondary" />
                Đã duyệt
              </span>
            </div>
          </div>
          <div className="flex h-64 items-end gap-4 px-2">
            {weeklyDocumentFlow.map((day) => (
              <div
                className="relative flex h-full flex-1 items-end rounded-t bg-primary-container/20"
                key={day.label}
              >
                <div
                  aria-label={`${day.label}: ${day.uploaded} tải lên, ${day.approved} đã duyệt`}
                  className="w-full rounded-t bg-primary transition-opacity hover:opacity-80"
                  role="img"
                  style={{ height: `${day.uploaded}%` }}
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-sm text-label-sm text-on-surface-variant">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </ModeratorCard>

        <ModeratorCard className="p-6 lg:col-span-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-label-md text-label-md text-on-surface">
              Hoạt động gần đây
            </h2>
            <MaterialIcon className="text-on-surface-variant" name="history" />
          </div>
          <div className="max-h-[300px] space-y-6 overflow-y-auto pr-2">
            {recentActivities.map((activity) => (
              <div className="flex gap-4" key={activity.id}>
                <div
                  className={`h-10 w-1 shrink-0 rounded-full ${
                    activityToneClasses[activity.tone]
                  }`}
                />
                <div>
                  <p className="font-label-md text-label-md">
                    {activity.title}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {activity.description}
                  </p>
                  <span className="text-[10px] font-bold uppercase text-outline">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-6 w-full border border-outline-variant py-2 font-label-sm text-label-sm transition-colors hover:bg-surface-container"
            type="button"
          >
            Xem tất cả hoạt động
          </button>
        </ModeratorCard>

        <section className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-primary-container p-8 text-on-primary-container lg:col-span-6">
          <div className="relative z-10">
            <h2 className="mb-2 font-headline-md text-headline-md">
              Hàng đợi kiểm duyệt ưu tiên
            </h2>
            <p className="max-w-sm font-body-md text-body-md opacity-90">
              Có 14 tài liệu từ giảng viên cần được xác minh khẩn cấp để kịp
              thời hạn đăng ký khóa học.
            </p>
          </div>
          <div className="relative z-10 mt-8">
            <Link
              className="inline-flex bg-surface px-8 py-3 font-label-md text-label-md text-primary transition-opacity hover:opacity-90"
              href="/moderator/documents"
            >
              Xử lý ngay
            </Link>
          </div>
        </section>

        <ModeratorCard className="flex min-h-[260px] flex-col justify-between bg-surface-container-high p-8 lg:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-2 font-label-md text-label-md text-on-surface">
                Chỉ số sức khỏe cộng đồng
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">98.4%</span>
                <MaterialIcon className="text-primary" name="trending_up" />
              </div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded border border-outline-variant bg-surface text-primary">
              <MaterialIcon className="text-4xl" name="monitoring" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="border border-outline-variant bg-surface p-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Tốc độ phản hồi
              </p>
              <p className="text-xl font-bold">14 phút</p>
            </div>
            <div className="border border-outline-variant bg-surface p-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Độ chính xác
              </p>
              <p className="text-xl font-bold">99.1%</p>
            </div>
          </div>
        </ModeratorCard>
      </div>
    </>
  );
}
