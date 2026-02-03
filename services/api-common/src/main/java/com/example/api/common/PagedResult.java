package com.example.api.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 分页结果封装（与设计文档 1.2 一致）
 * 列表接口统一采用包裹式：{ "data": { "items": [...], "total": 100, "page": 1, "size": 20 } }
 *
 * @param <T> 列表元素类型
 */
@Data
public class PagedResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<T> items;
    private long total;
    private int page;
    private int size;

    public PagedResult() {
    }

    public PagedResult(List<T> items, long total, int page, int size) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    public static <T> PagedResult<T> of(List<T> items, long total, int page, int size) {
        return new PagedResult<>(items, total, page, size);
    }
}
