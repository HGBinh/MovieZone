# MovieZone

HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG

Khoa: Công nghệ Thông tin 2

Học phần: Lập Trình Website

Đề tài số 05

Tên đề tài: Ứng dụng xem thông tin phim – MovieZone

Nhóm thực hiện: 8_LTW

Thành viên:

* Hoàng Gia Bình (Leader)
* Nguyễn Trần Mạnh Dũng
* Phạm Thị Tường Vy
* Nguyễn Thành Long

## Mô tả đề tài

MovieZone là website hỗ trợ người dùng tìm kiếm và xem thông tin phim thông qua TMDB API. Người dùng có thể xem thông tin chi tiết của phim, trailer, lưu danh sách phim yêu thích và gửi phản hồi thông qua form liên hệ.

## Chức năng chính

* Tìm kiếm phim theo tên, năm phát hành và thể loại.
* Xem thông tin chi tiết của phim.
* Xem trailer phim.
* Lưu và quản lý danh sách phim yêu thích.
* Đăng ký, đăng nhập tài khoản.
* Gửi phản hồi bằng EmailJS.

## Công nghệ sử dụng

Frontend:

* ReactJS
* TypeScript
* Vite
* Tailwind CSS

Backend:

* Node.js
* ExpressJS
* TypeScript

Database:

* MongoDB Atlas

Các dịch vụ khác:

* TMDB API
* JWT Authentication
* Cloudinary
* EmailJS

## Hướng dẫn cài đặt và chạy dự án

Clone source code:

```bash
git clone https://github.com/HGBinh/MovieZone.git
cd MovieZone
```

Cài đặt và chạy Frontend:

```bash
cd client
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

Cài đặt và chạy Backend:

```bash
cd server
npm install
npm run dev
```

Backend chạy tại:

```text
http://localhost:5000
```

Build và chạy Backend ở chế độ production:

```bash
npm run build
npm start
```

## Repository

https://github.com/HGBinh/MovieZone
