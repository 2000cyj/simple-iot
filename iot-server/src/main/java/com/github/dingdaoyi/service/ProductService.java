package com.github.dingdaoyi.service;

import com.github.dingdaoyi.core.base.PageResult;
import com.github.dingdaoyi.entity.Product;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.dingdaoyi.model.query.ProductPageQuery;
import com.github.dingdaoyi.model.vo.ProductPageVo;
import com.github.dingdaoyi.model.vo.ProductVo;

import java.util.List;
import java.util.Optional;

/**
 * 产品服务接口
 *
 * @author dingyunwei
 */
public interface ProductService extends IService<Product>{


    /**
     * 根据产品类型和厂家查询
     * @param productTypeId
     * @param manufacturer
     * @return
     */
    List<Product> listByType(Integer productTypeId, String manufacturer);

    /**
     * 新增产品
     * @param entity 产品实体
     * @return 是否新增成功
     */
    Boolean add(Product entity);

    /**
     * 查询是否已经存在
     * @param model 产品型号
     * @param manufacturer 厂家
     * @param productTypeId 产品类型id
     * @return 是否存在
     */
    boolean existsUnique( String model,  String manufacturer, Integer productTypeId);

    /**
     * 产品详情
     * @param productId 产品id
     * @return 产品详情
     */
    Optional<ProductVo> details(Integer productId);

    /**
     * 判断产品是否存在
     * @param productId 产品id
     * @return 是否存在
     */
    boolean existsById(Integer productId);

    /**
     * 按产品key查询
     * @param productKey 产品key
     * @return 产品实体
     */
    Optional<Product> getByProductKey(String productKey);

    /**
     * 分页查询
     * @param pageQuery
     * @return
     */
    PageResult<ProductPageVo> pageByQuery(ProductPageQuery pageQuery);

    /**
     * 判断协议下是否已绑定产品
     * @param protocolId 协议id
     * @return 是否存在
     */
    boolean existsByProtocol(Integer protocolId);

    /**
     * 查询产品类型与型号
     * @param id 产品id
     * @return 产品类型名称-产品型号
     */
    String getTypeModel(Integer id);
}
