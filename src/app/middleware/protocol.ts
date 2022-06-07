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
import { logger } from "../service/log";
import { Stream } from "stream";
import VisualDataSubsystem from "../service/system_visual_data";
import { systemConfig } from "../setting";

// Define standard response data format middleware
export async function middleware(
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
  next: Function
): Promise<void> {
  // 介面請求次數增加
  if (ctx.url.startsWith("/api/")) {
    VisualDataSubsystem.addRequestCount();
  }
  // 傳遞下一個中介軟體，遇到任何錯誤和返回資料將按照響應協議處理
  try {
    await next();
  } catch (error) {
    ctx.body = error;
  }

  // 設定公開頭
  if (systemConfig.crossDomain) {
    ctx.response.set("Access-Control-Allow-Origin", "*");
    ctx.response.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    ctx.response.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
    );
  }

  // 產品資訊標識
  ctx.cookies.set("MCSManager", "Copyright 2021 Suwings");
  ctx.response.set("X-Powered-By", "MCSManager");

  // 傳送Error類時序列化並顯示
  if (ctx.body instanceof Error) {
    const error = ctx.body as Error;
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: error.message,
      time: new Date().getTime()
    });
    return;
  }

  // 放行所有資料流
  if (ctx.body instanceof Stream) {
    return;
  }

  // 404 錯誤碼
  if (ctx.status == 404) {
    ctx.status = 404;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: "[404] Not Found",
      time: new Date().getTime()
    });
    return;
  }

  // 響應文字為字串時則使用普通格式化
  if (typeof ctx.body == "string") {
    const status = ctx.status;
    const data = ctx.body;
    ctx.body = JSON.stringify({
      status,
      data,
      time: new Date().getTime()
    });
    return;
  }

  // 返回結果為空時，顯示處理失敗
  if (ctx.body === null || ctx.body === false || ctx.body === undefined) {
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: 500,
      data: ctx.body || null,
      time: new Date().getTime()
    });
    return;
  }

  // 正常資料
  if (ctx.status == 200) {
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: ctx.body,
      time: new Date().getTime()
    });
    return;
  }
}
