# PadTV — Điện thoại thành tay cầm, TV thành màn hình game

PadTV gồm giao diện web tĩnh và máy chủ Node.js giữ phòng/WebSocket. Để dùng trên Internet, triển khai **frontend lên Netlify** và **máy chủ realtime lên Render**. Chỉ đưa `public/` lên Netlify là chưa đủ vì Netlify static hosting không giữ kết nối WebSocket lâu dài.

## Triển khai trực tuyến

### 1) Đẩy máy chủ realtime lên Render
1. Giải nén dự án và đẩy toàn bộ thư mục `padtv` lên một GitHub repository.
2. Vào Render, tạo **New → Web Service**, kết nối repository đó và chọn thư mục gốc `padtv` nếu repo có nhiều thư mục.
3. Build command: `npm install`; Start command: `npm start`. Render cũng có thể đọc cấu hình từ `render.yaml`.
4. Sau khi deploy, kiểm tra `https://TEN-DICH-VU.onrender.com/api/health`. Kết quả cần có `"ok":true`.
5. Sao chép URL dịch vụ, ví dụ `https://padtv-realtime.onrender.com`.

### 2) Cấu hình và đẩy giao diện lên Netlify
1. Mở `public/js/config.js`.
2. Điền URL WebSocket Render vào `websocketUrl`, đổi `https://` thành `wss://`. Ví dụ:
   `websocketUrl: 'wss://padtv-realtime.onrender.com'`
3. Để `siteUrl: ''` nếu muốn tự lấy URL trang Netlify hiện tại.
4. Đẩy toàn bộ dự án lên GitHub, vào Netlify → **Add new site → Import an existing project**, chọn repo và deploy. Netlify sẽ dùng `netlify.toml` với thư mục publish `public`.
5. Nếu đã deploy trước khi sửa `config.js`, commit/push thay đổi để Netlify deploy lại.

> Dùng đúng URL HTTPS của Render trong `config.js` dưới dạng `wss://...`. Không thêm đường dẫn `/` ở cuối. URL Netlify và URL Render là hai địa chỉ khác nhau.

## Sử dụng
1. Mở `https://TEN-SITE.netlify.app/tv` trên TV hoặc máy tính.
2. Chờ mã phòng và QR xuất hiện.
3. Quét QR bằng điện thoại thứ nhất, chọn Người chơi 1; điện thoại thứ hai chọn Người chơi 2.
4. Người chơi 1 chọn game và bấm Bắt đầu. Xoay điện thoại nằm ngang để điều khiển.

## Chạy thử trên máy cá nhân
Yêu cầu Node.js 18 trở lên:

```bash
npm install
npm start
```

Mở `http://localhost:3000/tv`. Muốn thử bằng điện thoại cùng Wi-Fi, mở địa chỉ LAN mà terminal in ra. Mạng công cộng cần deploy backend lên máy chủ có hỗ trợ WebSocket.

## Lưu ý vận hành
- Gói miễn phí trên một số nền tảng có thể ngủ khi không hoạt động; kết nối đầu tiên có thể mất thêm thời gian.
- QR được tạo ngay trong trình duyệt; thư viện QR được tải từ jsDelivr nên lần đầu tạo QR cần Internet.
- Máy chủ hiện lưu phòng trong bộ nhớ RAM. Khởi động lại dịch vụ sẽ làm mất phòng đang chơi; không có tài khoản hay lưu lịch sử trận đấu.
- PadTV là bản demo chơi 2 người với game Đấu Trường Neon. Đua Xe và Bóng Đá Mini đang được đánh dấu sắp ra mắt.
