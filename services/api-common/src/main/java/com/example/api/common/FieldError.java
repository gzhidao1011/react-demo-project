package com.example.api.common;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 字段校验错误详情
 * 用于结构化返回参数校验错误信息
 */
@Data
@NoArgsConstructor
public class FieldError implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 错误字段名
     */
    private String field;

    /**
     * 错误消息
     */
    private String message;

    /**
     * 错误码（可选，用于前端国际化）
     */
    private String code;

    /**
     * 构造方法（不含错误码）
     */
    public FieldError(String field, String message) {
        this.field = field;
        this.message = message;
    }

    /**
     * 构造方法（含错误码）
     */
    public FieldError(String field, String message, String code) {
        this.field = field;
        this.message = message;
        this.code = code;
    }
}
