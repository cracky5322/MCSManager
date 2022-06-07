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

import { logger } from "./log";
import { IRemoteService, RemoteServiceConfig } from "../entity/entity_interface";
import RemoteService from "../entity/remote_service";
import { UniversalRemoteSubsystem } from "./base/urs";
import StorageSubsystem from "../common/system_storage";
import fs from "fs-extra";
import path from "path";

// 遠端服務管理子系統（RemoteServiceSubsystem）這個子系統將是最重要的系統之一
// 主要功能是在所有地方儲存遠端服務
// 掃描本地服務，統一管理，遠端呼叫和代理等
class RemoteServiceSubsystem extends UniversalRemoteSubsystem<RemoteService> {
  constructor() {
    super();
    // If it is the first startup, it will automatically try to connect to "LocalHost",
    // otherwise it will automatically read from the configuration file and connect to all remote services.
    StorageSubsystem.list("RemoteServiceConfig").forEach((uuid) => {
      const config = StorageSubsystem.load(
        "RemoteServiceConfig",
        RemoteServiceConfig,
        uuid
      ) as RemoteServiceConfig;
      const newService = new RemoteService(uuid, config);
      this.setInstance(uuid, newService);
      newService.connect();
    });

    // 若無任何守護程序，則檢測本地是否存在守護程序
    if (this.services.size === 0) {
      this.initConnectLocalhost("");
    }

    logger.info(`遠端服務子系統初始化完畢`);
    logger.info(`總計配置節點數: ${this.services.size}`);

    // 註冊定期連線狀態檢查
    setInterval(() => this.connectionStatusCheckTask(), 1000 * 60);
  }

  // Register a NEW remote service to system and connect it.
  // Like: this.registerRemoteService({
  //   ip: "127.0.0.1",
  //   apiKey: "test_key",
  //   port: 24444
  // });
  registerRemoteService(config: IRemoteService) {
    const instance = this.newInstance(config);
    StorageSubsystem.store("RemoteServiceConfig", instance.uuid, instance.config);
    instance.connect();
    return instance;
  }

  // 根據 UUID 刪除指定的遠端服務
  deleteRemoteService(uuid: string) {
    if (this.getInstance(uuid)) {
      this.getInstance(uuid).disconnect();
      this.deleteInstance(uuid);
      StorageSubsystem.delete("RemoteServiceConfig", uuid);
    }
  }

  // According to the IRemoteService, New a RemoteService object
  // Used to initialize objects.
  newInstance(config: IRemoteService) {
    const instance = new RemoteService(
      config.uuid || this.randdomUuid(),
      new RemoteServiceConfig()
    );
    this.setInstance(instance.uuid, instance);
    this.edit(instance.uuid, config);
    return instance;
  }

  // Edit the configuration file of the instance
  edit(uuid: string, config: IRemoteService) {
    const instance = this.getInstance(uuid);
    if (config.remarks) instance.config.remarks = config.remarks;
    if (config.ip) instance.config.ip = config.ip;
    if (config.port) instance.config.port = config.port;
    if (config.apiKey) instance.config.apiKey = config.apiKey;
    StorageSubsystem.store("RemoteServiceConfig", instance.uuid, instance.config);
  }

  // Scannce localhost service
  // First use, need to scan the local host
  // Note: Every time you execute "initConnectLocalhost",
  // it will be managed by the subsystem (regardless of whether the target exists).
  async initConnectLocalhost(key?: string) {
    const ip = "localhost";
    const localKeyFilePath = path.normalize(
      path.join(process.cwd(), "../daemon/data/Config/global.json")
    );
    logger.info(`正在嘗試讀取本地守護程序: ${localKeyFilePath}`);
    if (fs.existsSync(localKeyFilePath)) {
      logger.info("檢測到本地守護程序，正在自動獲取金鑰和埠...");
      const localDaemonConfig = JSON.parse(
        fs.readFileSync(localKeyFilePath, { encoding: "utf-8" })
      );
      const localKey = localDaemonConfig.key;
      const localPort = localDaemonConfig.port;
      logger.info("正在自動連線本地守護程序...");
      return this.registerRemoteService({ apiKey: localKey, port: localPort, ip });
    } else if (key) {
      const port = 24444;
      logger.info("無法自動獲取本地守護程序配置檔案，已發起連線但可能未經證實...");
      return this.registerRemoteService({ apiKey: key, port, ip });
    }
    logger.info("無法自動獲取本地守護程序配置檔案，請手動連線守護程序");
  }

  count() {
    let total = 0;
    let available = 0;
    this.services.forEach((v) => {
      total++;
      if (v.available) available++;
    });
    return { available, total };
  }

  // 定期連線狀態檢查
  connectionStatusCheckTask() {
    this.services?.forEach((v) => {
      if (v && v.available === false) {
        logger.warn(
          `檢測到守護程序 ${v.config.remarks} ${v.config.ip}:${v.config.port} 狀態異常，正在重置並連線`
        );
        return v.connect();
      }
    });
  }
}

export default new RemoteServiceSubsystem();
