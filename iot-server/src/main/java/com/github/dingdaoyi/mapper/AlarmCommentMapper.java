package com.github.dingdaoyi.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.github.dingdaoyi.entity.AlarmComment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 告警评论 Mapper
 */
@Mapper
public interface AlarmCommentMapper extends BaseMapper<AlarmComment> {
}
