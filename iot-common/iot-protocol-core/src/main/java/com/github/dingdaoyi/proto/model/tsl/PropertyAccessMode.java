package com.github.dingdaoyi.proto.model.tsl;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * 物模型属性读写模式
 *
 * @author dingyunwei
 */
@Getter
public enum PropertyAccessMode {
    READE("r"),
    READE_WROTE("rw"),
    ;
    @JsonValue
    @EnumValue
    private final String vale;

    PropertyAccessMode(String vale) {
        this.vale = vale;
    }
}
