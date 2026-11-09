#!/usr/bin/env node
// Node HTTP server for a TanStack Start build.
// Serves hashed client assets, then forwards every other request to the
// server `fetch` export (the same entry the Lambda shim used to call).
import { createServer } from "node:http";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, normalize, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 3000);
const surface = process.env.APP_SURFACE || "app";
const databaseUrl = process.env.DATABASE_URL || "";

let poolPromise;
function getPool() {
  if (!databaseUrl) return null;
  if (!poolPromise) {
    poolPromise = import("pg").then(({ default: pg }) => new pg.Pool({ connectionString: databaseUrl }));
  }
  return poolPromise;
}

const NUMBER_FIELDS = ["rating", "price", "mrp", "reviews", "starting_at", "experience", "jobs", "on_time", "energy_rating", "sort_order"];

function normalizeRow(row) {
  const out = { ...row };
  for (const key of NUMBER_FIELDS) {
    if (out[key] != null && out[key] !== "" && !Array.isArray(out[key])) out[key] = Number(out[key]);
  }
  return out;
}

// node-postgres writes JavaScript arrays as Postgres arrays. These columns are jsonb.
function bindValue(value) {
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

const SESSION_COOKIE = "gayatri_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const ADMIN_TABLES = new Set(["products", "services", "amc_plans", "technicians", "technician_tasks"]);

function hashPassword(password, salt = randomBytes(16)) {
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = String(stored || "").split(":");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    out[name] = decodeURIComponent(rest.join("="));
  }
  return out;
}

function sessionCookie(id, maxAge) {
  return `${SESSION_COOKIE}=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

function isIdent(value) {
  return typeof value === "string" && /^[a-z_][a-z0-9_]*$/.test(value);
}

async function ensureAdminUser() {
  const pool = await getPool();
  if (!pool) return;
  await pool.query(`
    create table if not exists public.users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password_hash text not null,
      role text not null default 'user' check (role in ('admin', 'user')),
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists public.sessions (
      id text primary key,
      user_id uuid not null references public.users(id) on delete cascade,
      expires_at timestamptz not null
    )
  `);
  const email = (process.env.ADMIN_EMAIL || "admin@gayatriservice.in").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin1234!";
  await pool.query(
    `insert into public.users (email, password_hash, role)
     values ($1, $2, 'admin')
     on conflict (email) do update set password_hash = excluded.password_hash, role = 'admin'`,
    [email, hashPassword(password)],
  );
  console.log(`[auth] admin user ready: ${email}`);
  await ensureTechnicianTasks(pool);
  await ensureTechnicianLogin(pool);
}

async function ensureTechnicianLogin(pool) {
  await pool.query(`
    create table if not exists public.technician_accounts (
      id uuid primary key default gen_random_uuid(),
      username text not null unique,
      password_hash text not null,
      technician_id text not null references public.technicians(id) on delete cascade,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists public.technician_sessions (
      id text primary key,
      account_id uuid not null references public.technician_accounts(id) on delete cascade,
      expires_at timestamptz not null
    )
  `);
  const username = "v.amit";
  const technicianId = "TECH-003";
  const found = await pool.query("select id from public.technicians where id = $1", [technicianId]);
  if (!found.rows[0]) {
    console.log("[auth] Amit Verma was not found, skipped technician login");
    return;
  }
  await pool.query(
    `insert into public.technician_accounts (username, password_hash, technician_id)
     values ($1, $2, $3)
     on conflict (username) do update
       set password_hash = excluded.password_hash, technician_id = excluded.technician_id`,
    [username, hashPassword("Amit1234!"), technicianId],
  );
  console.log("[auth] technician login ready: v.amit");
}

async function ensureTechnicianTasks(pool) {
  await pool.query(`
    create table if not exists public.technician_tasks (
      id uuid primary key default gen_random_uuid(),
      technician_id text not null references public.technicians(id) on delete cascade,
      customer_name text not null,
      customer_phone text not null default '',
      problem text not null,
      details text not null default '',
      address text not null,
      map_url text not null default '',
      voice_note_url text not null default '',
      visit_date date,
      time_slot text not null default '',
      priority text not null default 'normal' check (priority in ('normal', 'urgent')),
      status text not null default 'assigned' check (status in ('assigned', 'accepted', 'on_the_way', 'completed', 'cancelled')),
      notification_status text not null default 'pending' check (notification_status in ('pending', 'sent')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`alter table public.technician_tasks add column if not exists completion_comment text not null default ''`);
  await pool.query(`alter table public.technician_tasks add column if not exists completion_voice_url text not null default ''`);
  await pool.query(`alter table public.technician_tasks add column if not exists visit_time text not null default ''`);
  await pool.query(`
    create table if not exists public.technician_notifications (
      id uuid primary key default gen_random_uuid(),
      technician_id text not null references public.technicians(id) on delete cascade,
      task_id uuid references public.technician_tasks(id) on delete cascade,
      title text not null,
      body text not null,
      created_at timestamptz not null default now(),
      delivered_at timestamptz
    )
  `);
  await pool.query(`
    create index if not exists technician_tasks_tech_idx
    on public.technician_tasks (technician_id, created_at desc)
  `);
  await pool.query(`drop trigger if exists technician_tasks_updated on public.technician_tasks`);
  await pool.query(`
    create trigger technician_tasks_updated before update on public.technician_tasks
    for each row execute function public.update_updated_at_column()
  `);
}

function taskWhen(task) {
  const date = task.visit_date instanceof Date
    ? task.visit_date.toISOString().slice(0, 10)
    : String(task.visit_date || "").slice(0, 10);
  return [date, task.visit_time, task.time_slot].filter(Boolean).join(" ");
}

async function queueJobNotification(pool, task) {
  if (task.status === "completed") return;
  const when = taskWhen(task);
  const title = task.priority === "urgent" ? "Urgent job" : "New job";
  const body = [task.problem, task.customer_name, task.address, when].filter(Boolean).join(" · ").slice(0, 240);
  await pool.query(
    `insert into public.technician_notifications (technician_id, task_id, title, body) values ($1, $2, $3, $4)`,
    [task.technician_id, task.id, title, body],
  );
  await pool.query("update public.technician_tasks set notification_status = 'pending' where id = $1", [task.id]);
}

async function sessionUser(pool, req) {
  const id = readCookies(req)[SESSION_COOKIE];
  if (!id) return null;
  const { rows } = await pool.query(
    `select u.id, u.email, u.role
     from public.sessions s
     join public.users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [id],
  );
  return rows[0] ?? null;
}

async function handleAdminQuery(pool, user, body) {
  if (!user || user.role !== "admin") return { status: 401, body: { error: "Admin sign-in required." } };
  const table = body?.table;
  const op = body?.op;
  if (!ADMIN_TABLES.has(table)) return { status: 400, body: { error: "Unknown table." } };

  if (op === "select") {
    const orderBy = body.orderBy || "name";
    if (!isIdent(orderBy)) return { status: 400, body: { error: "Invalid sort column." } };
    const { rows } = await pool.query(`select * from public.${table} order by ${orderBy}`);
    return { status: 200, body: { data: rows.map(normalizeRow) } };
  }

  if (op === "insert") {
    const row = body.row && typeof body.row === "object" ? body.row : null;
    const keys = row ? Object.keys(row).filter(isIdent) : [];
    if (!row || keys.length === 0) return { status: 400, body: { error: "Nothing to save." } };
    const values = keys.map((key) => bindValue(row[key]));
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
    const inserted = await pool.query(
      `insert into public.${table} (${keys.join(", ")}) values (${placeholders}) returning *`,
      values,
    );
    if (table === "technician_tasks" && inserted.rows[0] && inserted.rows[0].status !== "completed") {
      await queueJobNotification(pool, inserted.rows[0]);
    }
    return { status: 200, body: { data: null } };
  }

  if (op === "update") {
    if (!isIdent(body.pk)) return { status: 400, body: { error: "Invalid key." } };
    const row = body.row && typeof body.row === "object" ? body.row : {};
    const keys = Object.keys(row).filter((key) => isIdent(key) && key !== body.pk);
    if (keys.length === 0) return { status: 400, body: { error: "Nothing to update." } };
    if (table === "technician_tasks" && row.status === "assigned") {
      const current = await pool.query("select * from public.technician_tasks where id = $1", [body.id]);
      const source = current.rows[0];
      if (source?.status === "completed") {
        const inserted = await pool.query(
          `insert into public.technician_tasks (
             technician_id, customer_name, customer_phone, problem, details, address, map_url, voice_note_url,
             visit_date, visit_time, time_slot, priority, status
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'assigned')
           returning *`,
          [
            source.technician_id, source.customer_name, source.customer_phone, source.problem, source.details,
            source.address, source.map_url, source.voice_note_url, source.visit_date, source.visit_time || "",
            source.time_slot, source.priority,
          ],
        );
        await queueJobNotification(pool, inserted.rows[0]);
        return { status: 200, body: { data: { reassigned: true } } };
      }
    }
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
    await pool.query(
      `update public.${table} set ${assignments} where ${body.pk} = $${keys.length + 1}`,
      [...keys.map((key) => bindValue(row[key])), body.id],
    );
    return { status: 200, body: { data: null } };
  }

  if (op === "delete") {
    if (!isIdent(body.pk)) return { status: 400, body: { error: "Invalid key." } };
    await pool.query(`delete from public.${table} where ${body.pk} = $1`, [body.id]);
    return { status: 200, body: { data: null } };
  }

  return { status: 400, body: { error: "Unknown operation." } };
}

async function handleLocalApi(req, res, url) {
  const isAuth = url.pathname.startsWith("/api/auth/");
  const isAdminQuery = url.pathname === "/api/admin/query";
  const isUpload = url.pathname === "/api/admin/upload";
  const isNotify = url.pathname === "/api/admin/notify";
  if (!isAuth && !isAdminQuery && !isUpload && !isNotify) return false;

  const pool = await getPool();
  if (!pool) {
    sendJson(res, 503, { error: "database unavailable" });
    return true;
  }

  try {
    if (req.method === "GET" && url.pathname === "/api/auth/session") {
      const user = await sessionUser(pool, req);
      sendJson(res, 200, { user });
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const id = readCookies(req)[SESSION_COOKIE];
      if (id) await pool.query("delete from public.sessions where id = $1", [id]);
      sendJson(res, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
      return true;
    }

    if (req.method === "POST" && (url.pathname === "/api/auth/login" || isAdminQuery || isUpload || isNotify)) {
      const raw = await readBody(req);
      if (isUpload && raw.length > 14_000_000) {
        sendJson(res, 413, { error: "File must be under 8 MB." });
        return true;
      }
      const body = raw.length ? JSON.parse(raw.toString("utf8")) : {};

      if (isUpload) {
        const user = await sessionUser(pool, req);
        if (!user || user.role !== "admin") {
          sendJson(res, 401, { error: "Admin sign-in required." });
          return true;
        }
        const saved = saveUpload(body);
        if (saved.error) sendJson(res, 400, { error: saved.error });
        else sendJson(res, 200, { url: saved.url });
        return true;
      }

      if (isNotify) {
        const user = await sessionUser(pool, req);
        if (!user || user.role !== "admin") {
          sendJson(res, 401, { error: "Admin sign-in required." });
          return true;
        }
        const { rows } = await pool.query("select * from public.technician_tasks where id = $1", [body.id]);
        if (!rows[0]) {
          sendJson(res, 404, { error: "Job not found." });
          return true;
        }
        if (rows[0].status === "completed") {
          sendJson(res, 400, { error: "Completed jobs do not send a push. Set the job back to Assigned to create a new one." });
          return true;
        }
        await queueJobNotification(pool, rows[0]);
        sendJson(res, 200, { ok: true });
        return true;
      }

      if (url.pathname === "/api/auth/login") {
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const { rows } = await pool.query(
          "select id, email, role, password_hash from public.users where email = $1",
          [email],
        );
        const account = rows[0];
        if (!account || account.role !== "admin" || !verifyPassword(password, account.password_hash)) {
          sendJson(res, 401, { error: "Invalid email or password." });
          return true;
        }
        const id = randomBytes(32).toString("hex");
        await pool.query(
          "insert into public.sessions (id, user_id, expires_at) values ($1, $2, now() + interval '7 days')",
          [id, account.id],
        );
        sendJson(res, 200, { user: { id: account.id, email: account.email, role: account.role } }, {
          "set-cookie": sessionCookie(id, SESSION_MAX_AGE),
        });
        return true;
      }

      const user = await sessionUser(pool, req);
      const result = await handleAdminQuery(pool, user, body);
      sendJson(res, result.status, result.body);
      return true;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    console.error("[auth]", error);
    sendJson(res, 500, { error: "Request failed." });
  }
  return true;
}

const TECH_STATUSES = new Set(["accepted", "on_the_way", "completed"]);

function techHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    ...extra,
  };
}

function bearerToken(req) {
  const header = String(req.headers.authorization || "");
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

async function technicianFromToken(pool, req) {
  const token = bearerToken(req);
  if (!token) return null;
  const { rows } = await pool.query(
    `select a.id, a.username, a.technician_id, t.name, t.specialization
     from public.technician_sessions s
     join public.technician_accounts a on a.id = s.account_id
     join public.technicians t on t.id = a.technician_id
     where s.id = $1 and s.expires_at > now()`,
    [token],
  );
  return rows[0] ?? null;
}

async function handleTechApi(req, res, url) {
  if (!url.pathname.startsWith("/api/tech/")) return false;
  if (req.method === "OPTIONS") {
    res.writeHead(204, techHeaders());
    res.end();
    return true;
  }
  const pool = await getPool();
  if (!pool) {
    sendJson(res, 503, { error: "database unavailable" }, techHeaders());
    return true;
  }
  try {
    if (req.method === "POST" && url.pathname === "/api/tech/login") {
      const raw = await readBody(req);
      const body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const { rows } = await pool.query(
        `select a.id, a.username, a.password_hash, a.technician_id, t.name, t.specialization
         from public.technician_accounts a
         join public.technicians t on t.id = a.technician_id
         where a.username = $1`,
        [username],
      );
      const account = rows[0];
      if (!account || !verifyPassword(password, account.password_hash)) {
        sendJson(res, 401, { error: "Invalid username or password." }, techHeaders());
        return true;
      }
      const token = randomBytes(32).toString("hex");
      await pool.query(
        "insert into public.technician_sessions (id, account_id, expires_at) values ($1, $2, now() + interval '30 days')",
        [token, account.id],
      );
      sendJson(res, 200, {
        token,
        technician: {
          id: account.technician_id,
          username: account.username,
          name: account.name,
          specialization: account.specialization,
        },
      }, techHeaders());
      return true;
    }

    const account = await technicianFromToken(pool, req);
    if (!account) {
      sendJson(res, 401, { error: "Sign in required." }, techHeaders());
      return true;
    }

    if (req.method === "GET" && url.pathname === "/api/tech/notifications") {
      const { rows } = await pool.query(
        `select id, task_id, title, body, created_at
         from public.technician_notifications
         where technician_id = $1 and delivered_at is null
         order by created_at`,
        [account.technician_id],
      );
      sendJson(res, 200, { notifications: rows }, techHeaders());
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/tech/notifications/ack") {
      const raw = await readBody(req);
      const body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)) : [];
      if (ids.length) {
        const acked = await pool.query(
          `update public.technician_notifications
           set delivered_at = now()
           where technician_id = $1 and delivered_at is null and id = any($2::uuid[])
           returning task_id`,
          [account.technician_id, ids],
        );
        const taskIds = [...new Set(acked.rows.map((row) => row.task_id).filter(Boolean))];
        if (taskIds.length) {
          await pool.query(
            `update public.technician_tasks t
             set notification_status = 'sent'
             where t.id = any($1::uuid[])
               and not exists (
                 select 1 from public.technician_notifications n
                 where n.task_id = t.id and n.delivered_at is null
               )`,
            [taskIds],
          );
        }
      }
      sendJson(res, 200, { ok: true }, techHeaders());
      return true;
    }

    if (req.method === "GET" && url.pathname === "/api/tech/tasks") {
      const { rows } = await pool.query(
        `select id, customer_name, customer_phone, problem, details, address, map_url, voice_note_url,
                completion_comment, completion_voice_url,
                to_char(visit_date, 'YYYY-MM-DD') as visit_date, visit_time, time_slot, priority, status, created_at
         from public.technician_tasks
         where technician_id = $1
         order by case when status in ('completed', 'cancelled') then 1 else 0 end, created_at desc`,
        [account.technician_id],
      );
      sendJson(res, 200, {
        technician: { id: account.technician_id, name: account.name, specialization: account.specialization },
        tasks: rows,
      }, techHeaders());
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/tech/tasks/status") {
      const raw = await readBody(req);
      if (raw.length > 14_000_000) {
        sendJson(res, 413, { error: "Voice note must be under 8 MB." }, techHeaders());
        return true;
      }
      const body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      const status = String(body.status || "");
      if (!TECH_STATUSES.has(status)) {
        sendJson(res, 400, { error: "Choose accepted, on the way, or completed." }, techHeaders());
        return true;
      }
      const existing = await pool.query(
        "select status from public.technician_tasks where id = $1 and technician_id = $2",
        [body.id, account.technician_id],
      );
      if (!existing.rows[0]) {
        sendJson(res, 404, { error: "Job not found." }, techHeaders());
        return true;
      }
      if (existing.rows[0].status === "completed" || existing.rows[0].status === "cancelled") {
        sendJson(res, 400, { error: "This job is closed. The office has to reopen it." }, techHeaders());
        return true;
      }
      let comment = "";
      let voiceUrl = "";
      if (status === "completed") {
        comment = String(body.comment || "").trim().slice(0, 2000);
        if (body.voice) {
          const saved = saveUpload({ data: body.voice });
          if (saved.error) {
            sendJson(res, 400, { error: saved.error }, techHeaders());
            return true;
          }
          voiceUrl = saved.url;
        }
        if (!comment && !voiceUrl) {
          sendJson(res, 400, { error: "Add a comment or a voice note before completing the job." }, techHeaders());
          return true;
        }
      }
      const updated = await pool.query(
        status === "completed"
          ? `update public.technician_tasks
             set status = $1, completion_comment = $2, completion_voice_url = $3
             where id = $4 and technician_id = $5
             returning id, completion_comment, completion_voice_url`
          : `update public.technician_tasks set status = $1
             where id = $2 and technician_id = $3
             returning id`,
        status === "completed"
          ? [status, comment, voiceUrl, body.id, account.technician_id]
          : [status, body.id, account.technician_id],
      );
      if (!updated.rows[0]) {
        sendJson(res, 404, { error: "Job not found." }, techHeaders());
        return true;
      }
      sendJson(res, 200, { ok: true, ...updated.rows[0] }, techHeaders());
      return true;
    }

    sendJson(res, 404, { error: "not found" }, techHeaders());
  } catch (error) {
    console.error("[tech]", error);
    sendJson(res, 500, { error: "Request failed." }, techHeaders());
  }
  return true;
}

async function handleCatalog(url, res) {
  if (!url.pathname.startsWith("/api/catalog")) return false;
  const pool = await getPool();
  if (!pool) {
    sendJson(res, 503, { error: "database unavailable" });
    return true;
  }

  const parts = url.pathname.split("/").filter(Boolean).slice(2);
  const query = async (sql, params = []) => {
    const { rows } = await pool.query(sql, params);
    return rows.map(normalizeRow);
  };

  try {
    if (parts[0] === "home") {
      const [services, products] = await Promise.all([
        query("select * from public.services where active = true order by name limit 10"),
        query("select * from public.products where active = true order by name limit 4"),
      ]);
      sendJson(res, 200, { services, products });
      return true;
    }
    if (parts[0] === "services" && !parts[1]) {
      sendJson(res, 200, { services: await query("select * from public.services where active = true order by name") });
      return true;
    }
    if (parts[0] === "services" && parts[1]) {
      const [service] = await query("select * from public.services where slug = $1", [decodeURIComponent(parts[1])]);
      if (!service) sendJson(res, 404, { error: "not found" });
      else sendJson(res, 200, { service });
      return true;
    }
    if (parts[0] === "products" && !parts[1]) {
      sendJson(res, 200, { products: await query("select * from public.products where active = true order by name") });
      return true;
    }
    if (parts[0] === "products" && parts[1]) {
      const [product] = await query("select * from public.products where id = $1", [decodeURIComponent(parts[1])]);
      if (!product) {
        sendJson(res, 404, { error: "not found" });
        return true;
      }
      const related = await query(
        "select * from public.products where category = $1 and active = true and id <> $2 limit 4",
        [product.category, product.id],
      );
      sendJson(res, 200, { product, related });
      return true;
    }
    if (parts[0] === "amc") {
      sendJson(res, 200, { plans: await query("select * from public.amc_plans where active = true order by sort_order") });
      return true;
    }
    if (parts[0] === "technicians" && parts[1]) {
      const [tech] = await query("select * from public.technicians where id = $1", [decodeURIComponent(parts[1])]);
      if (!tech) sendJson(res, 404, { error: "not found" });
      else sendJson(res, 200, { tech });
      return true;
    }
    if (parts[0] === "search") {
      const term = url.searchParams.get("q")?.trim() ?? "";
      if (!term) {
        sendJson(res, 200, { services: [], products: [] });
        return true;
      }
      const like = `%${term}%`;
      const [services, products] = await Promise.all([
        query(
          "select * from public.services where active = true and (name ilike $1 or category_label ilike $1) order by name",
          [like],
        ),
        query(
          "select * from public.products where active = true and (name ilike $1 or brand ilike $1) order by name",
          [like],
        ),
      ]);
      sendJson(res, 200, { services, products });
      return true;
    }
    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    console.error("[catalog]", error);
    sendJson(res, 500, { error: "query failed" });
  }
  return true;
}
const uploadDir = resolve(process.env.UPLOAD_DIR || "uploads");
mkdirSync(uploadDir, { recursive: true });

const UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};
const IMAGE_EXTS = new Set(["jpg", "png", "webp", "gif"]);

function saveUpload(body) {
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([\s\S]+)$/i.exec(String(body?.data || ""));
  const ext = match ? UPLOAD_TYPES[match[1].toLowerCase()] : "";
  if (!match || !ext) return { error: "Choose an image or an audio recording." };
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  const image = IMAGE_EXTS.has(ext);
  const limit = image ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
  if (!bytes.length || bytes.length > limit) return { error: image ? "Image must be under 5 MB." : "Voice note must be under 8 MB." };
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  writeFileSync(resolve(uploadDir, name), bytes);
  return { url: `/uploads/${name}` };
}

function uploadPath(urlPath) {
  if (!urlPath.startsWith("/uploads/")) return null;
  const name = urlPath.slice("/uploads/".length);
  if (!/^[a-z0-9]+\.(jpg|png|webp|gif|webm|mp3|m4a|ogg|wav)$/i.test(name)) return null;
  const file = resolve(uploadDir, name);
  if (!file.startsWith(uploadDir + sep) || !existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

const clientDir = resolve(process.env.CLIENT_DIR || "dist/client");
const entry = resolve(process.env.SERVER_ENTRY || "dist/server/server.js");

const MIME = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".webm": "audio/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

const HOP_BY_HOP = new Set(["host", "connection", "content-length", "transfer-encoding", "keep-alive"]);

function clientFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const file = resolve(clientDir, relative.replace(/^[/\\]+/, ""));
  if (file !== clientDir && !file.startsWith(clientDir + sep)) return null;
  if (!existsSync(file)) return null;
  const stat = statSync(file);
  if (!stat.isFile()) return null;
  return file;
}

function sendFile(res, file) {
  const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "content-type": type,
    "cache-control": file.includes(`${sep}assets${sep}`)
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
  });
  createReadStream(file).pipe(res);
}

async function loadFetch() {
  const candidates = [entry, entry.replace(/server\.js$/, "index.mjs"), entry.replace(/server\.js$/, "index.js")];
  const errors = [];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const mod = await import(candidate);
      const fn =
        (typeof mod.fetch === "function" && mod.fetch) ||
        (typeof mod.default?.fetch === "function" && mod.default.fetch) ||
        (typeof mod.default === "function" && mod.default) ||
        null;
      if (fn) {
        console.log(`[${surface}] server entry ${candidate}`);
        return fn;
      }
      errors.push(`${candidate}: exports ${Object.keys(mod).join(", ") || "(none)"}`);
    } catch (error) {
      errors.push(`${candidate}: ${error?.message ?? error}`);
    }
  }
  throw new Error(`Could not load a server entry.\n${errors.join("\n")}`);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const appFetch = await loadFetch();

try {
  await ensureAdminUser();
} catch (error) {
  console.error("[auth] could not prepare admin user", error);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${port}`;
    const url = new URL(req.url || "/", `http://${host}`);

    if (await handleLocalApi(req, res, url)) return;

    if (await handleTechApi(req, res, url)) return;

    if (await handleCatalog(url, res)) return;

    if (url.pathname === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      res.end(`ok ${surface}\n`);
      return;
    }

    // The customer container does not include the admin UI. Send /admin to the admin portal.
    if (surface === "app" && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) {
      const configured = process.env.ADMIN_APP_URL || process.env.VITE_ADMIN_APP_URL || "http://localhost:3001";
      const admin = new URL(configured);
      const target = new URL(`${url.pathname}${url.search}`, admin);
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") target.hostname = url.hostname;
      res.writeHead(302, { location: target.toString(), "cache-control": "no-store" });
      res.end();
      return;
    }

    const uploaded = uploadPath(url.pathname);
    if (uploaded) {
      sendFile(res, uploaded);
      return;
    }

    const file = clientFile(url.pathname);
    if (file) {
      sendFile(res, file);
      return;
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null || HOP_BY_HOP.has(key.toLowerCase())) continue;
      if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
      else headers.set(key, value);
    }

    const method = req.method || "GET";
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await readBody(req) : undefined;
    const request = new Request(url, { method, headers, body: body && body.length ? body : undefined });
    const response = await appFetch(request);

    const responseHeaders = {};
    for (const [key, value] of response.headers) {
      if (key.toLowerCase() === "set-cookie") continue;
      responseHeaders[key] = value;
    }
    const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    if (cookies.length) responseHeaders["set-cookie"] = cookies;

    res.writeHead(response.status, responseHeaders);
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error(`[${surface}]`, error);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error\n");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[${surface}] listening on 0.0.0.0:${port}`);
});
