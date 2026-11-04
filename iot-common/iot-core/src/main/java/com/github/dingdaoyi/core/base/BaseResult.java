package com.github.dingdaoyi.core.base;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.dingdaoyi.core.enums.ErrorCode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 统一响应结果
 *
 * @author dingyunwei
 */
@Data
@Schema(description = "统一响应结果")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResult<T> {

    @Schema(description = "响应码")
    private Integer code;

    @Schema(description = "响应消息")
    private String msg;

    @Schema(description = "响应数据")
    private T data;

    private BaseResult(Integer code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    /**
     * 是否成功。由响应码推导，不再单独存储，避免出现 code 与 success 不一致的响应体。
     */
    @Schema(description = "是否成功")
    public boolean isSuccess() {
        return ErrorCode.SUCCESS.getCode().equals(code);
    }

    public static <T> BaseResult<T> success() {
        return new BaseResult<>(ErrorCode.SUCCESS.getCode(), "操作成功", null);
    }

    public static <T> BaseResult<T> success(T data) {
        return new BaseResult<>(ErrorCode.SUCCESS.getCode(), "操作成功", data);
    }

    public static <T> BaseResult<T> success(String msg, T data) {
        return new BaseResult<>(ErrorCode.SUCCESS.getCode(), msg, data);
    }

    public static <T> BaseResult<T> fail(String msg) {
        return new BaseResult<>(ErrorCode.INTERNAL_SERVER_ERROR.getCode(), msg, null);
    }

    public static <T> BaseResult<T> fail(ErrorCode code, String msg) {
        return new BaseResult<>(code.getCode(), msg, null);
    }

    public static <T> BaseResult<T> fail(Integer code, String msg) {
        return new BaseResult<>(code, msg, null);
    }
}