package com.github.dingdaoyi.iot.proto;

import com.github.dingdaoyi.entity.Protocol;
import com.github.dingdaoyi.proto.inter.ProtocolDecoder;

import java.util.List;
import java.util.Map;


/**
 * 协议初始化接口
 */
public interface ProtocolInitialize {
    /**
     * 初始化
     * @param protocols
     * @return
     */
    Map<String, ProtocolDecoder> initProtocol(List<Protocol> protocols);
}
