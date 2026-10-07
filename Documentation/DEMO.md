# Demo chức năng trước DevOps

1. Mở tổng quan, đối chiếu seed 5 KH / 6 thú cưng / 4 dịch vụ / 3 lịch.
2. Tạo khách KH006, tên và điện thoại hợp lệ; tìm lần lượt bằng mã, tên, số điện thoại; sửa địa chỉ.
3. Tạo thú cưng TC007 thuộc KH006; mở chi tiết và sửa cân nặng. Tìm bằng điện thoại chủ.
4. Tạo dịch vụ DV005 giá100000 thời lượng30 phút. Thử giá âm để thấy validation.
5. Đặt LH004 cho TC007, DV005 tại giờ đã chọn; xem giá và kết thúc dự kiến.
6. Đặt lịch thứ hai cho cùng thú cưng trong khoảng30 phút đó: phải bị từ chối. Đặt đúng giờ kết thúc: được phép.
7. Lọc lịch bằng ngày và trạng thái; sửa thành đang thực hiện, hoàn thành hoặc hủy.
8. Sửa giá DV005 rồi mở lịch cũ: giá snapshot không thay đổi. Khi đổi sang dịch vụ khác, snapshot cập nhật theo dịch vụ mới.
9. Thử xóa KH006 khi còn TC007: phải bị chặn. Xóa lịch, thú cưng, khách, dịch vụ theo thứ tự để kiểm tra xóa.
10. Trong pgAdmin SELECT * FROM từng bảng, đối chiếu thay đổi; down/up Compose và kiểm tra dữ liệu vẫn còn.

Chụp ảnh tổng quan, từng màn hình CRUD, lỗi trùng lịch, pgAdmin. Chưa chụp minh chứng Prometheus/Grafana/Loki ở giai đoạn này.
