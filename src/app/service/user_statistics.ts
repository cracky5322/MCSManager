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

import axios from "axios";

const st = new Date().toLocaleDateString();

// 此功能模組用於 MCSManager 使用者資料統計，目的是瞭解現有日活數量與安裝數量。
// 使用者統計將不會發送任何隱私資料，使用者資料，系統資訊等。
// 詳情參考：https://mcsmanager.com/agreement.html
async function statistics() {
  return await axios.get("http://statistics.mcsmanager.com/", {
    params: {
      st
    },
    timeout: 1000 * 10
  });
}

// 請求 24 小時內只有一次算有效統計，重複請求忽略不計
// 這裡設定為 24 小時請求一次
setTimeout(async () => {
  try {
    return await statistics();
  } catch (error) {
    // ignore
  }
}, 1000 * 60 * 60 * 24);

// 面板啟動時進行統計一次
statistics()
  .then(() => {})
  .catch(() => {});
