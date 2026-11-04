package com.github.dingdaoyi.core.exception;

import com.github.dingdaoyi.core.enums.ErrorCode;
import lombok.Getter;

/**
 * 业务逻辑异常
 *
 * @author dingyunwei
 */
@Getter
public final class ServiceException extends RuntimeException {

    /**
     * 业务错误码
     */
    private final Integer code;

    /**
     * 错误提示
     */
    private final String msg;

    public ServiceException(String msg) {
        super(msg);
        this.code = ErrorCode.INTERNAL_SERVER_ERROR.getCode();
        this.msg = msg;
    }

    public ServiceException(Integer code, String msg) {
        super(msg);
        this.code = code;
        this.msg = msg;
    }

    public ServiceException(ErrorCode errorCode) {
        super(errorCode.getMsg());
        this.code = errorCode.getCode();
        this.msg = errorCode.getMsg();
    }

    public ServiceException(ErrorCode errorCode, String msg) {
        super(msg);
        this.code = errorCode.getCode();
        this.msg = msg;
    }

    /**
     * 对外暴露的异常提示，与 {@link #msg} 保持一致
     */
    @Override
    public String getMessage() {
        return msg;
    }
}
