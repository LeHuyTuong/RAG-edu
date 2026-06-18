import type { SideNavItem } from "../types/sideNav";
import { ROUTE_PATHS } from "../routes/router.const";

export const USER_NAV_ITEMS: SideNavItem[] = [
  {
    label: "Trang chủ",
    icon: "home",
    href: ROUTE_PATHS.PROTECTED_ROUTES.HOME,
    section: "main",
  },
  {
    label: "Thư viện",
    icon: "local_library",
    href: ROUTE_PATHS.LIBRARY,
    section: "main",
  },
  {
    label: "Tài liệu của tôi",
    icon: "description",
    href: ROUTE_PATHS.PROTECTED_ROUTES.MY_DOCUMENTS,
    section: "main",
  },
  {
    label: "Đóng góp",
    icon: "cloud_upload",
    href: ROUTE_PATHS.PROTECTED_ROUTES.UPLOADS,
    section: "main",
  },
  {
    label: "Cài đặt",
    icon: "settings",
    href: ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
    section: "secondary",
  },
  {
    label: "Đăng xuất",
    icon: "logout",
    href: "#",
    section: "secondary",
  },
];

export const MODERATOR_NAV_ITEMS: SideNavItem[] = [
  {
    label: "Bảng điều khiển",
    icon: "dashboard",
    href: ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD,
    section: "main",
    exact: true,
  },
  {
    label: "Duyệt tài liệu",
    icon: "description",
    href: ROUTE_PATHS.MODERATOR_ROUTES.DOCUMENTS,
    section: "main",
  },
  {
    label: "Kiểm duyệt bài viết",
    icon: "gavel",
    href: ROUTE_PATHS.MODERATOR_ROUTES.POSTS,
    section: "main",
  },
  {
    label: "Cài đặt",
    icon: "settings",
    href: ROUTE_PATHS.MODERATOR_ROUTES.SETTINGS,
    section: "secondary",
  },
  {
    label: "Đăng xuất",
    icon: "logout",
    href: "#",
    section: "secondary",
  },
];

export const ADMIN_NAV_ITEMS: SideNavItem[] = [
  {
    label: "Bảng điều khiển",
    icon: "dashboard",
    href: ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD,
    section: "main",
    exact: true,
  },
  {
    label: "Quản lý người dùng",
    icon: "group",
    href: ROUTE_PATHS.ADMIN_ROUTES.USERS,
    section: "main",
  },
  {
    label: "Quản lý tài liệu",
    icon: "description",
    href: ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
    section: "main",
  },
  {
    label: "Quản lý môn học",
    icon: "menu_book",
    href: ROUTE_PATHS.ADMIN_ROUTES.SUBJECTS,
    section: "main",
  },

  {
    label: "Báo cáo",
    icon: "bar_chart",
    href: ROUTE_PATHS.ADMIN_ROUTES.REPORTS,
    section: "main",
  },

  {
    label: "Cài đặt",
    icon: "settings",
    href: ROUTE_PATHS.ADMIN_ROUTES.SETTINGS,
    section: "secondary",
  },
  {
    label: "Đăng xuất",
    icon: "logout",
    href: "#",
    section: "secondary",
  },
];
