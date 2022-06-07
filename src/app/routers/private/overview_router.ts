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
import RemoteServiceSubsystem from "../../service/system_remote_service";
import VisualDataSubsystem from "../../service/system_visual_data";
import RemoteRequest from "../../service/remote_command";
import os from "os";
import { systemInfo } from "../../common/system_info";
import { getVersion, specifiedDaemonVersion } from "../../version";
import GlobalVariable from "../../common/global_variable";
import {
  LOGIN_FAILED_KEY,
  ILLEGAL_ACCESS_KEY,
  LOGIN_COUNT,
  LOGIN_FAILED_COUNT_KEY,
  BAN_IP_COUNT
} from "../../service/passport_service";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// 控制面板首頁資訊總覽路由
router.get("/", permission({ level: 10, token: false }), async (ctx) => {
  // 獲取遠端服務各個資訊
  const remoteInfoList = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let remoteInfo: any = {};
    try {
      remoteInfo = await new RemoteRequest(remoteService).request("info/overview");
    } catch (err) {
      // 忽略請求錯誤，繼續迴圈
    }
    // 賦予一些識別符號值
    remoteInfo.uuid = remoteService.uuid;
    remoteInfo.ip = remoteService.config.ip;
    remoteInfo.port = remoteService.config.port;
    remoteInfo.available = remoteService.available;
    remoteInfo.remarks = remoteService.config.remarks;
    remoteInfoList.push(remoteInfo);
  }
  const selfInfo = systemInfo();
  // 獲取本面板端所在系統資訊
  const overviewData = {
    version: getVersion(),
    specifiedDaemonVersion: specifiedDaemonVersion(),
    process: {
      cpu: selfInfo.processCpu,
      memory: process.memoryUsage().rss,
      cwd: selfInfo.cwd
    },
    record: {
      logined: GlobalVariable.get(LOGIN_COUNT, 0),
      illegalAccess: GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0),
      banips: GlobalVariable.get(BAN_IP_COUNT, 0),
      loginFailed: GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0)
    },
    system: {
      user: os.userInfo(),
      time: new Date().toLocaleString(),
      totalmem: selfInfo.totalmem,
      freemem: selfInfo.freemem,
      type: selfInfo.type,
      version: os.version(),
      node: process.version,
      hostname: selfInfo.hostname,
      loadavg: selfInfo.loadavg,
      platform: selfInfo.platform,
      release: selfInfo.release,
      uptime: os.uptime(),
      cpu: selfInfo.cpuUsage
    },
    chart: {
      system: VisualDataSubsystem.getSystemChartArray(),
      request: VisualDataSubsystem.getStatusChartArray()
    },
    remoteCount: RemoteServiceSubsystem.count(),
    remote: remoteInfoList
  };

  ctx.body = overviewData;
});

export default router;
