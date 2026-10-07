const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const request = require("supertest");
const { newDb } = require("pg-mem");
const { createApp } = require("../src/app");
const { repository } = require("../src/repository");
const root = path.resolve(__dirname, "../..");
function setup() {
  const db = newDb();
  db.public.none(
    fs.readFileSync(path.join(root, "Database/01-schema.sql"), "utf8"),
  );
  db.public.none(
    fs.readFileSync(path.join(root, "Database/02-seed.sql"), "utf8"),
  );
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  return {
    pool,
    agent: request.agent(createApp(pool)),
    repo: repository(pool),
  };
}
async function token(agent, url = "/customers/new") {
  const r = await agent.get(url).expect(200);
  return r.text.match(/name="_csrf" value="([^"]+)"/)[1];
}
test("EJS renders all four sections, detail/edit pages, static files and health", async () => {
  const { agent, pool } = setup();
  await agent
    .get("/")
    .expect(200)
    .then((r) => assert.match(r.text, /Tổng quan cửa hàng/));
  for (const type of ["customers", "pets", "services", "appointments"])
    for (const tail of ["", "/1", "/1/edit", "/new"])
      await agent.get("/" + type + tail).expect(200);
  await agent.get("/static/style.css").expect(200);
  await agent
    .get("/health")
    .expect(200)
    .then((r) => assert.equal(r.body.database, "connected"));
  await pool.end();
});
test("customer create, search by code/name/phone, update and delete", async () => {
  const { agent, pool } = setup(),
    csrf = await token(agent);
  const body = {
    _csrf: csrf,
    code: "KH_TEST",
    name: "Khách kiểm thử",
    phone: "0987654321",
    email: "test@example.com",
    address: "Hà Nội",
    notes: "",
  };
  const saved = await agent
    .post("/customers")
    .type("form")
    .send(body)
    .expect(303);
  const url = saved.headers.location;
  for (const q of ["KH_TEST", "Khách kiểm thử", "0987654321"])
    await agent
      .get("/customers")
      .query({ q })
      .expect(200)
      .then((r) => assert.match(r.text, /KH_TEST/));
  await agent
    .post(url)
    .type("form")
    .send({ ...body, name: "Tên đã sửa" })
    .expect(303);
  await agent
    .get(url)
    .expect(200)
    .then((r) => assert.match(r.text, /Tên đã sửa/));
  await agent
    .post(url + "/delete")
    .type("form")
    .send({ _csrf: csrf })
    .expect(303);
  await agent.get(url).expect(404);
  await pool.end();
});
test("validation, duplicate codes/phone, CSRF, HTML escaping and SQL injection input", async () => {
  const { agent, pool } = setup(),
    csrf = await token(agent);
  await agent.post("/customers").type("form").send({ code: "X" }).expect(403);
  await agent
    .post("/customers")
    .type("form")
    .send({ _csrf: csrf, code: "X", name: "Test", phone: "bad" })
    .expect(400);
  await agent
    .post("/customers")
    .type("form")
    .send({ _csrf: csrf, code: "KH001", name: "Test", phone: "0987654321" })
    .expect(400);
  await agent
    .post("/customers")
    .type("form")
    .send({ _csrf: csrf, code: "XX", name: "Test", phone: "0901234561" })
    .expect(400);
  await agent
    .post("/customers")
    .type("form")
    .send({
      _csrf: csrf,
      code: "HTML",
      name: "<script>alert(1)</script>",
      phone: "0987654321",
    })
    .expect(303);
  await agent
    .get("/customers")
    .query({ q: "HTML" })
    .expect(200)
    .then((r) => {
      assert.match(r.text, /&lt;script&gt;/);
      assert.ok(!r.text.includes("<script>alert(1)</script>"));
    });
  await agent
    .get("/customers")
    .query({ q: "' OR 1=1 --" })
    .expect(200)
    .then((r) => assert.match(r.text, /0 kết quả/));
  await pool.end();
});
test("foreign keys restrict customer/pet/service deletion", async () => {
  const { agent, pool } = setup(),
    csrf = await token(agent);
  for (const url of [
    "/customers/1/delete",
    "/pets/1/delete",
    "/services/1/delete",
  ])
    await agent.post(url).type("form").send({ _csrf: csrf }).expect(409);
  await pool.end();
});
test("pets and services full create/update/delete, service numeric validation", async () => {
  const { agent, pool } = setup(),
    csrf = await token(agent);
  const pet = {
    _csrf: csrf,
    code: "TC_TEST",
    customer_id: 2,
    name: "Mèo test",
    species: "Mèo",
    breed: "Mèo ta",
    birth_date: "2020-02-02",
    weight: 4,
    notes: "",
  };
  const p = (await agent.post("/pets").type("form").send(pet).expect(303))
    .headers.location;
  await agent
    .post(p)
    .type("form")
    .send({ ...pet, name: "Mèo sửa" })
    .expect(303);
  await agent
    .get(p)
    .expect(200)
    .then((r) => assert.match(r.text, /Mèo sửa/));
  await agent
    .post(p + "/delete")
    .type("form")
    .send({ _csrf: csrf })
    .expect(303);
  const service = {
    _csrf: csrf,
    code: "DV_TEST",
    name: "Spa test",
    price: 50000,
    duration_minutes: 30,
    description: "",
  };
  await agent
    .post("/services")
    .type("form")
    .send({ ...service, price: -1 })
    .expect(400);
  const s = (
    await agent.post("/services").type("form").send(service).expect(303)
  ).headers.location;
  await agent
    .post(s)
    .type("form")
    .send({ ...service, price: 60000 })
    .expect(303);
  await agent
    .get(s)
    .expect(200)
    .then((r) => assert.match(r.text, /60.000/));
  await agent
    .post(s + "/delete")
    .type("form")
    .send({ _csrf: csrf })
    .expect(303);
  await pool.end();
});
test("appointment overlap, touching boundary, cancellation, filters and snapshot", async () => {
  const { agent, pool, repo } = setup(),
    csrf = await token(agent);
  const body = {
    _csrf: csrf,
    code: "LH_TEST",
    pet_id: 1,
    service_id: 1,
    starts_at: "2026-10-08T09:15",
    status: "scheduled",
    notes: "",
  };
  await agent.post("/appointments").type("form").send(body).expect(409);
  const url = (
    await agent
      .post("/appointments")
      .type("form")
      .send({ ...body, starts_at: "2026-10-08T09:45" })
      .expect(303)
  ).headers.location;
  await pool.query(
    "UPDATE services SET price=999999,duration_minutes=100 WHERE id=1",
  );
  await agent
    .post(url)
    .type("form")
    .send({ ...body, starts_at: "2026-10-08T09:45", status: "completed" })
    .expect(303);
  const record = await repo.get("appointments", url.split("/").pop());
  assert.equal(Number(record.price), 150000);
  assert.equal(
    (new Date(record.ends_at) - new Date(record.starts_at)) / 60000,
    45,
  );
  await agent
    .get("/appointments")
    .query({ q: "LH_TEST", status: "completed", day: "2026-10-08" })
    .expect(200)
    .then((r) => assert.match(r.text, /LH_TEST/));
  await agent
    .post(url)
    .type("form")
    .send({ ...body, starts_at: "2026-10-08T09:45", status: "cancelled" })
    .expect(303);
  await agent
    .post("/appointments")
    .type("form")
    .send({ ...body, code: "LH_REBOOK", starts_at: "2026-10-08T09:45" })
    .expect(303);
  await agent
    .post(url + "/delete")
    .type("form")
    .send({ _csrf: csrf })
    .expect(303);
  await pool.end();
});

test("invalid calendar dates, missing records and invalid identifiers", async () => {
  const { agent, pool } = setup(),
    csrf = await token(agent);
  await agent.get("/pets/bad").expect(404);
  await agent.get("/pets/999").expect(404);
  await agent
    .post("/pets")
    .type("form")
    .send({
      _csrf: csrf,
      code: "DATE",
      customer_id: 1,
      name: "Test",
      species: "Mèo",
      birth_date: "2026-02-31",
      weight: 3,
    })
    .expect(400);
  await agent
    .post("/appointments")
    .type("form")
    .send({
      _csrf: csrf,
      code: "DATE",
      pet_id: 1,
      service_id: 1,
      starts_at: "2026-02-31T12:00",
      status: "scheduled",
    })
    .expect(400);
  await pool.end();
});
