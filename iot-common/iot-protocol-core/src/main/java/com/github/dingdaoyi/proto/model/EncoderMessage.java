package com.github.dingdaoyi.proto.model;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * 协议编码请求
 *
 * @author dwx
 */
@Data
public class EncoderMessage {

    /**
     * 标识符
     */
    private String identifier;

    private String deviceKey;

    /**
     * 产品key
     */
    private String productKey;

    /**
     * 下行参数
     */
    Map<String, Object> params = new HashMap<>();
}
