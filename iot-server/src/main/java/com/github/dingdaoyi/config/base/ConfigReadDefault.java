package com.github.dingdaoyi.config.base;

import jakarta.annotation.Resource;
import org.dromara.sms4j.core.factory.SmsFactory;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 短信发送实例初始化
 *
 * @author dingyunwei
 */
@Component
public class ConfigReadDefault {
    @Resource
    ReadConfig config;

    @EventListener
    public void init(ContextRefreshedEvent event){
        // 创建SmsBlend 短信实例，无配置时跳过
        if (config.getSupplierConfig("1") != null) {
            SmsFactory.createSmsBlend(config, "1");
        }
    }
}
