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

import { v4 } from "uuid";
import { IPacket, IRequestPacket } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";

class RemoteError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

// Use RemoteRequest to send Socket.io events and data to remote services,
// and support synchronous response data (such as HTTP).
export default class RemoteRequest {
  constructor(public readonly rService: RemoteService) {
    if (!this.rService || !this.rService.socket)
      throw new Error("Unable to complete initialization, remote service does not exist.");
  }

  // request to remote service
  public async request(event: string, data?: any, timeout = 6000, force = false): Promise<any> {
    if (!this.rService.socket)
      throw new Error("The Socket must is SocketIOClient.Socket, Not null.");
    if (!this.rService.available && !force)
      throw new Error("遠端服務狀態不可用，建議嘗試重連遠端服務或檢查配置");
    if (!this.rService.socket.connected && !force)
      throw new Error("遠端服務連線不可用，無法傳送資料");

    return new Promise((resolve, reject) => {
      const uuid = [v4(), new Date().getTime()].join("");
      const protocolData: IRequestPacket = { uuid, data };

      // Start countdown
      const countdownTask = setTimeout(
        () => reject(new RemoteError(`請求遠端(${this.rService.config.ip})事件 [${event}] 超時`)),
        timeout
      );

      // define event function
      const fn = (msg: IPacket) => {
        if (msg.uuid === uuid) {
          clearTimeout(countdownTask);
          // 每當返回訊息後，匹配ID確保響應是請求的對應，則刪除自身事件監聽
          this.rService.socket.removeEventListener(event, fn);
          if (msg.status == RemoteService.STATUS_OK) resolve(msg.data);
          else if (msg.data.err) {
            reject(new RemoteError(msg.data.err));
          } else {
            reject(new RemoteError(msg.data));
          }
        }
      };
      this.rService.socket.on(event, fn);
      // send command
      this.rService.emit(event, protocolData);
    });
  }
}
