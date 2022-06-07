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

import path from "path";
import fs from "fs-extra";

interface IClassz {
  name: string;
}

class StorageSubsystem {
  public static readonly STIRAGE_DATA_PATH = path.normalize(path.join(process.cwd(), "data"));
  public static readonly STIRAGE_INDEX_PATH = path.normalize(
    path.join(process.cwd(), "data", "index")
  );

  /**
   * 根據類定義和識別符號儲存成本地檔案
   */
  public store(category: string, uuid: string, object: any) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const filePath = path.join(dirPath, `${uuid}.json`);
    const data = JSON.stringify(object, null, 4);
    fs.writeFileSync(filePath, data, { encoding: "utf-8" });
  }

  // 以複製目標方為原型的基本型別的深複製
  // target 複製目標 object 複製源
  protected defineAttr(target: any, object: any): any {
    for (const v of Object.keys(target)) {
      const objectValue = object[v];
      if (objectValue === undefined) continue;
      if (objectValue instanceof Array) {
        target[v] = objectValue;
        continue;
      }
      if (objectValue instanceof Object && typeof objectValue === "object") {
        this.defineAttr(target[v], objectValue);
        continue;
      }
      target[v] = objectValue;
    }
    return target;
  }

  /**
   * 根據類定義和識別符號例項化成物件
   */
  public load(category: string, classz: any, uuid: string) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const filePath = path.join(dirPath, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, { encoding: "utf-8" });
    const dataObject = JSON.parse(data);
    const target = new classz();
    // for (const v of Object.keys(target)) {
    //   if (dataObject[v] !== undefined) target[v] = dataObject[v];
    // }
    // 深層物件複製
    return this.defineAttr(target, dataObject);
  }

  /**
   * 透過類定義返回所有與此類有關的識別符號
   */
  public list(category: string) {
    const dirPath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
    if (!fs.existsSync(dirPath)) fs.mkdirsSync(dirPath);
    const files = fs.readdirSync(dirPath);
    const result = new Array<string>();
    files.forEach((name) => {
      result.push(name.replace(path.extname(name), ""));
    });
    return result;
  }

  /**
   * 透過類定義刪除指定型別的識別符號例項
   */
  public delete(category: string, uuid: string) {
    const filePath = path.join(StorageSubsystem.STIRAGE_DATA_PATH, category, `${uuid}.json`);
    if (!fs.existsSync(filePath)) return;
    fs.removeSync(filePath);
  }
}

export default new StorageSubsystem();
