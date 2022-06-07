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

import os from "os";
import osUtils from "os-utils";
import fs from "fs";
// import systeminformation from "systeminformation";

interface IInfoTable {
  [key: string]: number;
}

interface ISystemInfo {
  cpuUsage: number;
  memUsage: number;
  totalmem: number;
  freemem: number;
  type: string;
  hostname: string;
  platform: string;
  release: string;
  uptime: number;
  cwd: string;
  processCpu: number;
  processMem: number;
  loadavg: number[];
}

// 系統詳細資訊每一段時間更新一次
const info: ISystemInfo = {
  type: os.type(),
  hostname: os.hostname(),
  platform: os.platform(),
  release: os.release(),
  uptime: os.uptime(),
  cwd: process.cwd(),
  loadavg: os.loadavg(),
  freemem: 0,
  cpuUsage: 0,
  memUsage: 0,
  totalmem: 0,
  processCpu: 0,
  processMem: 0
};

// 定時重新整理快取
setInterval(() => {
  if (os.platform() === "linux") {
    return setLinuxSystemInfo();
  }
  if (os.platform() === "win32") {
    return setWindowsSystemInfo();
  }
  return otherSystemInfo();
}, 3000);

function otherSystemInfo() {
  info.freemem = os.freemem();
  info.totalmem = os.totalmem();
  info.memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  osUtils.cpuUsage((p) => (info.cpuUsage = p));
}

function setWindowsSystemInfo() {
  info.freemem = os.freemem();
  info.totalmem = os.totalmem();
  info.memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  osUtils.cpuUsage((p) => (info.cpuUsage = p));
}

function setLinuxSystemInfo() {
  try {
    // 基於 /proc/meminfo 的記憶體資料讀取
    const data = fs.readFileSync("/proc/meminfo", { encoding: "utf-8" });
    const list = data.split("\n");
    const infoTable: IInfoTable = {};
    list.forEach((line) => {
      const kv = line.split(":");
      if (kv.length === 2) {
        const k = kv[0].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
        let v = kv[1].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
        v = v.replace(/kb/gim, "").replace(/mb/gim, "").replace(/gb/gim, "");
        let vNumber = parseInt(v);
        if (isNaN(vNumber)) vNumber = 0;
        infoTable[k] = vNumber;
      }
    });
    const memAvailable = infoTable["memavailable"] ?? infoTable["memfree"];
    const memTotal = infoTable["memtotal"];
    info.freemem = memAvailable * 1024;
    info.totalmem = memTotal * 1024;
    info.memUsage = (info.totalmem - info.freemem) / info.totalmem;
    osUtils.cpuUsage((p) => (info.cpuUsage = p));
  } catch (error) {
    // 若讀取錯誤，則自動採用預設通用讀取法
    otherSystemInfo();
  }
}

export function systemInfo() {
  return info;
}
