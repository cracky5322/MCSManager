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

// @Entity
export default class SystemConfig {
  // HTTP 服務埠與IP
  httpPort: number = 23333;
  httpIp: string = null;

  // 資料傳輸埠
  dataPort: number = 23334;

  // 分散式轉發模式
  forwardType: number = 1;

  // 是否准許跨域請求
  crossDomain: boolean = false;
  // 是否採用 Gzip 壓縮 HTTP 返回資訊
  gzip: boolean = false;
  // 最大同時壓縮任務
  maxCompress: number = 1;
  // 最大同時下載任務
  maxDonwload: number = 10;
  // 解壓縮實現形式
  zipType: number = 1;
  // 登入次數IP限制
  loginCheckIp: boolean = true;
  // 登入介面文案
  loginInfo: string = "";
}
