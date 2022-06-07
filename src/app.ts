/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版權所有 (C) 2022 Suwings <Suwings@outlook.com>

  該程式是免費軟體，您可以重新分發和/或修改據 GNU Affero 通用公共許可證的條款，
  由自由軟體基金會，許可證的第 3 版，或（由您選擇）任何更高版本。

  根據 AGPL 與使用者協議，您必須保留所有版權宣告，如果修改原始碼則必須開源修改後的原始碼。
  可以前往 https://mcsmanager.com/ 閱讀使用者協議，申請閉源開發授權等。
*/

// 程式啟動入口檔案

// 初始化版本管理器
import { initVersionManager, getVersion } from "./app/version";
initVersionManager();
const VERSION = getVersion();

// 顯示產品標識
console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __  /_  __ \\  __  /_  __  /  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/             
 + Released under the AGPL-3.0 License
 + Copyright 2022 Suwings
 + Version ${VERSION}
`);

// 啟動前開發環境檢測
import fs from "fs";
if (!fs.existsSync("public")) {
  console.log(
    "Unable to start, this project is used by the MCSManager development environment and cannot be run directly."
  );
  console.log("Please go to https://mcsmanager.com/ for the latest installation method.");
  console.log(
    'If you are running in development mode, create "public" directory and place the frontend static files before rerunning.'
  );
  console.log("");
  console.log("無法啟動，此專案是 MCSManager 開發人員所用專案，普通使用者不可直接執行。");
  console.log("請前往 https://mcsmanager.com/ 瞭解最新的安裝方式。");
  console.log("如果您要以開發模式執行，請建立 public 目錄並放置前端靜態檔案再重新執行。");
  process.exit(0);
}

import Koa from "koa";
import { v4 } from "uuid";
import path from "path";
import koaBody from "koa-body";
import session from "koa-session";
import koaStatic from "koa-static";
import http from "http";

import { logger } from "./app/service/log";
import { middleware as protocolMiddleware } from "./app/middleware/protocol";

const BASE_PATH = __dirname;

// 裝載全域性配置檔案
import { initSystemConfig, systemConfig } from "./app/setting";
initSystemConfig();

const app = new Koa();

// 監聽 Koa 錯誤
app.on("error", (error) => {
  // 遮蔽所有 Koa 框架級別事件
  // 當 Koa 遭遇短連線洪水攻擊時，很容易錯誤資訊刷屏，有可能會間接影響某些應用程式運作
});

app.use(
  koaBody({
    multipart: true,
    parsedMethods: ["POST", "PUT", "DELETE", "GET"]
  })
);

app.keys = [v4()];
app.use(
  session(
    {
      key: v4(),
      maxAge: 86400000,
      overwrite: true,
      httpOnly: true,
      signed: true,
      rolling: false,
      renew: false,
      secure: false
    },
    app
  )
);

// Http log and print
app.use(async (ctx, next) => {
  logger.info(`${ctx.ip} ${ctx.method} - ${ctx.URL.href}`);
  await next();
});

// Protocol middleware
app.use(protocolMiddleware);

// 靜態檔案路由
app.use(koaStatic(path.join(BASE_PATH, "public")));

// 裝載所有路由
import { index } from "./app/index";
// Websocket 路由（暫無用）
// import SocketService from "./app/service/socket_service";
index(app);

// Error reporting
process.on("uncaughtException", function (err) {
  logger.error(`ERROR (uncaughtException):`, err);
});

// Error reporting
process.on("unhandledRejection", (reason, p) => {
  logger.error(`ERROR (unhandledRejection):`, reason, p);
});

// 啟動 HTTP 服務
function startUp(port: number, host?: string) {
  const httpServer = http.createServer(app.callback());

  // 暫不需要 Socket 服務
  // SocketService.setUpSocketIO(httpServer);

  httpServer.listen(port, host);
  logger.info("================================");
  logger.info("控制面板端已啟動");
  logger.info("專案參考: https://github.com/mcsmanager");
  logger.info(`訪問地址: http://${host ? host : "localhost"}:${port}/`);
  logger.info(`軟體公網訪問需開放埠 ${port} 與守護程序埠`);
  logger.info("關閉此程式請使用 Ctrl+C 快捷鍵");
  logger.info("================================");
}

startUp(systemConfig.httpPort, systemConfig.httpIp);
