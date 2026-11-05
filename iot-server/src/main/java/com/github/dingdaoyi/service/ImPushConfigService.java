package com.github.dingdaoyi.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.entity.ImPushConfig;
import com.github.dingdaoyi.model.enu.NotifyType;

import java.util.List;
import java.util.Optional;

/**
 * IM 推送配置服务接口
 */
public interface ImPushConfigService extends IService<ImPushConfig> {

    /**
     * 查询指定平台已启用的推送配置
     * @param platform 推送平台
     * @return 推送配置
     */
    Optional<ImPushConfig> getEnabledByPlatform(NotifyType platform);

    /**
     * 查询全部已启用的推送配置
     * @return 推送配置列表
     */
    List<ImPushConfig> listEnabled();
}
