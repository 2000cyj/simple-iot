package com.github.dingdaoyi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.github.dingdaoyi.entity.WebhookIngress;
import org.apache.ibatis.annotations.Mapper;

/**
 * webhook 接入配置 Mapper
 */
@Mapper
public interface WebhookIngressMapper extends BaseMapper<WebhookIngress> {
}
