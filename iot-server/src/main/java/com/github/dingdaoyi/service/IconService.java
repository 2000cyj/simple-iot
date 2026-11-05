package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.Icon;
import com.baomidou.mybatisplus.extension.service.IService;
/**
 * 图标服务接口
 */
public interface IconService extends IService<Icon>{

    /**
     * 查询图标访问路径
     * @param id 图标id
     * @return 图标路径
     */
    String path(Integer id);

}
