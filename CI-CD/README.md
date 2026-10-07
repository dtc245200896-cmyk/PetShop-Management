# CI/CD

Workflow thật ở .github/workflows/ci.yml để GitHub Actions nhận diện tự động. CI cài dependency bằng lockfile, kiểm tra syntax và chạy workflow tests với pg-mem. Trigger push/pull_request. Không giả lập việc deploy: CD chưa cấu hình ở giai đoạn phần mềm.

Khi đưa lên GitHub cần dùng tài khoản/repo của sinh viên. Chưa push hoặc tạo repository thay sinh viên. Không commit .env hay node_modules.
