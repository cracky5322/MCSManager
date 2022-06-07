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
import { getUserUuid } from "../../service/passport_service";
import userSystem from "../../service/system_user";
import { getToken, isAjax } from "../../service/passport_service";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { isTopPermissionByUuid } from "../../service/permission_service";
import validator from "../../middleware/validator";
import { v4 } from "uuid";

const router = new Router({ prefix: "/auth" });

// [Low-level Permission]
// 新增令牌返回
router.get(
  "/token",
  permission({ level: 1, token: false }),
  async (ctx: Koa.ParameterizedContext) => {
    // 有且只有 Ajax 請求能夠獲取 token 令牌
    if (isAjax(ctx)) {
      ctx.body = getToken(ctx);
    } else {
      throw new Error("The request is not an Ajax request.");
    }
  }
);

// [Low-level Permission]
// 獲取使用者資料
router.get("/", permission({ level: 1, token: false }), async (ctx) => {
  // 預設許可權獲取本人
  let uuid = getUserUuid(ctx);
  // 前端可以選擇需要高階資料
  const advanced = ctx.query.advanced;
  // 管理許可權可獲取任何人
  if (isTopPermissionByUuid(uuid)) {
    if (ctx.query.uuid) uuid = String(ctx.query.uuid);
  }
  // 有且只有 Ajax 請求准許訪問
  if (isAjax(ctx)) {
    const user = userSystem.getInstance(uuid);
    if (!user) throw new Error("此使用者UID不存在");

    // 高階功能可選，分析每一個例項資料
    let resInstances = [];
    if (advanced) {
      const instances = user.instances;
      for (const iterator of instances) {
        const remoteService = RemoteServiceSubsystem.getInstance(iterator.serviceUuid);
        // 若此遠端服務根本不存在，則裝載一個已刪除的提示
        if (!remoteService) {
          resInstances.push({
            hostIp: "-- Unknown --",
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--",
            remarks: "--"
          });
          continue;
        }
        try {
          // Note: 這裡可以整合UUID來節省返回的流量，暫不做此最佳化
          let instancesInfo = await new RemoteRequest(remoteService).request("instance/section", {
            instanceUuids: [iterator.instanceUuid]
          });
          instancesInfo = instancesInfo[0];
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            remarks: remoteService.config.remarks,
            instanceUuid: instancesInfo.instanceUuid,
            serviceUuid: remoteService.uuid,
            status: instancesInfo.status,
            nickname: instancesInfo.config.nickname,
            ie: instancesInfo.config.ie,
            oe: instancesInfo.config.oe,
            endTime: instancesInfo.config.endTime,
            lastDatetime: instancesInfo.config.lastDatetime,
            stopCommand: instancesInfo.config.stopCommand
          });
        } catch (error) {
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--"
          });
        }
      }
    } else {
      resInstances = user.instances;
    }
    // 響應使用者資料
    ctx.body = {
      uuid: user.uuid,
      userName: user.userName,
      loginTime: user.loginTime,
      registerTime: user.registerTime,
      instances: resInstances,
      permission: user.permission,
      token: getToken(ctx),
      apiKey: user.apiKey,
      isInit: user.isInit
    };
  }
});

// [Low-level Permission]
// 修改個人使用者資訊
router.put(
  "/update",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    if (userUuid) {
      const config = ctx.request.body;
      const { passWord, isInit } = config;
      if (!userSystem.validatePassword(passWord))
        throw new Error("密碼不規範，必須為擁有大小寫字母，數字，長度在9到36之間");
      userSystem.edit(userUuid, { passWord, isInit });
      ctx.body = true;
    }
  }
);

// [Low-level Permission]
// API 生成和關閉
router.put(
  "/api",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    const enable = ctx.request.body.enable;
    const user = userSystem.getInstance(userUuid);
    let newKey = "";
    try {
      if (user) {
        if (enable) {
          newKey = v4().replace(/-/gim, "");
          userSystem.edit(userUuid, {
            apiKey: newKey
          });
        } else {
          userSystem.edit(userUuid, {
            apiKey: ""
          });
        }
      }
      ctx.body = newKey;
    } catch (error) {
      ctx.body = error;
    }
  }
);

export default router;
