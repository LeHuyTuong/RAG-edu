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
    username: "Văn Thái",
    title: "Nghiên cứu sinh Sử học",
    subject: "Chiến tranh Đông Dương",
    content:
      "Chiến dịch Điện Biên Phủ là một bước ngoặt quan trọng trong lịch sử kháng chiến chống Pháp. Cần phân tích kỹ yếu tố địa chính trị và hậu cần.",
    replies: 8,
    likes: 56,
  },
  {
    id: "2",
    avatarUrl: "",
    initials: "AN",
    username: "Anh Nguyễn",
    title: "Giảng viên Lịch sử",
    subject: "Triều đại nhà Trần",
    content:
      "Nhà Trần đã ba lần đánh bại quân Nguyên Mông — một kỳ tích quân sự hiếm có trong lịch sử thế giới. Tinh thần đoàn kết và chiến thuật tài tình là chìa khóa.",
    replies: 12,
    likes: 102,
  },
  {
    id: "3",
    avatarUrl: "",
    initials: "MH",
    username: "Minh Hiếu",
    title: "Nhà nghiên cứu độc lập",
    subject: "Cải cách ruộng đất",
    content:
      "Cải cách ruộng đất 1953-1956 là một trong những chính sách quan trọng nhất của Đảng, tác động sâu sắc đến cơ cấu nông thôn Việt Nam.",
    replies: 5,
    likes: 34,
  },
  {
    id: "4",
    avatarUrl: "",
    initials: "TL",
    username: "Thu Linh",
    title: "Sinh viên Sử học",
    subject: "Chiến dịch Điện Biên Phủ",
    content:
      "Điện Biên Phủ không chỉ là chiến thắng quân sự mà còn là biểu tượng của ý chí dân tộc. 56 ngày đêm khoét núi, ngủ hầm đã đi vào lịch sử.",
    replies: 3,
    likes: 78,
  },
  {
    id: "5",
    avatarUrl: "",
    initials: "QB",
    username: "Quốc Bảo",
    title: "Biên tập viên",
    subject: "Phong trào Cần Vương",
    content:
      "Phong trào Cần Vương thể hiện tinh thần yêu nước mãnh liệt của sĩ phu Việt Nam cuối thế kỷ XIX, dù không thành công nhưng có ý nghĩa lịch sử to lớn.",
    replies: 15,
    likes: 91,
  },
  {
    id: "6",
    avatarUrl: "",
    initials: "HN",
    username: "Hương Nguyễn",
    title: "Hướng dẫn viên bảo tàng",
    subject: "Văn hóa lịch sử",
    content:
      "Di sản văn hóa vật thể và phi vật thể của Việt Nam phản ánh sâu sắc lịch sử dân tộc qua hàng nghìn năm dựng nước và giữ nước.",
    replies: 7,
    likes: 45,
  },
];
