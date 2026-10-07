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
## Giám sát bằng Prometheus và Grafana

Khởi động toàn bộ hệ thống:

    docker compose up -d --build

Trước lần chạy đầu tiên, sao chép `.env.example` thành `.env`
và thay các mật khẩu mẫu bằng mật khẩu mạnh.

- Website qua Nginx: http://localhost:8088
- pgAdmin: http://localhost:5050
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

Đăng nhập Grafana bằng GRAFANA_ADMIN_USER và
GRAFANA_ADMIN_PASSWORD trong `.env`.

Prometheus thu thập metrics từ chính Prometheus, cAdvisor,
Nginx Exporter và PostgreSQL Exporter.
Kiểm tra tại http://localhost:9090/targets: cả 4 target phải UP.

Grafana tự nạp nguồn dữ liệu Prometheus và dashboard
“PetShop — Container, Nginx & PostgreSQL” từ cấu hình provisioning.

Dashboard gồm 6 panel:
1. Trạng thái các mục tiêu giám sát.
2. RAM sử dụng của từng container.
3. CPU sử dụng của từng container.
4. Số yêu cầu HTTP mỗi giây qua Nginx.
5. Trạng thái kết nối PostgreSQL.
6. Số kết nối tới database PetShop.

Nếu chỉnh dashboard trong giao diện Grafana, cần xuất lại JSON
và cập nhật Infrastructure/monitoring/grafana/dashboards/petshop-overview.json
để lưu thay đổi cùng mã nguồn.

## Log tập trung với Loki và Promtail

Khởi động dịch vụ log:
    docker compose up -d loki promtail

Promtail thu thập log các container thuộc project petshop_node_de28
và gửi tới Loki. Grafana kết nối Loki qua http://loki:3100.

Xem log tại http://localhost:3000:
Explore > chọn loki > Code > nhập LogQL > Run query.
Chọn Last 15 minutes; nếu chưa có log, truy cập website rồi chạy lại.

Ba truy vấn và lệnh tạo log thử được ghi trong [Documentation/LOGQL.md](Documentation/LOGQL.md).
## Hardening hệ thống

- Ứng dụng chạy bằng tài khoản node, UID 1000.
- Filesystem của ứng dụng chỉ đọc; /tmp sử dụng tmpfs.
- Ứng dụng bỏ toàn bộ Linux capabilities và bật no-new-privileges.
- Tách mạng frontend, backend và monitoring. Mạng backend đặt internal: true.
- PostgreSQL không công khai cổng ra máy host.
- Nginx bổ sung 5 security headers.
- Ứng dụng kết nối PostgreSQL bằng petshop_app, chỉ có quyền
  SELECT, INSERT, UPDATE, DELETE trên 4 bảng nghiệp vụ và quyền dùng sequence.
- petshop_app không có quyền superuser, tạo database, tạo role
  hoặc tạo bảng trong schema public.

### Cấu hình tài khoản database

Trong .env, đặt APP_DB_USER=petshop_app và cấu hình APP_DB_PASSWORD.
POSTGRES_USER và POSTGRES_PASSWORD dành cho tài khoản quản trị database.

Khi khởi tạo database mới, Database/03-roles.sql tự tạo và phân quyền
petshop_app. Với database đã tồn tại, áp dụng bằng lệnh:

    docker compose exec postgres psql -U petshop_lab -d petshop -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/03-roles.sql

Nếu thay đổi APP_DB_PASSWORD, cần tạo lại container postgres để cập nhật
biến môi trường, chạy lại lệnh phân quyền trên và tạo lại container app.

Không commit .env. Khi triển khai, sử dụng mật khẩu mạnh, riêng biệt
cho database, pgAdmin và Grafana.

### Giới hạn bảo mật

cAdvisor chạy privileged để thu thập thông tin container.
Promtail truy cập Docker socket để lấy log; mount read-only không
loại bỏ quyền truy cập Docker API. Đây là các thành phần cần được
bảo vệ khi triển khai ngoài môi trường thực hành.
