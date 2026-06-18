export const topNavLinks = [
  { label: "Documents", href: "#" },
  { label: "Forum", href: "#" },
  { label: "Courses", href: "#" },
  { label: "Repository", href: "#" },
];

export const styleGuideLayout = {
  brandName: "ScholarShare",
  pageTitle: "Hệ Thống Thiết Kế",
  sideNavTitle: "UI Style Guide",
  sideNavSubtitle: "Design System v1.0",
  sideNavCtaLabel: "Download Assets",
  footerText: "© 2024 ScholarShare Academic Platform",
  userAvatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAqTgUeZZKrxTgB6HfyXOBoFN_WBeanNLJFkeRdHJ0ecdNkBidAy6g3ECFpmQYr-01bKUAjqB5CjkF62_TtZVLSkoeEfqYRj5cgBt9HJ1XwepggaGA5QA62c9RD4Zd5tKD7CzyyeSprBfFDWMrPO5KfV3ZBmWtt2aSeGFaflOOnaLk1PNH7ecrisyZOGLwVyYxOXdHCDdIFcAfe_1NMk98L4I36keGuOOLzICHTDILVJyQfAQRF_6l2a77lMLH0Ivep2cPYxoBqXTQ",
} as const;

export const styleGuideSections = {
  basics: "Phần 1: Thành Phần Cơ Bản",
  inputs: "Phần 2: Thành Phần Nhập Liệu",
  dataDisplay: "Phần 3: Hiển Thị Dữ Liệu",
  feedback: "Phần 4: Phản Hồi & Tương Tác",
} as const;

export const styleGuideLabels = {
  buttons: {
    title: "Nút Bấm",
    primary: "Primary",
    secondary: "Secondary",
    outline: "Outline",
    ghost: "Ghost",
  },
  typography: {
    title: "Kiểu Chữ",
  },
  icons: {
    title: "Icon",
  },
  inputs: {
    title: "Ô Nhập Liệu",
    searchTitle: "Thanh Tìm Kiếm",
    nameLabel: "Họ và Tên",
    namePlaceholder: "Nhập họ và tên",
    passwordLabel: "Mật khẩu",
    emailLabel: "Email",
    emailError: "Vui lòng nhập đúng định dạng email",
    searchLabel: "Tìm kiếm",
    searchPlaceholder: "Tìm kiếm tài liệu, khóa học...",
  },
  selection: {
    title: "Chọn Lựa",
    cityLabel: "Thành phố",
    rememberLabel: "Ghi nhớ",
    genderOptions: [
      { label: "Nam", value: "male" },
      { label: "Nữ", value: "female" },
    ],
    switchTitle: "Công Tắc",
  },
  table: {
    title: "Bảng Dữ Liệu",
    showing: "Hiển thị 1-5 của 50",
    columns: ["STT", "Tên Người Dùng", "Email", "Trạng Thái", "Hành Động"],
  },
  cards: {
    title: "Thẻ Thông Tin",
    buyLabel: "Mua ngay",
    contactLabel: "Liên hệ",
  },
  tags: {
    title: "Nhãn & Tag",
  },
  avatars: {
    title: "Ảnh Đại Diện",
  },
  feedback: {
    toastTitle: "Thông Báo",
    loadingTitle: "Tải & Skeleton",
    tooltipTitle: "Chú Thích",
    toastMessage: "Cập nhật thành công!",
    tooltipText: "Thông tin chi tiết về mục này",
    modalTitle: "Xác nhận xóa",
    modalDescription: "Bạn có chắc chắn muốn xóa không?",
    modalConfirm: "Xóa",
    modalCancel: "Hủy",
  },
} as const;

export const sideNavItems = [
  { label: "Overview", icon: "dashboard", section: "main" },
  { label: "Components", icon: "extension", section: "main", active: true },
  { label: "Inputs", icon: "input", section: "main" },
  { label: "Data Display", icon: "table_chart", section: "main" },
  { label: "Feedback", icon: "feedback", section: "main" },
  { label: "Settings", icon: "settings", section: "secondary" },
  { label: "Documentation", icon: "menu_book", section: "secondary" },
] as const;

export const iconRow = [
  "home",
  "person",
  "settings",
  "search",
  "notifications",
  "mail",
];

export const typographySamples = [
  { label: "Tiêu đề 1 (Display)", className: "font-display text-display" },
  {
    label: "Tiêu đề 2 (Headline Lg)",
    className: "font-headline-lg text-headline-lg",
  },
  {
    label: "Văn bản body (Body Md) - Nền tảng học thuật chuyên nghiệp.",
    className: "font-body-md text-body-md",
  },
  {
    label: "Chú thích nhỏ (Label Sm) - Sử dụng cho siêu dữ liệu.",
    className: "font-label-sm text-label-sm text-on-surface-variant",
  },
] as const;

export const selectOptions = ["Hà Nội", "TP.HCM", "Đà Nẵng"];

export const tableRows = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nva@example.com",
    status: "success",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAoAT7OkPQ-gxUxRboHyrPTfeZbfeGcMXwt5gPpUoUsseZJ9UvOTNRpCc1ucKfty0ZBHxruvGqDPyy3T8S2Ml9HOpVg3YhMe9H1ppajAsax80q9SjWdl3QPkIXqvvPTcABeyOQ84Wp2Q8jbeqpb7zMlDa7SdBDYPs-cFaWBC_4zyhMyZ_M57ariy2H2ErbBe86ZpZNG3Pjcy9RnqgDxE_VpttFyiIG1pTBJU_pm4Llu4W9TSLu6TeZy0tORPkWCiJvRj93RiTkOHs",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "ttb@example.com",
    status: "warning",
    initials: "TB",
    avatarTone: "secondary",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "lvc@example.com",
    status: "error",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOSiljSsQjoG2_VcANjVZOi-felvc_YQqg1LAR--jFSguDTL3ta4ARreWdbUQC03ysHtDpwAMEtu6SWdNnso4FLZDvD84XChytWuHo39b-xHrHe0stFNFh7G5FPPWGG6EQd3JIdB6rGzBAzdAsNoVb2aR3z3VmrHuQEijy50OnUApr6Lh_iabvssYpGA6ly66dtHuvLfWZ2iN7zTLKSo4KbMeqbSwuDvlTlsj-a_ybCdeIrCxvN1i3pze9zgK3qjaJjXaK39G3IJI",
  },
  {
    id: 4,
    name: "Phạm Thị M",
    email: "ptm@example.com",
    status: "success",
    initials: "PM",
    avatarTone: "tertiary",
  },
  {
    id: 5,
    name: "Hoàng Văn N",
    email: "hvn@example.com",
    status: "success",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbjN5HOwZAUdWmT9DD_Tc9jI9L9tjzxRi3tiWzIg5qEyGBoM_Q1czO-aEMAUuCcHSZopSykCr9B8zmzCDIMaLK8UDOsYLb-lUAznd7nItGjCAj42HabLmBGUJnes-A7B81kqOQgekVy1BY9soTZGys7kVHF9WERpIriplIG4nohS6gL0CxAQR9pWZn3Bv1bJjFdQZiu8IsrG00Jl4ce5TZzu2Aep9yvPBQ-FEh7MBvnZtrpDaOxIALNBUicNdpUtuGAVRU49Xv2J8",
  },
] as const;

export const statusLabelMap: Record<string, string> = {
  success: "Thành công",
  warning: "Đang xử lý",
  error: "Thất bại",
};

export const productCard = {
  title: "Giày Thể Thao X",
  description: "Siêu nhẹ, thoáng khí",
  price: "1.500.000đ",
  imageAlt: "Sản phẩm",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBvNXML-ZJgw5WawKeVf5vvnKrvKA6nKaOsv0f_N4IN8i-mnkr3mm-8xFwB-2zAZ1G1ZNJiisHnTuEnd9BFemYcN1M9SNL3Sh-LfTg4iFhS8BrSaP_IChIsHhFkckqYPy-fqknO0oe8PIApK3OnOx8vSEaXffWisBK53HfzBDOnJpKiZGRwcv1v5gboapGShBBrTqtnkdLgrEFIKSapUfhDd5TupZhqKPM929KhrRnAcDqQyYQu2RjPo5hgo9jDHxPJKtgoOVTzFfs",
} as const;

export const profileCard = {
  name: "Nguyễn Thị Hoa",
  title: "Giám đốc Marketing",
  imageAlt: "User Avatar",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCPlSP2E3bUKV6scvPdvzpsqbj8EY53-rp54i9Mg6adf8D6SCmr2AyOXz7_pxfWRrkT5pI31WSN-TI9MKFL5x2aN4kIC245KNfcb080rPQDbDMtmdo0NaiPRk0bnkWWTzvcNbFfAWmzTgC-hCEf21rWoANWkRJ3_4GieBVkw-2cXiEPY1lHh-exDsFQbOA9rRvC3eC-rpQgQM0aTSbQ_gQqqt2GrOueKGfi91Lht5jO8WnU24IqHJHLJtGm1iX6hpqS0T-uSGy9WC8",
} as const;

export const statusBadges = [
  { label: "Thành công", tone: "success" },
  { label: "Đang xử lý", tone: "warning" },
  { label: "Thất bại", tone: "error" },
] as const;

export const hashtagTags = ["#ThiếtKế", "#HọcTập", "#TàiLiệu"];

export const avatars = [
  {
    size: "lg",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBJAO2huc2EqTsfAqLXLxzoXSFRLw5RWI-MekEngVcR-iQCQwV4mLGNHBKDGtvwosBS6OD61jrTa-bsesdttnK3Bf3GfbvEZ2JhxpUVbvm4VKIrJaLSyBausa7CLRz_HOu-YMiDaKh4Ovz72GMmkLpziAvjcL6ja9BTipuEDjwOQH8OTYlNlnULfoVB0Xmddkv5TnSQuWTU6LoGU8Y4C7wrpJGp_9ftpx03Be3pr9nYQPV8ZCLw7tORFY0gIQvDppsds1FI2YiBG4M",
  },
  {
    size: "md",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDY3z7Llpe0tvOGZaWu19IcklRhvWFbCmFx8LQa7qpDLihkRt4n2aoirBhTirAzjJlkMUY2Zr8HsnEyh-lyDZJ17ChvVTnHvgn0X0uJFIgm5ohLV9P0OgjdbZdkev9u3j39O2WXlL-J7ARsgZqDlXPTyqpEsSo9-k6YLcKrvRyKSGllCStUuiaGEh4CIRZOxw1Sqfhj2GsV5PDqszsr-LsmBc9S4f9sgxIPTgTm15SF3AZjTh7pkcEo7Sj7mkFzGAFPLVfQXL6OARs",
  },
  { size: "lg", initials: "AT", tone: "primary" },
  { size: "md", initials: "M", tone: "tertiary" },
] as const;

export const footerLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "API Reference", href: "#" },
  { label: "Support", href: "#" },
];
