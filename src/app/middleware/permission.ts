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
import GlobalVariable from "../common/global_variable";
import userSystem from "../service/system_user";
import { getUuidByApiKey, ILLEGAL_ACCESS_KEY, isAjax } from "../service/passport_service";

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 許可權不足";
}

function tokenError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 令牌(Token)驗證失敗，拒絕訪問";
}

function ajaxError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 無法找到請求頭 x-requested-with: xmlhttprequest";
}

function apiError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] API 金鑰不正確";
}

// 基本使用者許可權中介軟體
export = (parameter: any) => {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    // 若為 API 請求，則進行 API 級的許可權判斷
    if (ctx.query.apikey) {
      const apiKey = String(ctx.query.apikey);
      const user = getUuidByApiKey(apiKey);
      if (user && user.permission >= parameter["level"]) {
        return await next();
      } else {
        return apiError(ctx);
      }
    }

    // 若路由需要 Token 驗證則進行驗證，預設是自動驗證
    if (parameter["token"] !== false) {
      if (!isAjax(ctx)) return ajaxError(ctx);
      const requestToken = ctx.query.token;
      const realToken = ctx.session["token"];
      if (requestToken !== realToken) {
        return tokenError(ctx);
      }
    }

    // 若許可權屬性為數字則自動執行許可權判定
    if (!isNaN(parseInt(parameter["level"]))) {
      // 最基礎的身份認證判定
      if (ctx.session["login"] === true && ctx.session["uuid"] && ctx.session["userName"]) {
        const user = userSystem.getInstance(ctx.session["uuid"]);
        // 普通使用者與管理使用者的許可權判斷
        if (user && user.permission >= parameter["level"]) {
          return await next();
        }
      }
    } else {
      return await next();
    }

    // 記錄越權訪問次數
    GlobalVariable.set(ILLEGAL_ACCESS_KEY, GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0) + 1);
    return verificationFailed(ctx);
  };
};
