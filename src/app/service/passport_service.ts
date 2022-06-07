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
import userSystem from "./system_user";
import { timeUuid } from "./password";
import GlobalVariable from "../common/global_variable";
import { systemConfig } from "../setting";
import { logger } from "./log";

export const BAN_IP_COUNT = "banip";
export const LOGIN_FAILED_KEY = "loginFailed";
export const ILLEGAL_ACCESS_KEY = "illegalAccess";
export const LOGIN_COUNT = "loginCount";
export const LOGIN_FAILED_COUNT_KEY = "loginFailedCount";

export function login(ctx: Koa.ParameterizedContext, userName: string, passWord: string): string {
  // 記錄登入請求次數
  GlobalVariable.set(LOGIN_COUNT, GlobalVariable.get(LOGIN_COUNT, 0) + 1);
  const ip = ctx.socket.remoteAddress;
  // 進行使用者資訊檢查
  if (userSystem.checkUser({ userName, passWord })) {
    // 登入成功後重置此IP的錯誤次數
    const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
    delete ipMap[ip];
    // 會話 Session 狀態改變為已登陸
    const user = userSystem.getUserByUserName(userName);
    user.loginTime = new Date().toLocaleString();
    ctx.session["login"] = true;
    ctx.session["userName"] = userName;
    ctx.session["uuid"] = user.uuid;
    ctx.session["token"] = timeUuid();
    ctx.session.save();
    logger.info(`[Logined Event] IP: ${ip} 成功登入賬號 ${userName}`);
    logger.info(`Token: ${ctx.session["token"]}`);
    return ctx.session["token"];
  } else {
    // 記錄登入失敗次數
    GlobalVariable.set(LOGIN_FAILED_COUNT_KEY, GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0) + 1);
    ctx.session["login"] = null;
    ctx.session["token"] = null;
    ctx.session.save();
    logger.info(`[Logined Event] IP: ${ip} 登入賬號 ${userName} 失敗`);
    return null;
  }
}

export function check(ctx: Koa.ParameterizedContext) {
  if (ctx.session["login"] && ctx.session["userName"] && ctx.session["token"]) return true;
  return false;
}

export function logout(ctx: Koa.ParameterizedContext): boolean {
  ctx.session["login"] = null;
  ctx.session["userName"] = null;
  ctx.session["uuid"] = null;
  ctx.session["token"] = null;
  ctx.session.save();
  return true;
}

export function register(
  ctx: Koa.ParameterizedContext,
  userName: string,
  passWord: string,
  permission: number
) {
  let f = true;
  // Check for duplicate usernames.
  userSystem.objects.forEach((user) => {
    if (user && user.userName == userName) f = false;
  });
  if (f) {
    // Next. UUID and other data will be automatically generated.
    userSystem.create({
      userName,
      passWord,
      permission
    });
    return true;
  }
  return false;
}

export function getUserNameBySession(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    return user ? user.userName : null;
  }
  return ctx.session["userName"];
}

export function getUserUuid(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    return user ? user.uuid : null;
  }
  return ctx.session["uuid"];
}

export function getToken(ctx: Koa.ParameterizedContext): string {
  return ctx.session["token"];
}

export function isAjax(ctx: Koa.ParameterizedContext) {
  return (
    ctx.header["x-requested-with"] &&
    ctx.header["x-requested-with"].toString().toLocaleLowerCase() === "xmlhttprequest"
  );
}

export function checkBanIp(ctx: Koa.ParameterizedContext) {
  if (!GlobalVariable.map.has(LOGIN_FAILED_KEY)) GlobalVariable.set(LOGIN_FAILED_KEY, {});
  // 此IpMap 在登入時也需要使用
  const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
  const ip = ctx.socket.remoteAddress;
  if (ipMap[ip] > 10 && systemConfig.loginCheckIp === true) {
    if (ipMap[ip] != 999) {
      // 記錄封禁次數
      GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 0) + 1);
      setTimeout(() => {
        delete ipMap[ip];
        // 刪除封禁次數
        GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 1) - 1);
      }, 1000 * 60 * 10);
    }
    ipMap[ip] = 999;
    return false;
  }
  if (!isNaN(Number(ipMap[ip]))) ipMap[ip] = Number(ipMap[ip]) + 1;
  else ipMap[ip] = 1;
  return true;
}

export function getUuidByApiKey(apiKey: string) {
  const pageData = userSystem.getQueryWrapper().selectPage(
    {
      apiKey
    },
    1,
    1
  );
  if (pageData.total === 1) {
    return pageData.data[0];
  }
  return null;
}

export function isApiRequest(ctx: Koa.ParameterizedContext) {
  return ctx.query.apikey ? true : false;
}

export function getApiKey(ctx: Koa.ParameterizedContext) {
  return String(ctx.query.apikey);
}
