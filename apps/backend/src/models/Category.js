import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
}, {
  timestamps: true
});

// Instance method to generate SEO-friendly URL
categorySchema.methods.getUrl = function() {
  return `/categories/${this.slug}`;
};

// Static method to generate unique slug from name
categorySchema.statics.generateSlug = async function(name, excludeId = null) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await this.findOne(query);
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Static method to check for circular dependencies
categorySchema.statics.checkCircularDependency = async function(categoryId, parentId) {
  if (!parentId || categoryId.toString() === parentId.toString()) {
    return categoryId.toString() === parentId.toString();
  }

  let currentParentId = parentId;
  const visited = new Set();

  while (currentParentId) {
    if (visited.has(currentParentId.toString())) {
      return true; // Circular dependency detected
    }
    
    if (currentParentId.toString() === categoryId.toString()) {
      return true; // Would create circular dependency
    }

    visited.add(currentParentId.toString());
    
    const parent = await this.findById(currentParentId).select('parentId');
    if (!parent) break;
    
    currentParentId = parent.parentId;
  }

  return false;
};

// Static method to get children categories
categorySchema.statics.getChildren = async function(parentId) {
  return this.find({ parentId }).sort({ name: 1 });
};

// Static method to count products in category
categorySchema.statics.getProductCount = async function(categoryId) {
  const Product = mongoose.model('Product');
  return Product.countDocuments({ category: categoryId });
};

export default mongoose.model('Category', categorySchema);