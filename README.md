# PetShop Đề 28 — Phần mềm chức năng

Bản mới xây dựng từ đầu bằng Node.js 24, Express 5, EJS và PostgreSQL; pgAdmin quản lý DB. Giai đoạn này chỉ có 3 services: app, postgres, pgadmin. Nginx/metrics/log tập trung sẽ bổ sung sau khi xác nhận chức năng.

## Chạy trên Windows
1. Cài và bật Docker Desktop (Linux containers).
2. Giải nén vào thư mục mới; mở PowerShell tại thư mục chứa docker-compose.yml.
3. Chạy:
```powershell
Copy-Item .env.example .env
notepad .env
docker compose up -d --build
docker compose ps
```
Đổi các mật khẩu và SESSION_SECRET trong .env trước lần chạy đầu. Mật khẩu ví dụ chỉ dành cho demo. SESSION_SECRET dùng chuỗi ngẫu nhiên ít nhất 32 ký tự.

Website: http://localhost:8088 — pgAdmin: http://localhost:5050.
Không cần cài Node.js/PostgreSQL trên Windows để chạy Compose.

Nếu cổng trùng ứng dụng khác, đổi WEB_PORT/PGADMIN_PORT trong .env rồi chạy lại `docker compose up -d`.

## pgAdmin
Đăng nhập bằng PGADMIN_DEFAULT_EMAIL / PGADMIN_DEFAULT_PASSWORD trong .env. Add New Server:
- Name: PetShop
- Host: postgres (tên service nội bộ, không phải localhost)
- Port: 5432
- Maintenance database: giá trị POSTGRES_DB
- Username / Password: POSTGRES_USER / POSTGRES_PASSWORD
Xem schema public với 4 bảng customers, pets, services, appointments.

## Chức năng
- Khách hàng: CRUD, chi tiết, tìm theo mã/tên/điện thoại; mã và điện thoại không trùng.
- Thú cưng: CRUD, liên kết chủ sở hữu; tìm mã/tên/chủ/điện thoại.
- Dịch vụ spa: CRUD, giá và thời lượng có kiểm tra dữ liệu.
- Lịch hẹn: CRUD, chọn thú cưng kèm chủ và dịch vụ, tìm kiếm/lọc ngày/trạng thái; sửa/hủy/hoàn thành; kiểm tra trùng thời gian của cùng thú cưng.
- Lưu snapshot giá/thời lượng khi đặt, giữ snapshot nếu chỉ sửa giờ/ghi chú/trạng thái cùng dịch vụ.
- Tổng quan: thống kê 4 nhóm và danh sách lịch gần đây.
- Dữ liệu mẫu: 5 khách hàng, 6 thú cưng, 4 dịch vụ, 3 lịch hẹn. Ngày mẫu cố định trong tháng10/2026; có thể sửa ngay trên website.

## Tổ chức dự án
| Nhóm | Vị trí | Nội dung |
|---|---|---|
| Backend | Backend/src, Backend/tests | Express routes/controller, metadata/validation, repository PostgreSQL, tests |
| Frontend | Frontend/views, Frontend/public | EJS, CSS responsive, JavaScript xác nhận xóa |
| Database | Database | Schema, seed SQL |
| Infrastructure | Infrastructure, docker-compose.yml | Dockerfile và 3 services Compose |
| Documentation | Documentation, README.md | Thiết kế, hướng dẫn demo, kết quả kiểm thử |
| CI/CD | CI-CD, .github/workflows | GitHub Actions chạy npm ci/check/test; chưa có CD deployment |

## Kiểm tra và vận hành
```powershell
docker compose logs --tail 80 app postgres pgadmin
Invoke-RestMethod http://localhost:8088/health
docker compose down
```
`down` giữ dữ liệu. `docker compose down -v` xóa vĩnh viễn DB và cấu hình pgAdmin; chỉ dùng khi chủ động làm mới.
SQL init/seed chỉ chạy khi volume DB còn trống. Đổi .env sau init không tự đổi mật khẩu trong DB.

Nếu cài Node24 để phát triển ngoài Docker:
```powershell
npm ci
npm run check
npm test
```
Ứng dụng đọc các biến DB từ environment; `.env` được Docker Compose đọc, không tự được Node đọc. Cách chạy khuyến nghị là Compose.

Xem Documentation/TESTING.md và DEMO.md. Đây là bản thực hành chức năng, chưa có đăng nhập/phân quyền người dùng, session dùng MemoryStore và DB runtime đang dùng tài khoản init. Chưa coi các tiêu chí hardening, Nginx, monitoring, logging, GitHub hay báo cáo là hoàn thành.
