# 📝 Hướng Dẫn Tạo Trang Mới

Hướng dẫn chi tiết từng bước tạo trang mới trong AI Study Hub, phân theo loại trang.

---

## 🎯 Quy Trình Chung (4 Bước)

```
1️⃣ Thêm Route      → routes.const.ts
         ↓
2️⃣ Thêm Config     → public/user/admin/library routes file
         ↓
3️⃣ Tạo Code        → app/modules/ + app/(app)/
         ↓
4️⃣ Kiểm Tra        → Truy cập URL & test
```

---

# 📖 HƯỚNG DẪN CHI TIẾT THEO LOẠI TRANG

---

## 1️⃣ TRANG PUBLIC (Không cần login)

### Ví Dụ: Tạo trang "Về Chúng Tôi" (`/about`)

### **Bước 1: Thêm Route vào `routes.const.ts`**

**File:** `app/routes/routes.const.ts`

```typescript
// Thêm vào ROUTE_PATHS object
export const ROUTE_PATHS = {
  HOME: '/',
  LIBRARY: '/library',
  LIBRARY_DETAIL: '/library/:id',
  ABOUT: '/about',           // ← THÊM ĐÂY
  TERMS: '/terms',
  PRIVACY: '/privacy',

  AUTH_ROUTES: { ... },
  PROTECTED_ROUTES: { ... },
  ADMIN_ROUTES: { ... },
} as const;
```

### **Bước 2: Thêm vào `public/public.routes.ts`**

**File:** `app/routes/public/public.routes.ts`

```typescript
import { ROUTE_PATHS } from "../router.const";

// Thêm vào PUBLIC_ROUTES array
export const PUBLIC_ROUTES = [
  ROUTE_PATHS.HOME,
  ROUTE_PATHS.LIBRARY,
  ROUTE_PATHS.ABOUT, // ← THÊM ĐÂY
  ROUTE_PATHS.TERMS,
  ROUTE_PATHS.PRIVACY,
];

// Thêm vào publicRouterConfig object
export const publicRouterConfig = {
  HOME: {
    path: ROUTE_PATHS.HOME,
    title: "Trang chủ",
    public: true,
    requiresAuth: false,
  },
  ABOUT: {
    // ← THÊM ĐÂY
    path: ROUTE_PATHS.ABOUT,
    title: "Về chúng tôi",
    public: true,
    requiresAuth: false,
  },
  // ... other routes
} as const;
```

### **Bước 3: Tạo Thư Mục & File Trang**

#### A. Tạo Module Page (Nội dung chính)

**File:** `app/modules/about/page.tsx`

```typescript
'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Về Chúng Tôi
          </h1>
          <p className="text-xl text-gray-600">
            Nền tảng chia sẻ tài liệu học tập cho sinh viên
          </p>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Sứ Mệnh</h2>
            <p className="text-gray-700 leading-relaxed">
              AI Study Hub được thành lập với mục đích giúp sinh viên tiếp cận
              tài liệu học tập chất lượng cao, chia sẻ kiến thức và hỗ trợ lẫn nhau
              trong quá trình học tập.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Tầm Nhìn</h2>
            <p className="text-gray-700 leading-relaxed">
              Trở thành cộng đồng học tập lớn nhất Việt Nam, nơi sinh viên có thể
              dễ dàng tìm kiếm, chia sẻ và cộng tác trên các tài liệu học tập.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Tính Năng Chính</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Thư Viện Tài Liệu', description: 'Truy cập hàng nghìn tài liệu' },
              { title: 'Chia Sẻ Dễ Dàng', description: 'Tải lên và chia sẻ tài liệu' },
              { title: 'Cộng Đồng', description: 'Kết nối với sinh viên khác' },
            ].map((feature, idx) => (
              <div key={idx} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition">
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/library"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Khám Phá Thư Viện →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### B. Tạo Wrapper Page (Route Group)

**File:** `app/(app)/about/page.tsx`

```typescript
// Wrapper đơn giản - gọi lại module page
export { default } from "@/modules/about/page";
```

### **Bước 4: Kiểm Tra**

```bash
# 1. Truy cập URL
http://localhost:3000/about

# 2. Kiểm tra
✅ Trang hiển thị đúng
✅ Không cần login
✅ Guest có thể xem
```

### **Checklist Trang Public**

```
□ Thêm route vào routes.const.ts
□ Thêm vào PUBLIC_ROUTES array
□ Thêm vào publicRouterConfig
□ Tạo app/modules/{page-name}/page.tsx
□ Tạo app/(app)/{path}/page.tsx wrapper
□ KHÔNG cần <ProtectedRoute>
□ Test URL: http://localhost:3000/{path}
□ Kiểm tra guest có thể xem
```

---

## 2️⃣ TRANG USER PROTECTED (Cần login)

### Ví Dụ: Tạo trang "Hồ Sơ Cá Nhân" (`/profile`)

### **Bước 1: Thêm Route vào `routes.const.ts`**

**File:** `app/routes/routes.const.ts`

```typescript
export const ROUTE_PATHS = {
  // ... public routes

  PROTECTED_ROUTES: {
    PROFILE: '/profile',      // ← THÊM ĐÂY
    SETTINGS: '/settings',
    DASHBOARD: '/dashboard',
    FAVORITES: '/favorites',
    MY_DOCUMENTS: '/my-documents',
    MY_UPLOADS: '/my-uploads',
    CHANGE_PASSWORD: '/change-password',
  },

  ADMIN_ROUTES: { ... },
} as const;
```

### **Bước 2: Thêm vào `user/user.routes.ts`**

**File:** `app/routes/user/user.routes.ts`

```typescript
import { ROUTE_PATHS } from "../routes.const";

// Thêm vào USER_PROTECTED_ROUTES array
export const USER_PROTECTED_ROUTES = [
  ROUTE_PATHS.PROTECTED_ROUTES.PROFILE, // ← THÊM ĐÂY
  ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
  ROUTE_PATHS.PROTECTED_ROUTES.DASHBOARD,
  ROUTE_PATHS.PROTECTED_ROUTES.FAVORITES,
  ROUTE_PATHS.PROTECTED_ROUTES.MY_DOCUMENTS,
  ROUTE_PATHS.PROTECTED_ROUTES.MY_UPLOADS,
];

// Thêm vào userRouterConfig object
export const userRouterConfig = {
  PROFILE: {
    // ← THÊM ĐÂY
    path: ROUTE_PATHS.PROTECTED_ROUTES.PROFILE,
    title: "Hồ Sơ Cá Nhân",
    public: false,
    requiresAuth: true,
  },
  SETTINGS: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
    title: "Cài Đặt",
    public: false,
    requiresAuth: true,
  },
  // ... other routes
} as const;
```

### **Bước 3: Tạo Thư Mục & File Trang**

#### A. Tạo Module Page

**File:** `app/modules/user/profile/page.tsx`

```typescript
'use client';

import { ProtectedRoute } from '@/routes';
import { getAuthUser } from '@/routes';
import Link from 'next/link';
import { useState } from 'react';

function ProfileContent() {
  const user = getAuthUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    university: '',
  });

  const handleSave = async () => {
    try {
      // Gọi API update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Cập nhật hồ sơ thành công!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Cập nhật thất bại');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Hồ Sơ Cá Nhân</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white border rounded-lg p-8 shadow-sm">
          {/* Avatar */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* Form */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full border p-2 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Tiểu Sử</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full border p-2 rounded h-24"
                  placeholder="Nói gì đó về bạn..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Trường Đại Học</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Lưu Thay Đổi
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-bold">Tiểu Sử:</span>
                <span className="text-gray-600">{formData.bio || 'Không có'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-bold">Trường:</span>
                <span className="text-gray-600">{formData.university || 'Không có'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link
            href="/settings"
            className="block border p-4 rounded hover:bg-gray-50 text-center"
          >
            ⚙️ Cài Đặt
          </Link>
          <Link
            href="/change-password"
            className="block border p-4 rounded hover:bg-gray-50 text-center"
          >
            🔐 Đổi Mật Khẩu
          </Link>
          <Link
            href="/my-documents"
            className="block border p-4 rounded hover:bg-gray-50 text-center"
          >
            📄 Tài Liệu Của Tôi
          </Link>
          <Link
            href="/favorites"
            className="block border p-4 rounded hover:bg-gray-50 text-center"
          >
            ❤️ Yêu Thích
          </Link>
        </div>
      </div>
    </div>
  );
}

// ← QUAN TRỌNG: Wrap với ProtectedRoute
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

#### B. Tạo Wrapper Page

**File:** `app/(app)/profile/page.tsx`

```typescript
export { default } from "@/modules/user/profile/page";
```

### **Bước 4: Kiểm Tra**

```bash
# 1. Guest truy cập
http://localhost:3000/profile
# Kết quả: Redirect → /user/login?redirect=/profile

# 2. User đã login truy cập
http://localhost:3000/profile
# Kết quả: ✅ Hiển thị trang profile
```

### **Checklist Trang User Protected**

```
□ Thêm route vào routes.const.ts (PROTECTED_ROUTES)
□ Thêm vào USER_PROTECTED_ROUTES array
□ Thêm vào userRouterConfig
□ Tạo app/modules/{path}/page.tsx
□ Tạo app/(app)/{path}/page.tsx wrapper
□ ✅ WRAP với <ProtectedRoute> (KHÔNG có requiredRole)
□ Test: Guest → Redirect login; User → Hiển thị
□ Kiểm tra redirect param: /profile?redirect=/profile
```

---

## 3️⃣ TRANG ADMIN (Cần admin role)

### Ví Dụ: Tạo trang "Quản Lý Người Dùng" (`/admin/users`)

### **Bước 1: Thêm Route vào `routes.const.ts`**

**File:** `app/routes/routes.const.ts`

```typescript
export const ROUTE_PATHS = {
  // ... other routes

  ADMIN: "/admin",
  ADMIN_ROUTES: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users", // ← THÊM ĐÂY
    DOCUMENTS: "/admin/documents",
    CATEGORIES: "/admin/categories",
    REPORTS: "/admin/reports",
    SETTINGS: "/admin/settings",
  },
} as const;
```

### **Bước 2: Thêm vào `admin/admin.routes.ts`**

**File:** `app/routes/admin/admin.routes.ts`

```typescript
import { ROUTE_PATHS } from "../routes.const";

// Thêm vào ADMIN_ROUTES array
export const ADMIN_ROUTES = [
  ROUTE_PATHS.ADMIN,
  ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD,
  ROUTE_PATHS.ADMIN_ROUTES.USERS, // ← THÊM ĐÂY
  ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
  ROUTE_PATHS.ADMIN_ROUTES.CATEGORIES,
  ROUTE_PATHS.ADMIN_ROUTES.REPORTS,
  ROUTE_PATHS.ADMIN_ROUTES.SETTINGS,
];

// Thêm vào adminRouterConfig object
export const adminRouterConfig = {
  USERS: {
    // ← THÊM ĐÂY
    path: ROUTE_PATHS.ADMIN_ROUTES.USERS,
    title: "Quản Lý Người Dùng",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  DOCUMENTS: {
    path: ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
    title: "Quản Lý Tài Liệu",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  // ... other routes
} as const;
```

### **Bước 3: Tạo Thư Mục & File Trang**

#### A. Tạo Module Page

**File:** `app/modules/admin/users/page.tsx`

```typescript
'use client';

import { ProtectedRoute } from '@/routes';
import { getAuthToken } from '@/routes';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Gọi API lấy danh sách users
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa người dùng này?')) return;

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Xóa người dùng thành công');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Xóa thất bại');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
      alert('Cập nhật vai trò thành công');
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Cập nhật thất bại');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản Lý Người Dùng</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            ← Quay Lại
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border p-3 rounded"
        />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border">
          <p className="text-gray-600 text-sm">Tổng Người Dùng</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded border">
          <p className="text-gray-600 text-sm">Sinh Viên</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded border">
          <p className="text-gray-600 text-sm">Giáo Viên</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded border">
          <p className="text-gray-600 text-sm">Admin</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Tên</th>
                <th className="border p-3 text-left">Vai Trò</th>
                <th className="border p-3 text-left">Ngày Tạo</th>
                <th className="border p-3 text-left">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-3">{user.email}</td>
                  <td className="border p-3">{user.name}</td>
                  <td className="border p-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="student">Sinh Viên</option>
                      <option value="teacher">Giáo Viên</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border p-3 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="border p-3">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không có người dùng nào</p>
        </div>
      )}
    </div>
  );
}

// ← QUAN TRỌNG: requiredRole="admin"
export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
```

#### B. Tạo Wrapper Page

**File:** `app/(app)/admin/users/page.tsx`

```typescript
export { default } from "@/modules/admin/users/page";
```

### **Bước 4: Kiểm Tra**

```bash
# 1. Guest truy cập
http://localhost:3000/admin/users
# Kết quả: Redirect → /user/login

# 2. Student truy cập
http://localhost:3000/admin/users
# Kết quả: Redirect → /dashboard (không phải admin)

# 3. Admin truy cập
http://localhost:3000/admin/users
# Kết quả: ✅ Hiển thị trang quản lý
```

### **Checklist Trang Admin**

```
□ Thêm route vào routes.const.ts (ADMIN_ROUTES)
□ Thêm vào ADMIN_ROUTES array
□ Thêm vào adminRouterConfig (requiresRole: 'admin')
□ Tạo app/modules/admin/{page-name}/page.tsx
□ Tạo app/(app)/admin/{path}/page.tsx wrapper
□ ✅ WRAP với <ProtectedRoute requiredRole="admin">
□ Test: Guest → Login; Student → Dashboard; Admin → Show
□ Sidebar/menu navigation sử dụng adminRouterConfig
```

---

## 📋 BẢNG SO SÁNH

| Yêu Cầu             | Public                  | User Protected        | Admin                     |
| ------------------- | ----------------------- | --------------------- | ------------------------- |
| **Route Location**  | ROUTE_PATHS.{NAME}      | PROTECTED_ROUTES      | ADMIN_ROUTES              |
| **Config File**     | public/public.routes.ts | user/user.routes.ts   | admin/admin.routes.ts     |
| **Array Tên**       | PUBLIC_ROUTES           | USER_PROTECTED_ROUTES | ADMIN_ROUTES              |
| **Config Object**   | publicRouterConfig      | userRouterConfig      | adminRouterConfig         |
| **Wrapper Path**    | app/(app)/{path}/       | app/(app)/{path}/     | app/(app)/admin/{path}/   |
| **Module Path**     | app/modules/{name}/     | app/modules/{name}/   | app/modules/admin/{name}/ |
| **ProtectedRoute**  | ❌ Không                | ✅ Có                 | ✅ Có                     |
| **requiredRole**    | -                       | -                     | `"admin"`                 |
| **Guest có xem?**   | ✅ YES                  | ❌ Redirect login     | ❌ Redirect login         |
| **Student có xem?** | ✅ YES                  | ✅ YES                | ❌ Redirect home          |
| **Admin có xem?**   | ✅ YES                  | ✅ YES                | ✅ YES                    |

---

## 🔧 TEMPLATE NHANH

### Tạo Public Page (Copy & Paste)

```bash
# 1. Thêm routes
HOME: '/',  # app/routes/routes.const.ts

# 2. Thêm config
PUBLIC_ROUTES = [..., ROUTE_PATHS.HOME]
publicRouterConfig = {..., HOME: {...}}

# 3. Tạo file
# app/modules/home/page.tsx - Nội dung
# app/(app)/home/page.tsx - Wrapper (export { default } from '@/modules/home/page')
```

### Tạo Protected Page (Copy & Paste)

```bash
# 1. Thêm routes - Cấu trúc giống public nhưng ở PROTECTED_ROUTES

# 2. Thêm config
USER_PROTECTED_ROUTES = [..., ROUTE_PATHS.PROTECTED_ROUTES.XYZ]
userRouterConfig = {..., XYZ: {...}}

# 3. Tạo file
# app/modules/xyz/page.tsx - Wrap với <ProtectedRoute>
# app/(app)/xyz/page.tsx - export { default }
```

### Tạo Admin Page (Copy & Paste)

```bash
# 1. Thêm routes - ở ADMIN_ROUTES

# 2. Thêm config
ADMIN_ROUTES = [..., ROUTE_PATHS.ADMIN_ROUTES.XYZ]
adminRouterConfig = {..., XYZ: {..., requiresRole: 'admin'}}

# 3. Tạo file
# app/modules/admin/xyz/page.tsx - Wrap với <ProtectedRoute requiredRole="admin">
# app/(app)/admin/xyz/page.tsx - export { default }
```

---

## 🐛 Troubleshooting

### Trang không hiển thị

```
✓ Kiểm tra route đã thêm vào routes.const.ts?
✓ Kiểm tra config object (PUBLIC/USER_PROTECTED/ADMIN_ROUTES)?
✓ Kiểm tra thư mục exist: app/modules/{name}/ + app/(app)/{path}/?
✓ Kiểm tra wrapper page tồn tại?
```

### Redirect sai chỗ

```
✓ Public không cần ProtectedRoute
✓ Protected cần <ProtectedRoute> (no requiredRole)
✓ Admin cần <ProtectedRoute requiredRole="admin">
✓ Kiểm tra localStorage có auth_token & user_info?
```

### CSS không apply

```
✓ Kiểm tra Tailwind output có include app/ folder?
✓ Kiểm tra 'use client' directive?
✓ Xóa .next cache, restart server?
```

---

## 📚 Tài Liệu Tham Khảo

- [routes/README.md](./README.md) - Hướng dẫn route system chi tiết
- [routes/USAGE.md](./USAGE.md) - Ví dụ code sử dụng routes
- [ProtectedRoute.tsx](./ProtectedRoute.tsx) - Component wrapper
- [auth.guard.ts](./guards/auth.guard.ts) - Auth checking logic
- [role.guard.ts](./guards/role.guard.ts) - Role checking logic
