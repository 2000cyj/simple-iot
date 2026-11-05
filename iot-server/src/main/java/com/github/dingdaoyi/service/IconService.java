package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.Icon;
import com.baomidou.mybatisplus.extension.service.IService;
/**
 * 图标服务接口
 */
public interface IconService extends IService<Icon>{

    String path(Integer id);

}
