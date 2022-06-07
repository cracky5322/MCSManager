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

import * as io from "socket.io-client";
import { RemoteServiceConfig } from "./entity_interface";
import { logger } from "../service/log";
import RemoteRequest from "../service/remote_command";
import InstanceStreamListener from "../common/instance_stream";

export default class RemoteService {
  public static readonly STATUS_OK = 200;
  public static readonly STATUS_ERR = 500;

  public uuid: string = null;
  public available: boolean = false;
  public socket: SocketIOClient.Socket = null;
  public readonly instanceStream = new InstanceStreamListener();
  public config: RemoteServiceConfig;

  constructor(uuid: string, config: RemoteServiceConfig) {
    this.uuid = uuid;
    this.config = config;
  }

  // 連線遠端服務
  public connect(connectOpts?: SocketIOClient.ConnectOpts) {
    if (connectOpts) this.config.connectOpts = connectOpts;

    if (this.available) {
      logger.info(`[${this.uuid}] 使用者發起重連已可用狀態的遠端服務，正在重置連線通道`);
      this.disconnect();
    }

    // 防止重複註冊事件
    if (this.socket && this.socket.hasListeners("connect")) {
      logger.info(`[${this.uuid}] 使用者發起重複連線請求，現進行重置連線配置`);
      return this.refreshReconnect();
    }

    // 開始正式連線遠端Socket程式
    let addr = `ws://${this.config.ip}:${this.config.port}`;
    if (this.config.ip.indexOf("wss://") === 0 || this.config.ip.indexOf("ws://") === 0) {
      addr = `${this.config.ip}:${this.config.port}`;
    }
    logger.info(`[${this.uuid}] 面板正在嘗試連線遠端服務 ${addr}`);
    this.socket = io.connect(addr, connectOpts);

    // 註冊內建事件
    this.socket.on("connect", async () => {
      logger.info(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 已連線`);
      await this.onConnect();
    });
    this.socket.on("disconnect", async () => {
      logger.info(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 已斷開`);
      await this.onDisconnect();
    });
    this.socket.on("connect_error", async (error: string) => {
      // 提示次數過於頻繁，不再提示
      // logger.warn(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 連線錯誤`);
      await this.onDisconnect();
    });
  }

  // This function is used to verify the identity. It only needs to be verified once.
  // This function will be executed automatically after the connection event is triggered.
  // Generally, there is no need to execute it manually.
  public async auth(key?: string) {
    if (key) this.config.apiKey = key;
    try {
      const res = await new RemoteRequest(this).request("auth", this.config.apiKey, 5000, true);
      if (res === true) {
        this.available = true;
        logger.info(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 驗證成功`);
        return true;
      }
      this.available = false;
      logger.warn(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 驗證失敗`);
      return false;
    } catch (error) {
      logger.warn(`遠端服務 [${this.uuid}] [${this.config.ip}:${this.config.port}] 驗證錯誤`);
      return false;
    }
  }

  public emit(event: string, data?: any) {
    return this.socket.emit(event, data);
  }

  private async onDisconnect() {
    this.available = false;
  }

  private async onConnect() {
    // this.available = true; Note: Connected is not auth;
    return await this.auth(this.config.apiKey);
  }

  disconnect() {
    if (this.socket) {
      logger.info(`[${this.uuid}] [${this.config.ip}:${this.config.port}] Socket 已主動釋放連線`);
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket.close();
      delete this.socket;
    }
    this.socket = null;
    this.available = false;
  }

  refreshReconnect() {
    this.disconnect();
    this.connect();
  }
}
