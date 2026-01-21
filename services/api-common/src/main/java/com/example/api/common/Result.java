package com.example.api.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

/**
 * 统一响应结果封装
 * 所有 API 接口都应返回此格式的响应
 * 
 * 设计参考：GitHub API、Google APIs、Stripe API 等国际主流 API 规范
 *
 * @param <T> 响应数据类型
 */
@Data
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 响应码
     * 0 表示成功，非 0 表示失败
     */
    private int code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 时间戳（毫秒）
     */
    private long timestamp;

    /**
     * 链路追踪 ID
     * 用于分布式链路追踪，便于问题定位
     */
    private String traceId;

    /**
     * 字段校验错误列表
     * 仅在参数校验失败时返回，包含每个字段的具体错误信息
     */
    private List<FieldError> errors;

    public Result() {
        this.timestamp = System.currentTimeMillis();
        this.traceId = generateTraceId();
    }

    public Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
        this.traceId = generateTraceId();
    }

    public Result(int code, String message, T data, List<FieldError> errors) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = System.currentTimeMillis();
        this.traceId = generateTraceId();
    }

    /**
     * 生成链路追踪 ID
     * 优先从 MDC 获取（如果已集成链路追踪系统），否则生成 UUID
     */
    private static String generateTraceId() {
        // 尝试从 SLF4J MDC 获取 traceId（SkyWalking/Sleuth 会自动注入）
        String traceId = org.slf4j.MDC.get("traceId");
        if (traceId == null || traceId.isEmpty()) {
            // 如果没有链路追踪系统，生成简化的 UUID
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        return traceId;
    }

    /**
     * 设置 traceId（允许外部覆盖）
     */
    public Result<T> traceId(String traceId) {
        this.traceId = traceId;
        return this;
    }

    // ==================== 成功响应 ====================

    /**
     * 成功响应（无数据）
     */
    public static <T> Result<T> success() {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), null);
    }

    /**
     * 成功响应（带数据）
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    /**
     * 成功响应（自定义消息 + 数据）
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
    }

    // ==================== 失败响应 ====================

    /**
     * 失败响应（使用错误码枚举）
     */
    public static <T> Result<T> error(ResultCode resultCode) {
        return new Result<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    /**
     * 失败响应（使用错误码枚举 + 自定义消息）
     */
    public static <T> Result<T> error(ResultCode resultCode, String message) {
        return new Result<>(resultCode.getCode(), message, null);
    }

    /**
     * 失败响应（自定义错误码和消息）
     */
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }

    /**
     * 参数校验失败响应（带结构化错误列表）
     */
    public static <T> Result<T> validationError(List<FieldError> errors) {
        return new Result<>(ResultCode.VALIDATION_ERROR.getCode(), ResultCode.VALIDATION_ERROR.getMessage(), null, errors);
    }

    /**
     * 参数校验失败响应（带自定义消息和结构化错误列表）
     */
    public static <T> Result<T> validationError(String message, List<FieldError> errors) {
        return new Result<>(ResultCode.VALIDATION_ERROR.getCode(), message, null, errors);
    }

    // ==================== 辅助方法 ====================

    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return this.code == ResultCode.SUCCESS.getCode();
    }
}
