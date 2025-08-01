# Product Overview

This is a React Native grocery list management app that helps users create shopping lists, manage products, track prices, and organize stores. The app provides a complete solution for grocery shopping with features like:

- User authentication and account management
- Creating and managing shopping lists with items
- Product catalog with generic and specific product hierarchy
- Store management and location tracking
- Price history tracking and comparison across stores
- Intuitive mobile-first interface

The app targets mobile users who want to organize their grocery shopping, compare prices across different stores, and maintain a personal product database for efficient shopping experiences.

Built with modern React Native stack using Expo for cross-platform deployment and Supabase as the backend service for authentication, database, and real-time features.

## Product Hierarchy Concept

### Generic Products
Generic products serve as **quick list filling tools** for users. They represent general product categories like "Rice", "Milk", "Bread" without specific brand or detailed information. The main purpose is to allow users to rapidly populate their shopping lists with common items.

Key characteristics:
- Simple name and category
- No brand, price, or detailed specifications
- Used for fast list creation
- Can be replaced by specific products later

### Specific Products
Specific products contain detailed information including brand, barcode, price history, and other specifications. They represent actual products that users can purchase in stores.

Key characteristics:
- Linked to a generic product (many-to-one relationship)
- Contains brand, barcode, price history
- Used for detailed product management
- Created through scanning or manual entry

### Workflow
1. **Quick List Creation**: Users add generic products to lists for rapid planning
2. **Product Substitution**: While editing the list, users can replace generic products with specific ones
3. **Detailed Management**: Specific products allow price tracking, barcode scanning, and detailed information

This two-tier system provides both speed (generic) and precision (specific) depending on the user's needs at different stages of their shopping process.