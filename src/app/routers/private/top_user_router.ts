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
import userSystem from "../../service/system_user";
import { ICompleteUser } from "../../entity/entity_interface";

const router = new Router({ prefix: "/auth" });

// [Top-level Permission]
// 更新使用者資料
router.put("/", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const { uuid, config } = ctx.request.body;
  const { passWord } = config;
  if (passWord && !userSystem.validatePassword(passWord))
    throw new Error("密碼不規範，必須為擁有大小寫字母，數字，長度在9到36之間");
  try {
    userSystem.edit(uuid, config);
    ctx.body = true;
  } catch (error) {
    ctx.throw(500, error.message);
  }
});

// [Top-level Permission]
// 獲取所有使用者資料
router.get("/overview", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const users: Array<ICompleteUser> = [];
  userSystem.objects.forEach((user) => {
    users.push({
      uuid: user.uuid,
      userName: user.userName,
      permission: user.permission,
      instances: user.instances,
      loginTime: user.loginTime,
      registerTime: user.loginTime
    });
  });
  ctx.body = users;
});

export default router;
