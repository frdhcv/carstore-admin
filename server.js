const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const APPS_JSON = path.join(DATA_DIR, "apps.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(APPS_JSON)) fs.writeFileSync(APPS_JSON, "[]", "utf-8");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function readApps() {
  try {
    return JSON.parse(fs.readFileSync(APPS_JSON, "utf-8"));
  } catch {
    return [];
  }
}

function writeApps(apps) {
  fs.writeFileSync(APPS_JSON, JSON.stringify(apps, null, 2), "utf-8");
}

app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.get("/admin", (req, res) => {
  const apps = readApps();

  const listHtml = apps.map((item, index) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.packageName || ""}</td>
      <td>${item.description || ""}</td>
      <td><a href="${item.apkUrl}" target="_blank">APK</a></td>
      <td>
        <form method="POST" action="/admin/delete/${index}" onsubmit="return confirm('Silmək istəyirsən?')">
          <button type="submit">Sil</button>
        </form>
      </td>
    </tr>
  `).join("");

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Car Store Admin</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; }
        input, button { padding: 10px; margin: 5px 0; width: 100%; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f3f3; }
        .wrap { max-width: 900px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <h1>Car Store Admin</h1>

        <form action="/admin/upload" method="POST">
          <label>App adı</label>
          <input name="name" required />

          <label>Package Name</label>
          <input name="packageName" />

          <label>Description</label>
          <input name="description" />

          <label>APK Link</label>
          <input type="text" name="apkUrl" placeholder="https://github.com/..." required />

          <button type="submit">Əlavə et</button>
        </form>

        <h2>Mövcud app-lar</h2>
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Package</th>
              <th>Description</th>
              <th>Fayl</th>
              <th>Sil</th>
            </tr>
          </thead>
          <tbody>
            ${listHtml}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `);
});

app.post("/admin/upload", (req, res) => {
  const { name, packageName, description, apkUrl } = req.body;

  if (!name || !apkUrl) {
    return res.status(400).send("Ad və APK link vacibdir");
  }

  const apps = readApps();
  apps.push({
    name,
    packageName,
    description,
    apkUrl
  });

  writeApps(apps);
  res.redirect("/admin");
});

app.post("/admin/delete/:index", (req, res) => {
  const index = Number(req.params.index);
  const apps = readApps();

  if (index >= 0 && index < apps.length) {
    apps.splice(index, 1);
    writeApps(apps);
  }

  res.redirect("/admin");
});

app.get("/api/apps", (req, res) => {
  res.json(readApps());
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});