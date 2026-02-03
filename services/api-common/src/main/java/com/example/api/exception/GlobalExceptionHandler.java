package com.example.api.exception;

import com.example.api.common.FieldError;
import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * 统一处理所有 Controller 层抛出的异常，返回标准格式的响应
 * 
 * 设计原则：
 * 1. 按语义返回 HTTP 状态码（符合 RESTful 规范）
 * 2. 结构化错误信息（便于前端处理）
 * 3. 包含 traceId（便于链路追踪）
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ==================== 业务异常 ====================

    /**
     * 处理业务异常
     * 根据错误码类型返回对应的 HTTP 状态码（限流返回 429，其他返回 400）
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("业务异常: URI={}, Code={}, Message={}", request.getRequestURI(), e.getCode(), e.getMessage());
        HttpStatus status = e.getCode() == ResultCode.RATE_LIMIT_EXCEEDED.getCode()
                ? HttpStatus.TOO_MANY_REQUESTS
                : e.getCode() == ResultCode.UNAUTHORIZED.getCode()
                        ? HttpStatus.UNAUTHORIZED
                        : (e.getCode() == ResultCode.USER_NOT_FOUND.getCode() || e.getCode() == ResultCode.NOT_FOUND.getCode())
                        ? HttpStatus.NOT_FOUND
                        : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Result.error(e.getCode(), e.getMessage()));
    }

    // ==================== 参数校验异常 ====================

    /**
     * 处理参数校验异常（@RequestBody 参数校验）
     * 返回结构化的字段错误列表
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        List<FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new FieldError(
                        fieldError.getField(),
                        fieldError.getDefaultMessage(),
                        fieldError.getCode()
                ))
                .collect(Collectors.toList());
        
        log.warn("参数校验失败: URI={}, Errors={}", request.getRequestURI(), errors);
        return Result.validationError("参数校验失败", errors);
    }

    /**
     * 处理参数绑定异常（@ModelAttribute 参数校验）
     * 返回结构化的字段错误列表
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException e, HttpServletRequest request) {
        List<FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new FieldError(
                        fieldError.getField(),
                        fieldError.getDefaultMessage(),
                        fieldError.getCode()
                ))
                .collect(Collectors.toList());
        
        log.warn("参数绑定失败: URI={}, Errors={}", request.getRequestURI(), errors);
        return Result.validationError("参数绑定失败", errors);
    }

    /**
     * 处理约束违反异常（@RequestParam、@PathVariable 参数校验）
     * 返回结构化的字段错误列表
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleConstraintViolationException(ConstraintViolationException e, HttpServletRequest request) {
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        List<FieldError> errors = violations.stream()
                .map(violation -> {
                    // 从属性路径中提取字段名
                    String field = violation.getPropertyPath().toString();
                    if (field.contains(".")) {
                        field = field.substring(field.lastIndexOf('.') + 1);
                    }
                    return new FieldError(field, violation.getMessage());
                })
                .collect(Collectors.toList());
        
        log.warn("约束违反: URI={}, Errors={}", request.getRequestURI(), errors);
        return Result.validationError("参数校验失败", errors);
    }

    // ==================== 请求参数异常 ====================

    /**
     * 处理缺少请求参数异常
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingServletRequestParameterException(MissingServletRequestParameterException e, HttpServletRequest request) {
        List<FieldError> errors = List.of(new FieldError(e.getParameterName(), "参数不能为空", "required"));
        log.warn("缺少请求参数: URI={}, Parameter={}", request.getRequestURI(), e.getParameterName());
        return Result.validationError("缺少必需的请求参数", errors);
    }

    /**
     * 处理参数类型不匹配异常
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        String expectedType = e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "未知类型";
        List<FieldError> errors = List.of(new FieldError(e.getName(), "类型应为 " + expectedType, "typeMismatch"));
        log.warn("参数类型错误: URI={}, Parameter={}, ExpectedType={}", request.getRequestURI(), e.getName(), expectedType);
        return Result.validationError("参数类型错误", errors);
    }

    /**
     * 处理请求体解析异常
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleHttpMessageNotReadableException(HttpMessageNotReadableException e, HttpServletRequest request) {
        log.warn("请求体解析失败: URI={}, Message={}", request.getRequestURI(), e.getMessage());
        return Result.error(ResultCode.BAD_REQUEST, "请求体格式错误，请检查 JSON 格式");
    }

    // ==================== HTTP 方法和路由异常 ====================

    /**
     * 处理 Content-Type 不支持异常（如缺少 Content-Type 头）
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    @ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    public Result<Void> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
        log.warn("媒体类型不支持: URI={}, Message={}", request.getRequestURI(), e.getMessage());
        return Result.error(ResultCode.BAD_REQUEST, "不支持的 Content-Type，请使用 application/json");
    }

    /**
     * 处理请求方法不支持异常
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        log.warn("请求方法不支持: URI={}, Method={}", request.getRequestURI(), e.getMethod());
        return Result.error(ResultCode.METHOD_NOT_ALLOWED, "不支持的请求方法: " + e.getMethod());
    }

    /**
     * 处理 ResponseStatusException（403、404 等）
     * 保留原始 HTTP 状态码，返回统一 Result 格式
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Result<Void>> handleResponseStatusException(ResponseStatusException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        log.warn("响应状态异常: URI={}, Status={}, Reason={}", request.getRequestURI(), status, e.getReason());
        ResultCode code = status == HttpStatus.NOT_FOUND ? ResultCode.NOT_FOUND
                : status == HttpStatus.FORBIDDEN ? ResultCode.FORBIDDEN
                : ResultCode.BAD_REQUEST;
        Result<Void> body = Result.error(code, e.getReason() != null ? e.getReason() : code.getMessage());
        return ResponseEntity.status(status).body(body);
    }

    /**
     * 处理资源不存在异常
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNoHandlerFoundException(NoHandlerFoundException e, HttpServletRequest request) {
        log.warn("资源不存在: URI={}", request.getRequestURI());
        return Result.error(ResultCode.NOT_FOUND, "请求的资源不存在: " + request.getRequestURI());
    }

    // ==================== 系统异常 ====================

    /**
     * 处理所有未捕获的异常。
     * Spring Security 的 AccessDeniedException 通过类名判断并返回 403，避免 api-common 强依赖 spring-security（order-service 等无 Security 的服务可正常加载本类）。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception e, HttpServletRequest request) {
        if ("org.springframework.security.access.AccessDeniedException".equals(e.getClass().getName())) {
            log.warn("无权限访问: URI={}, Message={}", request.getRequestURI(), e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Result.error(ResultCode.FORBIDDEN, ResultCode.FORBIDDEN.getMessage()));
        }
        log.error("服务器内部错误: URI={}, Message={}", request.getRequestURI(), e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Result.error(ResultCode.INTERNAL_ERROR, "服务器内部错误，请稍后重试"));
    }
}
