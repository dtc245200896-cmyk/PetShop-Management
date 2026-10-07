const express = require("express");
const session = require("express-session");
const crypto = require("node:crypto");
const path = require("node:path");
const { entities, statuses } = require("./entities");
const { repository } = require("./repository");
function createApp(pool) {
  const app = express(),
    repo = repository(pool);
  app.disable("x-powered-by");
  app.set("view engine", "ejs");
  app.set("views", path.resolve(__dirname, "../../Frontend/views"));
  app.use(
    "/static",
    express.static(path.resolve(__dirname, "../../Frontend/public")),
  );
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", maxAge: 3600000 },
    }),
  );
  app.use((req, res, next) => {
    req.session.csrf ||= crypto.randomBytes(32).toString("hex");
    res.locals = {
      ...res.locals,
      csrf: req.session.csrf,
      entities,
      statuses,
      active: req.path.split("/")[1],
      flash: req.session.flash,
    };
    delete req.session.flash;
    res.locals.money = (v) => Number(v).toLocaleString("vi-VN") + " đ";
    res.locals.time = (v) =>
      new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    if (req.method === "POST" && req.body._csrf !== req.session.csrf)
      return res
        .status(403)
        .render("error", {
          title: "Phiên không hợp lệ",
          message: "Tải lại trang rồi thử lại.",
        });
    next();
  });
  app.param("id", (req, res, next, value) => {
    if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 2147483647)
      return res
        .status(404)
        .render("error", {
          title: "Không tìm thấy",
          message: "Mã định danh không hợp lệ.",
        });
    next();
  });
  app.get("/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  });
  app.get("/", async (req, res) => {
    const counts = {};
    for (const t of Object.keys(entities))
      counts[t] = Number(
        (await pool.query(`SELECT COUNT(*) AS count FROM ${t}`)).rows[0].count,
      );
    res.render("dashboard", {
      title: "Tổng quan",
      counts,
      appointments: await repo.list("appointments"),
    });
  });
  async function options() {
    return {
      customers: await repo.list("customers"),
      pets: await repo.list("pets"),
      services: await repo.list("services"),
    };
  }
  function friendly(e) {
    if (e.code === "23505") return "Mã hoặc số điện thoại đã tồn tại.";
    if (e.code === "23503")
      return "Dữ liệu đang được tham chiếu hoặc lựa chọn không tồn tại. Hãy xử lý dữ liệu liên quan trước.";
    return e.status
      ? e.message
      : "Không thể xử lý yêu cầu. Kiểm tra kết nối database.";
  }
  for (const [type, meta] of Object.entries(entities)) {
    app.get("/" + type, async (req, res) => {
      const q = String(req.query.q || "").slice(0, 100),
        status = statuses[req.query.status] ? req.query.status : "",
        day = /^\d{4}-\d{2}-\d{2}$/.test(req.query.day || "")
          ? req.query.day
          : "";
      res.render("list", {
        title: meta.title,
        type,
        meta,
        rows: await repo.list(type, q, status, day),
        q,
        status,
        day,
      });
    });
    const form = async (req, res) => {
      const record = req.params.id ? await repo.get(type, req.params.id) : {};
      if (!record)
        return res
          .status(404)
          .render("error", {
            title: "Không tìm thấy",
            message: "Bản ghi không tồn tại.",
          });
      res.render("form", {
        title: (req.params.id ? "Sửa " : "Thêm ") + meta.singular,
        type,
        meta,
        record,
        error: null,
        options: await options(),
      });
    };
    app.get("/" + type + "/new", form);
    app.get("/" + type + "/:id/edit", form);
    app.get("/" + type + "/:id", async (req, res) => {
      const record = await repo.get(type, req.params.id);
      if (!record)
        return res
          .status(404)
          .render("error", {
            title: "Không tìm thấy",
            message: "Bản ghi không tồn tại.",
          });
      res.render("detail", {
        title: meta.title + " / " + record.code,
        type,
        meta,
        record,
      });
    });
    const save = async (req, res) => {
      try {
        const data = meta.schema.parse(req.body);
        const id = await repo.save(
          type,
          data,
          req.params.id ? Number(req.params.id) : null,
        );
        req.session.flash = "Đã lưu thành công";
        res.redirect(303, "/" + type + "/" + id);
      } catch (e) {
        const message = e.issues
          ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" • ")
          : friendly(e);
        if (!e.issues && !e.status && !e.code) console.error(e);
        res
          .status(e.status || 400)
          .render("form", {
            title: "Kiểm tra thông tin",
            type,
            meta,
            record: { ...req.body, id: req.params.id },
            error: message,
            options: await options(),
          });
      }
    };
    app.post("/" + type, save);
    app.post("/" + type + "/:id", save);
    app.post("/" + type + "/:id/delete", async (req, res) => {
      try {
        await repo.remove(type, req.params.id);
        req.session.flash = "Đã xóa thành công";
        res.redirect(303, "/" + type);
      } catch (e) {
        res
          .status(e.status || 409)
          .render("error", { title: "Không thể xóa", message: friendly(e) });
      }
    });
  }
  app.use((req, res) =>
    res
      .status(404)
      .render("error", {
        title: "Không tìm thấy",
        message: "Trang không tồn tại.",
      }),
  );
  app.use((e, req, res, next) => {
    console.error(e.message);
    res
      .status(500)
      .render("error", {
        title: "Lỗi hệ thống",
        message:
          "Không thể xử lý yêu cầu. Kiểm tra database hoặc tải lại trang.",
      });
  });
  return app;
}
module.exports = { createApp };
