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
import { timeUuid } from "../../service/password";
import { getUserUuid } from "../../service/passport_service";
import { isHaveInstanceByUuid } from "../../service/permission_service";

const router = new Router({ prefix: "/protected_instance" });

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
// 開啟例項路由
router.all(
  "/open",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/open", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 例項關閉路由
router.all(
  "/stop",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/stop", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 向例項傳送命令路由
// 現階段已實現WS跨面板端命令傳遞，此介面保留做API介面
router.all(
  "/command",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, command: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const command = String(ctx.query.command);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/command", {
        instanceUuid,
        command
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 重啟例項
router.all(
  "/restart",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/restart", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 終止例項
router.all(
  "/kill",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/kill", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 執行非同步任務
router.post(
  "/asynchronous",
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String, task_name: String },
    body: {}
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const taskName = String(ctx.query.task_name);
      const parameter = ctx.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/asynchronous", {
        instanceUuid,
        taskName,
        parameter
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 終止非同步任務
router.all(
  "/stop_asynchronous",
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/stop_asynchronous", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 請求與守護程序建立資料流專有通道
router.post(
  "/stream_channel",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "stream_channel",
        password: password,
        parameter: {
          instanceUuid
        }
      });
      ctx.body = {
        password,
        addr
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 根據檔案列表獲取例項配置檔案列表
router.post(
  "/process_config/list",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const files = ctx.request.body.files;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/list",
        {
          instanceUuid,
          files
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 獲取指定配置檔案內容
router.get(
  "/process_config/file",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/file",
        {
          instanceUuid,
          fileName,
          config: null,
          type
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 更新指定配置檔案內容
router.put(
  "/process_config/file",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/file",
        {
          instanceUuid,
          fileName,
          config,
          type
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 更新例項低許可權配置資料（普通使用者）
router.put(
  "/instance_update",
  permission({ level: 1 }),
  validator({
    query: { uuid: String, remote_uuid: String },
    body: { pingConfig: Object, eventTask: Object, terminalOption: Object }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      // 此處是低許可權使用者配置設定介面，為防止資料注入，必須進行一層過濾
      // Ping 協議配置
      const pingConfig = {
        ip: config.pingConfig.ip,
        port: config.pingConfig.port,
        type: config.pingConfig.type
      };
      // 事件任務配置
      const eventTask = {
        autoStart: config.eventTask.autoStart,
        autoRestart: config.eventTask.autoRestart
      };
      // 網頁終端設定
      const terminalOption = {
        haveColor: config.terminalOption?.haveColor ?? false
      };
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config: {
          pingConfig: pingConfig.ip != null ? pingConfig : null,
          eventTask: eventTask.autoStart != null ? eventTask : null,
          terminalOption
        }
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 獲取某例項終端日誌
router.get(
  "/outputlog",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/outputlog", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
