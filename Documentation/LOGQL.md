# Truy vấn LogQL - PetShop Đề 28

Mở Grafana > Explore > chọn loki > Code.
Chọn Last 15 minutes, sau đó bấm Run query.

## 1. Xem log container Nginx
    {container="petshop_node_de28-nginx-1"}

## 2. Lọc dòng log chứa GET
    {container="petshop_node_de28-nginx-1"} |= "GET"

Lệnh tạo yêu cầu GET:
    curl.exe -s -o NUL http://localhost:8088/

## 3. Lọc dòng log chứa mã 404
    {container="petshop_node_de28-nginx-1"} |= " 404 "

Lệnh tạo yêu cầu 404:
    curl.exe -i http://localhost:8088/trang-khong-ton-tai

Cả ba truy vấn đã trả về log khi kiểm tra thực hành.
Luồng thu thập: Nginx > Promtail > Loki > Grafana.
