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

const router = new Router({ prefix: "/files" });

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

// 檢視檔案列表
router.get(
  "/list",
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String, target: String, page: Number, page_size: Number }
  }),
  async (ctx) => {
    try {
      const target = String(ctx.query.target);
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const page = Number(ctx.query.page);
      const pageSize = Number(ctx.query.page_size);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/list", {
        instanceUuid,
        target,
        pageSize,
        page
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 新建目錄
router.post(
  "/mkdir",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/mkdir", {
        target,
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 編輯檔案
router.put(
  "/",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { target: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const target = String(ctx.request.body.target);
      const text = ctx.request.body.text;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/edit", {
        instanceUuid,
        target,
        text
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 複製檔案
router.post(
  "/copy",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/copy", {
        instanceUuid,
        targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 重新命名/移動檔案
router.put(
  "/move",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Array } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const targets = ctx.request.body.targets as [];
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/move", {
        instanceUuid,
        targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 刪除檔案
router.delete(
  "/",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String }, body: { targets: Object } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = ctx.query.uuid;
      const targets = ctx.request.body.targets;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("file/delete", {
        instanceUuid,
        targets
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// 壓縮/解壓縮檔案
router.post(
  "/compress",
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String },
    body: { source: String, targets: Object, type: Number }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const source = String(ctx.request.body.source);
      const targets = ctx.request.body.targets;
      const type = Number(ctx.request.body.type);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      await new RemoteRequest(remoteService).request("file/compress", {
        instanceUuid,
        targets,
        source,
        type
      });
      ctx.body = true;
    } catch (err) {
      ctx.body = err;
    }
  }
);

router.all(
  "/download",
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String, file_name: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.file_name);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "download",
        password: password,
        parameter: {
          fileName,
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

router.all(
  "/upload",
  permission({ level: 1 }),
  validator({ query: { uuid: String, remote_uuid: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const uploadDir = String(ctx.query.upload_dir);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir,
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

export default router;
