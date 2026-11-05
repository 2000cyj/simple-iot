package com.github.dingdaoyi.proto.model;


/**
 * 数据解析错误类型
 *
 * @author dingyunwei
 */
public enum DecodeErrorType {
    MAX_ERROR("上限告警"),
    MIN_ERROR("下限告警"),
    ;

    public final String message;

    DecodeErrorType(String message) {
        this.message = message;
    }
}
