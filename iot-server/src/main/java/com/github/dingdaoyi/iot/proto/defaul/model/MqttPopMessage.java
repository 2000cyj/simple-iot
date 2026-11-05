package com.github.dingdaoyi.iot.proto.defaul.model;

import lombok.Data;

/**
 * MQTT POP 报文
 *
 * @author dingyunwei
 */
@Data
public class MqttPopMessage{
    /**
     * 参数值
     */
    private Object value;
}
