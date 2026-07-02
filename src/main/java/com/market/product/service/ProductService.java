package com.market.product.service;

import com.market.common.exception.ResourceNotFoundException;
import com.market.product.domain.Product;
import com.market.product.dto.ProductRequest;
import com.market.product.dto.ProductResponse;
import com.market.product.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product(request.name(), request.price(), request.description());
        return ProductResponse.from(productRepository.save(product));
    }

    public ProductResponse get(Long productId) {
        return ProductResponse.from(findProduct(productId));
    }

    public List<ProductResponse> getAll() {
        return productRepository.findAll()
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional
    public ProductResponse update(Long productId, ProductRequest request) {
        Product product = findProduct(productId);
        product.update(request.name(), request.price(), request.description());
        return ProductResponse.from(product);
    }

    @Transactional
    public void delete(Long productId) {
        Product product = findProduct(productId);
        productRepository.delete(product);
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found. id=" + productId));
    }
}
