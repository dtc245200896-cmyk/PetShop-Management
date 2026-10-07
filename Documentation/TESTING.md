# Kết quả kiểm thử — 07/10/2026

## Đã thực hiện
- npm run check: PASS cho các module backend và JavaScript frontend.
- npm test: 7 nhóm kiểm thử PASS, 0 FAIL.
- Docker Compose v2.35.1 --env-file .env.example config --quiet: PASS.
- Đường dẫn bind mounts và 3 services: PASS.

Các nhóm: render EJS cho tổng quan và list/new/edit/detail của 4 chức năng; CRUD và tìm mã/tên/phone; validation/duplicate/CSRF/escape HTML/SQL injection; foreign key chống xóa cha; CRUD thú cưng và dịch vụ; overlap/boundary/cancel/filter/snapshot lịch; ngày không tồn tại, ID không hợp lệ và record404.

Tests dùng Supertest + pg-mem (PostgreSQL emulator) với schema/seed thật của dự án. Không thay thế kiểm tra PostgreSQL thật; chưa xác minh race condition bằng requests đồng thời trên PostgreSQL.

## Cần thực hiện trên máy sinh viên
Môi trường đóng gói không có Docker Engine nên chưa build image/chạy 3 containers thực. Chạy README rồi kiểm tra /health, pgAdmin, thao tác CRUD và khả năng lưu dữ liệu sau down/up. Giao diện đã kiểm tra HTML render bằng Supertest, chưa kiểm tra tương tác trực quan trên trình duyệt thật.

Sau khi đạt phần chức năng, tiếp tục Nginx, Prometheus/Grafana, Loki/Promtail, hardening và báo cáo theo đề. Chưa tạo repository GitHub hoặc xác nhận GitHub Actions chạy.
