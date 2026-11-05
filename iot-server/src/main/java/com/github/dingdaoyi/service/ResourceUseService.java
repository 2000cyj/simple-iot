package com.github.dingdaoyi.service;

/**
 * 资源占用检查接口
 *
 * @author dingyunwei
 */
public interface ResourceUseService<T> {

    /**
     * 是否使用
     *
     * @param data 参数
     * @return
     */
    boolean isUsed(T data);

    /**
     * 使用目标
     *
     * @return
     */
    String userTarget();
}
