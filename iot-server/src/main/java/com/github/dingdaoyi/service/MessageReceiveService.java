package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.MessageReceive;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.core.base.PageResult;
import com.github.dingdaoyi.model.query.MessageRecivePageQuery;

/**
 * 消息接收服务接口
 *
 * @author dingyunwei
 */
public interface MessageReceiveService extends IService<MessageReceive>{


    /**
     * 分页查询
     * @param pageQuery
     * @return
     */
    PageResult<MessageReceive> pageByQuery(MessageRecivePageQuery pageQuery);

    /**
     * 删除消息接收配置
     * @param id 配置id
     * @return 是否删除成功
     */
    Boolean deleteById(Integer id);

    /**
     * 按id查询名称
     * @param id 配置id
     * @return 名称
     */
    String getNameById(Integer id);


}
