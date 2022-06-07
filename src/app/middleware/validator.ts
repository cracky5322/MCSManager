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

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 400;
  ctx.body = "錯誤請求：請求引數不正確";
}

// Type check
function check(taget: any, parameter: any) {
  if (taget) {
    for (const key in parameter) {
      const typeVal = parameter[key];

      if (taget[key] == null || taget[key] === "") return false;

      if (typeVal === Number) {
        taget[key] = Number(taget[key]);
        if (isNaN(taget[key])) return false;
        continue;
      }

      if (typeVal === String) {
        taget[key] = String(taget[key]);
        continue;
      }

      if (typeVal === Date) {
        const r = new Date(taget[key]).toString();
        if (r == "Invalid Date" || r == null) return false;
        taget[key] = new Date(taget[key]);
        continue;
      }

      if (typeVal === Array) {
        if (!(taget[key] instanceof Array)) {
          const object = JSON.parse(taget[key]);
          if (!(object instanceof Array)) return false;
          taget[key] = object;
        }
      }

      if (typeVal === Object) {
        if (!taget[key]) return false;
        // const object = JSON.parse(taget[key]);
        // taget[key] = object;
      }
    }
    return true;
  }
  return false;
}

// Entry function
export = function (parameter: any) {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    try {
      let checkBool = true;
      if (parameter["params"] && !check(ctx.params, parameter["params"])) checkBool = false;
      if (parameter["query"] && !check(ctx.query, parameter["query"])) checkBool = false;
      if (parameter["body"] && !check(ctx.request.body, parameter["body"])) checkBool = false;
      if (checkBool) return await next();
      return verificationFailed(ctx);
    } catch (err) {
      const error: Error = err;
      ctx.status = 500;
      ctx.body = `${error.message}`;
    }
  };
};
