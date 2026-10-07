# PetShop Management Đề 28: Hệ thống Quản lý Cửa hàng Thú cưng

Website quản lý cửa hàng thú cưng phục vụ học phần Triển khai và Quản trị Hệ thống Phần mềm. Ứng dụng quản lý khách hàng, thú cưng, dịch vụ spa và lịch hẹn; toàn bộ hệ thống triển khai bằng **Docker Compose**.

| Thành phần | Công nghệ |
|---|---|
| Website | Node.js 24, Express 5, EJS |
| Cơ sở dữ liệu | PostgreSQL 16, pgAdmin |
| Reverse proxy | Nginx |
| Giám sát | Prometheus, Grafana, cAdvisor, Nginx Exporter, PostgreSQL Exporter |
| Log tập trung | Loki, Promtail, LogQL |
| Kiểm tra mã nguồn | GitHub Actions |

## 1. Chức năng

- **Khách hàng:** thêm, xem, sửa, xóa; tìm theo mã, tên hoặc điện thoại; kiểm tra mã và điện thoại không trùng.
- **Thú cưng:** quản lý thông tin và chủ sở hữu; tìm theo mã, tên, chủ hoặc điện thoại.
- **Dịch vụ spa:** quản lý giá, thời lượng và mô tả; kiểm tra dữ liệu đầu vào.
- **Lịch hẹn:** đặt, sửa, hủy, hoàn thành; tìm kiếm và lọc theo ngày, trạng thái; chặn lịch trùng thời gian của cùng thú cưng.
- **Giá và thời lượng lịch hẹn:** lưu tại thời điểm đặt; giữ giá trị đã lưu khi chỉ sửa giờ, ghi chú hoặc trạng thái mà không đổi dịch vụ.
- **Tổng quan:** thống kê các nhóm dữ liệu và hiển thị lịch hẹn gần đây.

Dữ liệu khởi tạo gồm **5 khách hàng, 6 thú cưng, 4 dịch vụ và 3 lịch hẹn**. Lịch mẫu thuộc tháng 10/2026; có thể chỉnh sửa trên website.

## 2. Khởi động trên Windows

### Chuẩn bị

- Cài và bật **Docker Desktop**, sử dụng Linux containers.
- Cài Git nếu tải dự án từ GitHub.
- Không cần cài Node.js hoặc PostgreSQL trên Windows để chạy bằng Compose.

### Lần chạy đầu tiên

```powershell
git clone https://github.com/dtc245200896-cmyk/PetShop-Management.git
cd PetShop-Management
Copy-Item .env.example .env
notepad .env
```

Trước khi chạy, cấu hình các biến trong `.env`:

| Biến | Mục đích |
|---|---|
| `POSTGRES_DB` | Tên database |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Tài khoản quản trị PostgreSQL |
| `APP_DB_USER` | Đặt là `petshop_app`, phù hợp với file phân quyền |
| `APP_DB_PASSWORD` | Mật khẩu tài khoản database của ứng dụng |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Tài khoản khởi tạo pgAdmin |
| `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD` | Tài khoản khởi tạo Grafana |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên ít nhất 32 ký tự |

Sử dụng mật khẩu mạnh, riêng biệt. Đặt giá trị mật khẩu trong dấu nháy đơn nếu có ký tự đặc biệt như `#`. **Không đưa `.env` lên GitHub.**

Lưu `.env`, rồi chạy:

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Chờ ứng dụng và PostgreSQL đạt trạng thái `healthy`. Metrics và log có thể cần thêm thời gian để xuất hiện.

### Địa chỉ truy cập

| Dịch vụ | Địa chỉ mặc định |
|---|---|
| Website qua Nginx | http://localhost:8088 |
| pgAdmin | http://localhost:5050 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Nếu cổng bị chiếm, đổi biến cổng tương ứng trong `.env`, rồi chạy lại `docker compose up -d`. Các cổng công khai của dự án được bind vào `127.0.0.1`.

### Những lần chạy tiếp theo

Mở Docker Desktop, mở PowerShell tại thư mục dự án và chạy:

```powershell
docker compose up -d
docker compose ps
```

## 3. Kết nối PostgreSQL bằng pgAdmin

Đăng nhập pgAdmin bằng tài khoản đã cấu hình khi khởi tạo. Chọn **Add New Server** và nhập:

| Trường | Giá trị |
|---|---|
| Name | `PetShop` |
| Host name/address | `postgres` |
| Port | `5432` |
| Maintenance database | Giá trị `POSTGRES_DB` |
| Username | Giá trị `POSTGRES_USER` |
| Password | Giá trị `POSTGRES_PASSWORD` |

Host là tên service `postgres` trong mạng Docker. Mở **Schemas → public → Tables** để xem `customers`, `pets`, `services`, `appointments`.

Để chạy SQL, nhấp chuột phải vào database PetShop và chọn **Query Tool**.

## 4. Nginx reverse proxy

Website được truy cập qua Nginx tại cổng `8088`; Nginx chuyển yêu cầu tới `app:3000`. Ứng dụng không publish trực tiếp cổng ra máy host.

Cấu hình tại `Infrastructure/nginx/default.conf`, gồm 5 security headers:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

Kiểm tra cấu hình và phản hồi:

```powershell
docker compose exec nginx nginx -t
curl.exe -I http://localhost:8088/
```

Sau khi sửa cấu hình Nginx, kiểm tra cú pháp rồi reload:

```powershell
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 5. Giám sát bằng Prometheus và Grafana

Prometheus thu thập metrics từ **4 target**: chính Prometheus, cAdvisor, Nginx Exporter và PostgreSQL Exporter. Kiểm tra tại http://localhost:9090/targets; cả 4 target phải `UP`.

Grafana tự nạp nguồn dữ liệu Prometheus và dashboard **PetShop — Container, Nginx & PostgreSQL** bằng provisioning.

| Panel | Nội dung |
|---|---|
| Trạng thái các mục tiêu giám sát | Khả năng scrape các target |
| RAM sử dụng của từng container | Bộ nhớ container |
| CPU sử dụng của từng container | Mức sử dụng CPU |
| Số yêu cầu HTTP mỗi giây qua Nginx | Lưu lượng yêu cầu web |
| Trạng thái kết nối PostgreSQL | Khả năng kết nối của exporter tới DB |
| Số kết nối tới database PetShop | Số kết nối database |

Đăng nhập Grafana bằng tài khoản đã cấu hình khi khởi tạo. Khi sửa dashboard, **lưu trước khi refresh**, sau đó xuất JSON và cập nhật file:

`Infrastructure/monitoring/grafana/dashboards/petshop-overview.json`

## 6. Log tập trung với Loki và Promtail

Promtail thu thập log các container thuộc Compose project `petshop_node_de28`, gắn nhãn và gửi tới Loki. Grafana kết nối Loki qua địa chỉ nội bộ `http://loki:3100`.

Trong Grafana, mở **Explore → chọn loki → Code**, chọn khoảng thời gian phù hợp rồi chạy LogQL. Không cần tạo lại dashboard giám sát.

### Ba truy vấn mẫu

**Toàn bộ log Nginx:**

```logql
{container="petshop_node_de28-nginx-1"}
```

**Các yêu cầu GET:**

```logql
{container="petshop_node_de28-nginx-1"} |= "GET"
```

**Các phản hồi 404:**

```logql
{container="petshop_node_de28-nginx-1"} |= " 404 "
```

Tạo log thử từ PowerShell:

```powershell
curl.exe -s -o NUL http://localhost:8088/
curl.exe -s -o NUL http://localhost:8088/trang-khong-ton-tai
```

Chọn **Last 15 minutes** và chạy lại truy vấn. Xem thêm [hướng dẫn LogQL](Documentation/LOGQL.md).

## 7. Hardening

| Biện pháp | Cấu hình |
|---|---|
| Non-root cho ứng dụng | Chạy bằng `node`, UID 1000 |
| Filesystem chỉ đọc | `read_only: true`; `/tmp` dùng tmpfs |
| Hạn chế quyền container | `cap_drop: ALL`, `no-new-privileges: true` |
| Tách mạng | `frontend`, `backend`, `monitoring`; backend đặt `internal: true` |
| Hạn chế cổng công khai | PostgreSQL không publish cổng; các giao diện bind localhost |
| Quyền DB của ứng dụng | Tài khoản riêng `petshop_app` với quyền CRUD trên 4 bảng và quyền dùng sequence |
| Hạn chế quyền quản trị DB | `petshop_app` không có superuser, quyền tạo database, role hoặc bảng trong schema public |
| Security headers | 5 header tại Nginx |

### Khởi tạo và cập nhật tài khoản ứng dụng

`Database/03-roles.sql` lấy mật khẩu từ biến môi trường `APP_DB_PASSWORD`, tạo role nếu chưa có và cấp quyền nghiệp vụ. File này chạy tự động khi khởi tạo volume PostgreSQL mới.

Với database đã tồn tại, chạy:

```powershell
docker compose exec postgres psql -U petshop_lab -d petshop -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/03-roles.sql
```

Lệnh trên dùng tài khoản quản trị `petshop_lab` và database `petshop` của môi trường thực hành; thay hai giá trị nếu cấu hình của bạn khác.

Khi đổi `APP_DB_PASSWORD` trong `.env`, lưu file và chạy từng lệnh:

```powershell
docker compose up -d --force-recreate postgres
docker compose exec postgres psql -U petshop_lab -d petshop -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/03-roles.sql
```

Chờ lệnh SQL kết thúc bằng `COMMIT`, rồi chạy:

```powershell
docker compose up -d --force-recreate app
docker compose exec nginx nginx -s reload
```

Kiểm tra website và thao tác lưu dữ liệu sau khi cập nhật.

### Giới hạn hiện tại

- Website chưa có đăng nhập và phân quyền người dùng; session sử dụng MemoryStore.
- cAdvisor chạy `privileged` để thu thập thông tin container.
- Promtail truy cập Docker socket; mount read-only không loại bỏ quyền truy cập Docker API.
- PostgreSQL Exporter hiện sử dụng tài khoản quản trị DB; có thể tách tài khoản giám sát với quyền hạn phù hợp khi hoàn thiện bảo mật.
- Nginx hiện dùng HTTP và security headers; chưa cấu hình HTTPS.
- Đổi biến mật khẩu trong `.env` không tự đổi mật khẩu tài khoản đã lưu trong PostgreSQL, pgAdmin hoặc Grafana. Cần cập nhật bằng cơ chế của từng dịch vụ.

## 8. Cấu trúc dự án

| Nhóm | Vị trí | Nội dung |
|---|---|---|
| Backend | `Backend/src`, `Backend/tests` | Routes, kiểm tra dữ liệu, truy cập PostgreSQL, kiểm thử |
| Frontend | `Frontend/views`, `Frontend/public` | EJS, CSS, JavaScript |
| Database | `Database` | Schema, dữ liệu mẫu, phân quyền |
| Infrastructure | `Infrastructure`, `docker-compose.yml` | Dockerfile, Nginx, monitoring, logging, Compose |
| Documentation | `Documentation`, `README.md` | Thiết kế, hướng dẫn demo và kiểm thử |
| CI/CD | `CI-CD`, `.github/workflows` | GitHub Actions kiểm tra mã nguồn; chưa tự động triển khai CD |

## 9. Kiểm tra và vận hành

### Trạng thái và sức khỏe

```powershell
docker compose config --quiet
docker compose ps
Invoke-RestMethod http://localhost:8088/health
```

### Xem log

```powershell
docker compose logs --tail 80 app postgres pgadmin nginx
docker compose logs --tail 80 loki promtail
```

### Dừng hệ thống

```powershell
docker compose down
```

`down` giữ named volumes. **`docker compose down -v` xóa các named volumes, bao gồm database, cấu hình pgAdmin và dữ liệu giám sát/log.** Chỉ dùng khi chủ động xóa dữ liệu.

Schema, seed và file phân quyền trong thư mục init chỉ tự chạy khi volume PostgreSQL còn trống.

### Kiểm thử khi phát triển

Nếu đã cài Node.js 24 trên máy:

```powershell
npm ci
npm run check
npm test
```

Ứng dụng đọc cấu hình từ environment. Docker Compose đọc `.env` và truyền các biến được khai báo vào container; Node.js không tự đọc file `.env` trong cách chạy hiện tại.

## 10. Minh chứng và tài liệu

| Nội dung | Minh chứng cần lưu |
|---|---|
| Chức năng website | CRUD khách hàng, thú cưng, dịch vụ, lịch hẹn và chặn trùng giờ |
| Database và pgAdmin | Kết nối thành công, 4 bảng và dữ liệu thực tế |
| Nginx | Kết quả `nginx -t`, HTTP 200 và security headers |
| Monitoring | 4 target UP và dashboard có dữ liệu |
| Logging | Kết quả 3 truy vấn LogQL |
| Hardening | UID, read-only, capabilities, mạng internal và quyền `petshop_app` |
| GitHub | Source, cấu hình, README và lịch sử commit |

Các commit theo giai đoạn:

| Commit | Nội dung |
|---|---|
| `8e5793f` | Xây dựng chức năng với Express, EJS, PostgreSQL và pgAdmin |
| `ebcb83d` | Nginx reverse proxy và security headers — commit 1 theo đề |
| `2ae8c63` | Prometheus và dashboard Grafana — commit 2 theo đề |
| `6d031b5` | Loki, Promtail và ví dụ LogQL — commit 3 theo đề |

Tham khảo [thiết kế](Documentation/DESIGN.md), [kiểm thử](Documentation/TESTING.md), [hướng dẫn demo](Documentation/DEMO.md) và [LogQL](Documentation/LOGQL.md).

Báo cáo nộp môn học cần tối thiểu **10 trang**, có bìa thông tin sinh viên, kiến trúc hệ thống, cách hoạt động, kết quả triển khai và hình minh chứng.
