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
import { Socket } from "socket.io";

// 應用例項資料流轉發介面卡

export default class InstanceStreamListener {
  // Instance uuid -> Socket[]
  public readonly listenMap = new Map<string, Socket[]>();

  public requestForward(socket: Socket, instanceUuid: string) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      for (const iterator of sockets)
        if (iterator.id === socket.id)
          throw new Error(`此 Socket ${socket.id} 已經存在於指定例項監聽表中`);
      sockets.push(socket);
    } else {
      this.listenMap.set(instanceUuid, [socket]);
    }
  }

  public cannelForward(socket: Socket, instanceUuid: string) {
    if (!this.listenMap.has(instanceUuid))
      throw new Error(`指定 ${instanceUuid} 並不存在於監聽表中`);
    const socketList = this.listenMap.get(instanceUuid);
    socketList.forEach((v, index) => {
      if (v.id === socket.id) socketList.splice(index, 1);
    });
  }

  public forward(instanceUuid: string, data: any) {
    const sockets = this.listenMap.get(instanceUuid);
    sockets.forEach((socket) => {
      if (socket && socket.connected) socket.emit("instance/stdout", data);
    });
  }

  public forwardViaCallback(instanceUuid: string, callback: (socket: Socket) => void) {
    if (this.listenMap.has(instanceUuid)) {
      const sockets = this.listenMap.get(instanceUuid);
      sockets.forEach((socket) => {
        if (socket && socket.connected) callback(socket);
      });
    }
  }

  public hasListenInstance(instanceUuid: string) {
    return this.listenMap.has(instanceUuid) && this.listenMap.get(instanceUuid).length > 0;
  }
}
