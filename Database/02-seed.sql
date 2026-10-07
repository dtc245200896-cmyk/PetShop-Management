INSERT INTO customers(code,name,phone,email,address) VALUES
('KH001','Nguyễn Minh Anh','0901234561','anh@example.com','Hà Nội'),
('KH002','Trần Hoàng Nam','0901234562','nam@example.com','Thái Nguyên'),
('KH003','Lê Thu Hà','0901234563','ha@example.com','Hà Nội'),
('KH004','Phạm Đức Huy','0901234564',NULL,'Thái Nguyên'),
('KH005','Vũ Ngọc Linh','0901234565',NULL,'Hà Nội');
INSERT INTO pets(code,customer_id,name,species,breed,weight) VALUES
('TC001',1,'Milo','Chó','Poodle',4.5),('TC002',1,'Miu','Mèo','Anh lông ngắn',3.2),
('TC003',2,'Bông','Chó','Corgi',9),('TC004',3,'Cam','Mèo','Mèo ta',3.5),
('TC005',4,'Lucky','Chó','Golden',20),('TC006',5,'Sữa','Mèo','Ragdoll',4);
INSERT INTO services(code,name,price,duration_minutes,description) VALUES
('DV001','Tắm và sấy',150000,45,'Tắm sạch, sấy khô, chải lông'),
('DV002','Cắt tỉa lông',250000,60,'Tạo kiểu lông theo yêu cầu'),
('DV003','Vệ sinh tai và móng',80000,20,'Vệ sinh tai, cắt móng'),
('DV004','Spa toàn diện',400000,90,'Tắm, tỉa lông và vệ sinh');
INSERT INTO appointments(code,pet_id,service_id,starts_at,ends_at,price,status) VALUES
('LH001',1,1,'2026-10-08 09:00:00+07','2026-10-08 09:45:00+07',150000,'scheduled'),
('LH002',3,2,'2026-10-08 10:00:00+07','2026-10-08 11:00:00+07',250000,'scheduled'),
('LH003',4,3,'2026-10-06 14:00:00+07','2026-10-06 14:20:00+07',80000,'completed');
