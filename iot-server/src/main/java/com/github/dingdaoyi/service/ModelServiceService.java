package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.ModelService;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.model.query.ServiceAddQuery;
import com.github.dingdaoyi.model.query.ServiceUpdateQuery;
import com.github.dingdaoyi.model.vo.ModelServiceVO;

import java.util.List;

/**
 * 物模型服务服务接口
 *
 * @author dingyunwei
 */
public interface ModelServiceService extends IService<ModelService>{

    /**
     *  查询标准物模型事件
     * @param productTypeId 品类id
     * @param serviceType  服务类型 可选
     * @param search 搜索条件
     * @return
     */
    List<ModelServiceVO> listByProductType(Integer productTypeId, Integer serviceType, String search);

    /**
     * 保存物模型服务
     * @param modelService 服务新增参数
     * @return 是否保存成功
     */
    Boolean save(ServiceAddQuery modelService);

    /**
     * 获取所有服务,事件
     * @param productId
     * @param productTypeId
     * @return
     */
    List<ModelServiceVO> listAllByProduct(Integer productId, Integer productTypeId);


    /**
     * 更新物模型服务
     * @param modelService 服务更新参数
     * @return 是否更新成功
     */
    Boolean update(ServiceUpdateQuery modelService);

    /**
     * 判断产品下是否存在物模型服务
     * @param productId 产品id
     * @return 是否存在
     */
    boolean existsByProduct(Integer productId);

    /**
     *
     * @param productId 产品id
     * @param serviceType 服务类型
     * @param search 搜索字段
     * @return
     */
    List<ModelServiceVO> listByProduct(Integer productId, Integer serviceType, String search);
}
