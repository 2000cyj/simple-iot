package com.github.dingdaoyi.core.base;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 分页数据。
 *
 * <p>纯分页载荷，只承载分页业务数据（列表 + 总数 + 页码 + 页大小），
 * 不再自带 code/msg 信封字段。对外 HTTP 响应统一由 {@link BaseResult} 包裹，
 * 即 {@code BaseResult<PageResult<T>>}，保证同一接口成功/失败的响应信封一致。</p>
 *
 * @author dingyunwei
 */
@Data
@Schema(description = "分页数据")
public class PageResult<T> {

    @Schema(description = "数据列表")
    private List<T> records;

    @Schema(description = "总记录数")
    private Long total;

    @Schema(description = "当前页码")
    private Long current;

    @Schema(description = "每页大小")
    private Long size;

    public PageResult() {
    }

    public PageResult(List<T> records, Long total, Long current, Long size) {
        this.records = records;
        this.total = total;
        this.current = current;
        this.size = size;
    }

    public static <T> PageResult<T> of(List<T> records, Long total, Long current, Long size) {
        return new PageResult<>(records, total, current, size);
    }
}
