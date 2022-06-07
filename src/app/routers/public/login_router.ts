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

import Koa from "koa";
import Router from "@koa/router";
import validator from "../../middleware/validator";
import permission from "../../middleware/permission";
import { check, login, logout, checkBanIp } from "../../service/passport_service";
import { systemConfig } from "../../setting";

const router = new Router({ prefix: "/auth" });

// [Public Permission]
// 登入路由
router.post(
  "/login",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    if (!checkBanIp(ctx)) throw new Error("身份驗證次數過多，您的 IP 地址已被鎖定 10 分鐘");
    if (check(ctx)) return (ctx.body = "Logined");
    let token = login(ctx, userName, passWord);
    if (token) {
      ctx.body = true;
    } else {
      throw new Error("賬號或密碼錯誤");
    }
  }
);

// [Public Permission]
// 退出路由
router.get(
  "/logout",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    logout(ctx);
    ctx.body = true;
  }
);

// [Public Permission]
// 登入介面文案展示
router.all(
  "/login_info",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = {
      loginInfo: systemConfig.loginInfo
    };
  }
);

export default router;
