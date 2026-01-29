package com.example.order.mapper;

import com.example.order.entity.OrderEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 订单数据访问层（MyBatis Mapper）
 */
@Mapper
public interface OrderMapper {

    OrderEntity findById(Long id);

    List<OrderEntity> findAll();

    List<OrderEntity> findByUserId(Long userId);

    List<OrderEntity> findByStatus(String status);

    List<OrderEntity> findByUserIdAndStatus(Long userId, String status);

    boolean existsById(Long id);

    int insert(OrderEntity order);

    int update(OrderEntity order);

    int deleteById(Long id);
}
