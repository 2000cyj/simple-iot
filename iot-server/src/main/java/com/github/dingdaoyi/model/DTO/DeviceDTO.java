package com.github.dingdaoyi.model.DTO;


import com.github.dingdaoyi.entity.Device;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 设备传输对象
 *
 * @author dingyunwei
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class DeviceDTO extends Device {
    /**
     * 协议key
     */
    private String protoKey;

    /**
     * 产品key
     */
    private String productKey;
}
