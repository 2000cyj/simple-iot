package com.github.dingdaoyi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.github.dingdaoyi.entity.PushLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 推送日志 Mapper
 */
@Mapper
public interface PushLogMapper extends BaseMapper<PushLog> {
}
