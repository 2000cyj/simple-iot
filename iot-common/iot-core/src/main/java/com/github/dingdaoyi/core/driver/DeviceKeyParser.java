package com.github.dingdaoyi.core.driver;

import com.github.dingdaoyi.core.service.DeviceProvider;

import java.util.List;
import java.util.Optional;

/**
 * 设备编号解析接口
 *
 * @author dingyunwei
 */
public interface DeviceKeyParser {

    void setDeviceProvider(DeviceProvider deviceProvider);
    /**
     * 可以启动的类型
     */
    List<DriverTypeEnum> driverTypes();
    /**
     * 解析驱动的名称
     */
    String driverName();
    /**
     * 是否包含设备编号
     */
    boolean hasDeviceKey(byte[] data);

    /**
     * 设备编号
     */
    Optional<String> deviceKey(byte[] data);
}
