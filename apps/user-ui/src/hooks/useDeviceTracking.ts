"use client";

import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

export default function useDeviceTracking() {
  const [deviceInfo, setDeviceInfo] = useState("");

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    setDeviceInfo(`${result.device.type || "desktop"} - ${result.os.name} ${result.os.version} - ${result.browser.name} ${result.browser.version}`);
  }, []);

  return { deviceInfo };
}
