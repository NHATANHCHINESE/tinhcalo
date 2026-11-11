# MacroDay

Ứng dụng nhật ký dinh dưỡng cá nhân bằng tiếng Việt, viết bằng React, TypeScript và Vite. Nhật ký, mục tiêu và ảnh bữa ăn được lưu trong trình duyệt trên thiết bị đang dùng.

## Chạy trên máy

Dùng Node.js 22.12 trở lên. Mở terminal tại thư mục chứa `package.json` rồi chạy:

```sh
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal. Để kiểm tra TypeScript, tạo và xem bản production:

```sh
npm run build
npm run preview
```

## Đưa mã nguồn lên GitHub

Giải nén ZIP. Tạo một repository **Private**, chọn **Add file → Upload files**, rồi tải nội dung bên trong thư mục `MacroDay` lên. Kiểm tra `package.json`, `src/` và `public/` nằm ngay ở cấp đầu tiên của repository, sau đó chọn **Commit changes**.

Thư mục `src/` chứa mã nguồn và dữ liệu món ăn. `public/` chứa ảnh vịt, phông chữ và mô hình nhận diện món ăn. `dist/` là website đã build, có thể phục vụ bằng máy chủ web tĩnh. Thông tin về tài nguyên đi kèm nằm trong `NOTICE.md`.
