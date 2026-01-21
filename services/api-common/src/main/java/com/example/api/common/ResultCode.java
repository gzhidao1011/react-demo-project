package com.example.api.common;

import lombok.Getter;

/**
 * 统一错误码枚举
 * 定义系统中所有的错误码和对应的消息
 */
@Getter
public enum ResultCode {

    // ========== 成功 ==========
    SUCCESS(0, "操作成功"),

    // ========== 客户端错误 4xxxx ==========
    BAD_REQUEST(40000, "请求参数错误"),
    VALIDATION_ERROR(40001, "参数校验失败"),
    UNAUTHORIZED(40100, "未授权，请先登录"),
    FORBIDDEN(40300, "无权限访问"),
    NOT_FOUND(40400, "资源不存在"),
    METHOD_NOT_ALLOWED(40500, "请求方法不允许"),

    // ========== 业务错误 5xxxx ==========
    USER_NOT_FOUND(50001, "用户不存在"),
    USER_ALREADY_EXISTS(50002, "用户已存在"),
    EMAIL_ALREADY_EXISTS(50003, "邮箱已存在"),
    ORDER_NOT_FOUND(50010, "订单不存在"),
    ORDER_STATUS_ERROR(50011, "订单状态错误"),

    // ========== 服务端错误 9xxxx ==========
    INTERNAL_ERROR(90000, "服务器内部错误"),
    SERVICE_UNAVAILABLE(90001, "服务不可用"),
    REMOTE_SERVICE_ERROR(90002, "远程服务调用失败");

    /**
     * 错误码
     */
    private final int code;

    /**
     * 错误消息
     */
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
