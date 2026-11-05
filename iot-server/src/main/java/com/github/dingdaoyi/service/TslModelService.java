package com.github.dingdaoyi.service;

import com.github.dingdaoyi.proto.model.tsl.TslModel;

import java.util.Optional;

/**
 * 物模型服务
 * @author dingyunwei
 */
public interface TslModelService {

    /**
     * 按产品key查询物模型
     * @param productKey 产品key
     * @return 物模型
     */
    Optional<TslModel> findByProductKey(String productKey);
}
