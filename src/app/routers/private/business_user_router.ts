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
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { register } from "../../service/passport_service";
import userSystem from "../../service/system_user";

const router = new Router({ prefix: "/auth" });

// 新增使用者資料
router.post(
  "/",
  permission({ level: 10 }),
  validator({ body: { username: String, password: String, permission: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const permission = Number(ctx.request.body.permission);
    if (userName.length < 2 || userName.length > 18) throw new Error("錯誤的使用者名稱長度規則");
    if (passWord.length < 6 || passWord.length > 18) throw new Error("錯誤的密碼長度規則");
    if (userSystem.existUserName(userName)) throw new Error("使用者名稱已經被佔用");
    const result = register(ctx, userName, passWord, permission);
    ctx.body = result;
  }
);

// 刪除使用者資料
router.del("/", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const uuids = ctx.request.body;
  try {
    for (const iterator of uuids) {
      userSystem.deleteInstance(iterator);
    }
    ctx.body = true;
  } catch (error) {
    ctx.throw(500, "無法完成使用者資料刪除");
  }
});

// 使用者搜尋功能
router.get(
  "/search",
  permission({ level: 10 }),
  validator({ query: { page: Number, page_size: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = ctx.query.userName as string;
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const condition: any = {};
    if (userName) condition["userName"] = `%${userName}%`;
    let resultPage = userSystem.getQueryWrapper().selectPage(condition, page, pageSize);
    // 複製一份，刪除多餘資料
    resultPage = JSON.parse(JSON.stringify(resultPage));
    resultPage.data.forEach((v) => {
      delete v.passWord;
      delete v.salt;
    });
    ctx.body = resultPage;
  }
);

export default router;
