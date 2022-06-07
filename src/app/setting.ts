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

// 全域性配置初始化

import SystemConfig from "./entity/setting";
import StorageSystem from "./common/system_storage";

let systemConfig: SystemConfig = null;

export function initSystemConfig() {
  systemConfig = StorageSystem.load("SystemConfig", SystemConfig, "config");
  if (!systemConfig) {
    systemConfig = new SystemConfig();
    StorageSystem.store("SystemConfig", "config", systemConfig);
  }
}

export function saveSystemConfig(_systemConfig: SystemConfig) {
  StorageSystem.store("SystemConfig", "config", _systemConfig);
}

export { systemConfig };
