package com.github.dingdaoyi.model.vo;

import com.github.dingdaoyi.entity.Product;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 产品分页 VO
 *
 * @author dingyunwei
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class ProductPageVo extends Product {

    /**
     * 产品类型名称
     */
    private String productTypeName;
}
