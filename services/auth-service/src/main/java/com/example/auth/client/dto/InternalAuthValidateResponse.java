package com.example.auth.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 内部 API 响应：校验用户成功（userId、email、name、roles） */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalAuthValidateResponse {
    private Long userId;
    private String email;
    private String name;
    private List<String> roles;
}
