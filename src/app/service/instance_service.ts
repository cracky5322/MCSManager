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

// 多轉發操作方法
export function multiOperationForwarding(
  instances: any[],
  callback: (remoteUuid: string, instanceUuids: string[]) => void
) {
  // 分類表
  const map = new Map<string, string[]>();
  // 根據資訊進行遠端主機與例項ID分類
  for (const instanceInfo of instances) {
    const remoteUuid: string = instanceInfo.serviceUuid;
    const instanceUuid: string = instanceInfo.instanceUuid;
    if (map.has(remoteUuid)) {
      map.get(remoteUuid).push(instanceUuid);
    } else {
      map.set(remoteUuid, [instanceUuid]);
    }
  }
  // 將分類好的資料分別打包轉發
  for (const iterator of map) {
    const remoteUuid = iterator[0];
    const instanceUuids = iterator[1];
    callback(remoteUuid, instanceUuids);
  }
}
