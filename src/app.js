const Koa = require("koa");
const { updateCloudflareIp } = require("./controller");
const schedule = require("node-schedule");
const app = new Koa();

app.use(async ctx => {
  if (ctx.request.url == "/updateCloudflareIp") {
    ctx.body = await updateCloudflareIp();
  } else {
    ctx.body = "Cloudflare IP DDNS Running Successfully!";
  }
});

// 每隔15分钟更新Cloudflare优选IP
schedule.scheduleJob("*/15 * * * *", updateCloudflareIp);
console.log("\x1b[93m%s\x1b[0m", "15分钟自动更新已开启");

// 初始化
const PORT = 52100;
app.listen(PORT, () => {
  console.log("\x1b[92m%s\x1b[0m", `Server is running：http://localhost:${PORT}`);
});
