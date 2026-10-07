const { z } = require("zod");
const text = (max) => z.string().trim().min(1, "Không được để trống").max(max);
const optional = (max) => z.string().trim().max(max).optional().default("");
const code = text(20).regex(
  /^[A-Za-z0-9_-]+$/,
  "Mã chỉ gồm chữ, số, dấu _ hoặc -",
);
const id = z.coerce.number().int().positive();
const date = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Ngày không hợp lệ",
  );
const entities = {
  customers: {
    title: "Khách hàng",
    singular: "khách hàng",
    fields: [
      ["code", "Mã khách hàng"],
      ["name", "Họ tên"],
      ["phone", "Số điện thoại"],
      ["email", "Email", "email"],
      ["address", "Địa chỉ"],
      ["notes", "Ghi chú", "textarea"],
    ],
    schema: z.object({
      code,
      name: text(120),
      phone: text(15).regex(
        /^0[0-9]{9,10}$/,
        "Điện thoại gồm 10–11 số, bắt đầu bằng 0",
      ),
      email: z.union([z.email(), z.literal("")]).default(""),
      address: optional(250),
      notes: optional(2000),
    }),
  },
  pets: {
    title: "Thú cưng",
    singular: "thú cưng",
    fields: [
      ["code", "Mã thú cưng"],
      ["customer_id", "Chủ sở hữu", "customers"],
      ["name", "Tên thú cưng"],
      ["species", "Loài"],
      ["breed", "Giống"],
      ["birth_date", "Ngày sinh", "date"],
      ["weight", "Cân nặng (kg)", "number"],
      ["notes", "Ghi chú", "textarea"],
    ],
    schema: z.object({
      code,
      customer_id: id,
      name: text(100),
      species: text(40),
      breed: optional(100),
      birth_date: date.refine(
        (v) => !v || v <= new Date().toISOString().slice(0, 10),
        "Ngày sinh không được ở tương lai",
      ),
      weight: z.preprocess(
        (v) => (v === "" ? null : v),
        z.coerce.number().min(0).max(1000).nullable(),
      ),
      notes: optional(2000),
    }),
  },
  services: {
    title: "Dịch vụ spa",
    singular: "dịch vụ",
    fields: [
      ["code", "Mã dịch vụ"],
      ["name", "Tên dịch vụ"],
      ["price", "Giá (VNĐ)", "number"],
      ["duration_minutes", "Thời lượng (phút)", "number"],
      ["description", "Mô tả", "textarea"],
    ],
    schema: z.object({
      code,
      name: text(120),
      price: z.coerce.number().int().min(0).max(100000000),
      duration_minutes: z.coerce.number().int().min(5).max(480),
      description: optional(2000),
    }),
  },
  appointments: {
    title: "Lịch hẹn",
    singular: "lịch hẹn",
    fields: [
      ["code", "Mã lịch hẹn"],
      ["pet_id", "Thú cưng / chủ sở hữu", "pets"],
      ["service_id", "Dịch vụ", "services"],
      ["starts_at", "Ngày giờ hẹn", "datetime-local"],
      ["status", "Trạng thái", "status"],
      ["notes", "Ghi chú", "textarea"],
    ],
    schema: z.object({
      code,
      pet_id: id,
      service_id: id,
      starts_at: text(30)
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ngày giờ không hợp lệ")
        .refine(
          (v) =>
            !isNaN(Date.parse(v + "+07:00")) &&
            new Date(v + "Z").toISOString().slice(0, 16) === v,
          "Ngày giờ không hợp lệ",
        ),
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
      notes: optional(2000),
    }),
  },
};
const statuses = {
  scheduled: "Đã đặt",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};
module.exports = { entities, statuses };
