import { DocumentPreviewData } from "@/modules/user/documents/detail/type";

export const documentDetailMock = {
  title:
    "Giáo trình Kỹ thuật Lập trình Nâng cao - Cấu trúc dữ liệu và Giải thuật",

  author: {
    name: "Nguyễn Văn A",

    role: "Giảng viên CNTT",

    avatar: "NV",
  },

  stats: {
    views: "12k",

    downloads: "450",

    likes: "4.8",
  },

  preview: {
    type: "image",

    images: [
      "/mock/document/page-1.jpg",

      "/mock/document/page-2.jpg",

      "/mock/document/page-3.jpg",
    ],
  } satisfies DocumentPreviewData,

  fileInfo: {
    format: "PDF",

    size: "12.4 MB",

    pages: 45,

    language: "Tiếng Việt",
  },

  description: `
Tài liệu này cung cấp cái nhìn sâu sắc về các kỹ thuật lập trình nâng cao, tập trung vào việc tối ưu hóa mã nguồn và triển khai các cấu trúc dữ liệu phức tạp.

Nội dung được biên soạn dành cho sinh viên chuyên ngành Công nghệ thông tin năm 2 và năm 3.
  `,

  tags: ["#LapTrinh", "#DataStructure", "#Algorithm", "#C_CPlus", "#GiaiThuat"],

  relatedDocuments: [
    {
      id: 1,

      title: "Lập trình hướng đối tượng với C++",

      author: "Trần Minh B",

      rating: "4.5",
    },

    {
      id: 2,

      title: "Tuyển tập 50 bài toán giải thuật kinh điển",

      author: "Lê Thị C",

      rating: "5.0",
    },

    {
      id: 3,

      title: "Toán rời rạc và Logic toán cho lập trình viên",

      author: "Phạm Văn D",

      rating: "4.2",
    },
  ],

  comments: [
    {
      id: 1,

      author: "Trần Đình Dũng",

      content:
        "Tài liệu rất chi tiết, phần quy hoạch động được giải thích rất dễ hiểu.",
    },

    {
      id: 2,

      author: "Lê Hoàng Nam",

      content: "Có file code đính kèm cho các ví dụ không ạ?",
    },
  ],
};
