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
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { getUserUuid } from "../../service/passport_service";
import { isHaveInstanceByUuid } from "../../service/permission_service";

const router = new Router({ prefix: "/protected_schedule" });

// 路由許可權驗證中介軟體
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const serviceUuid = String(ctx.query.remote_uuid);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, serviceUuid, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = "[Forbidden] [中介軟體] 引數不正確或非法訪問例項";
  }
});

// [Low-level Permission]
// 獲取計劃任務列表
router.get(
  "/",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const list = await new RemoteRequest(RemoteServiceSubsystem.getInstance(serviceUuid)).request(
        "schedule/list",
        {
          instanceUuid
        }
      );
      ctx.body = list;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 建立計劃任務
router.post(
  "/",
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String },
    body: { name: String, count: Number, time: String, action: String, type: Number }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const task = ctx.request.body;
      ctx.body = await new RemoteRequest(RemoteServiceSubsystem.getInstance(serviceUuid)).request(
        "schedule/register",
        {
          instanceUuid,
          name: String(task.name),
          count: Number(task.count),
          time: String(task.time),
          action: String(task.action),
          payload: String(task.payload),
          type: Number(task.type)
        }
      );
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 註冊計劃任務
router.delete(
  "/",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const name = String(ctx.query.task_name);
      ctx.body = await new RemoteRequest(RemoteServiceSubsystem.getInstance(serviceUuid)).request(
        "schedule/delete",
        {
          instanceUuid,
          name
        }
      );
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
