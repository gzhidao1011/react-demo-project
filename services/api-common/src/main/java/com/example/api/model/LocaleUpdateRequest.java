package com.example.api.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.io.Serializable;

/**
 * 更新用户 Locale 请求
 * 用于 PATCH /api/user/locale
 *
 * @see com.example.user.controller.LocaleController
 */
@Data
public class LocaleUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 语言代码，支持 zh、en、ja、ko 等 BCP 47 语言标签
     */
    @NotBlank(message = "locale 不能为空")
    @Pattern(regexp = "^[a-z]{2}(-[A-Za-z]{2,4})?$", message = "locale 格式不正确")
    private String locale;
}
