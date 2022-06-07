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

  視覺化資料子系統：負責收集系統資料和事件資料，並且提供一些方法展示出來
*/
import { logger } from "./log";
import { systemInfo } from "../common/system_info";
import RemoteServiceSubsystem from "../service/system_remote_service";
import RemoteRequest from "./remote_command";

class LineQueue<T> {
  private readonly arr = new Array<T>();

  constructor(public readonly maxSize: number, defaultValue?: T) {
    for (let index = 0; index < maxSize; index++) {
      this.arr.push(defaultValue);
    }
  }

  push(data: T) {
    if (this.arr.length < this.maxSize) {
      this.arr.push(data);
    } else {
      this.arr.shift();
      this.arr.push(data);
    }
  }

  getArray() {
    return this.arr;
  }
}

interface ISystemChartInfo {
  cpu: number;
  mem: number;
}

interface IWebChartInfo {
  value: number;
  totalInstance: number;
  runningInstance: number;
}

class VisualDataSubsystem {
  public readonly countMap: Map<string, number> = new Map<string, number>();

  // 系統資訊表
  public readonly systemChart = new LineQueue<ISystemChartInfo>(60, { cpu: 0, mem: 0 });
  // 面板狀態表
  public readonly statusChart = new LineQueue<IWebChartInfo>(60, {
    value: 0,
    totalInstance: 0,
    runningInstance: 0
  });

  // 請求次數計數器
  private requestCount = 0;

  constructor() {
    // 系統資訊表
    setInterval(() => {
      const info = systemInfo();
      if (info) {
        this.systemChart.push({
          cpu: Number((info.cpuUsage * 100).toFixed(1)),
          mem: Number((info.memUsage * 100).toFixed(1))
        });
      } else {
        this.systemChart.push({
          cpu: 0,
          mem: 0
        });
      }
    }, 1000 * 10);

    // 狀態表
    setInterval(async () => {
      // 計算總例項與執行例項數
      const remoteInfoList = new Array();
      for (const iterator of RemoteServiceSubsystem.services.entries()) {
        try {
          remoteInfoList.push(await new RemoteRequest(iterator[1]).request("info/overview"));
        } catch (err) {}
      }
      let totalInstance = 0;
      let runningInstance = 0;
      for (const iterator of remoteInfoList) {
        if (iterator.instance) {
          totalInstance += iterator.instance.total;
          runningInstance += iterator.instance.running;
        }
      }
      this.statusChart.push({
        value: this.requestCount,
        totalInstance,
        runningInstance
      });
      this.requestCount = 0;
    }, 1000 * 10);
  }

  addRequestCount() {
    this.requestCount++;
  }

  getSystemChartArray() {
    return this.systemChart.getArray();
  }

  getStatusChartArray() {
    return this.statusChart.getArray();
  }

  // Trigger counting event
  emitCountEvent(eventName: string) {
    const v = this.countMap.get(eventName);
    if (v) {
      this.countMap.set(eventName, v + 1);
    } else {
      this.countMap.set(eventName, 1);
    }
  }

  // Trigger counting event
  eventCount(eventName: string) {
    return this.countMap.get(eventName);
  }

  // Trigger log event
  emitLogEvent(eventName: string, source: any) {
    const time = new Date().toLocaleString();
    logger.info(`The object [${source}] triggered the [${eventName}] event at ${time}`);
  }
}

export default new VisualDataSubsystem();
