package com.github.dingdaoyi.entity.enu;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * 服务类型枚举
 *
 * @author dingyunwei
 */
@Getter
public enum ServiceTypeEnum {
    SERVICE(1),EVENT(2);

    @JsonValue
    @EnumValue
    private final int value;

    ServiceTypeEnum(int value) {
        this.value = value;
    }
}
