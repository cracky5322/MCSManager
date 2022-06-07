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

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { saveSystemConfig, systemConfig } from "../../setting";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// 獲取面板配置項
router.get("/setting", permission({ level: 10 }), async (ctx) => {
  ctx.body = systemConfig;
});

// [Top-level Permission]
// 更新面板配置項
router.put("/setting", validator({ body: {} }), permission({ level: 10 }), async (ctx) => {
  const config = ctx.request.body;
  if (config) {
    if (config.httpIp != null) systemConfig.httpIp = config.httpIp;
    if (config.httpPort != null) systemConfig.httpPort = config.httpPort;
    if (config.crossDomain != null) systemConfig.crossDomain = config.crossDomain;
    if (config.gzip != null) systemConfig.gzip = config.gzip;
    if (config.maxCompress != null) systemConfig.maxCompress = config.maxCompress;
    if (config.maxDonwload != null) systemConfig.maxDonwload = config.maxDonwload;
    if (config.zipType != null) systemConfig.zipType = config.zipType;
    if (config.loginCheckIp != null) systemConfig.loginCheckIp = config.loginCheckIp;
    if (config.forwardType != null) systemConfig.forwardType = Number(config.forwardType);
    if (config.dataPort != null) systemConfig.dataPort = Number(config.dataPort);
    if (config.loginInfo != null) systemConfig.loginInfo = String(config.loginInfo);
    saveSystemConfig(systemConfig);
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error("錯誤的配置方式");
});

export default router;
