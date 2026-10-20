package com.ivanta.category;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.ProductDtos.CategoryUpsert;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryAdminService {

    private final CategoryRepository categories;
    private final IdService ids;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public List<Category> list() {
        return categories.findAll(org.springframework.data.domain.Sort.by("sortOrder").ascending());
    }

    @Transactional
    public Category create(CategoryUpsert req) {
        if (categories.findByNameIgnoreCase(req.name()).isPresent())
            throw new BusinessException(ErrorCode.CONFLICT, "Category already exists");
        Category c = new Category();
        c.setId(ids.next("categories", "CAT", 4));
        c.setName(req.name().trim());
        c.setSlug(req.name().trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""));
        c.setParentId(req.parentId());
        c.setDescription(req.description());
        c.setImageKey(req.imageKey());
        if (req.sortOrder() != null) c.setSortOrder(req.sortOrder());
        categories.save(c);
        audit.record("CATEGORY_CREATED", "category", c.getId(), null, c.getName());
        return c;
    }

    @Transactional
    public Category update(String id, CategoryUpsert req) {
        Category c = categories.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Category not found"));
        String before = c.getName() + " active=" + c.getIsActive();
        if (req.name() != null) c.setName(req.name().trim());
        if (req.parentId() != null) c.setParentId(req.parentId().isBlank() ? null : req.parentId());
        if (req.description() != null) c.setDescription(req.description());
        if (req.imageKey() != null) c.setImageKey(req.imageKey());
        if (req.sortOrder() != null) c.setSortOrder(req.sortOrder());
        categories.save(c);
        audit.record("CATEGORY_UPDATED", "category", id, before, c.getName());
        return c;
    }

    @Transactional
    public void deactivate(String id) {
        Category c = categories.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Category not found"));
        c.setIsActive(false);
        categories.save(c);
        audit.record("CATEGORY_UPDATED", "category", id, "active=true", "active=false");
    }
}
