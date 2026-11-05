package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.ModelProperty;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.model.query.ModelPropertyUpdateQuery;
import com.github.dingdaoyi.model.query.ProductPropertyAddQuery;
import com.github.dingdaoyi.model.query.StandardPropertyAddQuery;

import java.util.List;

/**
 * 物模型属性服务接口
 *
 * @author dingyunwei
 */
public interface ModelPropertyService extends IService<ModelProperty> {


    /**
     *
     * @param productTypeId
     * @param productId
     * @param paramType
     * @param search
     * @param all 是否查询全部, 在产品属性查询时, 判断是否查询所有包函产品类型的数据
     * @return
     */
    List<ModelProperty> listByProductType(Integer productTypeId, Integer productId,Integer paramType,String search,Boolean all);

    /**
     * 根据父级id查询
     * @param parentId
     * @return
     */
    List<ModelProperty> listByParentId(Integer parentId);

    /**
     * 保存标准物模型属性
     * @param property 属性新增参数
     * @return 是否保存成功
     */
    Boolean saveStandardProperty(StandardPropertyAddQuery property);

    /**
     * 所有id是否存在
     *
     * @param ids
     * @return
     */
    boolean allExists(List<Integer> ids);

    /**
     * 存在判断
     * @param identifier
     * @param productTypeId
     * @return
     */
    boolean exists(String identifier,
                   Integer productTypeId);

    /**
     * 存在判断
     * @param identifier 属性标识符
     * @param productTypeId 产品类型id
     * @param productId 产品id
     * @return 是否存在
     */
    boolean exists(String identifier, Integer productTypeId,  Integer productId);

    /**
     * 保存产品自定义物模型属性
     * @param property 属性新增参数
     * @return 是否保存成功
     */
    Boolean saveProductProperty(ProductPropertyAddQuery property);

    /**
     * 更新物模型属性
     * @param property 属性更新参数
     * @return 是否更新成功
     */
    Boolean update(ModelPropertyUpdateQuery property);

    /**
     * 根据产品查询物模型的属性和参数信息
     * @param productId
     * @param productTypeId
     * @return
     */
    List<ModelProperty> listByProduct(Integer productId, Integer productTypeId);

    /**
     * 判断产品下是否存在物模型属性
     * @param productId 产品id
     * @return 是否存在
     */
    boolean existsByProduct(Integer productId);
}
