package com.github.dingdaoyi.service;


import com.github.dingdaoyi.core.base.PageResult;
import com.github.dingdaoyi.model.query.DeviceDataQuery;
import com.github.dingdaoyi.model.query.DeviceEventDataVo;
import com.github.dingdaoyi.model.query.TelemetryAggQuery;
import com.github.dingdaoyi.proto.model.KeyValue;

import java.util.List;

/**
 * 设备数据服务接口
 *
 * @author dingyunwei
 */
public interface DeviceDataService {

    /**
     * 查询设备最新属性值
     * @param deviceKey 设备编号
     * @return 属性标识符与属性值的列表
     */
    List<KeyValue<String, Object>> getLatestData(String deviceKey);

    /**
     * 按条件查询设备属性指标
     * @param query 查询条件
     * @return 属性标识符与属性值的列表
     */
    List<KeyValue<String, Object>> metric(DeviceDataQuery query);

    /**
     * 分页查询设备事件日志
     * @param query 查询条件
     * @return 事件日志分页结果
     */
    PageResult<DeviceEventDataVo> eventLogs(DeviceDataQuery query);

    /**
     * 时序数据聚合统计
     * @param query 聚合条件
     * @return 聚合结果列表
     */
    List<KeyValue<String, Object>> aggregate(TelemetryAggQuery query);
}
