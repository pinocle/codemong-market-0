package com.market.product.controller;

import com.market.product.dto.ProductRequest;
import com.market.product.dto.ProductResponse;
import com.market.product.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @GetMapping("/{productId}")
    public ProductResponse get(@PathVariable Long productId) {
        return productService.get(productId);
    }

    @GetMapping
    public List<ProductResponse> getAll() {
        return productService.getAll();
    }

    @PutMapping("/{productId}")
    public ProductResponse update(
            @PathVariable Long productId,
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.update(productId, request);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long productId) {
        productService.delete(productId);
    }
}
