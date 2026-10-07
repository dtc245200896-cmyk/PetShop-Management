// Tên bảng/cột chỉ lấy từ danh sách nội bộ; mọi giá trị dùng SQL parameters.
const { entities } = require("./entities");
const join = {
  customers: "SELECT c.* FROM customers c",
  pets: "SELECT p.*, c.name AS owner_name, c.phone AS owner_phone FROM pets p JOIN customers c ON c.id=p.customer_id",
  services: "SELECT s.* FROM services s",
  appointments:
    "SELECT a.*, p.name AS pet_name, c.name AS owner_name, c.phone AS owner_phone, s.name AS service_name FROM appointments a JOIN pets p ON p.id=a.pet_id JOIN customers c ON c.id=p.customer_id JOIN services s ON s.id=a.service_id",
};
const alias = { customers: "c", pets: "p", services: "s", appointments: "a" };
const search = {
  customers: ["c.code", "c.name", "c.phone"],
  pets: ["p.code", "p.name", "c.name", "c.phone"],
  services: ["s.code", "s.name"],
  appointments: ["a.code", "p.name", "c.name", "c.phone"],
};
function repository(pool) {
  async function list(type, q = "", status = "", day = "") {
    const args = [],
      filters = [];
    if (q) {
      args.push("%" + q + "%");
      filters.push(
        "(" + search[type].map((col) => `${col} ILIKE $1`).join(" OR ") + ")",
      );
    }
    if (type === "appointments" && status) {
      args.push(status);
      filters.push(`a.status=$${args.length}`);
    }
    if (type === "appointments" && day) {
      args.push(day + "T00:00:00+07:00", day + "T23:59:59.999+07:00");
      filters.push(
        `a.starts_at BETWEEN $${args.length - 1} AND $${args.length}`,
      );
    }
    return (
      await pool.query(
        join[type] +
          (filters.length ? " WHERE " + filters.join(" AND ") : "") +
          ` ORDER BY ${alias[type]}.id DESC LIMIT 500`,
        args,
      )
    ).rows;
  }
  async function get(type, id) {
    return (await pool.query(join[type] + ` WHERE ${alias[type]}.id=$1`, [id]))
      .rows[0];
  }
  async function save(type, data, id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (type === "appointments") {
        const pet = (
          await client.query("SELECT id FROM pets WHERE id=$1 FOR UPDATE", [
            data.pet_id,
          ])
        ).rows[0];
        const service = (
          await client.query("SELECT * FROM services WHERE id=$1", [
            data.service_id,
          ])
        ).rows[0];
        if (!pet || !service)
          throw Object.assign(
            new Error("Thú cưng hoặc dịch vụ không tồn tại"),
            { status: 400 },
          );
        const old = id
          ? (await client.query("SELECT * FROM appointments WHERE id=$1", [id]))
              .rows[0]
          : null;
        // Giữ snapshot giá/thời lượng khi chỉ sửa ghi chú/trạng thái.
        const same = old && Number(old.service_id) === data.service_id;
        data.price = same ? old.price : service.price;
        const duration = same
          ? (new Date(old.ends_at) - new Date(old.starts_at)) / 60000
          : service.duration_minutes;
        data.starts_at = new Date(data.starts_at + "+07:00");
        data.ends_at = new Date(+data.starts_at + duration * 60000);
        if (data.status !== "cancelled") {
          const overlap = await client.query(
            "SELECT id FROM appointments WHERE pet_id=$1 AND status <> 'cancelled' AND starts_at < $2 AND ends_at > $3 AND id <> $4",
            [data.pet_id, data.ends_at, data.starts_at, id || 0],
          );
          if (overlap.rows.length)
            throw Object.assign(
              new Error("Thú cưng đã có lịch trùng thời gian. Chọn giờ khác."),
              { status: 409 },
            );
        }
      }
      const cols = Object.keys(data),
        values = Object.values(data).map((v) => (v === "" ? null : v));
      const sql = id
        ? `UPDATE ${type} SET ${cols.map((c, i) => `${c}=$${i + 1}`).join(",")} WHERE id=$${cols.length + 1} RETURNING id`
        : `INSERT INTO ${type} (${cols.join(",")}) VALUES (${cols.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING id`;
      const result = await client.query(sql, id ? [...values, id] : values);
      if (!result.rows.length)
        throw Object.assign(new Error("Không tìm thấy dữ liệu"), {
          status: 404,
        });
      await client.query("COMMIT");
      return result.rows[0].id;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  return {
    list,
    get,
    save,
    remove: async (type, id) => {
      const r = await pool.query(
        `DELETE FROM ${type} WHERE id=$1 RETURNING id`,
        [id],
      );
      if (!r.rows.length)
        throw Object.assign(new Error("Không tìm thấy dữ liệu"), {
          status: 404,
        });
    },
  };
}
module.exports = { repository };
