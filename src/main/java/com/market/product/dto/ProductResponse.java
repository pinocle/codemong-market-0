package com.market.product.dto;

import com.market.product.domain.Product;

public record ProductResponse(
        Long id,
        String name,
        Integer price,
        String description
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getDescription()
        );
    }
}
