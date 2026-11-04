package com.github.dingdaoyi.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.github.dingdaoyi.core.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("tb_push_log")
public class PushLog extends BaseEntity {

    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    private Integer pushConfigId;
    private String pushConfigName;
    private String eventType;
    private boolean success;
    private Integer statusCode;
    private String message;
    private String responseBody;
    private String deviceKey;
    private Long durationMs;
}
