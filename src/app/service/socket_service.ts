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

import http from "http";
import { Server, Socket } from "socket.io";
import WebSocketRouter from "../routers/public/socket_router";
import { logger } from "./log";

export default class SocketService {
  public static server: Server;
  public static readonly socketsMap = new Map<string, Socket>();

  public static setUpSocketIO(httpServer: http.Server) {
    const io = new Server(httpServer, {
      path: "/socket.io",
      cors: {
        // 臨時的
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on("connection", (socket) => {
      // 使用者 Websocket 連結時，加入全域性，繫結相關事件
      logger.info(`Websocket ${socket.id}(${socket.handshake.address}) connection`);
      this.socketsMap.set(socket.id, socket);
      // 繫結業務事件
      SocketService.bindEvents(socket);
      // 當用戶 Websocket 斷開時，從Socket列表中刪除，並釋放一些資源
      socket.on("disconnect", () => {
        this.socketsMap.delete(socket.id);
        for (const name of socket.eventNames()) socket.removeAllListeners(name);
        logger.info(`Websocket ${socket.id}(${socket.handshake.address}) disconnected`);
      });
    });

    this.server = io;
    return this.server;
  }

  // 用於繫結 Socket 事件
  private static bindEvents(socket: Socket) {
    new WebSocketRouter(socket);
  }
}
