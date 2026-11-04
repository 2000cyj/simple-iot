package com.github.dingdaoyi.core.service;

import com.github.dingdaoyi.core.model.DeviceBase;

import java.util.Optional;

/**
 * 设备查询接口
 *
 * @author dingyunwei
 */
public interface DeviceProvider {

    /**
     * 按第三方设备编号查询设备
     *
     * @param threadDeviceId 第三方id
     */
    Optional<DeviceBase> getByThreadDeviceId(String threadDeviceId);
}
