export interface Comment {
  id: string;
  avatarUrl?: string;
  initials?: string;
  username: string;
  title: string;
  subject: string;
  content: string;
  replies: number;
  likes: number;
}

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "1",
    avatarUrl: "",
    initials: "VT",
    username: "Van Thai",
    title: "Sinh viên IT",
    subject: "Vật lý",
    content:
      "Dao động điều hòa là một phần rất quan trọng trong chương trình vật lý 12. Cần nắm chắc công thức và cách biến đổi.",
    replies: 8,
    likes: 56,
  },
  {
    id: "2",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyen",
    title: "Giảng viên",
    subject: "Kinh tế",
    content:
      "Cung và cầu là nền tảng của kinh tế vi mô, ảnh hưởng trực tiếp đến giá cả thị trường.",
    replies: 12,
    likes: 102,
  },
  {
    id: "3",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyen",
    title: "Giảng viên",
    subject: "Kinh tế",
    content:
      "Cung và cầu là nền tảng của kinh tế vi mô, ảnh hưởng trực tiếp đến giá cả thị trường.",
    replies: 12,
    likes: 102,
  },
  {
    id: "4",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyen",
    title: "Giảng viên",
    subject: "Kinh tế",
    content:
      "Cung và cầu là nền tảng của kinh tế vi mô, ảnh hưởng trực tiếp đến giá cả thị trường.",
    replies: 12,
    likes: 102,
  },
  {
    id: "4",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyen",
    title: "Giảng viên",
    subject: "Kinh tế",
    content:
      "Cung và cầu là nền tảng của kinh tế vi mô, ảnh hưởng trực tiếp đến giá cả thị trường.",
    replies: 12,
    likes: 102,
  },
  {
    id: "6",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyen",
    title: "Giảng viên",
    subject: "Kinh tế",
    content:
      "Cung và cầu là nền tảng của kinh tế vi mô, ảnh hưởng trực tiếp đến giá cả thị trường.",
    replies: 12,
    likes: 102,
  },
];
