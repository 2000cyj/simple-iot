package com.github.dingdaoyi.model.vo;

import com.github.dingdaoyi.entity.ProductType;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 产品类型 VO
 *
 * @author dingyunwei
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class ProductTypeVo extends ProductType {
    /**
     * 是否存在子类
     */
    private List<ProductTypeVo> children;
}
