package com.example.api.common;

import lombok.Getter;

/**
 * 统一错误码枚举
 * 定义系统中所有的错误码和对应的消息
 * 遵循 OAuth 2.0 错误码规范（401xx 认证、400xx 验证、429xx 限流）
 */
@Getter
public enum ResultCode {

    // ========== 成功 ==========
    SUCCESS(0, "操作成功"),

    // ========== 客户端错误 4xxxx ==========
    BAD_REQUEST(40000, "请求参数错误"),
    /** 参数校验失败（@Valid、约束违反等） */
    VALIDATION_ERROR(40004, "参数校验失败"),
    /** 未授权，请先登录（缺少或无效的认证信息） */
    UNAUTHORIZED(40108, "未授权，请先登录"),
    FORBIDDEN(40300, "无权限访问"),
    NOT_FOUND(40400, "资源不存在"),
    METHOD_NOT_ALLOWED(40500, "请求方法不允许"),

    // ==================== 认证错误（401xx）====================
    /**
     * 邮箱或密码错误
     * 不明确提示是邮箱还是密码错误，防止用户枚举攻击
     */
    INVALID_CREDENTIALS(40100, "邮箱或密码错误"),
    /** 邮箱不存在 */
    EMAIL_NOT_FOUND(40101, "邮箱不存在"),
    /** 密码错误 */
    PASSWORD_ERROR(40102, "密码错误"),
    /** Token 已过期 */
    TOKEN_EXPIRED(40103, "Token 已过期"),
    /** 无效的 Token */
    TOKEN_INVALID(40104, "无效的 Token"),
    /** 无效的 Refresh Token */
    REFRESH_TOKEN_INVALID(40105, "无效的 Refresh Token"),
    /**
     * 检测到 Token 重用，请重新登录
     * Token 轮换安全检测，参考 Auth0 Refresh Token Rotation
     */
    REFRESH_TOKEN_REUSED(40106, "检测到 Token 重用，请重新登录"),
    /** 账户已被锁定，请稍后再试（登录失败次数过多） */
    ACCOUNT_LOCKED(40107, "账户已被锁定，请稍后再试"),
    /** 邮箱未验证，请先完成邮箱验证 */
    EMAIL_NOT_VERIFIED(40109, "请先完成邮箱验证"),
    /**
     * 重置链接无效或已过期
     * 错误消息一致性：无效与过期均返回此码，不区分泄露信息
     */
    PASSWORD_RESET_TOKEN_INVALID(40110, "重置链接无效或已过期"),

    // ==================== 验证错误（400xx）====================
    /** 邮箱已被注册 */
    EMAIL_ALREADY_EXISTS(40001, "邮箱已被注册"),
    /** 密码强度不足 */
    PASSWORD_TOO_WEAK(40002, "密码强度不足"),
    /**
     * 密码不符合策略要求
     * 符合 NIST 和 OWASP 密码策略建议
     */
    PASSWORD_POLICY_VIOLATION(40003, "密码不符合策略要求"),
    /** 不支持的语言代码 */
    INVALID_LOCALE(40005, "不支持的语言"),

    // ==================== 限流错误（429xx）====================
    /** 请求过于频繁，请稍后再试（参考 GitHub、Stripe 的限流错误处理） */
    RATE_LIMIT_EXCEEDED(42901, "请求过于频繁，请稍后再试"),

    // ========== 业务错误 5xxxx ==========
    USER_NOT_FOUND(50001, "用户不存在"),
    USER_ALREADY_EXISTS(50002, "用户已存在"),
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
