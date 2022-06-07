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
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";

const router = new Router({ prefix: "/service" });

// [Top-level Permission]
// 獲取遠端服務列表
// 僅包含服務資訊，不包括例項資訊列表
router.get("/remote_services_list", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      available: remoteService.available,
      remarks: remoteService.config.remarks
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// 向守護程序查詢指定的例項
router.get(
  "/remote_service_instances",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, page: Number, page_size: Number } }),
  async (ctx) => {
    const serviceUuid = String(ctx.query.remote_uuid);
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const instanceName = ctx.query.instance_name;
    const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
    const result = await new RemoteRequest(remoteService).request("instance/select", {
      page,
      pageSize,
      condition: {
        instanceName
      }
    });
    ctx.body = result;
  }
);

// [Top-level Permission]
// 獲取遠端伺服器系統資訊
router.get("/remote_services_system", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = null;
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("info/overview");
    } catch (err) {
      continue;
    }
    result.push(instancesInfo);
  }
  ctx.body = result;
});

// [Top-level Permission]
// 獲取遠端伺服器例項資訊（瀏覽過大）
router.get("/remote_services", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = [];
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("instance/overview");
    } catch (err) {
      // 忽略請求出錯
    }
    // 如果連線可用則傳送遠端指令
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      available: remoteService.available,
      instances: instancesInfo
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// 新增遠端服務
router.post(
  "/remote_service",
  permission({ level: 10 }),
  validator({ body: { apiKey: String, port: Number, ip: String, remarks: String } }),
  async (ctx) => {
    const parameter = ctx.request.body;
    // 進行非同步註冊
    const instance = RemoteServiceSubsystem.registerRemoteService({
      apiKey: parameter.apiKey,
      port: parameter.port,
      ip: parameter.ip,
      remarks: parameter.remarks || ""
    });
    ctx.body = instance.uuid;
  }
);

// [Top-level Permission]
// 修改遠端服務引數
router.put(
  "/remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    const parameter = ctx.request.body;
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("例項不存在");
    await RemoteServiceSubsystem.edit(uuid, {
      port: parameter.port,
      ip: parameter.ip,
      apiKey: parameter.apiKey,
      remarks: parameter.remarks
    });
    ctx.body = true;
  }
);

// [Top-level Permission]
// 刪除遠端服務
router.delete(
  "/remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("例項不存在");
    await RemoteServiceSubsystem.deleteRemoteService(uuid);
    ctx.body = true;
  }
);

// [Top-level Permission]
// 連線遠端例項
router.get(
  "/link_remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("例項不存在");
    try {
      RemoteServiceSubsystem.getInstance(uuid).connect();
      ctx.body = true;
    } catch (error) {
      ctx.body = error;
    }
  }
);

export default router;
