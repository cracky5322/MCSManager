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
import { multiOperationForwarding } from "../../service/instance_service";
import { timeUuid } from "../../service/password";

const router = new Router({ prefix: "/instance" });

// [Top-level Permission]
// 獲取某例項詳細資訊
router.get(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/detail", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 建立例項
router.post(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 建立例項時上傳檔案
router.post(
  "/upload",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      // const uploadDir = String(ctx.query.upload_dir);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      const newInstanceUuid = result.instanceUuid;
      if (!newInstanceUuid) throw new Error("建立例項失敗");
      // 向守護程序傳送跨端檔案上傳任務
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir: ".",
          instanceUuid: newInstanceUuid
        }
      });
      ctx.body = {
        instanceUuid: newInstanceUuid,
        password,
        addr
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 更新例項資訊（管理使用者）
router.put(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 刪除例項
router.delete(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String }, body: { uuids: Object, deleteFile: Boolean } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuids = ctx.request.body.uuids;
      const deleteFile = ctx.request.body.deleteFile;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/delete", {
        instanceUuids,
        deleteFile
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 批次開啟例項路由
router.post("/multi_open", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/open", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// 批次關閉例項路由
router.post("/multi_stop", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/stop", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// 批次終止例項路由
router.post("/multi_kill", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/kill", { instanceUuids })
        .catch((err) => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

export default router;
