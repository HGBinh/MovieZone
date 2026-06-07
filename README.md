# MovieZone

## Thông tin đề tài

**HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG**

**Khoa:** Công nghệ Thông tin 2

**Học phần:** Lập Trình Website

**Đề tài số:** 05

**Tên đề tài:** Ứng dụng xem thông tin phim – MovieZone

**Nhóm thực hiện:** 8_LTW

### Thành viên nhóm

| STT | Họ và tên             | Vai trò    |
| --- | --------------------- | ---------- |
| 1   | Hoàng Gia Bình        | Leader     |
| 2   | Nguyễn Trần Mạnh Dũng | Thành viên |
| 3   | Phạm Thị Tường Vy     | Thành viên |
| 4   | Nguyễn Thành Long     | Thành viên |

---

## Giới thiệu dự án

MovieZone là một ứng dụng web hỗ trợ người dùng tìm kiếm và tra cứu thông tin phim thông qua TMDB API. Hệ thống cung cấp các thông tin như tên phim, mô tả, poster, trailer, đánh giá và các thông tin liên quan khác.

Ngoài chức năng tra cứu phim, hệ thống còn hỗ trợ đăng ký tài khoản, đăng nhập, quản lý danh sách phim yêu thích và gửi phản hồi thông qua EmailJS.

---

## Chức năng chính

### Người dùng

* Tìm kiếm phim theo tên.
* Xem danh sách phim phổ biến.
* Xem thông tin chi tiết của phim.
* Xem trailer phim.
* Đăng ký tài khoản.
* Đăng nhập và xác thực bằng JWT.
* Lưu và quản lý danh sách phim yêu thích.
* Gửi phản hồi thông qua biểu mẫu liên hệ.

### Hệ thống

* Kết nối và lấy dữ liệu từ TMDB API.
* Lưu trữ dữ liệu người dùng trên MongoDB Atlas.
* Quản lý xác thực người dùng bằng JWT.
* Upload và lưu trữ hình ảnh thông qua Cloudinary.
* Gửi email bằng EmailJS.

---

## Công nghệ sử dụng

### Frontend

* ReactJS
* TypeScript
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* React Hook Form
* Zod

### Backend

* Node.js
* ExpressJS
* TypeScript

### Database

* MongoDB Atlas
* Mongoose

### Các dịch vụ tích hợp

* TMDB API
* JWT Authentication
* Cloudinary
* EmailJS

---

## Cấu trúc thư mục

```text
MovieZone
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── utils
│   └── package.json
│
└── README.md
```

---

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/HGBinh/MovieZone.git
cd MovieZone
```

### 2. Cài đặt Frontend

```bash
cd client
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

### 3. Cài đặt Backend

```bash
cd server
npm install
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

---

## Biến môi trường

Tạo file `.env` trong thư mục `server` và cấu hình các biến môi trường cần thiết:

```env
PORT=
MONGODB_URI=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TMDB_API_KEY=
```

Đối với EmailJS, cấu hình trong phần Frontend theo tài khoản EmailJS đang sử dụng.

---

## Build dự án

Backend:

```bash
npm run build
npm start
```

Frontend:

```bash
npm run build
```

---

## Triển khai hệ thống

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

## Repository

https://github.com/HGBinh/MovieZone
