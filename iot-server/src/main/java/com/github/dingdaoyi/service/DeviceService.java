package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.Device;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.model.DTO.DeviceDTO;
import com.github.dingdaoyi.core.base.PageResult;
import com.github.dingdaoyi.model.query.DevicePageQuery;
import com.github.dingdaoyi.model.vo.DevicePageVo;
import com.github.dingdaoyi.model.vo.DeviceVo;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

/**
 * 设备服务接口
 */
public interface DeviceService extends IService<Device>{


    /**
     * 设备详情
     * @param id
     * @return
     */
    Optional<DeviceVo> details(Integer id);

    /**
     * 按设备编号查询
     * @param deviceKey 设备编号
     * @return 设备信息
     */
    Optional<DeviceDTO> getByDeviceKey(String deviceKey);

    /**
     * 分页查询设备
     * @param query 分页查询条件
     * @return 设备分页结果
     */
    PageResult<DevicePageVo> pageByQuery(@Valid DevicePageQuery query);

    /**
     * 更新设备在线状态
     * @param deviceKey 设备编号
     * @param online 是否在线
     */
    void updateOlinStatus(String deviceKey, boolean online);

    /**
     * 获取设备key
     * @param id id
     * @return
     */
    String getDeviceKey(Integer id);

    /**
     * 条件查询,所有数据可能为空,最多返回100条
     * @param productTypeId
     * @param productId
     * @param deviceKey
     * @return
     */
    List<Device> list(Integer productTypeId, Integer productId, String deviceKey);

    /**
     * 按第三方设备编号查询
     * @param thirdDeviceId 第三方设备编号
     * @return 设备信息
     */
    Optional<DeviceDTO> getByThirdDeviceId(String thirdDeviceId);
}
