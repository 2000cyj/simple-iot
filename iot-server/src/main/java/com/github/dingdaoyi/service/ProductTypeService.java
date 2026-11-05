package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.ProductType;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.model.PageQuery;
import com.github.dingdaoyi.core.base.PageResult;
import com.github.dingdaoyi.model.vo.ProductTypeVo;

import java.util.List;

/**
 * 产品类型服务接口
 */
public interface ProductTypeService extends IService<ProductType>{


    /**
     * 通过父级查询子级
     * @param parentId
     * @param withChildren
     * @param name 名称（模糊查询）
     * @return
     */
    List<ProductTypeVo> listByParentId(Integer parentId, Boolean withChildren, String name);

    /**
     * 新增产品类型
     * @param entity 产品类型实体
     * @return 是否新增成功
     */
    boolean add(ProductType entity);

    /**
     * 更新产品类型状态
     * @param status 状态, 1启用 2禁用
     * @param id 产品类型id
     * @return 是否更新成功
     */
    Boolean updateStatusById(Integer status, Integer id);

    /**
     * 判断产品类型是否存在
     * @param productTypeId 产品类型id
     * @return 是否存在
     */
    boolean existsById(Integer productTypeId);

    /**
     * 分页查询产品类型
     * @param query 分页查询条件
     * @return 产品类型分页结果
     */
    PageResult<ProductType> pageByQuery(PageQuery query);

    /**
     * 判断父级下是否存在子级
     * @param parentId 父级id
     * @return 是否存在
     */
    boolean existsByParentId(Integer parentId);
}
