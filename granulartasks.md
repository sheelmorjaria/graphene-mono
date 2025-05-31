Epic: Product Browse & Search
Story 1.1: View Product List (Customer)
Story: As a customer, I want to view a list of available products so that I can browse offerings.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Products" or "Shop" page is available to all users without authentication. 
    2. The page displays a paginated list of all active products. 
    3. For each product, the following information is displayed: Product Name, Main Image, Price, Short Description, and a "View Details" button/link. 
    4. Products are sorted by creation date (newest first) by default, with options to sort by price (low to high, high to low) and name (A-Z, Z-A). 
    5. The page provides categories or filters (e.g., by category, price range) to narrow down the product list. 
    6. The product list is responsive and displays correctly on various devices. 

Granular Tasks & Subtasks for Story 1.1:
Here's the detailed breakdown of tasks, ready for development:
    • Frontend Tasks:
        ◦ Task 1.1.1: Develop Product List Page UI (Base Layout) 
            ▪ Subtask 1.1.1.1: Create ProductListPage component/route. 
            ▪ Subtask 1.1.1.2: Implement responsive grid/flex layout for product cards. 
            ▪ Subtask 1.1.1.3: Design ProductCard component to display Name, Image, Price, Short Description. 
            ▪ Subtask 1.1.1.4: Add "View Details" button/link to each product card. 
        ◦ Task 1.1.2: Implement Pagination UI 
            ▪ Subtask 1.1.2.1: Create Pagination component. 
            ▪ Subtask 1.1.2.2: Integrate pagination controls (next/prev, page numbers) with product list. 
        ◦ Task 1.1.3: Implement Sorting Controls UI 
            ▪ Subtask 1.1.3.1: Create SortOptions dropdown/buttons. 
            ▪ Subtask 1.1.3.2: Add options for "Newest First", "Price: Low to High", "Price: High to Low", "Name: A-Z", "Name: Z-A". 
        ◦ Task 1.1.4: Implement Filtering UI 
            ▪ Subtask 1.1.4.1: Create FilterSidebar or FilterPanel component. 
            ▪ Subtask 1.1.4.2: Implement category filter (checkboxes/links). 
            ▪ Subtask 1.1.4.3: Implement price range filter (sliders/input fields). 
        ◦ Task 1.1.5: Frontend API Integration for Product List 
            ▪ Subtask 1.1.5.1: Create service/hook to fetch products from GET /api/products. 
            ▪ Subtask 1.1.5.2: Pass pagination parameters (page, limit). 
            ▪ Subtask 1.1.5.3: Pass sorting parameters (sortBy, sortOrder). 
            ▪ Subtask 1.1.5.4: Pass filtering parameters (category, minPrice, maxPrice). 
            ▪ Subtask 1.1.5.5: Handle loading states and display errors gracefully. 
        ◦ Task 1.1.6: Dynamic Content Rendering 
            ▪ Subtask 1.1.6.1: Map fetched product data to ProductCard components. 
            ▪ Subtask 1.1.6.2: Update product list dynamically when sorting/filtering/pagination changes. 
    • Backend Tasks:
        ◦ Task 1.1.7: Create Product Listing API Endpoint 
            ▪ Subtask 1.1.7.1: Design and implement GET /api/products endpoint. 
            ▪ Subtask 1.1.7.2: Implement logic to query Product collection in MongoDB. 
            ▪ Subtask 1.1.7.3: Implement pagination logic (skip/limit) on MongoDB query. 
            ▪ Subtask 1.1.7.4: Implement sorting logic based on query parameters (createdAt, price, name). 
            ▪ Subtask 1.1.7.5: Implement filtering logic for category, minPrice, maxPrice. 
            ▪ Subtask 1.1.7.6: Ensure only "active" (or published) products are returned. 
            ▪ Subtask 1.1.7.7: Return necessary product fields (name, image, price, short description, ID) and pagination metadata (total count, current page, total pages). 
        ◦ Task 1.1.8: Implement Product Catalog Data Model 
            ▪ Subtask 1.1.8.1: Define MongoDB schema for Product collection (Name, Description, Price, Image URLs, Category ID, isActive, createdAt, etc.). 
            ▪ Subtask 1.1.8.2: Define MongoDB schema for Category collection (Name, Slug, etc.). 
            ▪ Subtask 1.1.8.3: Seed initial 30 product data records and basic categories. 
        ◦ Task 1.1.9: Error Handling & Validation (Backend) 
            ▪ Subtask 1.1.9.1: Implement input validation for all query parameters (pagination, sorting, filtering). 
            ▪ Subtask 1.1.9.2: Implement robust error handling for database queries and API responses. 
    • Testing Tasks:
        ◦ Task 1.1.10: Write Unit Tests 
            ▪ Subtask 1.1.10.1: Unit tests for frontend components (ProductCard, Pagination, etc.). 
            ▪ Subtask 1.1.10.2: Unit tests for backend utility functions (e.g., query builders). 
        ◦ Task 1.1.11: Write Integration Tests 
            ▪ Subtask 1.1.11.1: Test GET /api/products endpoint with various parameters (pagination, sort, filter, invalid inputs). 
            ▪ Subtask 1.1.11.2: Test data retrieval from MongoDB. 
        ◦ Task 1.1.12: Manual End-to-End Testing 
            ▪ Subtask 1.1.12.1: Verify product list displays correctly. 
            ▪ Subtask 1.1.12.2: Test pagination functionality. 
            ▪ Subtask 1.1.12.3: Test sorting options. 
            ▪ Subtask 1.1.12.4: Test category and price range filters. 
            ▪ Subtask 1.1.12.5: Verify responsiveness on different devices. 

Epic: Product Browse & Search
Story 1.2: View Product Details (Customer)
Story: As a customer, I want to view detailed information about a specific product so that I can make an informed purchasing decision.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. Clicking on a product from the list (Story 1.1) navigates the customer to a dedicated "Product Details" page for that product. 
    2. The URL for the product details page is SEO-friendly (e.g., /products/product-name-slug). 
    3. The page displays comprehensive information for the product, including: 
        ◦ Full Product Name 
        ◦ Multiple Product Images (gallery/carousel) 
        ◦ Detailed Description 
        ◦ Price 
        ◦ Availability/Stock Status (e.g., "In Stock", "Low Stock", "Out of Stock") 
        ◦ "Add to Cart" button. 
        ◦ Any relevant product attributes/specifications (e.g., color, size, material, technical specs). 
    4. If the product is out of stock, the "Add to Cart" button is disabled or replaced with an appropriate message. 
    5. The page is responsive and displays correctly on various devices. 
    6. (Implicit from later Epics): Includes a section for customer reviews and ratings (addressed in Epic 15). 

Granular Tasks & Subtasks for Story 1.2:
    • Frontend Tasks:
        ◦ Task 1.2.1: Develop Product Details Page UI Layout 
            ▪ Subtask 1.2.1.1: Create ProductDetailsPage component/route. 
            ▪ Subtask 1.2.1.2: Implement main layout for product information sections. 
            ▪ Subtask 1.2.1.3: Design ImageGallery component for multiple product images (carousel functionality). 
            ▪ Subtask 1.2.1.4: Create AddToCartButton component. 
        ◦ Task 1.2.2: Implement Dynamic Content Display 
            ▪ Subtask 1.2.2.1: Display Full Product Name, Price, Detailed Description. 
            ▪ Subtask 1.2.2.2: Display Availability/Stock Status (e.g., "In Stock", "Out of Stock"). 
            ▪ Subtask 1.2.2.3: Conditionally enable/disable "Add to Cart" button based on stock status. 
            ▪ Subtask 1.2.2.4: Render additional product attributes/specifications dynamically. 
        ◦ Task 1.2.3: Implement SEO-Friendly URL Routing 
            ▪ Subtask 1.2.3.1: Configure client-side router to handle /products/:slug routes. 
            ▪ Subtask 1.2.3.2: Implement logic to extract product slug from URL. 
        ◦ Task 1.2.4: Frontend API Integration for Product Details 
            ▪ Subtask 1.2.4.1: Create service/hook to fetch single product by slug from GET /api/products/:slug. 
            ▪ Subtask 1.2.4.2: Handle loading states and display errors gracefully (e.g., "Product Not Found"). 
        ◦ Task 1.2.5: Ensure Responsiveness 
            ▪ Subtask 1.2.5.1: Apply responsive CSS to ensure optimal display on various devices. 
    • Backend Tasks:
        ◦ Task 1.2.6: Create Product Details API Endpoint 
            ▪ Subtask 1.2.6.1: Design and implement GET /api/products/:slug endpoint. 
            ▪ Subtask 1.2.6.2: Implement logic to query Product collection by slug. 
            ▪ Subtask 1.2.6.3: Ensure only active products are returned. 
            ▪ Subtask 1.2.6.4: Return all necessary product fields (full name, multiple image URLs, detailed description, price, stock quantity, attributes). 
        ◦ Task 1.2.7: Update Product Data Model for Details 
            ▪ Subtask 1.2.7.1: Add fields to Product schema for: images (array of URLs), longDescription, stockQuantity, attributes (e.g., array of objects {name: "Color", value: "Red"}). 
            ▪ Subtask 1.2.7.2: Ensure existing slug field is correctly populated. 
            ▪ Subtask 1.2.7.3: Update seed data for initial 30 products to include these new detailed fields. 
        ◦ Task 1.2.8: Error Handling & Validation (Backend) 
            ▪ Subtask 1.2.8.1: Implement validation for slug parameter. 
            ▪ Subtask 1.2.8.2: Handle "product not found" scenarios gracefully (e.g., HTTP 404). 
    • Testing Tasks:
        ◦ Task 1.2.9: Write Unit Tests 
            ▪ Subtask 1.2.9.1: Unit tests for frontend components (ImageGallery, AddToCartButton). 
            ▪ Subtask 1.2.9.2: Unit tests for backend data retrieval by slug. 
        ◦ Task 1.2.10: Write Integration Tests 
            ▪ Subtask 1.2.10.1: Test GET /api/products/:slug endpoint with valid and invalid slugs. 
            ▪ Subtask 1.2.10.2: Verify correct product data is returned. 
        ◦ Task 1.2.11: Manual End-to-End Testing 
            ▪ Subtask 1.2.11.1: Verify navigation from product list to details page. 
            ▪ Subtask 1.2.11.2: Check all product details (images, description, price, stock) are correctly displayed. 
            ▪ Subtask 1.2.11.3: Test "Add to Cart" button behavior for in-stock and out-of-stock items. 
            ▪ Subtask 1.2.11.4: Verify URL slug correctness. 
            ▪ Subtask 1.2.11.5: Verify responsiveness on different devices.

Epic: Product Browse & Search
Story 1.3: Search Products (Customer)
Story: As a customer, I want to search for products using keywords so that I can quickly find specific items.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A prominent search bar is available on the header of all customer-facing pages. 
    2. Customers can type keywords into the search bar. 
    3. Pressing Enter or clicking a "Search" button initiates a search. 
    4. Search results are displayed on a dedicated "Search Results" page, similar in layout to the "Product List" page (Story 1.1), showing relevant products that match the keywords. 
    5. Search results are paginated, sortable, and filterable (by category, price range) just like the main product list. 
    6. Search should be case-insensitive. 
    7. Partial keyword matches should return results. 
    8. The search results page displays the search query (e.g., "Showing results for 'shoes'"). 
    9. The search functionality is responsive. 

Granular Tasks & Subtasks for Story 1.3:
    • Frontend Tasks:
        ◦ Task 1.3.1: Implement Global Search Bar UI 
            ▪ Subtask 1.3.1.1: Design and implement search input field and search button in the global header component. 
            ▪ Subtask 1.3.1.2: Ensure search bar is present on all customer-facing pages. 
        ◦ Task 1.3.2: Develop Search Results Page UI 
            ▪ Subtask 1.3.2.1: Create SearchResultsPage component/route. 
            ▪ Subtask 1.3.2.2: Reuse ProductCard, Pagination, SortOptions, and FilterSidebar components from Story 1.1. 
            ▪ Subtask 1.3.2.3: Display the active search query (e.g., "Showing results for 'XYZ'"). 
        ◦ Task 1.3.3: Implement Frontend Search Logic 
            ▪ Subtask 1.3.3.1: Capture input from search bar on submit. 
            ▪ Subtask 1.3.3.2: Redirect to SearchResultsPage with search query as a URL parameter (e.g., /search?q=keyword). 
            ▪ Subtask 1.3.3.3: Extract search query from URL on SearchResultsPage load. 
        ◦ Task 1.3.4: Frontend API Integration for Search Results 
            ▪ Subtask 1.3.4.1: Create service/hook to fetch products from GET /api/products/search. 
            ▪ Subtask 1.3.4.2: Pass search query (q), pagination, sorting, and filtering parameters. 
            ▪ Subtask 1.3.4.3: Handle loading states and display "No results found" message. 
        ◦ Task 1.3.5: Ensure Responsiveness of Search UI and Results 
            ▪ Subtask 1.3.5.1: Apply responsive CSS to search bar and results layout. 
    • Backend Tasks:
        ◦ Task 1.3.6: Create Product Search API Endpoint 
            ▪ Subtask 1.3.6.1: Design and implement GET /api/products/search endpoint. 
            ▪ Subtask 1.3.6.2: Implement logic to query Product collection based on search keywords. 
            ▪ Subtask 1.3.6.3: Implement case-insensitive partial keyword matching on relevant fields (e.g., product name, description, category name). Consider using MongoDB text search or regular expressions for this. 
            ▪ Subtask 1.3.6.4: Integrate pagination, sorting, and filtering logic (reusing or adapting from Task 1.1.7). 
            ▪ Subtask 1.3.6.5: Ensure only "active" products are returned. 
        ◦ Task 1.3.7: Optimize Database for Search 
            ▪ Subtask 1.3.7.1: Add necessary indexes (e.g., text index) to Product collection for efficient keyword search. 
        ◦ Task 1.3.8: Error Handling & Validation (Backend) 
            ▪ Subtask 1.3.8.1: Validate search query parameter (q). 
            ▪ Subtask 1.3.8.2: Handle scenarios where no products match the search query. 
    • Testing Tasks:
        ◦ Task 1.3.9: Write Unit Tests 
            ▪ Subtask 1.3.9.1: Unit tests for frontend search bar component. 
            ▪ Subtask 1.3.9.2: Unit tests for backend search logic (case-insensitivity, partial matches). 
        ◦ Task 1.3.10: Write Integration Tests 
            ▪ Subtask 1.3.10.1: Test GET /api/products/search endpoint with various valid/invalid keywords. 
            ▪ Subtask 1.3.10.2: Test combination of search with pagination, sorting, and filtering. 
        ◦ Task 1.3.11: Manual End-to-End Testing 
            ▪ Subtask 1.3.11.1: Verify search bar presence and functionality. 
            ▪ Subtask 1.3.11.2: Test various search terms (exact, partial, case-insensitive). 
            ▪ Subtask 1.3.11.3: Verify search results display correctly with pagination, sorting, and filtering. 
            ▪ Subtask 1.3.11.4: Test "no results" scenario. 
            ▪ Subtask 1.3.11.5: Verify responsiveness of search UI and results.
Epic: Customer Account Management
Story 2.1: Register New Account (Customer)
Story: As a new customer, I want to create an account so that I can manage my orders, save my details, and have a personalized experience.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Register" or "Create Account" link/button is prominently available on the website (e.g., in the header, login page). 
    2. Clicking the link navigates the customer to a registration form. 
    3. The registration form requires the following information: 
        ◦ Email Address (Required, unique, valid format) 
        ◦ Password (Required, strong password policy enforced: min 8 characters, mix of uppercase, lowercase, numbers, symbols) 
        ◦ Confirm Password (Required, must match password) 
        ◦ First Name (Required) 
        ◦ Last Name (Required) 
        ◦ (Optional fields like Phone Number, Marketing Opt-in checkbox) 
    4. Client-side validation provides immediate feedback for invalid input. 
    5. Upon successful submission: 
        ◦ The user's account is created in the backend. 
        ◦ The user is automatically logged in. 
        ◦ A success message is displayed. 
        ◦ A welcome email is sent to the registered email address. 
    6. If registration fails (e.g., email already exists), a clear and specific error message is displayed. 
    7. All registration processes are performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.1:
    • Frontend Tasks:
        ◦ Task 2.1.1: Develop Registration Page UI 
            ▪ Subtask 2.1.1.1: Create RegisterPage component/route. 
            ▪ Subtask 2.1.1.2: Design and implement input fields for Email, Password, Confirm Password, First Name, Last Name, (Optional: Phone, Marketing Opt-in). 
            ▪ Subtask 2.1.1.3: Add "Register" button. 
            ▪ Subtask 2.1.1.4: Add link to "Login" page for existing users. 
        ◦ Task 2.1.2: Implement Client-Side Validation for Registration Form 
            ▪ Subtask 2.1.2.1: Implement validation for Email format (regex). 
            ▪ Subtask 2.1.2.2: Implement password strength validation (min length, character types). 
            ▪ Subtask 2.1.2.3: Implement "Confirm Password" match validation. 
            ▪ Subtask 2.1.2.4: Display real-time feedback for invalid fields. 
        ◦ Task 2.1.3: Frontend API Integration for Account Registration 
            ▪ Subtask 2.1.3.1: Create service/hook to send registration data to POST /api/auth/register. 
            ▪ Subtask 2.1.3.2: Handle success response (automatic login, display success message, redirect to dashboard/homepage). 
            ▪ Subtask 2.1.3.3: Handle error responses (display specific error messages, e.g., "Email already exists"). 
        ◦ Task 2.1.4: Update Global Header UI 
            ▪ Subtask 2.1.4.1: Ensure "Register" link is present in the header/login area. 
    • Backend Tasks:
        ◦ Task 2.1.5: Create Account Registration API Endpoint 
            ▪ Subtask 2.1.5.1: Design and implement POST /api/auth/register endpoint. 
            ▪ Subtask 2.1.5.2: Implement server-side validation for all incoming registration data (email format, password strength, required fields). 
            ▪ Subtask 2.1.5.3: Hash the user's password using a strong, one-way algorithm (e.g., bcrypt) before storing. 
            ▪ Subtask 2.1.5.4: Check for unique email address (if email already exists, return appropriate error). 
            ▪ Subtask 2.1.5.5: Create new User document in MongoDB. 
            ▪ Subtask 2.1.5.6: Implement logic for automatic login upon successful registration (e.g., generate JWT token and send in response). 
            ▪ Subtask 2.1.5.7: Trigger sending of welcome email (integrate with Email Service Provider). 
        ◦ Task 2.1.6: Implement User Data Model 
            ▪ Subtask 2.1.6.1: Define MongoDB schema for User collection (email, hashedPassword, firstName, lastName, phone, marketingOptIn, createdAt, updatedAt, roles, etc.). 
        ◦ Task 2.1.7: Email Service Integration (Welcome Email) 
            ▪ Subtask 2.1.7.1: Configure integration with chosen Email Service Provider (e.g., SendGrid API key setup). 
            ▪ Subtask 2.1.7.2: Create welcome email template. 
            ▪ Subtask 2.1.7.3: Implement function to send welcome email upon successful registration. 
    • Security Tasks (Specific to this Story):
        ◦ Task 2.1.8: Secure Password Handling 
            ▪ Subtask 2.1.8.1: Ensure bcrypt/Argon2 is correctly configured for password hashing. 
            ▪ Subtask 2.1.8.2: Implement best practices for salt generation. 
        ◦ Task 2.1.9: Implement Rate Limiting for Registration Attempts 
            ▪ Subtask 2.1.9.1: Prevent brute-force registration attempts from a single IP address. 
    • Testing Tasks:
        ◦ Task 2.1.10: Write Unit Tests 
            ▪ Subtask 2.1.10.1: Unit tests for frontend validation logic. 
            ▪ Subtask 2.1.10.2: Unit tests for backend password hashing. 
        ◦ Task 2.1.11: Write Integration Tests 
            ▪ Subtask 2.1.11.1: Test POST /api/auth/register with valid data (expect success). 
            ▪ Subtask 2.1.11.2: Test with invalid data (invalid email, weak password, mismatched passwords). 
            ▪ Subtask 2.1.11.3: Test with existing email (expect specific error). 
            ▪ Subtask 2.1.11.4: Verify user creation in DB and correct password hashing. 
            ▪ Subtask 2.1.11.5: Verify welcome email is triggered (mock email service for testing). 
        ◦ Task 2.1.12: Manual End-to-End Testing 
            ▪ Subtask 2.1.12.1: Test full registration flow from UI. 
            ▪ Subtask 2.1.12.2: Verify successful account creation and automatic login. 
            ▪ Subtask 2.1.12.3: Test all validation messages on the UI. 
            ▪ Subtask 2.1.12.4: Attempt to register with an already existing email.
Epic: Customer Account Management
Story 2.2: Log In to Account (Customer)
Story: As a returning customer, I want to log in to my account so that I can access my saved information, order history, and personalized features.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Login" link/button is prominently available on the website (e.g., in the header). 
    2. Clicking the link navigates the customer to a login form. 
    3. The login form requires: 
        ◦ Email Address (Required, valid format) 
        ◦ Password (Required) 
    4. Client-side validation provides immediate feedback for invalid input. 
    5. Upon successful submission: 
        ◦ The user is authenticated in the backend. 
        ◦ A session is established. 
        ◦ The user is redirected to their account dashboard or the previous page. 
        ◦ A success message is displayed. 
    6. If login fails (e.g., invalid credentials), a clear and specific error message is displayed. 
    7. All login processes are performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.2:
    • Frontend Tasks:
        ◦ Task 2.2.1: Develop Login Page UI
            ▪ Subtask 2.2.1.1: Create LoginPage component/route. 
            ▪ Subtask 2.2.1.2: Design and implement input fields for Email and Password. 
            ▪ Subtask 2.2.1.3: Add "Login" button. 
            ▪ Subtask 2.2.1.4: Add link to "Register" page for new users. 
            ▪ Subtask 2.2.1.5: Add "Forgot Password" link. 
        ◦ Task 2.2.2: Implement Client-Side Validation for Login Form
            ▪ Subtask 2.2.2.1: Implement validation for Email format. 
            ▪ Subtask 2.2.2.2: Ensure both fields are required. 
            ▪ Subtask 2.2.2.3: Display real-time feedback for invalid fields. 
        ◦ Task 2.2.3: Frontend API Integration for Account Login
            ▪ Subtask 2.2.3.1: Create service/hook to send login data to POST /api/auth/login. 
            ▪ Subtask 2.2.3.2: Handle success response (store JWT token, redirect to dashboard/previous page, display success message). 
            ▪ Subtask 2.2.3.3: Handle error responses (display specific error messages, e.g., "Invalid email or password"). 
        ◦ Task 2.2.4: Update Global Header UI
            ▪ Subtask 2.2.4.1: Ensure "Login" link is present in the header/login area. 
            ▪ Subtask 2.2.4.2: After successful login, replace "Login" link with user account link/dropdown. 
    • Backend Tasks:
        ◦ Task 2.2.5: Create Account Login API Endpoint
            ▪ Subtask 2.2.5.1: Design and implement POST /api/auth/login endpoint. 
            ▪ Subtask 2.2.5.2: Implement server-side validation for email and password. 
            ▪ Subtask 2.2.5.3: Retrieve user from MongoDB by email. 
            ▪ Subtask 2.2.5.4: Compare provided password with stored hashed password using bcrypt's compare function (or equivalent). 
            ▪ Subtask 2.2.5.5: If credentials are valid, generate a JWT (JSON Web Token) and send it in the response. 
            ▪ Subtask 2.2.5.6: Implement session management (e.g., store JWT in an HTTP-only, secure cookie). 
            ▪ Subtask 2.2.5.7: Return user data (excluding sensitive information) in the response. 
        ◦ Task 2.2.6: JWT Authentication Middleware
            ▪ Subtask 2.2.6.1: Implement middleware to verify JWT token on protected API routes. 
            ▪ Subtask 2.2.6.2: Extract user ID from JWT and make it available to route handlers. 
        ◦ Task 2.2.7: Error Handling & Security (Backend)
            ▪ Subtask 2.2.7.1: Implement rate limiting for login attempts. 
            ▪ Subtask 2.2.7.2: Log failed login attempts. 
    • Testing Tasks:
        ◦ Task 2.2.8: Write Unit Tests
            ▪ Subtask 2.2.8.1: Unit tests for frontend validation logic. 
            ▪ Subtask 2.2.8.2: Unit tests for backend password comparison. 
            ▪ Subtask 2.2.8.3: Unit tests for JWT generation and verification. 
        ◦ Task 2.2.9: Write Integration Tests
            ▪ Subtask 2.2.9.1: Test POST /api/auth/login with valid credentials (expect success). 
            ▪ Subtask 2.2.9.2: Test with invalid credentials (invalid email, incorrect password). 
            ▪ Subtask 2.2.9.3: Verify JWT token is returned and stored correctly. 
            ▪ Subtask 2.2.9.4: Test access to protected routes with and without valid JWT. 
        ◦ Task 2.2.10: Manual End-to-End Testing
            ▪ Subtask 2.2.10.1: Test full login flow from UI. 
            ▪ Subtask 2.2.10.2: Verify successful login and redirection. 
            ▪ Subtask 2.2.10.3: Test all validation messages on the UI. 
            ▪ Subtask 2.2.10.4: Test login with incorrect credentials. 
            ▪ Subtask 2.2.10.5: Verify user session is established.
Epic: Customer Account Management
Story 2.3: Log Out of Account (Customer)
Story: As a logged-in customer, I want to be able to log out of my account securely so that I can end my session and protect my personal information.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Logout" link/button is prominently available in the customer's account/header section when logged in. 
    2. Clicking the "Logout" link/button securely ends the customer's session on the server-side. 
    3. The customer is redirected to the homepage or login page after successful logout. 
    4. A confirmation message (e.g., "You have been logged out.") may be displayed. 
    5. After logging out, the customer can no longer access authenticated sections of the website without logging in again. 

Granular Tasks & Subtasks for Story 2.3:
    • Frontend Tasks:
        ◦ Task 2.3.1: Implement Logout UI Element 
            ▪ Subtask 2.3.1.1: Add "Logout" button/link to the customer account dropdown or header when a user is logged in. 
            ▪ Subtask 2.3.1.2: Ensure "Login" and "Register" links reappear after logout. 
        ◦ Task 2.3.2: Frontend API Integration for Logout 
            ▪ Subtask 2.3.2.1: Create service/hook to send a logout request to POST /api/auth/logout. 
            ▪ Subtask 2.3.2.2: On successful response, clear client-side session data (e.g., remove JWT from local storage/cookies). 
            ▪ Subtask 2.3.2.3: Redirect customer to the homepage or login page. 
            ▪ Subtask 2.3.2.4: Display a temporary success message (e.g., using a toast notification). 
    • Backend Tasks:
        ◦ Task 2.3.3: Create Logout API Endpoint 
            ▪ Subtask 2.3.3.1: Design and implement POST /api/auth/logout endpoint. 
            ▪ Subtask 2.3.3.2: Invalidate the user's session token on the server-side (e.g., add JWT to a blacklist, remove from active sessions store if using stateful sessions). 
            ▪ Subtask 2.3.3.3: Return a success response. 
            ▪ Subtask 2.3.3.4: Log the logout event. 
        ◦ Task 2.3.4: Session Invalidation Logic 
            ▪ Subtask 2.3.4.1: Implement mechanism for JWT blacklisting or revoking refresh tokens to ensure true server-side logout. 
    • Security Tasks (Specific to this Story):
        ◦ Task 2.3.5: Ensure Secure Token Invalidation 
            ▪ Subtask 2.3.5.1: Verify that after logout, the token cannot be reused to access protected resources. 
    • Testing Tasks:
        ◦ Task 2.3.6: Write Unit Tests 
            ▪ Subtask 2.3.6.1: Unit tests for client-side session clearing logic. 
            ▪ Subtask 2.3.6.2: Unit tests for backend token invalidation. 
        ◦ Task 2.3.7: Write Integration Tests 
            ▪ Subtask 2.3.7.1: Test POST /api/auth/logout after a successful login. 
            ▪ Subtask 2.3.7.2: Attempt to access a protected resource with the invalidated token (should fail). 
        ◦ Task 2.3.8: Manual End-to-End Testing 
            ▪ Subtask 2.3.8.1: Log in as a customer. 
            ▪ Subtask 2.3.8.2: Verify "Logout" link is visible. 
            ▪ Subtask 2.3.8.3: Click "Logout" and verify redirection and success message. 
            ▪ Subtask 2.3.8.4: Attempt to navigate back to a protected page (e.g., "My Account") without re-logging in (should be redirected to login).
Epic: Customer Account Management
Story 2.4: Manage Account Profile (Customer)
Story: As a logged-in customer, I want to view and update my personal profile information (e.g., name, email, phone number) so that my account details are accurate and up-to-date.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "My Profile" or "Account Details" section is accessible from the customer's account dashboard/menu. 
    2. Upon accessing this section, the customer's current profile information (First Name, Last Name, Email, Phone Number) is pre-filled in an editable form. 
    3. Customers can modify any of these fields. 
    4. Client-side validation is performed on updated fields (e.g., email format, phone number format). 
    5. Upon successful submission, the updated profile information is saved to the backend. 
    6. If the email address is changed, a re-verification process may be initiated (e.g., sending a confirmation email to the new address). 
    7. The customer receives a success confirmation message upon successful update. 
    8. If the update fails (e.g., email already exists), a clear and specific error message is displayed. 
    9. All profile updates are performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.4:
    • Frontend Tasks:
        ◦ Task 2.4.1: Implement "My Profile" Page UI 
            ▪ Subtask 2.4.1.1: Create MyProfilePage component/route accessible via authenticated routes. 
            ▪ Subtask 2.4.1.2: Design and implement an editable form with fields for First Name, Last Name, Email, and Phone Number. 
            ▪ Subtask 2.4.1.3: Add "Save Changes" button. 
            ▪ Subtask 2.4.1.4: Add navigation link to "My Profile" in the customer dashboard/menu. 
        ◦ Task 2.4.2: Implement Frontend Data Fetching 
            ▪ Subtask 2.4.2.1: Create service/hook to fetch current user profile data from GET /api/user/profile. 
            ▪ Subtask 2.4.2.2: Pre-fill the form fields with fetched data. 
            ▪ Subtask 2.4.2.3: Handle loading states. 
        ◦ Task 2.4.3: Implement Client-Side Validation for Profile Form 
            ▪ Subtask 2.4.3.1: Implement validation for Email format (regex). 
            ▪ Subtask 2.4.3.2: Implement basic validation for name and phone number formats. 
            ▪ Subtask 2.4.3.3: Display real-time feedback for invalid fields. 
        ◦ Task 2.4.4: Frontend API Integration for Profile Update 
            ▪ Subtask 2.4.4.1: Create service/hook to send updated profile data to PUT /api/user/profile. 
            ▪ Subtask 2.4.4.2: Handle success response (display success message). 
            ▪ Subtask 2.4.4.3: Handle error responses (display specific error messages, e.g., "Email already in use"). 
    • Backend Tasks:
        ◦ Task 2.4.5: Create Fetch User Profile API Endpoint 
            ▪ Subtask 2.4.5.1: Design and implement GET /api/user/profile endpoint. 
            ▪ Subtask 2.4.5.2: Authenticate the user (using JWT middleware from 2.2). 
            ▪ Subtask 2.4.5.3: Retrieve user profile data from MongoDB based on authenticated user ID. 
            ▪ Subtask 2.4.5.4: Return non-sensitive profile information (First Name, Last Name, Email, Phone Number, etc.). 
        ◦ Task 2.4.6: Create Update User Profile API Endpoint 
            ▪ Subtask 2.4.6.1: Design and implement PUT /api/user/profile endpoint. 
            ▪ Subtask 2.4.6.2: Authenticate the user. 
            ▪ Subtask 2.4.6.3: Implement server-side validation for all incoming profile data (email format, uniqueness for new email, required fields). 
            ▪ Subtask 2.4.6.4: Update the User document in MongoDB with the new profile information. 
            ▪ Subtask 2.4.6.5: If email address is changed, trigger re-verification process (e.g., send verification email to new address with a token, require confirmation before updating email in DB). This is a more complex flow, consider it a stretch goal or separate story if time-consuming. 
            ▪ Subtask 2.4.6.6: Return success response. 
    • Testing Tasks:
        ◦ Task 2.4.7: Write Unit Tests 
            ▪ Subtask 2.4.7.1: Unit tests for frontend validation logic. 
            ▪ Subtask 2.4.7.2: Unit tests for backend profile update logic (data validation). 
        ◦ Task 2.4.8: Write Integration Tests 
            ▪ Subtask 2.4.8.1: Test GET /api/user/profile for authenticated user. 
            ▪ Subtask 2.4.8.2: Test PUT /api/user/profile with valid updates. 
            ▪ Subtask 2.4.8.3: Test PUT /api/user/profile with invalid data (e.g., invalid email format, email already exists). 
            ▪ Subtask 2.4.8.4: Test unauthorized access to profile endpoints. 
        ◦ Task 2.4.9: Manual End-to-End Testing 
            ▪ Subtask 2.4.9.1: Log in as a customer and navigate to "My Profile". 
            ▪ Subtask 2.4.9.2: Verify current profile information is pre-filled. 
            ▪ Subtask 2.4.9.3: Update various fields (name, phone) and save. Verify changes. 
            ▪ Subtask 2.4.9.4: Attempt to change email to an already existing one. Verify error message. 
            ▪ Subtask 2.4.9.5: Test client-side validation messages.
Epic: Customer Account Management
Story 2.5: Change Password (Customer)
Story: As a logged-in customer, I want to be able to change my account password so that I can maintain my account security.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Change Password" section or link is accessible from the customer's account dashboard/menu. 
    2. Upon accessing this section, the customer is presented with a form requiring: 
        ◦ Current Password (Required, for verification) 
        ◦ New Password (Required, strong password policy enforced: min 8 characters, mix of uppercase, lowercase, numbers, symbols) 
        ◦ Confirm New Password (Required, must match new password) 
    3. Client-side validation provides immediate feedback for invalid input. 
    4. Upon successful submission: 
        ◦ The new password is securely updated in the backend. 
        ◦ The customer receives a success confirmation message. 
        ◦ An email notification is sent to the customer's registered email address confirming the password change. 
    5. If the password change fails (e.g., incorrect current password, new password doesn't meet policy, new password matches old password, confirmation mismatch), a clear and specific error message is displayed. 
    6. All password changes are performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.5:
    • Frontend Tasks:
        ◦ Task 2.5.1: Implement "Change Password" Page UI 
            ▪ Subtask 2.5.1.1: Create ChangePasswordPage component/route accessible via authenticated routes. 
            ▪ Subtask 2.5.1.2: Design and implement input fields for Current Password, New Password, and Confirm New Password. 
            ▪ Subtask 2.5.1.3: Add "Update Password" button. 
            ▪ Subtask 2.5.1.4: Add navigation link to "Change Password" in the customer dashboard/menu. 
        ◦ Task 2.5.2: Implement Client-Side Validation for Password Form 
            ▪ Subtask 2.5.2.1: Implement password strength validation for the new password. 
            ▪ Subtask 2.5.2.2: Implement "Confirm New Password" match validation. 
            ▪ Subtask 2.5.2.3: Ensure all fields are required. 
            ▪ Subtask 2.5.2.4: Display real-time feedback for invalid fields. 
        ◦ Task 2.5.3: Frontend API Integration for Password Change 
            ▪ Subtask 2.5.3.1: Create service/hook to send password change data to PUT /api/user/change-password. 
            ▪ Subtask 2.5.3.2: Handle success response (display success message). 
            ▪ Subtask 2.5.3.3: Handle error responses (display specific error messages, e.g., "Incorrect current password", "New password cannot be the same as old"). 
    • Backend Tasks:
        ◦ Task 2.5.4: Create Change Password API Endpoint
            ▪ Subtask 2.5.4.1: Design and implement PUT /api/user/change-password endpoint. 
            ▪ Subtask 2.5.4.2: Authenticate the user (using JWT middleware). 
            ▪ Subtask 2.5.4.3: Implement server-side validation for all incoming password data (new password strength, new password matches confirmation). 
            ▪ Subtask 2.5.4.4: Retrieve the user from MongoDB using the authenticated user ID. 
            ▪ Subtask 2.5.4.5: Verify the currentPassword by comparing it with the stored hashed password using bcrypt's compare function. If it doesn't match, return an error. 
            ▪ Subtask 2.5.4.6: Check if the newPassword is different from the currentPassword. If not, return an error. 
            ▪ Subtask 2.5.4.7: Hash the newPassword using the strong hashing algorithm. 
            ▪ Subtask 2.5.4.8: Update the hashedPassword in the User document in MongoDB. 
            ▪ Subtask 2.5.4.9: Invalidate the user's current session/JWT token(s) to force re-authentication with the new password for all active sessions. 
            ▪ Subtask 2.5.4.10: Return success response. 
            ▪ Subtask 2.5.4.11: Trigger sending of "Password Changed" notification email (integrate with Email Service Provider). 
        ◦ Task 2.5.5: Email Service Integration (Password Changed Notification)
            ▪ Subtask 2.5.5.1: Create "Password Changed" email template. 
            ▪ Subtask 2.5.5.2: Implement function to send this notification email upon successful password change. 
    • Security Tasks (Specific to this Story):
        ◦ Task 2.5.6: Enforce Robust Password Policy on Backend 
            ▪ Subtask 2.5.6.1: Ensure the backend rigorously checks new passwords against the defined strength policy. 
        ◦ Task 2.5.7: Secure Password Comparison 
            ▪ Subtask 2.5.7.1: Double-check that password comparison is done safely (e.g., using bcrypt.compare for constant-time comparison). 
        ◦ Task 2.5.8: Session Invalidation on Password Change 
            ▪ Subtask 2.5.8.1: Implement logic to invalidate all active sessions for the user after a password change to enhance security (prevents old tokens from being used). 
    • Testing Tasks:
        ◦ Task 2.5.9: Write Unit Tests 
            ▪ Subtask 2.5.9.1: Unit tests for frontend password validation. 
            ▪ Subtask 2.5.9.2: Unit tests for backend password comparison and hashing. 
        ◦ Task 2.5.10: Write Integration Tests 
            ▪ Subtask 2.5.10.1: Test PUT /api/user/change-password with correct current password and valid new password. 
            ▪ Subtask 2.5.10.2: Test with incorrect current password. 
            ▪ Subtask 2.5.10.3: Test with new password not meeting policy. 
            ▪ Subtask 2.5.10.4: Test with new password matching old password. 
            ▪ Subtask 2.5.10.5: Test with mismatched new password and confirmation. 
            ▪ Subtask 2.5.10.6: Verify session invalidation after password change. 
        ◦ Task 2.5.11: Manual End-to-End Testing 
            ▪ Subtask 2.5.11.1: Log in and navigate to "Change Password". 
            ▪ Subtask 2.5.11.2: Test successful password change, verify success message and notification email (if configured). 
            ▪ Subtask 2.5.11.3: Test all error scenarios on the UI (incorrect current, weak new, mismatch, same as old). 
            ▪ Subtask 2.5.11.4: After successful change, verify old password no longer works and new password does. 

Epic: Customer Account Management
Story 2.6: Reset Forgotten Password (Customer)
Story: As a customer who has forgotten my password, I want to be able to reset it securely so that I can regain access to my account.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Forgot Password?" link is available on the login page. 
    2. Clicking the link navigates the customer to a "Forgot Password" form. 
    3. The form requires the customer to enter their registered email address. 
    4. Upon submission, if the email is registered, a password reset link with a unique, time-limited token is sent to that email address. A confirmation message is displayed to the user (e.g., "If an account exists for that email, a password reset link has been sent."). 
    5. The reset link directs the customer to a "Reset Password" page. 
    6. On the "Reset Password" page, the customer can enter a new password and confirm it. 
    7. Client-side validation is performed on the new password (strong password policy, confirmation match). 
    8. Upon successful submission, the new password is securely updated in the backend, and the token is invalidated. 
    9. The customer is redirected to the login page and receives a success message (e.g., "Your password has been reset successfully. Please log in with your new password."). 
    10. If the reset link is invalid, expired, or already used, an appropriate error message is displayed. 
    11. All processes are performed securely. 

Granular Tasks & Subtasks for Story 2.6:
    • Frontend Tasks (Request Password Reset):
        ◦ Task 2.6.1: Implement "Forgot Password" Link & Request Form UI 
            ▪ Subtask 2.6.1.1: Add "Forgot Password?" link to the LoginPage. 
            ▪ Subtask 2.6.1.2: Create ForgotPasswordRequestPage component/route. 
            ▪ Subtask 2.6.1.3: Design and implement input field for Email Address and "Send Reset Link" button. 
        ◦ Task 2.6.2: Implement Client-Side Validation for Request Form 
            ▪ Subtask 2.6.2.1: Validate email format. 
            ▪ Subtask 2.6.2.2: Ensure email field is required. 
        ◦ Task 2.6.3: Frontend API Integration for Requesting Reset 
            ▪ Subtask 2.6.3.1: Create service/hook to send email to POST /api/auth/forgot-password. 
            ▪ Subtask 2.6.3.2: Handle success response (display generic confirmation message to prevent email enumeration). 
            ▪ Subtask 2.6.3.3: Handle error responses (e.g., server errors, but avoid specific messages for invalid emails). 
    • Frontend Tasks (Reset Password):
        ◦ Task 2.6.4: Implement "Reset Password" Page UI 
            ▪ Subtask 2.6.4.1: Create ResetPasswordPage component/route (e.g., /reset-password?token=XYZ). 
            ▪ Subtask 2.6.4.2: Design and implement input fields for New Password and Confirm New Password, and "Reset Password" button. 
        ◦ Task 2.6.5: Implement Client-Side Validation for Reset Form 
            ▪ Subtask 2.6.5.1: Implement new password strength validation. 
            ▪ Subtask 2.6.5.2: Implement "Confirm New Password" match validation. 
        ◦ Task 2.6.6: Frontend API Integration for Resetting Password 
            ▪ Subtask 2.6.6.1: Create service/hook to send new password and token to POST /api/auth/reset-password. 
            ▪ Subtask 2.6.6.2: Handle success response (redirect to login, display success message). 
            ▪ Subtask 2.6.6.3: Handle error responses (display specific messages for invalid/expired token, weak password). 
    • Backend Tasks (Request Password Reset):
        ◦ Task 2.6.7: Create Forgot Password Request API Endpoint 
            ▪ Subtask 2.6.7.1: Design and implement POST /api/auth/forgot-password. 
            ▪ Subtask 2.6.7.2: Server-side validation for email format. 
            ▪ Subtask 2.6.7.3: Look up user by email. 
            ▪ Subtask 2.6.7.4: If user found, generate a unique, cryptographically secure, time-limited reset token. 
            ▪ Subtask 2.6.7.5: Store the hashed token (and its expiry) in the User document or a dedicated PasswordResetToken collection. 
            ▪ Subtask 2.6.7.6: Construct the reset link (e.g., frontend_url/reset-password?token=XYZ). 
            ▪ Subtask 2.6.7.7: Send the reset link to the user's email address via Email Service Provider. 
            ▪ Subtask 2.6.7.8: Always return a generic success message, regardless of whether the email exists, to prevent user enumeration. 
    • Backend Tasks (Reset Password):
        ◦ Task 2.6.8: Create Reset Password API Endpoint 
            ▪ Subtask 2.6.8.1: Design and implement POST /api/auth/reset-password. 
            ▪ Subtask 2.6.8.2: Server-side validation for new password strength and confirmation match. 
            ▪ Subtask 2.6.8.3: Extract and validate the reset token from the request. 
            ▪ Subtask 2.6.8.4: Look up the user by the token (or hashed token). 
            ▪ Subtask 2.6.8.5: Verify token validity (not expired, not used). 
            ▪ Subtask 2.6.8.6: Hash the newPassword. 
            ▪ Subtask 2.6.8.7: Update the user's hashedPassword in MongoDB. 
            ▪ Subtask 2.6.8.8: Invalidate the used reset token (mark as used or delete). 
            ▪ Subtask 2.6.8.9: Invalidate any existing active user sessions (JWTs) for security. 
            ▪ Subtask 2.6.8.10: Return success response. 
    • Email Service Integration:
        ◦ Task 2.6.9: Design Password Reset Email Template 
            ▪ Subtask 2.6.9.1: Create a clear and secure email template for the password reset link. 
    • Security Tasks (Specific to this Story):
        ◦ Task 2.6.10: Secure Token Generation & Storage 
            ▪ Subtask 2.6.10.1: Ensure reset tokens are long, random, and cryptographically secure. 
            ▪ Subtask 2.6.10.2: Store hashed tokens in DB, not plain text. 
            ▪ Subtask 2.6.10.3: Implement strict expiry for tokens (e.g., 1 hour). 
            ▪ Subtask 2.6.10.4: Ensure token is single-use. 
        ◦ Task 2.6.11: Rate Limiting for Reset Requests 
            ▪ Subtask 2.6.11.1: Implement rate limiting on POST /api/auth/forgot-password to prevent abuse. 
        ◦ Task 2.6.12: Prevent User Enumeration 
            ▪ Subtask 2.6.12.1: Ensure the "Forgot Password" endpoint always returns a generic success message to prevent attackers from determining valid email addresses. 
    • Testing Tasks:
        ◦ Task 2.6.13: Write Unit Tests 
            ▪ Subtask 2.6.13.1: Unit tests for frontend validation. 
            ▪ Subtask 2.6.13.2: Unit tests for backend token generation/validation. 
        ◦ Task 2.6.14: Write Integration Tests 
            ▪ Subtask 2.6.14.1: Test POST /api/auth/forgot-password with valid/invalid emails (verify generic success and email trigger for valid). 
            ▪ Subtask 2.6.14.2: Simulate receiving email, extract token, test POST /api/auth/reset-password with valid token and new password. 
            ▪ Subtask 2.6.14.3: Test with expired token, invalid token, already used token. 
            ▪ Subtask 2.6.14.4: Verify new password works and old password does not. 
            ▪ Subtask 2.6.14.5: Verify session invalidation after reset. 
        ◦ Task 2.6.15: Manual End-to-End Testing 
            ▪ Subtask 2.6.15.1: Test full "Forgot Password" flow from UI, including email receipt. 
            ▪ Subtask 2.6.15.2: Test invalid/expired link scenarios. 
            ▪ Subtask 2.6.15.3: Verify security measures (e.g., generic message for unknown email).
Epic: Customer Account Management
Story 2.7: Manage Shipping Addresses (Customer)
Story: As a logged-in customer, I want to add, edit, and delete my shipping addresses so that I can conveniently select them during checkout.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "My Addresses" or "Shipping Addresses" section is accessible from the customer's account dashboard/menu. 
    2. This section displays a list of the customer's saved shipping addresses. 
    3. For each address, an "Edit" and "Delete" option is available. 
    4. There is an option to "Add New Address". 
    5. Adding a New Address: 
        ◦ A form is presented with fields for: Full Name, Address Line 1, Address Line 2 (Optional), City, State/Province, Postal Code, Country, Phone Number. 
        ◦ Client-side validation is performed on required fields and format. 
        ◦ Upon submission, the new address is saved to the backend and added to the customer's list. 
    6. Editing an Existing Address: 
        ◦ Clicking "Edit" pre-fills the address form with the selected address's details. 
        ◦ Customers can modify any field. 
        ◦ Client-side validation is performed. 
        ◦ Upon submission, the updated address is saved to the backend. 
    7. Deleting an Address: 
        ◦ Clicking "Delete" prompts a confirmation (e.g., "Are you sure you want to delete this address?"). 
        ◦ Upon confirmation, the address is removed from the customer's saved list. 
        ◦ If an address is currently associated with a pending order, deletion should be prevented or require a warning. (Though for simplicity, initially we can assume addresses are only for future use). 
    8. A confirmation message is displayed for successful add, edit, or delete operations. 
    9. All operations are performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.7:
    • Frontend Tasks:
        ◦ Task 2.7.1: Implement "My Addresses" Page UI 
            ▪ Subtask 2.7.1.1: Create MyAddressesPage component/route accessible via authenticated routes. 
            ▪ Subtask 2.7.1.2: Design and implement a layout to display a list of addresses. 
            ▪ Subtask 2.7.1.3: Add "Add New Address" button. 
            ▪ Subtask 2.7.1.4: For each address, display details clearly and include "Edit" and "Delete" buttons. 
            ▪ Subtask 2.7.1.5: Add navigation link to "My Addresses" in the customer dashboard/menu. 
        ◦ Task 2.7.2: Develop Address Form UI (Reusable for Add/Edit) 
            ▪ Subtask 2.7.2.1: Create AddressForm component with fields: Full Name, Address Line 1, Address Line 2 (Optional), City, State/Province, Postal Code, Country, Phone Number. 
            ▪ Subtask 2.7.2.2: Implement form submission button. 
        ◦ Task 2.7.3: Implement Client-Side Validation for Address Form 
            ▪ Subtask 2.7.3.1: Implement validation for all required fields (non-empty). 
            ▪ Subtask 2.7.3.2: Implement basic format validation (e.g., postal code regex). 
            ▪ Subtask 2.7.3.3: Display real-time feedback for invalid fields. 
        ◦ Task 2.7.4: Frontend API Integration: Fetch Addresses 
            ▪ Subtask 2.7.4.1: Create service/hook to fetch user's addresses from GET /api/user/addresses. 
            ▪ Subtask 2.7.4.2: Display fetched addresses in the list. 
            ▪ Subtask 2.7.4.3: Handle loading states. 
        ◦ Task 2.7.5: Frontend API Integration: Add New Address 
            ▪ Subtask 2.7.5.1: Integrate AddressForm with POST /api/user/addresses. 
            ▪ Subtask 2.7.5.2: Redirect/update list on success, display confirmation. 
        ◦ Task 2.7.6: Frontend API Integration: Edit Address 
            ▪ Subtask 2.7.6.1: On "Edit" click, pre-fill AddressForm with existing address data. 
            ▪ Subtask 2.7.6.2: Integrate AddressForm with PUT /api/user/addresses/:addressId. 
            ▪ Subtask 2.7.6.3: Update list on success, display confirmation. 
        ◦ Task 2.7.7: Frontend API Integration: Delete Address 
            ▪ Subtask 2.7.7.1: Implement "Delete" confirmation dialog. 
            ▪ Subtask 2.7.7.2: Integrate with DELETE /api/user/addresses/:addressId. 
            ▪ Subtask 2.7.7.3: Remove address from list on success, display confirmation. 
    • Backend Tasks:
        ◦ Task 2.7.8: Update User Data Model for Addresses 
            ▪ Subtask 2.7.8.1: Add an array field (e.g., shippingAddresses) to the User schema in MongoDB, containing address objects. Each address object should have a unique ID. 
        ◦ Task 2.7.9: Create Fetch Addresses API Endpoint 
            ▪ Subtask 2.7.9.1: Design and implement GET /api/user/addresses. 
            ▪ Subtask 2.7.9.2: Authenticate the user. 
            ▪ Subtask 2.7.9.3: Retrieve the shippingAddresses array for the authenticated user. 
        ◦ Task 2.7.10: Create Add New Address API Endpoint 
            ▪ Subtask 2.7.10.1: Design and implement POST /api/user/addresses. 
            ▪ Subtask 2.7.10.2: Authenticate the user. 
            ▪ Subtask 2.7.10.3: Implement server-side validation for all address fields. 
            ▪ Subtask 2.7.10.4: Generate a unique ID for the new address. 
            ▪ Subtask 2.7.10.5: Add the new address object to the shippingAddresses array in the user's document. 
        ◦ Task 2.7.11: Create Edit Address API Endpoint 
            ▪ Subtask 2.7.11.1: Design and implement PUT /api/user/addresses/:addressId. 
            ▪ Subtask 2.7.11.2: Authenticate the user and verify addressId belongs to the user. 
            ▪ Subtask 2.7.11.3: Implement server-side validation for updated address fields. 
            ▪ Subtask 2.7.11.4: Find and update the specific address object within the shippingAddresses array in the user's document. 
        ◦ Task 2.7.12: Create Delete Address API Endpoint 
            ▪ Subtask 2.7.12.1: Design and implement DELETE /api/user/addresses/:addressId. 
            ▪ Subtask 2.7.12.2: Authenticate the user and verify addressId belongs to the user. 
            ▪ Subtask 2.7.12.3: Implement logic to prevent deletion if the address is linked to a pending order (this would involve querying the Order collection, which is a stretch goal/future enhancement). For now, simply remove. 
            ▪ Subtask 2.7.12.4: Remove the address object from the shippingAddresses array in the user's document. 
        ◦ Task 2.7.13: Error Handling & Security (Backend) 
            ▪ Subtask 2.7.13.1: Implement robust error handling for invalid data, non-existent addresses, or unauthorized access. 
            ▪ Subtask 2.7.13.2: Ensure all address operations correctly verify the user's ownership of the address. 
    • Testing Tasks:
        ◦ Task 2.7.14: Write Unit Tests 
            ▪ Subtask 2.7.14.1: Unit tests for frontend form validation. 
            ▪ Subtask 2.7.14.2: Unit tests for backend address manipulation logic. 
        ◦ Task 2.7.15: Write Integration Tests 
            ▪ Subtask 2.7.15.1: Test GET /api/user/addresses for authenticated users. 
            ▪ Subtask 2.7.15.2: Test POST /api/user/addresses with valid and invalid data. 
            ▪ Subtask 2.7.15.3: Test PUT /api/user/addresses/:addressId with valid updates, invalid data, and incorrect address ID. 
            ▪ Subtask 2.7.15.4: Test DELETE /api/user/addresses/:addressId for own addresses and attempts to delete others' addresses. 
            ▪ Subtask 2.7.15.5: Test unauthorized access to all address endpoints. 
        ◦ Task 2.7.16: Manual End-to-End Testing 
            ▪ Subtask 2.7.16.1: Log in and navigate to "My Addresses". 
            ▪ Subtask 2.7.16.2: Add a new address, verify it appears in the list. 
            ▪ Subtask 2.7.16.3: Edit an existing address, verify changes. 
            ▪ Subtask 2.7.16.4: Delete an address, verify removal from list. 
            ▪ Subtask 2.7.16.5: Test all client-side validation messages. 
            ▪ Subtask 2.7.16.6: Test error messages for failed operations.
Epic: Customer Account Management
Story 2.8: View Order History (Customer)
Story: As a logged-in customer, I want to view a list of all my past orders so that I can keep track of my purchases.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "My Orders" or "Order History" section is accessible from the customer's account dashboard/menu. 
    2. This section displays a paginated list of all orders placed by the logged-in customer. 
    3. For each order in the list, the following high-level details are displayed: 
        ◦ Order Number/ID 
        ◦ Order Date 
        ◦ Total Amount 
        ◦ Order Status (e.g., "Pending", "Processing", "Shipped", "Delivered", "Cancelled") 
        ◦ A "View Details" button/link to see the full order details. 
    4. Orders are displayed in reverse chronological order (newest first) by default. 
    5. All order history retrieval is performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.8:
    • Frontend Tasks:
        ◦ Task 2.8.1: Implement "My Orders" Page UI 
            ▪ Subtask 2.8.1.1: Create MyOrdersPage component/route accessible via authenticated routes. 
            ▪ Subtask 2.8.1.2: Design and implement a table or list layout to display order summaries. 
            ▪ Subtask 2.8.1.3: Add "View Details" link/button for each order row. 
            ▪ Subtask 2.8.1.4: Add navigation link to "My Orders" in the customer dashboard/menu. 
        ◦ Task 2.8.2: Implement Pagination UI for Orders 
            ▪ Subtask 2.8.2.1: Reuse/adapt Pagination component from Story 1.1. 
            ▪ Subtask 2.8.2.2: Integrate pagination controls with the order list. 
        ◦ Task 2.8.3: Frontend API Integration: Fetch Order History 
            ▪ Subtask 2.8.3.1: Create service/hook to fetch user's orders from GET /api/user/orders. 
            ▪ Subtask 2.8.3.2: Pass pagination parameters (page, limit) and sorting parameters (sortBy, sortOrder). 
            ▪ Subtask 2.8.3.3: Map fetched order data to the UI. 
            ▪ Subtask 2.8.3.4: Handle loading states and display "No orders found" message. 
        ◦ Task 2.8.4: Display Order Summary Details 
            ▪ Subtask 2.8.4.1: Ensure Order Number, Order Date, Total Amount, and Order Status are displayed for each order. 
    • Backend Tasks:
        ◦ Task 2.8.5: Create Fetch Order History API Endpoint 
            ▪ Subtask 2.8.5.1: Design and implement GET /api/user/orders. 
            ▪ Subtask 2.8.5.2: Authenticate the user. 
            ▪ Subtask 2.8.5.3: Query the Order collection in MongoDB, filtering by the authenticated userId. 
            ▪ Subtask 2.8.5.4: Implement pagination logic (skip/limit) on the query. 
            ▪ Subtask 2.8.5.5: Implement default sorting by orderDate (descending/newest first). 
            ▪ Subtask 2.8.5.6: Selectively return only the summary fields required by the frontend (Order ID, Date, Total, Status). 
            ▪ Subtask 2.8.5.7: Return total order count for pagination. 
        ◦ Task 2.8.6: Ensure Order Data Model Supports Querying 
            ▪ Subtask 2.8.6.1: Verify Order collection schema includes userId, orderDate, totalAmount, status, orderNumber/ID. (This assumes Order model is already defined from Epic 3: Checkout Process). 
            ▪ Subtask 2.8.6.2: Ensure appropriate indexes are on userId and orderDate for efficient querying. 
        ◦ Task 2.8.7: Error Handling & Security (Backend) 
            ▪ Subtask 2.8.7.1: Implement robust error handling for database queries. 
            ▪ Subtask 2.8.7.2: Crucially, ensure a user can only fetch their own orders, never another user's. 
    • Testing Tasks:
        ◦ Task 2.8.8: Write Unit Tests 
            ▪ Subtask 2.8.8.1: Unit tests for frontend order display logic. 
            ▪ Subtask 2.8.8.2: Unit tests for backend order filtering by userId and sorting. 
        ◦ Task 2.8.9: Write Integration Tests 
            ▪ Subtask 2.8.9.1: Test GET /api/user/orders for an authenticated user with existing orders. 
            ▪ Subtask 2.8.9.2: Test for a user with no orders (expect empty list). 
            ▪ Subtask 2.8.9.3: Test with pagination parameters. 
            ▪ Subtask 2.8.9.4: Test unauthorized access (should return 401/403). 
            ▪ Subtask 2.8.9.5: Attempt to fetch orders for a different user ID (should fail). 
        ◦ Task 2.8.10: Manual End-to-End Testing 
            ▪ Subtask 2.8.10.1: Log in as a customer and navigate to "My Orders". 
            ▪ Subtask 2.8.10.2: Verify the list of past orders is displayed correctly. 
            ▪ Subtask 2.8.10.3: Check pagination if multiple pages of orders exist. 
            ▪ Subtask 2.8.10.4: Verify correct summary details are shown for each order. 
            ▪ Subtask 2.8.10.5: Test viewing as a user with no orders.
Story 2.9: View Order Details (Customer)
Story: As a logged-in customer, I want to view the full details of a specific past order so that I can see what I purchased, where it was shipped, and its current status.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. Clicking "View Details" from an order in the "Order History" list (Story 2.8) navigates the customer to a dedicated "Order Details" page for that order. 
    2. The URL for the order details page is unique (e.g., /my-account/orders/:orderId). 
    3. The page displays comprehensive information for the specific order, including: 
        ◦ Order Number/ID 
        ◦ Order Date 
        ◦ Total Amount 
        ◦ Order Status 
        ◦ Shipping Address (full details) 
        ◦ Billing Address (full details) 
        ◦ Payment Method Used (e.g., "PayPal", "Card ending in ****1234") - Note: Never full card details. 
        ◦ A list of all purchased items (Product Name, Image, Quantity, Unit Price, Line Total). 
        ◦ Subtotal, Shipping Cost, Tax, Discounts applied. 
    4. If available, a tracking number and link are displayed for shipped orders. 
    5. All order details retrieval is performed securely via authenticated API endpoints. 

Granular Tasks & Subtasks for Story 2.9:
    • Frontend Tasks:
        ◦ Task 2.9.1: Develop Order Details Page UI Layout 
            ▪ Subtask 2.9.1.1: Create OrderDetailsPage component/route accessible via authenticated routes. 
            ▪ Subtask 2.9.1.2: Design and implement sections for Order Summary, Shipping/Billing Addresses, Payment Info, and Ordered Items list. 
            ▪ Subtask 2.9.1.3: Implement UI for displaying tracking number and link. 
        ◦ Task 2.9.2: Implement Frontend API Integration for Order Details 
            ▪ Subtask 2.9.2.1: Create service/hook to fetch single order by ID from GET /api/user/orders/:orderId. 
            ▪ Subtask 2.9.2.2: Pass orderId extracted from the URL. 
            ▪ Subtask 2.9.2.3: Handle loading states and display "Order Not Found" or "Unauthorized" errors gracefully. 
        ◦ Task 2.9.3: Dynamic Content Rendering for Order Details 
            ▪ Subtask 2.9.3.1: Display all top-level order details (Order Number, Date, Total, Status, Shipping/Billing, Payment Method). 
            ▪ Subtask 2.9.3.2: Iterate through ordered items and display product details (Name, Image, Quantity, Unit Price, Line Total). 
            ▪ Subtask 2.9.3.3: Conditionally display tracking information if present. 
            ▪ Subtask 2.9.3.4: Display breakdown of Subtotal, Shipping, Tax, Discounts. 
        ◦ Task 2.9.4: Link from Order History to Order Details 
            ▪ Subtask 2.9.4.1: Ensure "View Details" button/link in MyOrdersPage (Story 2.8) correctly navigates to the OrderDetailsPage with the correct orderId. 
    • Backend Tasks:
        ◦ Task 2.9.5: Create Fetch Single Order Details API Endpoint 
            ▪ Subtask 2.9.5.1: Design and implement GET /api/user/orders/:orderId. 
            ▪ Subtask 2.9.5.2: Authenticate the user. 
            ▪ Subtask 2.9.5.3: Query the Order collection by _id (or orderNumber if preferred) for the authenticated userId. This is critical for security. 
            ▪ Subtask 2.9.5.4: Populate necessary nested data (e.g., product details for ordered items, so product names and images are available without extra lookups). 
            ▪ Subtask 2.9.5.5: Return all comprehensive order details as specified in ACs, ensuring no sensitive payment details are exposed. 
        ◦ Task 2.9.6: Verify Order Data Model for Comprehensive Details 
            ▪ Subtask 2.9.6.1: Confirm Order collection schema includes: shippingAddress, billingAddress, paymentMethod (type, last 4 digits), items array (with productId, productName, quantity, unitPrice, productImage), subtotal, shippingCost, taxAmount, discountAmount, trackingNumber, trackingLink. (This confirms the model defined in Epic 3 will support these details). 
        ◦ Task 2.9.7: Error Handling & Security (Backend) 
            ▪ Subtask 2.9.7.1: Implement robust error handling (e.g., HTTP 404 for non-existent order, HTTP 403 for order not belonging to user). 
            ▪ Subtask 2.9.7.2: Ensure stringent authorization: a user can only retrieve details for their own orders. 
    • Testing Tasks:
        ◦ Task 2.9.8: Write Unit Tests 
            ▪ Subtask 2.9.8.1: Unit tests for frontend data parsing and display logic. 
            ▪ Subtask 2.9.8.2: Unit tests for backend order retrieval logic with userId and orderId filtering. 
        ◦ Task 2.9.9: Write Integration Tests 
            ▪ Subtask 2.9.9.1: Test GET /api/user/orders/:orderId for an authenticated user with a valid order ID. 
            ▪ Subtask 2.9.9.2: Test with an invalid orderId (expect 404). 
            ▪ Subtask 2.9.9.3: Test with a valid orderId but belonging to another user (expect 403 Forbidden). 
            ▪ Subtask 2.9.9.4: Verify all specified fields are returned correctly. 
        ◦ Task 2.9.10: Manual End-to-End Testing 
            ▪ Subtask 2.9.10.1: Log in and navigate to "My Orders". 
            ▪ Subtask 2.9.10.2: Click "View Details" on a past order. 
            ▪ Subtask 2.9.10.3: Verify all order details (summary, addresses, payment, items, totals, tracking) are displayed accurately. 
            ▪ Subtask 2.9.10.4: Test cases with different order statuses and content (e.g., order with discount, order with multiple items). 
            ▪ Subtask 2.9.10.5: Attempt to directly access an order URL with an invalid ID or an ID belonging to another user.
Epic: Checkout Process
Story 3.1: Add Product to Cart (Customer)
Story: As a customer, I want to add products from the product list or details page to my shopping cart so that I can proceed to checkout.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. An "Add to Cart" button is prominently displayed on both the Product List page (for each product card) and the Product Details page. 
    2. Clicking "Add to Cart" adds the selected product to the customer's shopping cart. 
    3. If a product is out of stock, the "Add to Cart" button is disabled (as per Story 1.2). 
    4. If the product is successfully added, a visual confirmation is provided (e.g., a mini-cart update, a small toast notification, or a brief animation). 
    5. The quantity of items in the cart (e.g., an icon in the header) is updated in real-time. 
    6. Customers can add multiple units of the same product to the cart (if stock allows). 
    7. The cart content is persistent, ideally across sessions (for logged-in users) or based on browser storage (for guests). 
    8. Adding an already-in-cart item should increment its quantity, not add a duplicate entry. 

Granular Tasks & Subtasks for Story 3.1:
    • Frontend Tasks:
        ◦ Task 3.1.1: Implement "Add to Cart" Button UI 
            ▪ Subtask 3.1.1.1: Ensure "Add to Cart" button is present on ProductCard (from Story 1.1) and ProductDetailsPage (from Story 1.2). 
            ▪ Subtask 3.1.1.2: Implement logic to disable button if product stockQuantity is 0. 
            ▪ Subtask 3.1.1.3: For Product Details page, implement a quantity selector (input field/+/- buttons) alongside the "Add to Cart" button. 
        ◦ Task 3.1.2: Implement Mini-Cart / Cart Icon in Header 
            ▪ Subtask 3.1.2.1: Design and implement a shopping cart icon (e.g., a basket) in the global header. 
            ▪ Subtask 3.1.2.2: Implement a badge/number overlay on the icon to display the current total quantity of items in the cart. 
            ▪ Subtask 3.1.2.3: Ensure the icon links to the main cart page (Story 3.2). 
        ◦ Task 3.1.3: Frontend API Integration for Adding to Cart 
            ▪ Subtask 3.1.3.1: Create service/hook to send productId and quantity to POST /api/cart/add. 
            ▪ Subtask 3.1.3.2: Handle success response by updating the mini-cart count. 
            ▪ Subtask 3.1.3.3: Implement visual confirmation (toast notification or subtle animation). 
            ▪ Subtask 3.1.3.4: Handle error responses (e.g., "Not enough stock," "Product not found"). 
        ◦ Task 3.1.4: Client-Side Cart State Management 
            ▪ Subtask 3.1.4.1: Implement a global state management solution (e.g., Redux, Zustand, React Context) to store the current cart state (item count, potentially item details). 
            ▪ Subtask 3.1.4.2: Update the cart state after POST /api/cart/add success. 
            ▪ Subtask 3.1.4.3: On initial page load, fetch current cart state to populate mini-cart. 
    • Backend Tasks:
        ◦ Task 3.1.5: Design Cart Data Model 
            ▪ Subtask 3.1.5.1: Define MongoDB schema for Cart collection. 
            ▪ Subtask 3.1.5.2: Cart should include userId (optional for guests), sessionId (for guests), items array. 
            ▪ Subtask 3.1.5.3: Each item in the array should contain productId, name, image, price, quantity, subtotal. 
            ▪ Subtask 3.1.5.4: Include createdAt, updatedAt for cart lifetime management. 
        ◦ Task 3.1.6: Create Add to Cart API Endpoint 
            ▪ Subtask 3.1.6.1: Design and implement POST /api/cart/add. 
            ▪ Subtask 3.1.6.2: Authenticate user (if logged in) or identify by session ID (for guests). 
            ▪ Subtask 3.1.6.3: Server-side validation for productId and quantity. 
            ▪ Subtask 3.1.6.4: Fetch product details (price, stock, image, name) from Product collection. 
            ▪ Subtask 3.1.6.5: Check product availability/stock: If quantity requested exceeds stockQuantity, return an error. 
            ▪ Subtask 3.1.6.6: If product already exists in cart, increment quantity of existing item. 
            ▪ Subtask 3.1.6.7: If product is new to cart, add a new item entry. 
            ▪ Subtask 3.1.6.8: Save/update the Cart document in MongoDB. 
            ▪ Subtask 3.1.6.9: Return updated cart summary (e.g., total item count, total price). 
        ◦ Task 3.1.7: Implement Guest Cart Management 
            ▪ Subtask 3.1.7.1: Implement logic to generate and manage a sessionId for guest users. 
            ▪ Subtask 3.1.7.2: Store sessionId in a secure, HTTP-only cookie or similar mechanism. 
            ▪ Subtask 3.1.7.3: When a guest logs in, merge their guest cart with their existing user cart (or transfer items if user has no active cart). 
        ◦ Task 3.1.8: Create Get Cart Details API Endpoint (for initial load) 
            ▪ Subtask 3.1.8.1: Design and implement GET /api/cart. 
            ▪ Subtask 3.1.8.2: Authenticate user or identify by session ID. 
            ▪ Subtask 3.1.8.3: Return the current cart contents (items and summary). 
    • Testing Tasks:
        ◦ Task 3.1.9: Write Unit Tests 
            ▪ Subtask 3.1.9.1: Unit tests for frontend cart state update logic. 
            ▪ Subtask 3.1.9.2: Unit tests for backend cart logic (add new item, increment existing, stock check). 
        ◦ Task 3.1.10: Write Integration Tests 
            ▪ Subtask 3.1.10.1: Test POST /api/cart/add with valid product and quantity. 
            ▪ Subtask 3.1.10.2: Test adding same product multiple times. 
            ▪ Subtask 3.1.10.3: Test adding product when out of stock. 
            ▪ Subtask 3.1.10.4: Test GET /api/cart for empty and populated carts. 
            ▪ Subtask 3.1.10.5: Test guest cart persistence across requests (using session ID). 
            ▪ Subtask 3.1.10.6: Test merging guest cart upon login. 
        ◦ Task 3.1.11: Manual End-to-End Testing 
            ▪ Subtask 3.1.11.1: Test adding products from list page and details page. 
            ▪ Subtask 3.1.11.2: Verify mini-cart updates in header. 
            ▪ Subtask 3.1.11.3: Test adding multiple quantities of the same item. 
            ▪ Subtask 3.1.11.4: Test "Add to Cart" for out-of-stock items (button disabled/error). 
            ▪ Subtask 3.1.11.5: Test adding items as a guest, then logging in to verify cart merge.
Epic: Checkout Process
Story 3.2: View & Manage Cart (Customer)
Story: As a customer, I want to view the items in my shopping cart, update quantities, and remove items so that I can review and adjust my order before proceeding to checkout.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "View Cart" link/button is prominently available (e.g., from the mini-cart in the header). 
    2. The cart page displays all items in the cart with the following details: 
        ◦ Product Name 
        ◦ Product Image 
        ◦ Quantity 
        ◦ Unit Price 
        ◦ Subtotal (for each item) 
        ◦ Total Price (for all items in the cart) 
    3. Customers can update the quantity of each item. 
        ◦ Quantity input fields or +/- buttons are provided. 
        ◦ Updates are reflected in the subtotal and total price. 
    4. Customers can remove items from the cart. 
        ◦ A "Remove" button or icon is provided for each item. 
        ◦ Removal updates the subtotal and total price. 
    5. If the cart is empty, a clear message (e.g., "Your cart is empty") is displayed. 
    6. A "Proceed to Checkout" button is available when the cart is not empty. 
    7. The cart page should be accessible for both logged-in users and guest users (using session-based persistence). 
    8. The cart page is responsive and usable on various devices. 

Granular Tasks & Subtasks for Story 3.2:
    • Frontend Tasks:
        ◦ Task 3.2.1: Implement Cart Page UI Layout 
            ▪ Subtask 3.2.1.1: Create CartPage component/route. 
            ▪ Subtask 3.2.1.2: Display items in a table or list format. 
            ▪ Subtask 3.2.1.3: Include columns/sections for Product Image, Name, Quantity, Unit Price, Subtotal, Remove. 
            ▪ Subtask 3.2.1.4: Display total price below the item list. 
            ▪ Subtask 3.2.1.5: Add "Proceed to Checkout" button. 
            ▪ Subtask 3.2.1.6: Display "Empty Cart" message when applicable. 
        ◦ Task 3.2.2: Implement Quantity Update Functionality 
            ▪ Subtask 3.2.2.1: Use input fields or +/- buttons for quantity selection. 
            ▪ Subtask 3.2.2.2: Implement real-time subtotal and total price updates as quantity changes. 
            ▪ Subtask 3.2.2.3: Implement client-side validation (e.g., prevent negative quantities). 
        ◦ Task 3.2.3: Implement Item Removal Functionality 
            ▪ Subtask 3.2.3.1: Add "Remove" button/icon for each item. 
            ▪ Subtask 3.2.3.2: Implement confirmation dialog before removal (optional, but recommended). 
            ▪ Subtask 3.2.3.3: Update total price after item removal. 
        ◦ Task 3.2.4: Frontend API Integration: Fetch Cart Details 
            ▪ Subtask 3.2.4.1: Reuse GET /api/cart service/hook from Story 3.1 to fetch cart data. 
            ▪ Subtask 3.2.4.2: Display cart items and total price. 
            ▪ Subtask 3.2.4.3: Handle loading states and empty cart scenario. 
        ◦ Task 3.2.5: Frontend API Integration: Update Cart Item Quantity 
            ▪ Subtask 3.2.5.1: Create service/hook to send productId and quantity to PUT /api/cart/update. 
            ▪ Subtask 3.2.5.2: Update cart display on success. 
        ◦ Task 3.2.6: Frontend API Integration: Remove Cart Item 
            ▪ Subtask 3.2.6.1: Create service/hook to send productId to DELETE /api/cart/remove. 
            ▪ Subtask 3.2.6.2: Update cart display on success. 
    • Backend Tasks:
        ◦ Task 3.2.7: Create Update Cart Item Quantity API Endpoint 
            ▪ Subtask 3.2.7.1: Design and implement PUT /api/cart/update. 
            ▪ Subtask 3.2.7.2: Authenticate user or identify by session ID. 
            ▪ Subtask 3.2.7.3: Server-side validation for productId and quantity. 
            ▪ Subtask 3.2.7.4: Update the quantity of the specified productId in the Cart document. 
            ▪ Subtask 3.2.7.5: Recalculate and update the item's subtotal and the cart's totalPrice. 
            ▪ Subtask 3.2.7.6: Return updated cart summary. 
        ◦ Task 3.2.8: Create Remove Cart Item API Endpoint 
            ▪ Subtask 3.2.8.1: Design and implement DELETE /api/cart/remove. 
            ▪ Subtask 3.2.8.2: Authenticate user or identify by session ID. 
            ▪ Subtask 3.2.8.3: Remove the specified productId from the items array in the Cart document. 
            ▪ Subtask 3.2.8.4: Recalculate and update the cart's totalPrice. 
            ▪ Subtask 3.2.8.5: Return updated cart summary. 
    • Testing Tasks:
        ◦ Task 3.2.9: Write Unit Tests 
            ▪ Subtask 3.2.9.1: Unit tests for frontend quantity update and removal logic. 
            ▪ Subtask 3.2.9.2: Unit tests for backend cart update and removal logic. 
        ◦ Task 3.2.10: Write Integration Tests 
            ▪ Subtask 3.2.10.1: Test GET /api/cart to verify cart details are displayed correctly. 
            ▪ Subtask 3.2.10.2: Test PUT /api/cart/update with valid and invalid quantities. 
            ▪ Subtask 3.2.10.3: Test DELETE /api/cart/remove for removing single and multiple items. 
            ▪ Subtask 3.2.10.4: Verify total price updates correctly after quantity changes and removals. 
            ▪ Subtask 3.2.10.5: Test empty cart display. 
        ◦ Task 3.2.11: Manual End-to-End Testing 
            ▪ Subtask 3.2.11.1: Add multiple products to the cart (from Story 3.1). 
            ▪ Subtask 3.2.11.2: Navigate to the cart page. 
            ▪ Subtask 3.2.11.3: Verify all items are displayed with correct details. 
            ▪ Subtask 3.2.11.4: Test updating quantities, verify subtotal and total price updates. 
            ▪ Subtask 3.2.11.5: Test removing items, verify total price updates. 
            ▪ Subtask 3.2.11.6: Test proceeding to checkout (button should be enabled if cart is not empty). 
            ▪ Subtask 3.2.11.7: Test the empty cart message.
Epic: Checkout Process
Story 3.3: Shipping Address Selection (Customer)
Story: As a customer, I want to select a shipping address from my saved addresses or add a new one during the checkout process so that my order is delivered to the correct location.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. During the checkout process, the customer is presented with a list of their saved shipping addresses (from Story 2.7). 
    2. The customer can select one of these addresses as the shipping address for the order. 
    3. An option to "Add New Address" is available, which presents the same address form as in Story 2.7. 
    4. If the customer adds a new address, it's saved to their account and selected for the current order. 
    5. The selected shipping address is clearly displayed to the customer. 
    6. The customer can edit the selected address (which updates their saved address). 
    7. The customer can select a different address from the list or add a new one at any point during checkout. 
    8. All address operations are performed securely. 

Granular Tasks & Subtasks for Story 3.3:
    • Frontend Tasks:
        ◦ Task 3.3.1: Integrate Shipping Address Selection into Checkout UI 
            ▪ Subtask 3.3.1.1: Add a "Shipping Address" section to the checkout page (we'll assume a multi-step checkout flow). 
            ▪ Subtask 3.3.1.2: Display a list of the customer's saved addresses (reuse the UI elements from Story 2.7). 
            ▪ Subtask 3.3.1.3: Allow the customer to select an address (e.g., using radio buttons). 
            ▪ Subtask 3.3.1.4: Display the selected address prominently. 
        ◦ Task 3.3.2: Implement "Add New Address" Functionality in Checkout 
            ▪ Subtask 3.3.2.1: Reuse the AddressForm component from Story 2.7. 
            ▪ Subtask 3.3.2.2: Integrate the form into the checkout flow (e.g., in a modal or expandable section). 
            ▪ Subtask 3.3.2.3: After successful submission, save the new address (using the existing API endpoint from Story 2.7) and select it for the order. 
        ◦ Task 3.3.3: Implement "Edit Address" Functionality in Checkout 
            ▪ Subtask 3.3.3.1: Provide an "Edit" button/link for each address in the list. 
            ▪ Subtask 3.3.3.2: Reuse the AddressForm component (pre-filled with the selected address). 
            ▪ Subtask 3.3.3.3: After successful submission, update the saved address (using the existing API endpoint from Story 2.7) and update the displayed address. 
        ◦ Task 3.3.4: Frontend API Integration: Fetch Addresses 
            ▪ Subtask 3.3.4.1: Reuse the GET /api/user/addresses service/hook from Story 2.7 to fetch the customer's saved addresses. 
            ▪ Subtask 3.3.4.2: Display the fetched addresses in the list. 
        ◦ Task 3.3.5: Frontend State Management for Selected Address 
            ▪ Subtask 3.3.5.1: Use a global state management solution (e.g., Redux, Zustand, React Context) to store the currently selected shipping address during the checkout process. 
            ▪ Subtask 3.3.5.2: Update this state when the customer selects an address or adds/edits one. 
    • Backend Tasks:
        ◦ Task 3.3.6: No new backend tasks are strictly required. We will reuse the existing API endpoints from Story 2.7 (GET /api/user/addresses, POST /api/user/addresses, PUT /api/user/addresses/:addressId). 
        ◦ Task 3.3.7: However, we need to ensure that the Order model (from Epic 3 introduction) includes a shippingAddress field. This field should store a snapshot of the shipping address details (Full Name, Address Line 1, Address Line 2, City, State/Province, Postal Code, Country, Phone Number) at the time the order was placed. This ensures order history is accurate even if the user later edits or deletes their saved address. 
    • Testing Tasks:
        ◦ Task 3.3.8: Write Unit Tests 
            ▪ Subtask 3.3.8.1: Unit tests for frontend logic related to address selection and display. 
        ◦ Task 3.3.9: Write Integration Tests 
            ▪ Subtask 3.3.9.1: Test the integration of the address selection UI with the existing address management API endpoints. 
            ▪ Subtask 3.3.9.2: Test adding a new address during checkout and selecting it. 
            ▪ Subtask 3.3.9.3: Test editing an address during checkout and verifying the changes. 
        ◦ Task 3.3.10: Manual End-to-End Testing 
            ▪ Subtask 3.3.10.1: Add several shipping addresses to a user account (using the "My Addresses" page from Story 2.7). 
            ▪ Subtask 3.3.10.2: Add a product to the cart and proceed to checkout. 
            ▪ Subtask 3.3.10.3: Verify the list of saved addresses is displayed. 
            ▪ Subtask 3.3.10.4: Select an existing address. 
            ▪ Subtask 3.3.10.5: Add a new address during checkout and select it. 
            ▪ Subtask 3.3.10.6: Edit an existing address during checkout. 
            ▪ Subtask 3.3.10.7: Ensure the selected address is correctly displayed throughout the checkout process.
Epic: Checkout Process
Story 3.4: Billing Address Selection (Customer)
Story: As a customer, I want to select a billing address from my saved addresses, or add a new one, or use my shipping address during checkout, so that the correct address is associated with my payment.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. During the checkout process, after shipping address selection, the customer is presented with options for their billing address. 
    2. An option to "Use Shipping Address as Billing Address" is prominently displayed and selected by default. 
    3. If this option is deselected, a list of the customer's saved addresses is displayed (from Story 2.7). 
    4. The customer can select one of these addresses as the billing address for the order. 
    5. An option to "Add New Address" is available, which presents the same address form as in Story 2.7. 
    6. If the customer adds a new address, it's saved to their account and selected for the current order. 
    7. The selected billing address is clearly displayed to the customer. 
    8. The customer can edit the selected address (which updates their saved address). 
    9. All address operations are performed securely. 

Granular Tasks & Subtasks for Story 3.4:
    • Frontend Tasks:
        ◦ Task 3.4.1: Integrate Billing Address Selection into Checkout UI 
            ▪ Subtask 3.4.1.1: Add a "Billing Address" section to the checkout page (after shipping address). 
            ▪ Subtask 3.4.1.2: Implement a checkbox/toggle for "Use Shipping Address as Billing Address". 
            ▪ Subtask 3.4.1.3: Conditionally display the list of saved addresses (reusing UI from Story 3.3/2.7) if the "Use Shipping Address" option is deselected. 
            ▪ Subtask 3.4.1.4: Allow selection of an address from the list. 
            ▪ Subtask 3.4.1.5: Display the selected billing address prominently. 
        ◦ Task 3.4.2: Implement "Add New Address" Functionality in Checkout for Billing 
            ▪ Subtask 3.4.2.1: Reuse the AddressForm component from Story 2.7/3.3. 
            ▪ Subtask 3.4.2.2: Integrate the form into the checkout flow for billing addresses. 
            ▪ Subtask 3.4.2.3: After successful submission, save the new address (using existing API) and select it as the billing address for the current order. 
        ◦ Task 3.4.3: Implement "Edit Address" Functionality in Checkout for Billing 
            ▪ Subtask 3.4.3.1: Provide an "Edit" button/link for each billing address. 
            ▪ Subtask 3.4.3.2: Reuse the AddressForm component (pre-filled with the selected address). 
            ▪ Subtask 3.4.3.3: After successful submission, update the saved address (using existing API) and update the displayed address. 
        ◦ Task 3.4.4: Frontend API Integration: Fetch Addresses (Reuse) 
            ▪ Subtask 3.4.4.1: Reuse GET /api/user/addresses service/hook from Story 2.7/3.3 to fetch the customer's saved addresses for billing options. 
        ◦ Task 3.4.5: Frontend State Management for Selected Billing Address 
            ▪ Subtask 3.4.5.1: Use global state to store the currently selected billing address during checkout. 
            ▪ Subtask 3.4.5.2: Update this state based on checkbox/selection changes. 
            ▪ Subtask 3.4.5.3: Implement logic to automatically set billing address to shipping address if the checkbox is checked. 
    • Backend Tasks:
        ◦ Task 3.4.6: No new backend API endpoints are strictly required. We will reuse existing address management APIs from Story 2.7. 
        ◦ Task 3.4.7: Ensure Order Model Includes billingAddress Field. 
            ▪ Subtask 3.4.7.1: Verify that the Order model (to be created in Epic 3: Checkout Process) includes a billingAddress field. This field should store a snapshot of the billing address details (Full Name, Address Line 1, Address Line 2, City, State/Province, Postal Code, Country, Phone Number) at the time the order was placed. 
    • Testing Tasks:
        ◦ Task 3.4.8: Write Unit Tests 
            ▪ Subtask 3.4.8.1: Unit tests for frontend logic controlling the "Use Shipping Address" checkbox and conditional display of address list. 
            ▪ Subtask 3.4.8.2: Unit tests for updating the billing address in the frontend state. 
        ◦ Task 3.4.9: Write Integration Tests 
            ▪ Subtask 3.4.9.1: Test the integration of the billing address selection UI with the existing address management API endpoints. 
            ▪ Subtask 3.4.9.2: Test adding a new billing address during checkout. 
            ▪ Subtask 3.4.9.3: Test editing an existing billing address during checkout. 
        ◦ Task 3.4.10: Manual End-to-End Testing 
            ▪ Subtask 3.4.10.1: Add products to cart and proceed to checkout. 
            ▪ Subtask 3.4.10.2: Select a shipping address. 
            ▪ Subtask 3.4.10.3: Verify "Use Shipping Address as Billing Address" checkbox is present. 
            ▪ Subtask 3.4.10.4: Test with the checkbox checked (verify shipping address is used as billing). 
            ▪ Subtask 3.4.10.5: Deselect the checkbox. Verify saved addresses are displayed. Select a different saved address. 
            ▪ Subtask 3.4.10.6: Add a brand new address as billing address. 
            ▪ Subtask 3.4.10.7: Edit a billing address during checkout. 
            ▪ Subtask 3.4.10.8: Ensure the final selected billing address is correctly reflected.
Epic: Checkout Process
Story 3.5: Shipping Method Selection (Customer)
Story: As a customer, I want to select a shipping method for my order and see its cost so that I can choose the delivery option that best suits my needs.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. During the checkout process, after the shipping address has been selected, the customer is presented with a list of available shipping methods. 
    2. Each shipping method displays its name (e.g., "Standard Shipping," "Express Shipping"), estimated delivery time, and cost. 
    3. The shipping options and their costs are dynamically calculated based on the selected shipping address and the contents of the cart (e.g., total weight, dimensions, value). 
    4. The customer can select one shipping method. 
    5. The total order cost (subtotal + shipping cost + tax + discounts) is updated in real-time to reflect the chosen shipping method. 
    6. The selected shipping method is clearly displayed. 
    7. All shipping method calculations are performed securely. 

Granular Tasks & Subtasks for Story 3.5:
    • Frontend Tasks:
        ◦ Task 3.5.1: Implement Shipping Method Selection UI 
            ▪ Subtask 3.5.1.1: Add a "Shipping Method" section to the checkout page. 
            ▪ Subtask 3.5.1.2: Design and implement a list/radio button group to display shipping options (Name, Estimated Delivery, Cost). 
            ▪ Subtask 3.5.1.3: Clearly display the currently selected shipping method. 
        ◦ Task 3.5.2: Frontend API Integration: Fetch Shipping Rates 
            ▪ Subtask 3.5.2.1: Create service/hook to call POST /api/shipping/calculate-rates (or similar) with the selected shipping address details and current cart contents. 
            ▪ Subtask 3.5.2.2: Make this API call whenever the shipping address changes or cart contents change (if applicable). 
            ▪ Subtask 3.5.2.3: Handle loading states while fetching rates. 
            ▪ Subtask 3.5.2.4: Display the returned shipping options. 
        ◦ Task 3.5.3: Update Order Summary with Selected Shipping Cost 
            ▪ Subtask 3.5.3.1: Implement logic to update the shippingCost in the frontend's global order summary state when a shipping method is selected. 
            ▪ Subtask 3.5.3.2: Ensure the total order cost (subtotal + shipping + tax + discounts) is recalculated and displayed dynamically. 
        ◦ Task 3.5.4: Frontend State Management for Selected Shipping Method 
            ▪ Subtask 3.5.4.1: Store the selected shipping method (ID, name, cost) in the frontend's checkout process state. 
    • Backend Tasks:
        ◦ Task 3.5.5: Design Shipping Method Data Model (Static/Configurable) 
            ▪ Subtask 3.5.5.1: Define how static shipping methods and their base rates will be stored (e.g., in a configuration file, or a ShippingMethod collection in MongoDB for admin configurability later). 
            ▪ Subtask 3.5.5.2: Model includes: id, name, estimatedDelivery, baseCost, criteria (e.g., min/max weight, min/max order value, restricted regions). 
        ◦ Task 3.5.6: Create Calculate Shipping Rates API Endpoint 
            ▪ Subtask 3.5.6.1: Design and implement POST /api/shipping/calculate-rates. 
            ▪ Subtask 3.5.6.2: This endpoint expects: cartContents (items with quantity, weight, dimensions, price), and shippingAddress (country, postal code). 
            ▪ Subtask 3.5.6.3: Implement logic to iterate through available shipping methods. 
            ▪ Subtask 3.5.6.4: For each method, apply rules/criteria based on cart content (total weight, value) and destination address (country, region). 
            ▪ Subtask 3.5.6.5: Calculate the final cost for eligible methods (e.g., baseCost + weight/dimension surcharges). 
            ▪ Subtask 3.5.6.6: Return a list of eligible shipping methods with their calculated costs. 
        ◦ Task 3.5.7: Integrate with Order Model 
            ▪ Subtask 3.5.7.1: Ensure the Order model includes fields for shippingMethod (name, cost, estimatedDelivery) to capture the chosen option at the time of order placement. 
    • Testing Tasks:
        ◦ Task 3.5.8: Write Unit Tests 
            ▪ Subtask 3.5.8.1: Unit tests for frontend UI updates when a shipping method is selected. 
            ▪ Subtask 3.5.8.2: Unit tests for backend shipping rate calculation logic (various cart contents, addresses, and method rules). 
        ◦ Task 3.5.9: Write Integration Tests 
            ▪ Subtask 3.5.9.1: Test POST /api/shipping/calculate-rates with diverse cart and address data (e.g., heavy items, light items, different countries). 
            ▪ Subtask 3.5.9.2: Verify correct shipping options and costs are returned. 
            ▪ Subtask 3.5.9.3: Test cases where no shipping methods are eligible (e.g., too heavy, unsupported region). 
        ◦ Task 3.5.10: Manual End-to-End Testing 
            ▪ Subtask 3.5.10.1: Add products to cart and proceed through shipping address selection. 
            ▪ Subtask 3.5.10.2: Verify shipping methods are displayed with costs. 
            ▪ Subtask 3.5.10.3: Select different shipping methods and verify the total order cost updates correctly. 
            ▪ Subtask 3.5.10.4: Change shipping address (if functionality is available earlier in flow) and verify shipping methods/costs dynamically update. 
            ▪ Subtask 3.5.10.5: Test edge cases (e.g., very heavy cart, international shipping if applicable).
Epic: Checkout Process
Story 3.6: Payment Method Selection (Customer)
Story: As a customer, I want to select a payment method (e.g., credit card, PayPal) and securely enter my payment details so that I can finalize my order.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. During the checkout process, after shipping method selection, the customer is presented with available payment options (e.g., "Credit Card," "PayPal," "Google Pay"). 
    2. Upon selecting a payment method: 
        ◦ Credit Card: Secure form fields for Card Number, Expiry Date, CVC/CVV, and Cardholder Name are displayed. These fields should be tokenized or handled directly by the payment gateway's client-side SDK. 
        ◦ Other Methods (e.g., PayPal): A button to redirect to the external payment provider's site is displayed. 
    3. Client-side validation is performed on credit card fields (e.g., valid number format, expiry date not in past). 
    4. No sensitive card data ever touches our backend server directly. 
    5. The payment method selection and input forms are responsive. 
    6. The customer's chosen payment method type is clearly displayed. 
    7. All payment operations are performed securely and in compliance with PCI DSS standards. 

Granular Tasks & Subtasks for Story 3.6:
    • Frontend Tasks:
        ◦ Task 3.6.1: Implement Payment Method Selection UI 
            ▪ Subtask 3.6.1.1: Add a "Payment Method" section to the checkout page. 
            ▪ Subtask 3.6.1.2: Design and implement radio buttons or clickable cards for various payment options (Credit Card, PayPal, Google Pay, etc.). 
            ▪ Subtask 3.6.1.3: Clearly indicate the selected payment method. 
        ◦ Task 3.6.2: Implement Credit Card Input UI (Stripe Elements) 
            ▪ Subtask 3.6.2.1: Integrate Stripe Elements (e.g., Card Element) into the credit card payment section. 
            ▪ Subtask 3.6.2.2: Implement client-side validation using Stripe's built-in validation features. 
            ▪ Subtask 3.6.2.3: Ensure no sensitive card data is handled by our frontend directly; let Stripe Elements handle tokenization. 
        ◦ Task 3.6.3: Implement Other Payment Method Buttons 
            ▪ Subtask 3.6.3.1: For methods like PayPal/Google Pay, implement buttons that initiate the redirect to the respective payment gateway. 
        ◦ Task 3.6.4: Frontend API Integration: Create Payment Intent (for Credit Card) 
            ▪ Subtask 3.6.4.1: Create a service/hook to call POST /api/payment/create-intent on the backend when the customer proceeds to payment. This call will initiate a Stripe Payment Intent. 
            ▪ Subtask 3.6.4.2: Pass order total, currency, and other relevant details. 
            ▪ Subtask 3.6.4.3: Handle the client_secret returned by the backend to confirm payment with Stripe. 
        ◦ Task 3.6.5: Frontend API Integration: Confirm Payment (for Credit Card) 
            ▪ Subtask 3.6.5.1: Use Stripe.js confirmCardPayment with the client_secret and Stripe Elements to finalize the credit card payment on the client side. 
            ▪ Subtask 3.6.5.2: Handle success (redirect to order confirmation) or failure (display error). 
        ◦ Task 3.6.6: Frontend State Management for Payment Details 
            ▪ Subtask 3.6.6.1: Store the selected payment method type in the checkout process state. 
            ▪ Subtask 3.6.6.2: Store any non-sensitive payment-related information needed (e.g., last 4 digits of card, card brand) for display. 
    • Backend Tasks:
        ◦ Task 3.6.7: Integrate Stripe SDK (Server-Side) 
            ▪ Subtask 3.6.7.1: Install and configure Stripe Node.js SDK (or equivalent for chosen backend language). 
            ▪ Subtask 3.6.7.2: Store Stripe API keys securely (environment variables). 
        ◦ Task 3.6.8: Create Payment Intent API Endpoint 
            ▪ Subtask 3.6.8.1: Design and implement POST /api/payment/create-intent. 
            ▪ Subtask 3.6.8.2: Authenticate the user. 
            ▪ Subtask 3.6.8.3: Retrieve the total order amount from the current cart/checkout session (do NOT trust frontend total). 
            ▪ Subtask 3.6.8.4: Call Stripe API to create a PaymentIntent. 
            ▪ Subtask 3.6.8.5: Return the client_secret from the Payment Intent to the frontend. 
        ◦ Task 3.6.9: Webhook Endpoint for Payment Status Updates 
            ▪ Subtask 3.6.9.1: Design and implement POST /api/stripe-webhook. 
            ▪ Subtask 3.6.9.2: Implement logic to verify Stripe webhook signatures for security. 
            ▪ Subtask 3.6.9.3: Handle payment_intent.succeeded, payment_intent.payment_failed, and other relevant Stripe events. 
            ▪ Subtask 3.6.9.4: Update order status in MongoDB based on webhook events (e.g., from "Pending Payment" to "Processing" or "Payment Failed"). This is crucial for reliable order processing. 
        ◦ Task 3.6.10: Update Order Model for Payment Details 
            ▪ Subtask 3.6.10.1: Ensure the Order model includes fields for paymentMethod (e.g., type, last4, brand, transactionId, paymentIntentId, paymentStatus). 
        ◦ Task 3.6.11: Error Handling & Security (Backend) 
            ▪ Subtask 3.6.11.1: Implement robust error handling for Stripe API calls. 
            ▪ Subtask 3.6.11.2: Ensure all payment-related operations are securely authenticated and authorized. 
    • Security & Compliance Tasks:
        ◦ Task 3.6.12: PCI DSS Compliance Considerations 
            ▪ Subtask 3.6.12.1: Review and ensure adherence to PCI DSS requirements for handling card data (by using Stripe Elements, sensitive data never hits our server). 
        ◦ Task 3.6.13: Environment Variables for API Keys 
            ▪ Subtask 3.6.13.1: Strictly use environment variables for all payment gateway API keys. 
    • Testing Tasks:
        ◦ Task 3.6.14: Write Unit Tests 
            ▪ Subtask 3.6.14.1: Unit tests for frontend payment method selection logic. 
            ▪ Subtask 3.6.14.2: Unit tests for backend payment intent creation logic (mocking Stripe API calls). 
            ▪ Subtask 3.6.14.3: Unit tests for webhook signature verification. 
        ◦ Task 3.6.15: Write Integration Tests 
            ▪ Subtask 3.6.15.1: Test POST /api/payment/create-intent for various order totals. 
            ▪ Subtask 3.6.15.2: Simulate Stripe webhook events (succeeded, failed) and verify order status updates in DB. 
            ▪ Subtask 3.6.15.3: Use Stripe's test card numbers to test payment confirmation flow end-to-end. 
        ◦ Task 3.6.16: Manual End-to-End Testing 
            ▪ Subtask 3.6.16.1: Add products to cart, proceed through address and shipping selection. 
            ▪ Subtask 3.6.16.2: Select "Credit Card," enter Stripe test card details, and submit. 
            ▪ Subtask 3.6.16.3: Verify successful payment and redirection to order confirmation. 
            ▪ Subtask 3.6.16.4: Test with failing credit card details (e.g., expired card). 
            ▪ Subtask 3.6.16.5: Test "Other" payment methods (e.g., PayPal redirect - though actual PayPal payment is a separate story). 
            ▪ Subtask 3.6.16.6: Verify error messages for invalid inputs or payment failures.
Epic: Checkout Process
Story 3.7: Place Order (Customer)
Story: As a customer, I want to review my complete order details and place my order so that my purchase is finalized and processed.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. After selecting a payment method, the customer is presented with a final "Order Review" screen. 
    2. This screen displays a comprehensive summary of the entire order: 
        ◦ All items in the cart (Product Name, Image, Quantity, Unit Price, Line Total). 
        ◦ Subtotal, Shipping Cost, Tax, Discounts applied, and Grand Total. 
        ◦ Selected Shipping Address. 
        ◦ Selected Billing Address. 
        ◦ Chosen Shipping Method. 
        ◦ Chosen Payment Method (type and last 4 digits for cards, or "PayPal" etc. - no sensitive details). 
    3. A prominent "Place Order" or "Confirm Order" button is available. 
    4. Clicking "Place Order" finalizes the order in the system, provided the payment was successful (or will be processed, e.g., for "Cash on Delivery" or redirecting to payment gateway). 
    5. Upon successful order placement, the customer is redirected to an "Order Confirmation" page. 
    6. A unique Order Number is generated and displayed to the customer on the confirmation page. 
    7. An order confirmation email is sent to the customer's registered email address. 
    8. The cart is cleared after successful order placement. 
    9. Stock levels of purchased products are updated in the inventory. 
    10. All order placement operations are performed securely and transactionally. 

Granular Tasks & Subtasks for Story 3.7:
    • Frontend Tasks:
        ◦ Task 3.7.1: Implement "Order Review" Page UI 
            ▪ Subtask 3.7.1.1: Create OrderReviewPage component/route. 
            ▪ Subtask 3.7.1.2: Design layout to display all final order details (cart items, addresses, shipping, payment, totals). 
            ▪ Subtask 3.7.1.3: Add "Place Order" or "Confirm Order" button. 
        ◦ Task 3.7.2: Aggregate & Display Final Order Data 
            ▪ Subtask 3.7.2.1: Retrieve all accumulated checkout state (cart items, selected shipping address, selected billing address, chosen shipping method, chosen payment method, calculated totals). 
            ▪ Subtask 3.7.2.2: Present this data clearly and readably. 
        ◦ Task 3.7.3: Implement "Order Confirmation" Page UI 
            ▪ Subtask 3.7.3.1: Create OrderConfirmationPage component/route (e.g., /order-confirmation/:orderId). 
            ▪ Subtask 3.7.3.2: Display a success message and the unique Order Number. 
            ▪ Subtask 3.7.3.3: Provide links to "View Order Details" (from Story 2.9) and "Continue Shopping". 
        ◦ Task 3.7.4: Frontend API Integration: Place Order 
            ▪ Subtask 3.7.4.1: Create service/hook to send final order data to POST /api/orders/place-order. 
            ▪ Subtask 3.7.4.2: This endpoint will typically be called after a successful payment intent confirmation (for credit card) or immediately for other methods. 
            ▪ Subtask 3.7.4.3: Handle success response (redirect to OrderConfirmationPage). 
            ▪ Subtask 3.7.4.4: Handle error responses (display generic error, suggest contacting support). 
        ◦ Task 3.7.5: Clear Cart on Frontend 
            ▪ Subtask 3.7.5.1: After successful order placement, update frontend cart state to be empty. 
    • Backend Tasks:
        ◦ Task 3.7.6: Design Order Data Model (Comprehensive) 
            ▪ Subtask 3.7.6.1: Define or finalize the MongoDB schema for Order collection. 
            ▪ It must include: _id (auto-generated), userId, orderNumber (unique, human-readable), orderDate, status (e.g., 'Pending', 'Processing', 'Payment Failed'), items (array of objects: productId, name, image, quantity, unitPrice), shippingAddress (snapshot), billingAddress (snapshot), shippingMethod (name, cost), paymentMethod (type, last4, brand, paymentIntentId), subtotal, shippingCost, taxAmount, discountAmount, grandTotal. 
        ◦ Task 3.7.7: Create Place Order API Endpoint 
            ▪ Subtask 3.7.7.1: Design and implement POST /api/orders/place-order. 
            ▪ Subtask 3.7.7.2: Authenticate the user. 
            ▪ Subtask 3.7.7.3: Receive all finalized order details (cart items, addresses, shipping method, payment intent ID if applicable, etc.) from the frontend. 
            ▪ Subtask 3.7.7.4: Perform crucial server-side validation and recalculation: 
                • Re-verify product prices and availability against current inventory to prevent tampering/stale data. 
                • Re-calculate total costs (subtotal, shipping, tax, grand total) on the backend. 
                • Verify paymentIntentId status with Stripe (if applicable) to ensure it's succeeded. 
            ▪ Subtask 3.7.7.5: Implement Transactional Logic: 
                • Start a database transaction (if supported/necessary for atomicity). 
                • Generate a unique orderNumber. 
                • Create the new Order document in the Order collection. 
                • Decrement stock quantities for all purchased products in the Product collection. 
                • Clear the customer's cart in the Cart collection. 
                • Commit the transaction. 
            ▪ Subtask 3.7.7.6: Trigger sending of order confirmation email. 
            ▪ Subtask 3.7.7.7: Return the new orderId and orderNumber in the response. 
        ◦ Task 3.7.8: Email Service Integration (Order Confirmation) 
            ▪ Subtask 3.7.8.1: Create a comprehensive order confirmation email template. 
            ▪ Subtask 3.7.8.2: Implement function to send this email with full order details upon successful order placement. 
    • Security & Data Integrity Tasks:
        ◦ Task 3.7.9: Prevent Double Submission / Idempotency 
            ▪ Subtask 3.7.9.1: Implement measures to prevent multiple order creations from a single user clicking "Place Order" multiple times (e.g., disable button after first click, use idempotency keys on backend). 
        ◦ Task 3.7.10: Data Validation & Recalculation on Backend 
            ▪ Subtask 3.7.10.1: Ensure all critical order details (prices, totals) are validated and recalculated on the backend using the authoritative data from the database, not just trusting frontend data. 
    • Testing Tasks:
        ◦ Task 3.7.11: Write Unit Tests 
            ▪ Subtask 3.7.11.1: Unit tests for frontend order summary display. 
            ▪ Subtask 3.7.11.2: Unit tests for backend order creation logic, stock decrement, and cart clearing. 
        ◦ Task 3.7.12: Write Integration Tests 
            ▪ Subtask 3.7.12.1: Test POST /api/orders/place-order with a fully prepared checkout session (including mock payment intent). 
            ▪ Subtask 3.7.12.2: Verify new order is created in DB with correct details. 
            ▪ Subtask 3.7.12.3: Verify product stock is decremented. 
            ▪ Subtask 3.7.12.4: Verify user's cart is cleared. 
            ▪ Subtask 3.7.12.5: Test with insufficient stock (expect failure). 
            ▪ Subtask 3.7.12.6: Test with an invalid payment intent (expect failure). 
        ◦ Task 3.7.13: Manual End-to-End Testing 
            ▪ Subtask 3.7.13.1: Go through the entire checkout flow (Add to Cart -> View Cart -> Addresses -> Shipping -> Payment -> Order Review). 
            ▪ Subtask 3.7.13.2: Carefully review all details on the Order Review page. 
            ▪ Subtask 3.7.13.3: Click "Place Order" and verify redirection to Order Confirmation page with correct order number. 
            ▪ Subtask 3.7.13.4: Verify order confirmation email is received. 
            ▪ Subtask 3.7.13.5: Verify cart is empty after order. 
            ▪ Subtask 3.7.13.6: Check product stock in admin/DB to confirm decrement. 
            ▪ Subtask 3.7.13.7: Test placing an order for an item that just went out of stock to ensure proper error handling.
Epic: Post-Purchase Operations & Support
Story 4.1: Track Order Status (Customer)
Story: As a customer, I want to track the current status of my order and see shipping updates so that I know when to expect my delivery.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. From the "Order History" page (Story 2.8) or "Order Details" page (Story 2.9), a link or section provides visibility into the order's current status and tracking information. 
    2. The order status is clearly displayed (e.g., "Processing," "Shipped," "Out for Delivery," "Delivered," "Cancelled"). 
    3. If the order has been shipped, a tracking number and a clickable link to the shipping carrier's tracking page are displayed. 
    4. Optionally, a timeline or step-by-step progress indicator for the order's journey is shown. 
    5. All order tracking information is kept up-to-date. 
    6. Only the authenticated customer can view their own order tracking. 

Granular Tasks & Subtasks for Story 4.1:
    • Frontend Tasks:
        ◦ Task 4.1.1: Integrate Tracking Info into Order Details Page UI 
            ▪ Subtask 4.1.1.1: Enhance the OrderDetailsPage (from Story 2.9) to prominently display the status of the order. 
            ▪ Subtask 4.1.1.2: Conditionally render a section for "Tracking Information" if trackingNumber and trackingLink exist in the order data. 
            ▪ Subtask 4.1.1.3: Display the trackingNumber and a clickable link for trackingLink. 
        ◦ Task 4.1.2: (Optional) Implement Order Status Timeline/Progress Indicator 
            ▪ Subtask 4.1.2.1: Design a visual timeline component (e.g., a series of steps) to represent order progression (e.g., "Order Placed", "Processing", "Shipped", "Delivered"). 
            ▪ Subtask 4.1.2.2: Dynamically highlight the current status in the timeline based on the order's status field. 
        ◦ Task 4.1.3: Frontend API Integration: Fetch Latest Order Status 
            ▪ Subtask 4.1.3.1: Reuse GET /api/user/orders/:orderId from Story 2.9. 
            ▪ Subtask 4.1.3.2: Ensure this endpoint returns the most up-to-date status, trackingNumber, and trackingLink. 
            ▪ Subtask 4.1.3.3: (Consideration) Implement a polling mechanism or consider WebSockets for real-time updates if a highly dynamic tracking experience is desired (Stretch Goal/Future Enhancement). 
    • Backend Tasks:
        ◦ Task 4.1.4: Update Order Data Model for Tracking 
            ▪ Subtask 4.1.4.1: Ensure the Order collection schema includes fields for: 
                • status (Enum: pending, processing, shipped, out_for_delivery, delivered, cancelled, returned, etc.) 
                • trackingNumber (String, optional) 
                • trackingLink (String, optional) 
                • statusHistory (Array of objects: status, timestamp, note - for detailed timeline) 
        ◦ Task 4.1.5: Develop Internal Endpoint for Status Updates (Admin/System Only) 
            ▪ Subtask 4.1.5.1: Create an internal API endpoint (e.g., PUT /api/internal/orders/:orderId/status) that can be called by an admin panel or fulfillment system to update an order's status and tracking details. 
            ▪ Subtask 4.1.5.2: This endpoint must be highly secured (e.g., API key, IP whitelisting, specific authentication). 
            ▪ Subtask 4.1.5.3: Update status, trackingNumber, trackingLink, and append to statusHistory. 
        ◦ Task 4.1.6: (Optional) Integrate with Shipping Carrier APIs for Auto-Tracking 
            ▪ Subtask 4.1.6.1: Research and select relevant shipping carrier APIs (e.g., UPS, FedEx, Royal Mail). 
            ▪ Subtask 4.1.6.2: Implement background jobs/cron jobs to periodically call carrier APIs using trackingNumber to fetch latest status updates. 
            ▪ Subtask 4.1.6.3: Update Order document's status and statusHistory based on carrier updates. (This is a significant stretch goal, might be manual for MVP). 
        ◦ Task 4.1.7: Ensure Secure Access to Order Tracking Data 
            ▪ Subtask 4.1.7.1: Double-check that GET /api/user/orders/:orderId rigorously enforces that only the userId associated with the order can access its details. 
    • Testing Tasks:
        ◦ Task 4.1.8: Write Unit Tests 
            ▪ Subtask 4.1.8.1: Unit tests for frontend conditional rendering of tracking info. 
            ▪ Subtask 4.1.8.2: Unit tests for backend status update logic (for internal endpoint). 
        ◦ Task 4.1.9: Write Integration Tests 
            ▪ Subtask 4.1.9.1: Test fetching an order with "Processing" status, verify no tracking info is shown. 
            ▪ Subtask 4.1.9.2: Test fetching an order with "Shipped" status, verify tracking number and link are displayed. 
            ▪ Subtask 4.1.9.3: Simulate an internal status update (e.g., via mock admin call) and then fetch the order to verify the status change. 
            ▪ Subtask 4.1.9.4: Test unauthorized attempts to access order tracking details. 
        ◦ Task 4.1.10: Manual End-to-End Testing 
            ▪ Subtask 4.1.10.1: Place a test order. 
            ▪ Subtask 4.1.10.2: Access its details page. Verify initial status. 
            ▪ Subtask 4.1.10.3: Manually update the order status in the backend (e.g., directly in MongoDB or via a mock admin tool). 
            ▪ Subtask 4.1.10.4: Refresh the order details page and verify the status update and tracking info (if added) are displayed. 
            ▪ Subtask 4.1.10.5: Test clickable tracking links.
Epic: Post-Purchase Operations & Support
Story 4.2: Cancel Order (Customer)
Story: As a customer, I want to be able to cancel my order (if it hasn't shipped yet) so that I can prevent unwanted purchases and receive a refund.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Cancel Order" button/link is available on the "Order Details" page (Story 2.9) for eligible orders. 
    2. An order is eligible for cancellation only if its status is "Pending," "Processing," or "Awaiting Shipment" (or equivalent early statuses). Once an order is "Shipped," "Out for Delivery," or "Delivered," it cannot be cancelled by the customer via this functionality. 
    3. Clicking "Cancel Order" prompts the customer with a confirmation dialog (e.g., "Are you sure you want to cancel this order? This action cannot be undone."). 
    4. Upon confirmation, the order's status is updated to "Cancelled" in the backend. 
    5. The stock levels of all products in the cancelled order are returned to inventory. 
    6. If the order was paid for, a refund process is initiated (e.g., via the payment gateway). 
    7. The customer receives a confirmation email for the cancellation and initiated refund. 
    8. The "Cancel Order" button is removed or disabled for cancelled/ineligible orders. 
    9. All cancellation operations are performed securely. 

Granular Tasks & Subtasks for Story 4.2:
    • Frontend Tasks:
        ◦ Task 4.2.1: Conditionally Display "Cancel Order" Button 
            ▪ Subtask 4.2.1.1: On the OrderDetailsPage (from Story 2.9), add a "Cancel Order" button. 
            ▪ Subtask 4.2.1.2: Implement logic to enable/disable or hide this button based on the order's status (only visible for "Pending," "Processing," "Awaiting Shipment"). 
        ◦ Task 4.2.2: Implement Cancellation Confirmation Dialog 
            ▪ Subtask 4.2.2.1: When "Cancel Order" is clicked, display a modal or confirmation prompt. 
            ▪ Subtask 4.2.2.2: Include a clear message about irreversibility and refund implications. 
        ◦ Task 4.2.3: Frontend API Integration: Request Cancellation 
            ▪ Subtask 4.2.3.1: Create service/hook to send a cancellation request to POST /api/user/orders/:orderId/cancel. 
            ▪ Subtask 4.2.3.2: On successful response, update the local order status in the UI to "Cancelled" and disable the "Cancel Order" button. 
            ▪ Subtask 4.2.3.3: Display a success message (e.g., "Order cancelled. Refund initiated."). 
            ▪ Subtask 4.2.3.4: Handle error responses (e.g., "Order cannot be cancelled at this stage," "Something went wrong"). 
    • Backend Tasks:
        ◦ Task 4.2.4: Create Cancel Order API Endpoint 
            ▪ Subtask 4.2.4.1: Design and implement POST /api/user/orders/:orderId/cancel. 
            ▪ Subtask 4.2.4.2: Authenticate the user and verify orderId belongs to them. 
            ▪ Subtask 4.2.4.3: Crucial: Check order status: 
                • Retrieve the order from MongoDB. 
                • If the order status is not "Pending," "Processing," or "Awaiting Shipment," return a 403 Forbidden or specific error message ("Order cannot be cancelled at this stage"). 
            ▪ Subtask 4.2.4.4: Implement Transactional Logic: 
                • Start a database transaction. 
                • Update the Order document's status to "Cancelled". 
                • For each item in the order, increment the stockQuantity of the corresponding product in the Product collection. 
                • Initiate Refund Process: Call the Payment Gateway (Stripe) API to issue a refund for the grandTotal of the order. Handle synchronous responses or rely on webhooks for asynchronous confirmation. (This will be a more complex subtask, potentially needing a separate internal service). 
                • Commit the transaction. 
            ▪ Subtask 4.2.4.5: Trigger sending of cancellation confirmation email. 
            ▪ Subtask 4.2.4.6: Return a success response. 
        ◦ Task 4.2.5: Implement Refund Integration with Payment Gateway 
            ▪ Subtask 4.2.5.1: Use Stripe SDK (or equivalent) to initiate refunds based on the paymentIntentId stored in the Order document (from Story 3.6). 
            ▪ Subtask 4.2.5.2: Handle refund success/failure/pending states. 
            ▪ Subtask 4.2.5.3: Update order status or add refundStatus to the order document based on refund outcome. 
        ◦ Task 4.2.6: Email Service Integration (Cancellation & Refund Confirmation) 
            ▪ Subtask 4.2.6.1: Create a clear email template for order cancellation confirmation. 
            ▪ Subtask 4.2.6.2: Include details about the refund status (initiated, expected timeframe). 
            ▪ Subtask 4.2.6.3: Implement function to send this email. 
    • Security & Data Integrity Tasks:
        ◦ Task 4.2.7: Ensure Atomic Operations 
            ▪ Subtask 4.2.7.1: Verify that status update, stockQuantity increment, and refund initiation happen as an atomic transaction. If one fails, all should roll back. 
        ◦ Task 4.2.8: Robust Authorization 
            ▪ Subtask 4.2.8.1: Re-confirm that only the owner of the order can request its cancellation. 
    • Testing Tasks:
        ◦ Task 4.2.9: Write Unit Tests 
            ▪ Subtask 4.2.9.1: Unit tests for frontend button visibility logic based on status. 
            ▪ Subtask 4.2.9.2: Unit tests for backend order status check before cancellation. 
            ▪ Subtask 4.2.9.3: Unit tests for stock increment logic. 
            ▪ Subtask 4.2.9.4: Unit tests for refund initiation (mocking payment gateway API). 
        ◦ Task 4.2.10: Write Integration Tests 
            ▪ Subtask 4.2.10.1: Place an order (Status: "Pending") and test successful cancellation. Verify order status, stock, and mock refund. 
            ▪ Subtask 4.2.10.2: Place an order, then manually change its status to "Shipped" and attempt cancellation (expect failure). 
            ▪ Subtask 4.2.10.3: Test attempting to cancel an order not belonging to the authenticated user. 
        ◦ Task 4.2.11: Manual End-to-End Testing 
            ▪ Subtask 4.2.11.1: Place a test order (e.g., 2 units of Product A). Note Product A's initial stock. 
            ▪ Subtask 4.2.11.2: Go to Order Details page. Verify "Cancel Order" button is visible. 
            ▪ Subtask 4.2.11.3: Click "Cancel Order", confirm dialog. 
            ▪ Subtask 4.2.11.4: Verify order status on UI changes to "Cancelled". 
            ▪ Subtask 4.2.11.5: Check Product A's stock in admin/DB; it should be back to initial + 2. 
            ▪ Subtask 4.2.11.6: Verify cancellation confirmation email is received. 
            ▪ Subtask 4.2.11.7: Test placing an order, then manually setting its status to "Shipped" in the DB. Try to cancel it from UI; button should be hidden/disabled or return error.
Epic: Post-Purchase Operations & Support
Story 4.3: Request Return (Customer)
Story: As a customer, I want to be able to request a return for one or more items from my delivered order so that I can send back unwanted or faulty products and receive a refund.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Request Return" button/link is available on the "Order Details" page (Story 2.9) for eligible items within a delivered order. 
    2. An order/item is eligible for return if its status is "Delivered" and it's within a defined return window (e.g., 30 days from delivery date). 
    3. Clicking "Request Return" navigates the customer to a return request form. 
    4. The return form displays the items from the eligible order, allowing the customer to select which items they wish to return and specify a quantity for each. 
    5. For each selected item, the customer must provide a reason for return (e.g., "Wrong size," "Damaged," "Changed mind"). 
    6. A customer can optionally upload images to support their return request (e.g., for damaged items). 
    7. Upon submission, a return request is created in the system with a unique ID, and its status is set to "Pending Review." 
    8. The customer receives a confirmation email for the return request, including instructions for shipping the item back (e.g., return address, potentially a pre-paid shipping label if applicable). 
    9. The order's overall status on the "Order Details" page may be updated (e.g., "Return Requested"). 
    10. All return request operations are performed securely. 

Granular Tasks & Subtasks for Story 4.3:
    • Frontend Tasks:
        ◦ Task 4.3.1: Conditionally Display "Request Return" Button 
            ▪ Subtask 4.3.1.1: On the OrderDetailsPage (from Story 2.9), add a "Request Return" button. 
            ▪ Subtask 4.3.1.2: Implement logic to enable/disable or hide this button based on: 
                • Order status being "Delivered". 
                • Delivery date being within the defined return window (e.g., deliveryDate + 30 days > current_date). 
                • No active return request already exists for the order (optional, depending on if multiple requests are allowed). 
        ◦ Task 4.3.2: Implement Return Request Form UI 
            ▪ Subtask 4.3.2.1: Create ReturnRequestPage component/route (e.g., /my-account/orders/:orderId/return). 
            ▪ Subtask 4.3.2.2: Display eligible items from the order with checkboxes for selection, quantity input (up to purchased quantity), and dropdown for "Reason for Return". 
            ▪ Subtask 4.3.2.3: Add an optional file upload input for images (e.g., for damage proof). 
            ▪ Subtask 4.3.2.4: Add a "Submit Return Request" button. 
        ◦ Task 4.3.3: Frontend API Integration: Fetch Eligible Items for Return 
            ▪ Subtask 4.3.3.1: Create service/hook to call GET /api/user/orders/:orderId/eligible-returns. 
            ▪ Subtask 4.3.3.2: Populate the return form with items returned from this endpoint. 
        ◦ Task 4.3.4: Frontend API Integration: Submit Return Request 
            ▪ Subtask 4.3.4.1: Create service/hook to send selected items, quantities, reasons, and optional images to POST /api/user/returns/request. 
            ▪ Subtask 4.3.4.2: On successful response, display a confirmation message and redirect to the OrderDetailsPage (or a dedicated "Return Request Submitted" page). 
            ▪ Subtask 4.3.4.3: Handle error responses (e.g., invalid quantity, item not eligible, API errors). 
    • Backend Tasks:
        ◦ Task 4.3.5: Design Return Request Data Model 
            ▪ Subtask 4.3.5.1: Define MongoDB schema for ReturnRequest collection. 
            ▪ It must include: _id, orderId, userId, requestDate, status (e.g., 'Pending Review', 'Approved', 'Rejected', 'Received', 'Refunded', 'Closed'), items (array of objects: productId, quantity, reason, unitPrice at purchase), images (array of URLs), returnShippingAddress (static/default return address), notes (for admin). 
        ◦ Task 4.3.6: Create API Endpoint to Get Eligible Return Items 
            ▪ Subtask 4.3.6.1: Design and implement GET /api/user/orders/:orderId/eligible-returns. 
            ▪ Subtask 4.3.6.2: Authenticate user and verify orderId belongs to them. 
            ▪ Subtask 4.3.6.3: Fetch the order. 
            ▪ Subtask 4.3.6.4: Check order status ("Delivered") and deliveryDate against return window. 
            ▪ Subtask 4.3.6.5: Return the list of items from the order that are eligible for return (e.g., not already fully returned from a previous request). 
        ◦ Task 4.3.7: Create Submit Return Request API Endpoint 
            ▪ Subtask 4.3.7.1: Design and implement POST /api/user/returns/request. 
            ▪ Subtask 4.3.7.2: Authenticate user. 
            ▪ Subtask 4.3.7.3: Validate incoming data (selected items, quantities, reasons). 
            ▪ Subtask 4.3.7.4: Re-verify eligibility (status, return window, quantities) on the backend for security. 
            ▪ Subtask 4.3.7.5: Store uploaded images (e.g., to S3 or similar object storage) and save their URLs. 
            ▪ Subtask 4.3.7.6: Create a new ReturnRequest document in MongoDB. 
            ▪ Subtask 4.3.7.7: Update the original Order document's status (e.g., add a hasReturnRequest: true flag or change status to "Return Requested"). 
            ▪ Subtask 4.3.7.8: Trigger sending of return request confirmation email. 
            ▪ Subtask 4.3.7.9: Return the created returnRequestId. 
        ◦ Task 4.3.8: Email Service Integration (Return Request Confirmation) 
            ▪ Subtask 4.3.8.1: Create a detailed email template for return request confirmation. 
            ▪ Subtask 4.3.8.2: Include the return request ID, list of items to be returned, return reason, and crucial instructions (return shipping address, how to package, what to include). 
            ▪ Subtask 4.3.8.3: Implement function to send this email. 
        ◦ Task 4.3.9: File Upload & Storage Integration 
            ▪ Subtask 4.3.9.1: Set up secure cloud storage (e.g., AWS S3, Google Cloud Storage) for uploaded return images. 
            ▪ Subtask 4.3.9.2: Implement backend logic to handle image uploads, secure storage, and retrieve public URLs. 
    • Security & Data Integrity Tasks:
        ◦ Task 4.3.10: Strict Return Eligibility Enforcement 
            ▪ Subtask 4.3.10.1: Ensure backend checks for order status and return window are robust and cannot be bypassed. 
        ◦ Task 4.3.11: File Upload Security 
            ▪ Subtask 4.3.11.1: Implement file type validation, size limits, and virus scanning for uploaded images. 
        ◦ Task 4.3.12: Authorization for Return Requests 
            ▪ Subtask 4.3.12.1: Ensure only the userId associated with the order can submit a return request for it. 
    • Testing Tasks:
        ◦ Task 4.3.13: Write Unit Tests 
            ▪ Subtask 4.3.13.1: Unit tests for frontend eligibility logic for "Request Return" button. 
            ▪ Subtask 4.3.13.2: Unit tests for backend return eligibility checks (status, date). 
            ▪ Subtask 4.3.13.3: Unit tests for return request creation. 
        ◦ Task 4.3.14: Write Integration Tests 
            ▪ Subtask 4.3.14.1: Place an order, simulate "Delivered" status (e.g., manually update DB), then request a return for some items. Verify ReturnRequest created and email sent. 
            ▪ Subtask 4.3.14.2: Test requesting return for an order that is "Shipped" or "Pending" (expect failure). 
            ▪ Subtask 4.3.14.3: Test requesting return for an order outside the return window. 
            ▪ Subtask 4.3.14.4: Test with partial return quantities. 
            ▪ Subtask 4.3.14.5: Test image upload functionality. 
            ▪ Subtask 4.3.14.6: Test unauthorized return requests. 
        ◦ Task 4.3.15: Manual End-to-End Testing 
            ▪ Subtask 4.3.15.1: Place an order and manually set its status to "Delivered" with a recent delivery date. 
            ▪ Subtask 4.3.15.2: Go to Order Details, verify "Request Return" button is visible. 
            ▪ Subtask 4.3.15.3: Click "Request Return", select some items, provide reasons, optionally upload an image. Submit. 
            ▪ Subtask 4.3.15.4: Verify confirmation message on UI. 
            ▪ Subtask 4.3.15.5: Check DB for new ReturnRequest document. 
            ▪ Subtask 4.3.15.6: Verify return confirmation email is received. 
            ▪ Subtask 4.3.15.7: Test ineligible orders (not delivered, too old) - button should be hidden/disabled.
Epic: Post-Purchase Operations & Support
Story 4.4: Contact Customer Support (Customer)
Story: As a customer, I want to easily contact customer support with a query or issue so that I can get help with my orders or general inquiries.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Contact Us" or "Support" link is readily available in the website's footer or header, and potentially within the customer account area. 
    2. Clicking the link navigates to a "Contact Us" form. 
    3. The form requests the following information: 
        ◦ Full Name (pre-filled if logged in) 
        ◦ Email Address (pre-filled if logged in) 
        ◦ Subject (dropdown for common topics like "Order Inquiry," "Product Question," "Technical Issue," "Other") 
        ◦ Order Number (Optional field, for specific order inquiries) 
        ◦ Message/Description (Required, multi-line text area) 
    4. Client-side validation ensures required fields are filled and email format is correct. 
    5. Upon successful submission, a confirmation message is displayed to the customer. 
    6. The support request is securely sent to the customer support team (e.g., via email, or into an internal ticketing system). 
    7. An automatic acknowledgment email is sent to the customer. 
    8. All contact operations are performed securely. 

Granular Tasks & Subtasks for Story 4.4:
    • Frontend Tasks:
        ◦ Task 4.4.1: Implement "Contact Us" Page UI 
            ▪ Subtask 4.4.1.1: Create ContactUsPage component/route (e.g., /contact-us). 
            ▪ Subtask 4.4.1.2: Design and implement the contact form with fields for Full Name, Email Address, Subject (dropdown), Order Number (optional), and Message. 
            ▪ Subtask 4.4.1.3: Add a "Submit" button. 
            ▪ Subtask 4.4.1.4: Place "Contact Us" link in the website footer/header and customer account dashboard. 
        ◦ Task 4.4.2: Pre-fill Form for Logged-in Users 
            ▪ Subtask 4.4.2.1: If the user is logged in, automatically pre-fill Full Name and Email Address fields with their account details. 
        ◦ Task 4.4.3: Implement Client-Side Validation for Contact Form 
            ▪ Subtask 4.4.3.1: Ensure Full Name, Email Address, Subject, and Message are required (except Order Number). 
            ▪ Subtask 4.4.3.2: Validate email format. 
            ▪ Subtask 4.4.3.3: Display real-time feedback for invalid input. 
        ◦ Task 4.4.4: Frontend API Integration: Submit Contact Form 
            ▪ Subtask 4.4.4.1: Create service/hook to send form data to POST /api/support/contact. 
            ▪ Subtask 4.4.4.2: On successful submission, display a confirmation message (e.g., "Your message has been sent! We'll get back to you shortly.") and clear the form. 
            ▪ Subtask 4.4.4.3: Handle error responses gracefully. 
    • Backend Tasks:
        ◦ Task 4.4.5: Create Submit Contact Form API Endpoint 
            ▪ Subtask 4.4.5.1: Design and implement POST /api/support/contact. 
            ▪ Subtask 4.4.5.2: Server-side validation for all incoming form data (required fields, email format, valid subject options). 
            ▪ Subtask 4.4.5.3: Sanitize input to prevent XSS. 
            ▪ Subtask 4.4.5.4: If an Order Number is provided, perform a basic validation (e.g., does it match an existing order, and optionally, does it belong to the logged-in user if they are logged in?). 
            ▪ Subtask 4.4.5.5: Route the support request: 
                • Option A (MVP): Send an email to a predefined customer support email address with all form details. 
                • Option B (Future/Integrate): Integrate with an external ticketing system (e.g., Zendesk, Freshdesk) to create a new ticket. 
            ▪ Subtask 4.4.5.6: Trigger sending of automatic acknowledgment email to the customer. 
            ▪ Subtask 4.4.5.7: Return a success response. 
        ◦ Task 4.4.6: Email Service Integration (Acknowledgment) 
            ▪ Subtask 4.4.6.1: Create a simple acknowledgment email template. 
            ▪ Subtask 4.4.6.2: Implement function to send this acknowledgment email to the customer's provided email address upon successful request submission. 
        ◦ Task 4.4.7: (Optional) Implement Rate Limiting 
            ▪ Subtask 4.4.7.1: Add rate limiting to POST /api/support/contact to prevent spam or abuse. 
    • Testing Tasks:
        ◦ Task 4.4.8: Write Unit Tests 
            ▪ Subtask 4.4.8.1: Unit tests for frontend form validation logic. 
            ▪ Subtask 4.4.8.2: Unit tests for backend input validation and sanitization. 
        ◦ Task 4.4.9: Write Integration Tests 
            ▪ Subtask 4.4.9.1: Test POST /api/support/contact with valid data (verify email sent/ticket created). 
            ▪ Subtask 4.4.9.2: Test with missing required fields (expect error). 
            ▪ Subtask 4.4.9.3: Test with invalid email format. 
            ▪ Subtask 4.4.9.4: Test with a valid Order Number (if validation logic is implemented). 
        ◦ Task 4.4.10: Manual End-to-End Testing 
            ▪ Subtask 4.4.10.1: Navigate to the "Contact Us" page (logged in and logged out). 
            ▪ Subtask 4.4.10.2: Verify pre-filled fields for logged-in users. 
            ▪ Subtask 4.4.10.3: Fill out the form with valid data and submit. 
            ▪ Subtask 4.4.10.4: Verify success message on UI. 
            ▪ Subtask 4.4.10.5: Check the customer support email inbox/ticketing system to ensure the request was received. 
            ▪ Subtask 4.4.10.6: Verify the automatic acknowledgment email is received by the customer. 
            ▪ Subtask 4.4.10.7: Test all client-side validation messages (empty fields, invalid email).
Epic: Post-Purchase Operations & Support
Story 4.5: View Return Request Status (Customer)
Story: As a customer, I want to be able to check the status of my return request(s) so that I can stay informed about the progress of my return and expected refund.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. From the "Order Details" page (Story 2.9), if a return request exists for the order, a section or link allows the customer to view its status. 
    2. Alternatively, or in addition to, a "Return History" page within the customer account area lists all return requests made by the customer. 
    3. For each return request, the following information is displayed: 
        ◦ Return Request ID 
        ◦ Request Date 
        ◦ Status (e.g., "Pending Review," "Approved," "Rejected," "Received," "Refunded," "Closed") 
        ◦ List of returned items with quantities and reasons 
        ◦ (Optional) Tracking information for the return shipment (if applicable) 
        ◦ (Optional) Communication log (e.g., messages exchanged between customer and support) 
    4. The status of each return request is kept up-to-date. 
    5. All return request information is presented securely. 

Granular Tasks & Subtasks for Story 4.5:
    • Frontend Tasks:
        ◦ Task 4.5.1: Integrate Return Status into Order Details Page 
            ▪ Subtask 4.5.1.1: On the OrderDetailsPage (from Story 2.9), if a return request exists for the order (e.g., hasReturnRequest: true or by querying for a ReturnRequest with the orderId), add a section to display basic return status. 
            ▪ Subtask 4.5.1.2: This section should include the returnRequestId and the current status. 
            ▪ Subtask 4.5.1.3: Provide a link (e.g., "View Return Details") to a dedicated page for more information. 
        ◦ Task 4.5.2: Implement "Return History" Page UI 
            ▪ Subtask 4.5.2.1: Create ReturnHistoryPage component/route (e.g., /my-account/returns). 
            ▪ Subtask 4.5.2.2: Display a list of all return requests for the logged-in user. 
            ▪ Subtask 4.5.2.3: For each return, show the returnRequestId, requestDate, status, and a brief summary of returned items (e.g., "3 items"). 
            ▪ Subtask 4.5.2.4: Provide a link to a detailed view of each return request. 
        ◦ Task 4.5.3: Implement "Return Details" Page UI 
            ▪ Subtask 4.5.3.1: Create ReturnDetailsPage component/route (e.g., /my-account/returns/:returnRequestId). 
            ▪ Subtask 4.5.3.2: Display all details of the return request: returnRequestId, requestDate, status, list of returned items with quantities and reasons, any uploaded images, and (optionally) tracking information and communication log. 
            ▪ Subtask 4.5.3.3: Use a clear and organized layout. 
        ◦ Task 4.5.4: Frontend API Integration: Fetch Return Requests 
            ▪ Subtask 4.5.4.1: Create service/hook to call GET /api/user/returns (for Return History Page) - should return a list of return requests for the logged-in user. 
            ▪ Subtask 4.5.4.2: Create service/hook to call GET /api/user/returns/:returnRequestId (for Return Details Page) - should return the full details of a specific return request. 
            ▪ Subtask 4.5.4.3: Ensure these endpoints return up-to-date status information. 
    • Backend Tasks:
        ◦ Task 4.5.5: Create API Endpoint to Get Return Requests (List) 
            ▪ Subtask 4.5.5.1: Design and implement GET /api/user/returns. 
            ▪ Subtask 4.5.5.2: Authenticate user. 
            ▪ Subtask 4.5.5.3: Fetch all ReturnRequest documents for the logged-in userId. 
            ▪ Subtask 4.5.5.4: Return a list of return requests with necessary details (e.g., returnRequestId, requestDate, status, list of returned items). 
        ◦ Task 4.5.6: Create API Endpoint to Get Return Request Details 
            ▪ Subtask 4.5.6.1: Design and implement GET /api/user/returns/:returnRequestId. 
            ▪ Subtask 4.5.6.2: Authenticate user. 
            ▪ Subtask 4.5.6.3: Verify that the returnRequestId belongs to the logged-in user. 
            ▪ Subtask 4.5.6.4: Fetch the full ReturnRequest document from MongoDB. 
            ▪ Subtask 4.5.6.5: Return all details of the return request. 
        ◦ Task 4.5.7: (Optional) Implement Tracking Information Integration 
            ▪ Subtask 4.5.7.1: If the return shipment has tracking information (e.g., from an admin panel update), include it in the ReturnDetailsPage. 
        ◦ Task 4.5.8: (Optional) Implement Communication Log 
            ▪ Subtask 4.5.8.1: If a communication log is desired, add a field to the ReturnRequest schema (e.g., communicationLog: array of objects with timestamp, sender (customer/admin), message). 
            ▪ Subtask 4.5.8.2: Implement UI and backend logic to display and potentially add to this log. 
    • Security & Data Integrity Tasks:
        ◦ Task 4.5.9: Secure Access to Return Information 
            ▪ Subtask 4.5.9.1: Double-check that all endpoints only allow access to return requests belonging to the authenticated user. 
    • Testing Tasks:
        ◦ Task 4.5.10: Write Unit Tests 
            ▪ Subtask 4.5.10.1: Unit tests for frontend logic to display return request information. 
            ▪ Subtask 4.5.10.2: Unit tests for backend logic to retrieve return requests and details. 
        ◦ Task 4.5.11: Write Integration Tests 
            ▪ Subtask 4.5.11.1: Create a return request (e.g., manually in DB or using the "Request Return" flow from Story 4.3). 
            ▪ Subtask 4.5.11.2: Test fetching the list of return requests (verify the created request is present). 
            ▪ Subtask 4.5.11.3: Test fetching the details of the created return request. 
            ▪ Subtask 4.5.11.4: Test attempting to access return requests belonging to another user. 
        ◦ Task 4.5.12: Manual End-to-End Testing 
            ▪ Subtask 4.5.12.1: Create a return request. 
            ▪ Subtask 4.5.12.2: Navigate to the "Return History" page and verify the request is displayed. 
            ▪ Subtask 4.5.12.3: Click on the request to view details. Verify all details are displayed correctly. 
            ▪ Subtask 4.5.12.4: Test the "View Return Details" link from the "Order Details" page.
Epic: Admin Order Management
Story 5.1: Admin Login & Dashboard
Story: As an administrator, I want to securely log in to the admin panel and see a dashboard with key order metrics so that I can monitor the business operations at a glance.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A dedicated admin login page is accessible via a specific URL (e.g., /admin/login). 
    2. Admins can log in using their email/username and password. 
    3. Authentication is secure (e.g., hashed passwords, JWTs). 
    4. Upon successful login, the admin is redirected to the Admin Dashboard. 
    5. The Admin Dashboard displays key operational metrics, such as: 
        ◦ Total Orders (Today/Week/Month) 
        ◦ Total Revenue (Today/Week/Month) 
        ◦ Number of Pending Orders 
        ◦ Number of Orders Awaiting Shipment 
        ◦ New Customers (Today/Week/Month) 
        ◦ (Optional) Quick links to "Manage Orders," "Manage Products," "Manage Users." 
    6. Unauthorized users attempting to access admin routes are redirected to the login page or receive an access denied error. 
    7. A "Logout" option is available in the admin panel. 

Granular Tasks & Subtasks for Story 5.1:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.1.1: Implement Admin Login Page UI 
            ▪ Subtask 5.1.1.1: Create AdminLoginPage component/route (e.g., /admin/login). 
            ▪ Subtask 5.1.1.2: Design and implement a simple login form with "Username/Email" and "Password" fields. 
            ▪ Subtask 5.1.1.3: Add a "Login" button. 
            ▪ Subtask 5.1.1.4: Implement client-side validation (e.g., required fields). 
        ◦ Task 5.1.2: Implement Admin Dashboard UI 
            ▪ Subtask 5.1.2.1: Create AdminDashboardPage component/route (e.g., /admin/dashboard). 
            ▪ Subtask 5.1.2.2: Design a layout for displaying key metrics using cards or summary boxes. 
            ▪ Subtask 5.1.2.3: Implement placeholder components for metrics like "Total Orders," "Revenue," "Pending Orders," "New Customers." 
            ▪ Subtask 5.1.2.4: Add navigation sidebar/header for quick links (e.g., to future "Manage Orders," "Manage Products"). 
        ◦ Task 5.1.3: Implement Admin Authentication Flow (Frontend) 
            ▪ Subtask 5.1.3.1: Create a dedicated admin authentication service/hook to handle login requests. 
            ▪ Subtask 5.1.3.2: On successful login, store JWT token (or similar) securely (e.g., in localStorage or sessionStorage). 
            ▪ Subtask 5.1.3.3: Redirect to /admin/dashboard upon successful authentication. 
            ▪ Subtask 5.1.3.4: Implement global route protection for all /admin routes, redirecting unauthenticated users to /admin/login. 
            ▪ Subtask 5.1.3.5: Implement "Logout" functionality (clear token, redirect to login). 
        ◦ Task 5.1.4: Frontend API Integration: Fetch Dashboard Metrics 
            ▪ Subtask 5.1.4.1: Create service/hook to call GET /api/admin/dashboard-metrics. 
            ▪ Subtask 5.1.4.2: Display fetched data on the dashboard. 
            ▪ Subtask 5.1.4.3: Handle loading states and errors. 
    • Backend Tasks (Admin API):
        ◦ Task 5.1.5: Create Admin User Schema & Management 
            ▪ Subtask 5.1.5.1: Define MongoDB schema for AdminUser (or add role: 'admin' to existing User schema). Include fields for email, passwordHash, firstName, lastName, permissions (future use). 
            ▪ Subtask 5.1.5.2: (Manual/Initial Setup) Create at least one admin user directly in the database for initial testing. 
        ◦ Task 5.1.6: Implement Admin Login API Endpoint 
            ▪ Subtask 5.1.6.1: Design and implement POST /api/admin/login. 
            ▪ Subtask 5.1.6.2: Validate incoming email/username and password. 
            ▪ Subtask 5.1.6.3: Hash incoming password and compare to stored hash. 
            ▪ Subtask 5.1.6.4: If valid, generate a JWT token (with admin role/permissions) and return it to the frontend. 
            ▪ Subtask 5.1.6.5: Handle invalid credentials (e.g., 401 Unauthorized). 
        ◦ Task 5.1.7: Implement Admin Authentication Middleware 
            ▪ Subtask 5.1.7.1: Create middleware to verify JWT tokens for all /api/admin routes. 
            ▪ Subtask 5.1.7.2: Ensure middleware checks for admin role/permission. 
            ▪ Subtask 5.1.7.3: Return 401/403 for invalid/missing tokens or insufficient permissions. 
        ◦ Task 5.1.8: Create Admin Dashboard Metrics API Endpoint 
            ▪ Subtask 5.1.8.1: Design and implement GET /api/admin/dashboard-metrics. 
            ▪ Subtask 5.1.8.2: Apply admin authentication middleware. 
            ▪ Subtask 5.1.8.3: Query Order collection for: 
                • Total orders (all time) 
                • Orders by status (Pending, Awaiting Shipment). 
                • Aggregate total revenue (sum of grandTotal) for specified periods (Today, Week, Month). 
            ▪ Subtask 5.1.8.4: Query User collection for new customers (based on createdAt) for specified periods. 
            ▪ Subtask 5.1.8.5: Return the calculated metrics. 
    • Security Tasks:
        ◦ Task 5.1.9: Secure JWT Handling 
            ▪ Subtask 5.1.9.1: Ensure JWTs are generated securely (strong secret) and handled properly (e.g., short expiry, refresh tokens - optional for MVP). 
            ▪ Subtask 5.1.9.2: Store JWTs in HttpOnly cookies if possible, or localStorage with XSS protection. 
        ◦ Task 5.1.10: Password Hashing 
            ▪ Subtask 5.1.10.1: Use a strong, salt-based hashing algorithm (e.g., bcrypt) for admin passwords. 
    • Testing Tasks:
        ◦ Task 5.1.11: Write Unit Tests 
            ▪ Subtask 5.1.11.1: Unit tests for frontend login form validation. 
            ▪ Subtask 5.1.11.2: Unit tests for backend password comparison and JWT generation. 
            ▪ Subtask 5.1.11.3: Unit tests for dashboard metric calculation logic (mocking DB data). 
        ◦ Task 5.1.12: Write Integration Tests 
            ▪ Subtask 5.1.12.1: Test successful admin login (verify token generation). 
            ▪ Subtask 5.1.12.2: Test login with incorrect credentials. 
            ▪ Subtask 5.1.12.3: Test accessing /api/admin/dashboard-metrics with/without valid admin token. 
            ▪ Subtask 5.1.12.4: Verify dashboard metrics API returns correct aggregated data based on mock order/user data. 
        ◦ Task 5.1.13: Manual End-to-End Testing 
            ▪ Subtask 5.1.13.1: Navigate to /admin/login. 
            ▪ Subtask 5.1.13.2: Attempt login with invalid credentials. Verify error message. 
            ▪ Subtask 5.1.13.3: Log in with valid admin credentials. Verify redirection to dashboard. 
            ▪ Subtask 5.1.13.4: Verify dashboard metrics are displayed (initially 0 or based on test data). 
            ▪ Subtask 5.1.13.5: Navigate directly to /admin/dashboard without logging in. Verify redirection to login page. 
            ▪ Subtask 5.1.13.6: Test "Logout" functionality.
Epic: Admin Order Management
Story 5.2: View All Orders (Admin)
Story: As an administrator, I want to view a paginated list of all customer orders, with options to filter and sort them, so that I can efficiently review and locate specific orders.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Orders" link is available in the Admin Dashboard navigation. 
    2. Clicking "Manage Orders" navigates the admin to a comprehensive order list page. 
    3. The page displays a paginated list of all orders in the system. 
    4. For each order, the following key details are displayed: 
        ◦ Order Number 
        ◦ Customer Name 
        ◦ Order Date 
        ◦ Grand Total 
        ◦ Current Status (e.g., "Pending," "Shipped," "Delivered," "Cancelled") 
    5. Admins can filter orders by: 
        ◦ Order Status 
        ◦ Customer Name/Email 
        ◦ Date Range 
    6. Admins can sort orders by: 
        ◦ Order Date (default: newest first) 
        ◦ Grand Total 
    7. A "View Details" button/link is available for each order to navigate to its full details (this will be addressed in Story 5.3). 
    8. All data retrieval is performed securely with admin-level authentication. 

Granular Tasks & Subtasks for Story 5.2:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.2.1: Implement "Manage Orders" Page UI 
            ▪ Subtask 5.2.1.1: Create AdminOrdersListPage component/route (e.g., /admin/orders). 
            ▪ Subtask 5.2.1.2: Add a navigation link for "Manage Orders" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.2.1.3: Design and implement a responsive table or list layout to display order summaries. 
            ▪ Subtask 5.2.1.4: Include columns for Order Number, Customer Name, Order Date, Grand Total, Status. 
            ▪ Subtask 5.2.1.5: Add a "View Details" button/link for each order row. 
        ◦ Task 5.2.2: Implement Pagination UI for Orders 
            ▪ Subtask 5.2.2.1: Reuse/adapt Pagination component from earlier stories (e.g., Story 1.1, 2.8). 
            ▪ Subtask 5.2.2.2: Integrate pagination controls with the order list. 
        ◦ Task 5.2.3: Implement Filtering UI 
            ▪ Subtask 5.2.3.1: Add dropdowns/selects for filtering by Order Status. 
            ▪ Subtask 5.2.3.2: Implement input fields for Customer Name/Email search. 
            ▪ Subtask 5.2.3.3: Add date picker components for "from" and "to" date range filtering. 
            ▪ Subtask 5.2.3.4: Include a "Apply Filters" and "Clear Filters" button. 
        ◦ Task 5.2.4: Implement Sorting UI 
            ▪ Subtask 5.2.4.1: Make table headers clickable for sorting (Order Date, Grand Total). 
            ▪ Subtask 5.2.4.2: Indicate current sort direction (ascending/descending) on the UI. 
        ◦ Task 5.2.5: Frontend API Integration: Fetch All Orders (with Filters/Sorting) 
            ▪ Subtask 5.2.5.1: Create service/hook to call GET /api/admin/orders. 
            ▪ Subtask 5.2.5.2: Pass pagination parameters (page, limit), filtering parameters (status, customerQuery, startDate, endDate), and sorting parameters (sortBy, sortOrder). 
            ▪ Subtask 5.2.5.3: Display fetched order data in the table. 
            ▪ Subtask 5.2.5.4: Handle loading states and display "No orders found" message. 
        ◦ Task 5.2.6: Display Customer Name (Cross-reference) 
            ▪ Subtask 5.2.6.1: Ensure the frontend can display the customer's full name or email, which might require including customer details in the order data returned by the backend or making an additional lookup (prefer latter for efficiency). 
    • Backend Tasks (Admin API):
        ◦ Task 5.2.7: Create Get All Orders API Endpoint (for Admin) 
            ▪ Subtask 5.2.7.1: Design and implement GET /api/admin/orders. 
            ▪ Subtask 5.2.7.2: Apply admin authentication middleware (from Story 5.1). 
            ▪ Subtask 5.2.7.3: Implement logic to query the Order collection for all orders. 
            ▪ Subtask 5.2.7.4: Implement pagination (skip/limit) on the query. 
            ▪ Subtask 5.2.7.5: Implement filtering logic based on: 
                • status (e.g., $match { status: '...' }) 
                • customerQuery (e.g., populate userId and then search User collection for name/email, then filter orders. Or, if customer name is denormalized on order, search directly). 
                • startDate, endDate (e.g., $match { orderDate: { $gte: ..., $lte: ... } }) 
            ▪ Subtask 5.2.7.6: Implement sorting logic based on orderDate (default: desc) and grandTotal. 
            ▪ Subtask 5.2.7.7: Populate userId to include customer's name/email for display on the order list. 
            ▪ Subtask 5.2.7.8: Return the paginated list of orders and total count for pagination. 
        ◦ Task 5.2.8: Optimize Database Indexes 
            ▪ Subtask 5.2.8.1: Ensure appropriate indexes exist on Order fields for filtering and sorting (e.g., status, orderDate, grandTotal, userId). 
            ▪ Subtask 5.2.8.2: If searching by customer name/email, ensure User collection has indexes on email, firstName, lastName. 
    • Testing Tasks:
        ◦ Task 5.2.9: Write Unit Tests 
            ▪ Subtask 5.2.9.1: Unit tests for frontend filter/sort state management. 
            ▪ Subtask 5.2.9.2: Unit tests for backend order querying logic (pagination, filtering, sorting with mock DB). 
        ◦ Task 5.2.10: Write Integration Tests 
            ▪ Subtask 5.2.10.1: Log in as admin, then call GET /api/admin/orders. Verify list of orders is returned. 
            ▪ Subtask 5.2.10.2: Test with page and limit parameters to verify pagination. 
            ▪ Subtask 5.2.10.3: Test filtering by various status values. 
            ▪ Subtask 5.2.10.4: Test filtering by customerQuery (name/email). 
            ▪ Subtask 5.2.10.5: Test filtering by startDate and endDate. 
            ▪ Subtask 5.2.10.6: Test sorting by orderDate and grandTotal (ASC/DESC). 
            ▪ Subtask 5.2.10.7: Test unauthorized access to this endpoint. 
        ◦ Task 5.2.11: Manual End-to-End Testing 
            ▪ Subtask 5.2.11.1: Log in to the admin panel. 
            ▪ Subtask 5.2.11.2: Navigate to "Manage Orders." 
            ▪ Subtask 5.2.11.3: Verify all orders are listed with correct summary details. 
            ▪ Subtask 5.2.11.4: Test pagination controls. 
            ▪ Subtask 5.2.11.5: Apply various filters (by status, by customer, by date range) and verify results. 
            ▪ Subtask 5.2.11.6: Test sorting by clicking on column headers. 
            ▪ Subtask 5.2.11.7: Ensure "View Details" links are present (though actual details will be in Story 5.3).
Epic: Admin Order Management
Story 5.3: View Order Details (Admin)
Story: As an administrator, I want to view the comprehensive details of a specific order so that I can understand its complete history, customer information, and items purchased, to facilitate management and support.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. Clicking "View Details" from an order in the "Manage Orders" list (Story 5.2) navigates the admin to a dedicated "Order Details" page for that order. 
    2. The page displays all comprehensive information for the specific order, including: 
        ◦ Order Number/ID 
        ◦ Order Date, Last Updated Date 
        ◦ Current Order Status 
        ◦ Grand Total, Subtotal, Shipping Cost, Tax, Discounts. 
        ◦ Full Customer Information (Name, Email, Phone, potentially link to customer profile). 
        ◦ Selected Shipping Address (full details). 
        ◦ Selected Billing Address (full details). 
        ◦ Chosen Shipping Method. 
        ◦ Chosen Payment Method (type, last 4 digits, payment Intent ID/transaction ID, payment status). 
        ◦ A detailed list of all purchased items (Product Name, Image, Quantity, Unit Price, Line Total). 
        ◦ (Optional) Order History/Status Log (e.g., "Order Placed," "Status Changed to Shipped," "Refund Issued"). 
    3. The admin can identify if there's an active return request associated with this order and potentially link to its details (building on Story 4.5 backend data). 
    4. All data retrieval is performed securely with admin-level authentication. 

Granular Tasks & Subtasks for Story 5.3:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.3.1: Implement "Order Details" Page UI for Admin 
            ▪ Subtask 5.3.1.1: Create AdminOrderDetailsPage component/route (e.g., /admin/orders/:orderId). 
            ▪ Subtask 5.3.1.2: Design a comprehensive layout for displaying all order information, organized into logical sections (e.g., Summary, Customer Info, Shipping, Billing, Payment, Items, History). 
            ▪ Subtask 5.3.1.3: Ensure the "View Details" button/link on AdminOrdersListPage (Story 5.2) correctly navigates to this new page with the orderId. 
        ◦ Task 5.3.2: Display Order Summary Details 
            ▪ Subtask 5.3.2.1: Render Order Number, Dates, Status, and financial totals (Grand Total, Subtotal, Shipping, Tax, Discounts). 
        ◦ Task 5.3.3: Display Customer, Shipping, and Billing Information 
            ▪ Subtask 5.3.3.1: Display customer's full name, email, phone, and potentially a link to their admin user profile (if Story 5.x "Manage Users" is implemented later). 
            ▪ Subtask 5.3.3.2: Render full details of the Shipping Address. 
            ▪ Subtask 5.3.3.3: Render full details of the Billing Address. 
        ◦ Task 5.3.4: Display Shipping and Payment Method Details 
            ▪ Subtask 5.3.4.1: Show the chosen Shipping Method (name, cost). 
            ▪ Subtask 5.3.4.2: Display Payment Method details (type, last 4 digits, transaction ID/Payment Intent ID, payment status). 
        ◦ Task 5.3.5: Display Ordered Items List 
            ▪ Subtask 5.3.5.1: Iterate through items array and display product details (Image, Name, Quantity, Unit Price, Line Total) in a clear table format. 
        ◦ Task 5.3.6: (Optional) Display Order History/Status Log 
            ▪ Subtask 5.3.6.1: If the backend provides an statusHistory array (from Story 4.1), render it as a chronological log. 
        ◦ Task 5.3.7: Frontend API Integration: Fetch Single Order Details 
            ▪ Subtask 5.3.7.1: Create service/hook to call GET /api/admin/orders/:orderId. 
            ▪ Subtask 5.3.7.2: Pass orderId extracted from the URL. 
            ▪ Subtask 5.3.7.3: Handle loading states and display "Order Not Found" or "Access Denied" errors. 
    • Backend Tasks (Admin API):
        ◦ Task 5.3.8: Create Get Single Order Details API Endpoint (for Admin) 
            ▪ Subtask 5.3.8.1: Design and implement GET /api/admin/orders/:orderId. 
            ▪ Subtask 5.3.8.2: Apply admin authentication middleware (from Story 5.1). 
            ▪ Subtask 5.3.8.3: Query the Order collection by _id. 
            ▪ Subtask 5.3.8.4: Populate all necessary nested data: 
                • userId to get full customer details (name, email, phone). 
                • items.productId to get full product details (image, current name, etc. - though the order items should already store a snapshot). 
            ▪ Subtask 5.3.8.5: Ensure all comprehensive order details (as per ACs) are returned, including shippingAddress, billingAddress, paymentMethod, shippingMethod, items, statusHistory. 
            ▪ Subtask 5.3.8.6: Return 404 if order not found. 
    • Testing Tasks:
        ◦ Task 5.3.9: Write Unit Tests 
            ▪ Subtask 5.3.9.1: Unit tests for frontend rendering of complex order data structures. 
            ▪ Subtask 5.3.9.2: Unit tests for backend order retrieval logic, ensuring correct data population. 
        ◦ Task 5.3.10: Write Integration Tests 
            ▪ Subtask 5.3.10.1: Log in as admin, then call GET /api/admin/orders/:orderId for a valid order ID. Verify all specified fields are returned correctly. 
            ▪ Subtask 5.3.10.2: Test with an invalid orderId (expect 404). 
            ▪ Subtask 5.3.10.3: Test attempting to access the endpoint without admin authentication (expect 401/403). 
            ▪ Subtask 5.3.10.4: Verify all nested customer and item data is included in the response. 
        ◦ Task 5.3.11: Manual End-to-End Testing 
            ▪ Subtask 5.3.11.1: Log in to the admin panel. 
            ▪ Subtask 5.3.11.2: Go to "Manage Orders" (Story 5.2). 
            ▪ Subtask 5.3.11.3: Click "View Details" for a few different orders (e.g., one with multiple items, one with a discount, one that was cancelled). 
            ▪ Subtask 5.3.11.4: Verify that all expected information (summary, customer, addresses, payment, shipping, items, status) is accurately displayed. 
            ▪ Subtask 5.3.11.5: Verify the link to customer profile if implemented.
Epic: Admin Order Management
Story 5.4: Update Order Status (Admin)
Story: As an administrator, I want to be able to manually update an order's status (e.g., to "Shipped," "Delivered," "Cancelled") and add tracking information so that I can reflect the actual state of the order and inform the customer.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. On the "Order Details" page (Story 5.3), there is an interface for changing the order's status. 
    2. The admin can select from a predefined list of valid next statuses (e.g., from "Processing" to "Shipped," but not directly to "Delivered"). 
    3. If the status is changed to "Shipped," fields for entering a tracking number and shipping carrier link become available and are required. 
    4. A confirmation dialog appears before applying the status change. 
    5. Upon successful update, the order's status is immediately reflected on the Admin Order Details page and the customer's Order Tracking page (Story 4.1). 
    6. An email notification is automatically sent to the customer if the status changes to "Shipped" or "Delivered" (or other significant states). 
    7. If an order is manually "Cancelled" by admin, stock levels of items are returned to inventory (similar to customer cancellation in 4.2). 
    8. All status updates are securely logged with an audit trail (who changed, when, to what). 

Granular Tasks & Subtasks for Story 5.4:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.4.1: Implement Order Status Update UI on Order Details Page 
            ▪ Subtask 5.4.1.1: On AdminOrderDetailsPage (Story 5.3), add a "Status Update" section. 
            ▪ Subtask 5.4.1.2: Implement a dropdown/select element populated with valid next statuses based on the current order status. 
            ▪ Subtask 5.4.1.3: Add an "Update Status" button. 
            ▪ Subtask 5.4.1.4: Implement input fields for trackingNumber and trackingLink that become visible and required only when "Shipped" status is selected. 
        ◦ Task 5.4.2: Implement Status Change Confirmation Dialog 
            ▪ Subtask 5.4.2.1: On clicking "Update Status," display a modal for confirmation (e.g., "Confirm status change to [New Status]?"). 
            ▪ Subtask 5.4.2.2: Include warning if cancelling order (e.g., "This will also initiate a refund and restock items."). 
        ◦ Task 5.4.3: Frontend API Integration: Update Order Status 
            ▪ Subtask 5.4.3.1: Create service/hook to call PUT /api/admin/orders/:orderId/status. 
            ▪ Subtask 5.4.3.2: Send the newStatus, trackingNumber, and trackingLink (if applicable) in the request body. 
            ▪ Subtask 5.4.3.3: On successful response, refresh the order details on the current page to reflect the new status. 
            ▪ Subtask 5.4.3.4: Display success/error notifications. 
    • Backend Tasks (Admin API):
        ◦ Task 5.4.4: Define Order Status Transition Logic 
            ▪ Subtask 5.4.4.1: Create a predefined list or state machine for valid order status transitions (e.g., Pending -> Processing, Processing -> Shipped, Shipped -> Delivered, Any -> Cancelled, Delivered -> Returned). 
        ◦ Task 5.4.5: Create Update Order Status API Endpoint 
            ▪ Subtask 5.4.5.1: Design and implement PUT /api/admin/orders/:orderId/status. 
            ▪ Subtask 5.4.5.2: Apply admin authentication middleware (from Story 5.1). 
            ▪ Subtask 5.4.5.3: Validate orderId and ensure it exists. 
            ▪ Subtask 5.4.5.4: Validate newStatus against the current order status using the defined transition logic. Return error if invalid. 
            ▪ Subtask 5.4.5.5: If newStatus is "Shipped": 
                • Validate trackingNumber and trackingLink are present and valid. 
                • Store them in the Order document. 
            ▪ Subtask 5.4.5.6: If newStatus is "Cancelled": 
                • Implement Transactional Logic: 
                    ◦ Start database transaction. 
                    ◦ For each item in the order, increment the stockQuantity in the Product collection. 
                    ◦ Initiate Refund Process: If the order was paid, trigger a refund via the payment gateway (similar to Story 4.2 cancellation logic, but initiated by admin). 
                    ◦ Commit transaction. 
            ▪ Subtask 5.4.5.7: Update Order document's status. 
            ▪ Subtask 5.4.5.8: Log the status change: Append entry to statusHistory (from Story 4.1's order model enhancement) including timestamp, oldStatus, newStatus, adminUserId (who made the change). 
            ▪ Subtask 5.4.5.9: Trigger relevant email notifications (e.g., "Order Shipped," "Order Delivered"). 
            ▪ Subtask 5.4.5.10: Return updated order data or success message. 
        ◦ Task 5.4.6: Email Service Integration (Status Notifications) 
            ▪ Subtask 5.4.6.1: Create email templates for "Order Shipped" (include tracking info) and "Order Delivered" notifications. 
            ▪ Subtask 5.4.6.2: Implement functions to send these emails triggered by the status update API. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.4.7: Robust Authorization & Input Validation 
            ▪ Subtask 5.4.7.1: Ensure only authenticated admins can use this endpoint. 
            ▪ Subtask 5.4.7.2: Server-side validation for all input fields is critical. 
        ◦ Task 5.4.8: Atomic Operations for Cancellation 
            ▪ Subtask 5.4.8.1: Reconfirm that stock updates and refund initiations for admin-initiated cancellations are atomic transactions. 
    • Testing Tasks:
        ◦ Task 5.4.9: Write Unit Tests 
            ▪ Subtask 5.4.9.1: Unit tests for frontend status dropdown logic (valid next states). 
            ▪ Subtask 5.4.9.2: Unit tests for backend status transition logic. 
            ▪ Subtask 5.4.9.3: Unit tests for stock increment logic on cancellation. 
        ◦ Task 5.4.10: Write Integration Tests 
            ▪ Subtask 5.4.10.1: Create an order (Status: "Pending"). As admin, change to "Processing". Verify. 
            ▪ Subtask 5.4.10.2: Change from "Processing" to "Shipped" with valid tracking info. Verify status, tracking fields, and mock email trigger. 
            ▪ Subtask 5.4.10.3: Change from "Shipped" to "Delivered". Verify. 
            ▪ Subtask 5.4.10.4: Change an order from "Processing" to "Cancelled". Verify status, stock return, and mock refund/email trigger. 
            ▪ Subtask 5.4.10.5: Attempt invalid status transitions (e.g., "Pending" directly to "Delivered"). Expect error. 
            ▪ Subtask 5.4.10.6: Attempt "Shipped" status update without tracking info (expect error). 
            ▪ Subtask 5.4.10.7: Test unauthorized access. 
        ◦ Task 5.4.11: Manual End-to-End Testing 
            ▪ Subtask 5.4.11.1: Log in to admin. Go to Order Details for a test order. 
            ▪ Subtask 5.4.11.2: Select "Processing" from dropdown, confirm. Verify UI updates. 
            ▪ Subtask 5.4.11.3: Select "Shipped", enter dummy tracking number/link, confirm. Verify UI updates and check customer's order tracking page. Verify email received. 
            ▪ Subtask 5.4.11.4: Select "Delivered", confirm. Verify UI updates and check customer's order tracking page. Verify email received. 
            ▪ Subtask 5.4.11.5: Take another test order. Select "Cancelled", confirm. Verify stock increases, and check for refund initiation (e.g., in Stripe dashboard test mode).
Epic: Admin Order Management
Story 5.5: Issue Refund (Admin)
Story: As an administrator, I want to be able to issue full or partial refunds for orders so that I can process returns, cancellations, or resolve customer issues efficiently.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. On the "Order Details" page (Story 5.3), a "Issue Refund" button or section is available for eligible orders (e.g., paid orders that are not fully refunded). 
    2. Clicking "Issue Refund" presents a modal or form allowing the admin to: 
        ◦ Select individual items to refund (quantity for each). 
        ◦ Specify a custom refund amount. 
        ◦ Provide a reason for the refund (required). 
    3. The system calculates the maximum refundable amount for selected items/quantities. 
    4. Confirmation dialog appears before initiating the refund. 
    5. Upon successful refund, the refund is processed via the payment gateway (e.g., Stripe). 
    6. The order's refundStatus and refundHistory are updated in the database. 
    7. If a full refund is issued, the order's status may change to "Refunded" or "Closed". 
    8. An email notification is automatically sent to the customer confirming the refund. 
    9. Stock levels are returned to inventory for refunded items, similar to cancellation. 
    10. All refund operations are securely logged and authorized. 

Granular Tasks & Subtasks for Story 5.5:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.5.1: Implement "Issue Refund" UI on Order Details Page 
            ▪ Subtask 5.5.1.1: On AdminOrderDetailsPage (Story 5.3), add an "Issue Refund" button/section. 
            ▪ Subtask 5.5.1.2: Implement logic to enable/disable this button based on order paymentStatus (must be paid) and refundStatus (not fully refunded). 
        ◦ Task 5.5.2: Implement Refund Form Modal 
            ▪ Subtask 5.5.2.1: On clicking "Issue Refund," display a modal with the refund form. 
            ▪ Subtask 5.5.2.2: Option 1 (Item-based refund): List purchased items with checkboxes, quantity inputs, and calculated max refundable amount per item. 
            ▪ Option 2 (Amount-based refund, simpler for MVP): Allow direct input of a numeric refund amount, with a clear display of the maximum refundable amount for the entire order. 
            ▪ Subtask 5.5.2.3: Add a "Refund Reason" dropdown/textarea (required). 
            ▪ Subtask 5.5.2.4: Display the calculated total refund amount based on selections/input. 
            ▪ Subtask 5.5.2.5: Add "Confirm Refund" button. 
        ◦ Task 5.5.3: Implement Client-Side Validation for Refund Form 
            ▪ Subtask 5.5.3.1: Validate refund amount is numeric and within refundable limits. 
            ▪ Subtask 5.5.3.2: Ensure refund reason is provided. 
        ◦ Task 5.5.4: Implement Refund Confirmation Dialog 
            ▪ Subtask 5.5.4.1: Display a confirmation modal with summary of refund amount and items before final submission. 
        ◦ Task 5.5.5: Frontend API Integration: Initiate Refund 
            ▪ Subtask 5.5.5.1: Create service/hook to call POST /api/admin/orders/:orderId/refund. 
            ▪ Subtask 5.5.5.2: Send refundAmount (or refundItems with quantities), refundReason, and orderId in the request body. 
            ▪ Subtask 5.5.5.3: On successful response, update the order details on the current page to reflect the refund status. 
            ▪ Subtask 5.5.5.4: Display success/error notifications (e.g., "Refund initiated successfully," "Refund failed: [error]"). 
    • Backend Tasks (Admin API):
        ◦ Task 5.5.6: Update Order Model for Refund Tracking 
            ▪ Subtask 5.5.6.1: Ensure the Order schema includes fields for: 
                • refundStatus (Enum: none, partial_refunded, fully_refunded, pending_refund) 
                • totalRefundedAmount (Number) 
                • refundHistory (Array of objects: refundId, amount, date, reason, adminUserId, status (e.g., 'succeeded', 'failed', 'pending')) 
        ◦ Task 5.5.7: Create Issue Refund API Endpoint 
            ▪ Subtask 5.5.7.1: Design and implement POST /api/admin/orders/:orderId/refund. 
            ▪ Subtask 5.5.7.2: Apply admin authentication middleware. 
            ▪ Subtask 5.5.7.3: Validate orderId and ensure it's a valid, paid order. 
            ▪ Subtask 5.5.7.4: Validate refund amount/items: 
                • Calculate maximum refundable amount for the order (e.g., grandTotal - totalRefundedAmount). 
                • If item-based refund, verify quantities and calculate corresponding amount. 
                • Ensure requested refundAmount does not exceed the maximum. 
                • Ensure refundReason is provided. 
            ▪ Subtask 5.5.7.5: Initiate Refund via Payment Gateway (Stripe): 
                • Use Stripe SDK to call stripe.refunds.create with the paymentIntentId (from order) and the amount to refund. 
                • Handle Stripe's response (success, pending, failure). 
            ▪ Subtask 5.5.7.6: Implement Transactional Logic: 
                • Start database transaction. 
                • Update totalRefundedAmount and refundStatus in the Order document. 
                • Add entry to refundHistory. 
                • If the refund is due to item returns, increment stockQuantity for the corresponding products in the Product collection. 
                • If fully refunded, update orderStatus to "Refunded" or "Closed". 
                • Commit transaction. 
            ▪ Subtask 5.5.7.7: Trigger sending of refund confirmation email. 
            ▪ Subtask 5.5.7.8: Return success response with updated order data. 
        ◦ Task 5.5.8: Email Service Integration (Refund Confirmation) 
            ▪ Subtask 5.5.8.1: Create an email template for refund confirmation. 
            ▪ Subtask 5.5.8.2: Include details: order number, refund amount, items refunded, refund reason, and expected processing time. 
            ▪ Subtask 5.5.8.3: Implement function to send this email. 
        ◦ Task 5.5.9: (Optional) Handle Payment Gateway Webhooks for Async Refunds 
            ▪ Subtask 5.5.9.1: If refunds are asynchronous, set up Stripe webhooks (e.g., charge.refunded) to update refundStatus and refundHistory when payment gateway confirms the refund. (Crucial for robust systems). 
    • Security & Data Integrity Tasks:
        ◦ Task 5.5.10: Strict Authorization & Amount Validation 
            ▪ Subtask 5.5.10.1: Only authorized admins can initiate refunds. 
            ▪ Subtask 5.5.10.2: Server-side validation of refund amount against available balance is paramount. 
        ◦ Task 5.5.11: Atomic Refund Operations 
            ▪ Subtask 5.5.11.1: Ensure that the refund status update, totalRefundedAmount update, refundHistory entry, and stock adjustment are all part of a single, atomic database transaction. 
    • Testing Tasks:
        ◦ Task 5.5.12: Write Unit Tests 
            ▪ Subtask 5.5.12.1: Unit tests for frontend refund amount calculation and validation. 
            ▪ Subtask 5.5.12.2: Unit tests for backend max refundable amount calculation. 
            ▪ Subtask 5.5.12.3: Unit tests for refund initiation (mocking Stripe API). 
            ▪ Subtask 5.5.12.4: Unit tests for stock increment on refund. 
        ◦ Task 5.5.13: Write Integration Tests 
            ▪ Subtask 5.5.13.1: Place a full order. Log in as admin. Issue a full refund. Verify order refundStatus, totalRefundedAmount, refundHistory and stockQuantity in DB. Mock Stripe refund success. 
            ▪ Subtask 5.5.13.2: Place another order. Issue a partial refund (e.g., refund 1 out of 2 items). Verify refundStatus (partial), totalRefundedAmount and stockQuantity for only the refunded item. 
            ▪ Subtask 5.5.13.3: Attempt to refund more than available (expect error). 
            ▪ Subtask 5.5.13.4: Test refunding an order that wasn't paid or already fully refunded (expect error). 
            ▪ Subtask 5.5.13.5: Test unauthorized access. 
        ◦ Task 5.5.14: Manual End-to-End Testing 
            ▪ Subtask 5.5.14.1: Place a test order (e.g., 3 units of Product A, 2 units of Product B). Note initial stock. 
            ▪ Subtask 5.5.14.2: Log in as admin, navigate to the order details. 
            ▪ Subtask 5.5.14.3: Click "Issue Refund." Select to refund 1 unit of Product A. Provide reason. Confirm. 
            ▪ Subtask 5.5.14.4: Verify UI updates (refunded amount, refund history). 
            ▪ Subtask 5.5.14.5: Check Product A's stock; it should be initial + 1. 
            ▪ Subtask 5.5.14.6: Verify refund confirmation email is received. 
            ▪ Subtask 5.5.14.7: Attempt to issue another refund to reach full amount for remaining items. Verify refundStatus becomes "fully_refunded". 
            ▪ Subtask 5.5.14.8: Try to refund a non-refundable amount (e.g., already fully refunded order) to confirm validation.
Epic: Admin Order Management
Story 5.6: Manage Return Requests (Admin)
Story: As an administrator, I want to be able to view, approve, reject, and track customer return requests so that I can efficiently process returns and issue refunds.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Returns" section/link is available in the Admin Dashboard navigation. 
    2. The "Manage Returns" page displays a list of all return requests. 
    3. For each return request, the following information is displayed: 
        ◦ Return Request ID 
        ◦ Customer Name 
        ◦ Request Date 
        ◦ Order Number 
        ◦ Status (e.g., "Pending Review," "Approved," "Rejected," "Received," "Refunded," "Closed") 
    4. Admins can filter return requests by status, customer, and date range. 
    5. Admins can sort return requests by date. 
    6. Clicking a return request allows the admin to view its full details (similar to customer Return Details in Story 4.5), including: 
        ◦ Return Request ID 
        ◦ Request Date 
        ◦ Status 
        ◦ List of returned items with quantities and reasons 
        ◦ Customer comments 
        ◦ (Optional) Uploaded images from the customer 
    7. The admin can change the status of a return request (e.g., "Approve," "Reject," "Received"). 
    8. If a return is "Approved," the admin can optionally initiate a refund (linking to Story 5.5). 
    9. If a return is "Rejected," the admin must provide a reason for the rejection, which is communicated to the customer. 
    10. The system tracks the history of each return request (status changes, admin actions). 
    11. Email notifications are sent to the customer for significant status changes (e.g., "Approved," "Rejected"). 

Granular Tasks & Subtasks for Story 5.6:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.6.1: Implement "Manage Returns" Page UI 
            ▪ Subtask 5.6.1.1: Create AdminReturnsListPage component/route (e.g., /admin/returns). 
            ▪ Subtask 5.6.1.2: Add a navigation link for "Manage Returns" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.6.1.3: Design and implement a paginated list of return requests with summary information (ID, Customer, Date, Order Number, Status). 
            ▪ Subtask 5.6.1.4: Implement filtering and sorting UI (similar to AdminOrdersListPage). 
            ▪ Subtask 5.6.1.5: Add links to view details of each return request. 
        ◦ Task 5.6.2: Implement "Return Request Details" Page UI (Admin) 
            ▪ Subtask 5.6.2.1: Create AdminReturnDetailsPage component/route (e.g., /admin/returns/:returnRequestId). 
            ▪ Subtask 5.6.2.2: Display all details of the return request (from backend). 
            ▪ Subtask 5.6.2.3: Include a section for changing the return status. 
            ▪ Subtask 5.6.2.4: If "Approved," provide a link/button to "Issue Refund" (using the UI from Story 5.5). 
            ▪ Subtask 5.6.2.5: If "Rejected," require a reason input. 
            ▪ Subtask 5.6.2.6: Display a history log of status changes and admin actions. 
        ◦ Task 5.6.3: Frontend API Integration: Fetch Return Requests (List) 
            ▪ Subtask 5.6.3.1: Create service/hook to call GET /api/admin/returns. 
            ▪ Subtask 5.6.3.2: Handle pagination, filtering, and sorting parameters. 
        ◦ Task 5.6.4: Frontend API Integration: Fetch Return Request Details 
            ▪ Subtask 5.6.4.1: Create service/hook to call GET /api/admin/returns/:returnRequestId. 
        ◦ Task 5.6.5: Frontend API Integration: Update Return Status 
            ▪ Subtask 5.6.5.1: Create service/hook to call PUT /api/admin/returns/:returnRequestId/status. 
            ▪ Subtask 5.6.5.2: Send the newStatus (and rejectionReason if applicable) in the body. 
    • Backend Tasks (Admin API):
        ◦ Task 5.6.6: Create Get Return Requests API Endpoint (List) 
            ▪ Subtask 5.6.6.1: Design and implement GET /api/admin/returns. 
            ▪ Subtask 5.6.6.2: Apply admin authentication. 
            ▪ Subtask 5.6.6.3: Implement pagination, filtering (by status, customer, date), and sorting. 
            ▪ Subtask 5.6.6.4: Return a list of return requests with summary details. 
        ◦ Task 5.6.7: Create Get Return Request Details API Endpoint 
            ▪ Subtask 5.6.7.1: Design and implement GET /api/admin/returns/:returnRequestId. 
            ▪ Subtask 5.6.7.2: Apply admin authentication. 
            ▪ Subtask 5.6.7.3: Fetch the full ReturnRequest document. 
            ▪ Subtask 5.6.7.4: Populate nested data: orderId, customerId (to get customer name). 
            ▪ Subtask 5.6.7.5: Return all details. 
        ◦ Task 5.6.8: Create Update Return Status API Endpoint 
            ▪ Subtask 5.6.8.1: Design and implement PUT /api/admin/returns/:returnRequestId/status. 
            ▪ Subtask 5.6.8.2: Apply admin authentication. 
            ▪ Subtask 5.6.8.3: Validate returnRequestId and newStatus. 
            ▪ Subtask 5.6.8.4: If newStatus is "Rejected," ensure rejectionReason is provided. 
            ▪ Subtask 5.6.8.5: Update the ReturnRequest document's status. 
            ▪ Subtask 5.6.8.6: If newStatus is "Approved," optionally link to the "Issue Refund" logic from Story 5.5 (or trigger refund automatically if configured). 
            ▪ Subtask 5.6.8.7: Add an entry to a returnHistory array in the ReturnRequest document, logging the status change and admin user. 
            ▪ Subtask 5.6.8.8: Trigger email notifications for "Approved" or "Rejected" status changes. 
        ◦ Task 5.6.9: Email Service Integration (Return Status Notifications) 
            ▪ Subtask 5.6.9.1: Create email templates for "Return Approved" and "Return Rejected". 
            ▪ Subtask 5.6.9.2: Include relevant details in the email (return ID, items, reason for rejection if applicable). 
            ▪ Subtask 5.6.9.3: Implement functions to send these emails. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.6.10: Secure Access and Input Validation 
            ▪ Subtask 5.6.10.1: Ensure only authenticated admins can access and modify return requests. 
            ▪ Subtask 5.6.10.2: Validate all input data (status, rejection reason) on the server side. 
    • Testing Tasks:
        ◦ Task 5.6.11: Write Unit Tests 
            ▪ Subtask 5.6.11.1: Unit tests for frontend logic related to return status updates. 
            ▪ Subtask 5.6.11.2: Unit tests for backend return request retrieval and status update logic. 
        ◦ Task 5.6.12: Write Integration Tests 
            ▪ Subtask 5.6.12.1: Create a return request (manually or via the customer flow). 
            ▪ Subtask 5.6.12.2: As admin, view the list of returns and verify the created request is present. 
            ▪ Subtask 5.6.12.3: View the details of the return request. 
            ▪ Subtask 5.6.12.4: Change the status to "Approved". Verify the status change and the link to initiate a refund. 
            ▪ Subtask 5.6.12.5: Change the status to "Rejected" with a reason. Verify the status change and the rejection reason. Mock email sending. 
            ▪ Subtask 5.6.12.6: Test unauthorized access. 
        ◦ Task 5.6.13: Manual End-to-End Testing 
            ▪ Subtask 5.6.13.1: Create a return request. 
            ▪ Subtask 5.6.13.2: Log in as admin, navigate to "Manage Returns". 
            ▪ Subtask 5.6.13.3: Verify the return request is listed. 
            ▪ Subtask 5.6.13.4: View the details. 
            ▪ Subtask 5.6.13.5: Change the status to "Approved". Verify UI updates and the "Issue Refund" link. 
            ▪ Subtask 5.6.13.6: Change the status to "Rejected" and provide a reason. Verify the UI updates and the rejection reason is displayed. Verify email received by customer.
Epic: Admin Order Management
Story 5.7: Manage Products (List, Search, Filter)
Story: As an administrator, I want to view a paginated list of all products, with options to search and filter them, so that I can efficiently locate specific products for review or modification.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Products" link is available in the Admin Dashboard navigation. 
    2. Clicking "Manage Products" navigates the admin to a product list page. 
    3. The page displays a paginated list of all products in the system. 
    4. For each product, the following key details are displayed: 
        ◦ Product Name 
        ◦ SKU (Stock Keeping Unit) 
        ◦ Price 
        ◦ Current Stock Quantity 
        ◦ Status (e.g., "Active," "Draft," "Archived," "Out of Stock") 
        ◦ Main Image Thumbnail 
    5. Admins can search for products by: 
        ◦ Product Name 
        ◦ SKU 
    6. Admins can filter products by: 
        ◦ Category 
        ◦ Status (e.g., "Active," "Draft," "Out of Stock") 
        ◦ Price Range 
        ◦ Stock Level (e.g., "In Stock," "Low Stock," "Out of Stock") 
    7. Admins can sort products by: 
        ◦ Product Name (A-Z) 
        ◦ Price 
        ◦ Stock Quantity 
    8. A "View Details" or "Edit" button/link is available for each product to navigate to its full details (this will be addressed in Story 5.8). 
    9. All data retrieval is performed securely with admin-level authentication. 

Granular Tasks & Subtasks for Story 5.7:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.7.1: Implement "Manage Products" Page UI 
            ▪ Subtask 5.7.1.1: Create AdminProductsListPage component/route (e.g., /admin/products). 
            ▪ Subtask 5.7.1.2: Add a navigation link for "Manage Products" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.7.1.3: Design and implement a responsive table or grid layout to display product summaries. 
            ▪ Subtask 5.7.1.4: Include columns/fields for Product Name, SKU, Price, Stock Quantity, Status, Main Image Thumbnail. 
            ▪ Subtask 5.7.1.5: Add an "Edit" or "View Details" button/link for each product row. 
        ◦ Task 5.7.2: Implement Pagination UI for Products 
            ▪ Subtask 5.7.2.1: Reuse/adapt existing Pagination component. 
            ▪ Subtask 5.7.2.2: Integrate pagination controls with the product list. 
        ◦ Task 5.7.3: Implement Search UI 
            ▪ Subtask 5.7.3.1: Add a search bar for Product Name and SKU. 
        ◦ Task 5.7.4: Implement Filtering UI 
            ▪ Subtask 5.7.4.1: Add dropdowns/selects for filtering by Category and Status. 
            ▪ Subtask 5.7.4.2: Implement input fields or sliders for Price Range filtering. 
            ▪ Subtask 5.7.4.3: Add dropdowns/checkboxes for Stock Level filtering (e.g., "In Stock," "Out of Stock," "Low Stock" with a configurable threshold). 
            ▪ Subtask 5.7.4.4: Include "Apply Filters" and "Clear Filters" buttons. 
        ◦ Task 5.7.5: Implement Sorting UI 
            ▪ Subtask 5.7.5.1: Make table headers clickable for sorting (Product Name, Price, Stock Quantity). 
            ▪ Subtask 5.7.5.2: Indicate current sort direction (ascending/descending). 
        ◦ Task 5.7.6: Frontend API Integration: Fetch All Products (with Filters/Search/Sorting) 
            ▪ Subtask 5.7.6.1: Create service/hook to call GET /api/admin/products. 
            ▪ Subtask 5.7.6.2: Pass pagination parameters (page, limit), search query (searchQuery), filtering parameters (category, status, minPrice, maxPrice, stockStatus), and sorting parameters (sortBy, sortOrder). 
            ▪ Subtask 5.7.6.3: Display fetched product data in the table/grid. 
            ▪ Subtask 5.7.6.4: Handle loading states and display "No products found" message. 
    • Backend Tasks (Admin API):
        ◦ Task 5.7.7: Create Get All Products API Endpoint (for Admin) 
            ▪ Subtask 5.7.7.1: Design and implement GET /api/admin/products. 
            ▪ Subtask 5.7.7.2: Apply admin authentication middleware (from Story 5.1). 
            ▪ Subtask 5.7.7.3: Implement logic to query the Product collection for all products. 
            ▪ Subtask 5.7.7.4: Implement pagination (skip/limit) on the query. 
            ▪ Subtask 5.7.7.5: Implement search logic (e.g., $regex for name and sku). 
            ▪ Subtask 5.7.7.6: Implement filtering logic based on: 
                • category (e.g., $match { category: '...' }) 
                • status (e.g., $match { status: '...' }) 
                • minPrice, maxPrice (e.g., $match { price: { $gte: ..., $lte: ... } }) 
                • stockStatus (e.g., $match { stockQuantity: { $gt: 0 } } for "In Stock", $match { stockQuantity: 0 } for "Out of Stock", custom logic for "Low Stock" threshold). 
            ▪ Subtask 5.7.7.7: Implement sorting logic based on name, price, stockQuantity. 
            ▪ Subtask 5.7.7.8: Return the paginated list of products and total count. 
        ◦ Task 5.7.8: Optimize Database Indexes 
            ▪ Subtask 5.7.8.1: Ensure appropriate indexes exist on Product fields for filtering, searching, and sorting (e.g., name, sku, category, status, price, stockQuantity). 
    • Security Tasks:
        ◦ Task 5.7.9: Secure Data Retrieval 
            ▪ Subtask 5.7.9.1: Ensure only authenticated admins can access this product list endpoint. 
    • Testing Tasks:
        ◦ Task 5.7.10: Write Unit Tests 
            ▪ Subtask 5.7.10.1: Unit tests for frontend filter/sort state management. 
            ▪ Subtask 5.7.10.2: Unit tests for backend product querying logic (pagination, filtering, searching, sorting with mock DB). 
        ◦ Task 5.7.11: Write Integration Tests 
            ▪ Subtask 5.7.11.1: Log in as admin, then call GET /api/admin/products. Verify list of products is returned. 
            ▪ Subtask 5.7.11.2: Test with page and limit parameters to verify pagination. 
            ▪ Subtask 5.7.11.3: Test searching by name and sku. 
            ▪ Subtask 5.7.11.4: Test filtering by category, status, price range, and stockStatus. 
            ▪ Subtask 5.7.11.5: Test sorting by name, price, and stockQuantity (ASC/DESC). 
            ▪ Subtask 5.7.11.6: Test unauthorized access to this endpoint. 
        ◦ Task 5.7.12: Manual End-to-End Testing 
            ▪ Subtask 5.7.12.1: Log in to the admin panel. 
            ▪ Subtask 5.7.12.2: Navigate to "Manage Products." 
            ▪ Subtask 5.7.12.3: Verify all products are listed with correct summary details. 
            ▪ Subtask 5.7.12.4: Test pagination controls. 
            ▪ Subtask 5.7.12.5: Use the search bar for product names and SKUs. 
            ▪ Subtask 5.7.12.6: Apply various filters (by category, status, price range, stock level) and verify results. 
            ▪ Subtask 5.7.12.7: Test sorting by clicking on column headers. 
            ▪ Subtask 5.7.12.8: Ensure "Edit" or "View Details" links are present (though actual editing will be in Story 5.8).
Epic: Admin Order Management
Story 5.8: Add/Edit Product (Admin)
Story: As an administrator, I want to be able to add new products and edit existing product details, including images, descriptions, pricing, inventory, and categories, so that I can maintain an accurate and up-to-date product catalog.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. From the "Manage Products" list (Story 5.7), an "Add New Product" button is available. 
    2. Clicking "Edit" on an existing product (from Story 5.7) navigates to an edit form pre-populated with its details. 
    3. The "Add/Edit Product" form allows the admin to input/modify the following product attributes: 
        ◦ Basic Info: Product Name (required), SKU (required, unique), Short Description, Long Description. 
        ◦ Pricing: Price (required, numeric), Sale Price (optional), Tax Class (dropdown). 
        ◦ Inventory: Stock Quantity (required, numeric), Low Stock Threshold (optional), Availability Status (In Stock, Out of Stock, Pre-Order). 
        ◦ Categorization: Category (dropdown, multi-select allowed), Tags (multi-select/text input). 
        ◦ Media: Main Product Image (upload), Additional Images (upload, multiple allowed). 
        ◦ Visibility: Product Status (e.g., "Active," "Draft," "Archived"). 
        ◦ (Optional, advanced for later) Product Variants (e.g., Size, Color with unique SKU/Stock/Price). 
    4. All required fields are validated client-side and server-side. 
    5. Image uploads are handled securely (resizing, storage). 
    6. Upon successful save (add or edit), the admin is redirected back to the "Manage Products" list, and the changes are immediately reflected. 
    7. Appropriate success/error messages are displayed. 
    8. All product creation/modification operations are securely logged with an audit trail (who changed, when). 

Granular Tasks & Subtasks for Story 5.8:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.8.1: Implement "Add New Product" Button & Routing 
            ▪ Subtask 5.8.1.1: Add an "Add New Product" button on the AdminProductsListPage (Story 5.7). 
            ▪ Subtask 5.8.1.2: Configure routing for /admin/products/new (for new product) and /admin/products/edit/:productId (for editing). 
        ◦ Task 5.8.2: Design & Implement "Product Form" UI 
            ▪ Subtask 5.8.2.1: Create AdminProductFormPage component. 
            ▪ Subtask 5.8.2.2: Structure the form into logical sections (e.g., Basic Info, Pricing, Inventory, Media, Categories & Tags). 
            ▪ Subtask 5.8.2.3: Implement input fields for: 
                • Product Name (text) 
                • SKU (text) 
                • Short Description (textarea) 
                • Long Description (rich text editor, or another textarea for MVP) 
                • Price (number input) 
                • Sale Price (number input) 
                • Tax Class (dropdown/select, potentially fetching from backend if defined) 
                • Stock Quantity (number input) 
                • Low Stock Threshold (number input) 
                • Availability Status (radio buttons/dropdown: In Stock, Out of Stock, Pre-Order) 
                • Category (multi-select/checkboxes, populated from backend categories) 
                • Tags (multi-select or text input with comma separation) 
                • Product Status (radio buttons/dropdown: Active, Draft, Archived) 
            ▪ Subtask 5.8.2.4: Implement file upload components for Main Product Image and Additional Images (with preview). 
            ▪ Subtask 5.8.2.5: Add "Save" and "Cancel" buttons. 
        ◦ Task 5.8.3: Implement Form Data Pre-population (for Edit Mode) 
            ▪ Subtask 5.8.3.1: If productId exists in the route params, fetch existing product data using GET /api/admin/products/:productId. 
            ▪ Subtask 5.8.3.2: Populate all form fields with fetched data. 
        ◦ Task 5.8.4: Implement Client-Side Form Validation 
            ▪ Subtask 5.8.4.1: Validate required fields (Name, SKU, Price, Stock Quantity). 
            ▪ Subtask 5.8.4.2: Validate numeric inputs (Price, Stock) and ensure positive values where appropriate. 
            ▪ Subtask 5.8.4.3: Validate SKU uniqueness (could be a debounced API call or on submission). 
            ▪ Subtask 5.8.4.4: Provide real-time error messages. 
        ◦ Task 5.8.5: Frontend API Integration: Submit Product Data 
            ▪ Subtask 5.8.5.1: Create service/hook to call POST /api/admin/products for new products. 
            ▪ Subtask 5.8.5.2: Create service/hook to call PUT /api/admin/products/:productId for editing. 
            ▪ Subtask 5.8.5.3: Use FormData for requests involving file uploads. 
            ▪ Subtask 5.8.5.4: On successful submission, redirect to AdminProductsListPage (Story 5.7) and display a success notification. 
            ▪ Subtask 5.8.5.5: Handle error responses (e.g., validation errors, unique SKU violation, server errors). 
    • Backend Tasks (Admin API):
        ◦ Task 5.8.6: Create Add Product API Endpoint 
            ▪ Subtask 5.8.6.1: Design and implement POST /api/admin/products. 
            ▪ Subtask 5.8.6.2: Apply admin authentication middleware. 
            ▪ Subtask 5.8.6.3: Implement server-side validation for all product fields (required, data types, ranges). 
            ▪ Subtask 5.8.6.4: Validate SKU uniqueness before creating a new product. 
            ▪ Subtask 5.8.6.5: Handle image uploads: 
                • Receive image files. 
                • Process images (resize, optimize). 
                • Store images securely (e.g., to AWS S3, Google Cloud Storage, or local file system if suitable for MVP). 
                • Save image URLs to the Product document. 
            ▪ Subtask 5.8.6.6: Create new Product document in MongoDB. 
            ▪ Subtask 5.8.6.7: Return the newly created product details. 
        ◦ Task 5.8.7: Create Edit Product API Endpoint 
            ▪ Subtask 5.8.7.1: Design and implement PUT /api/admin/products/:productId. 
            ▪ Subtask 5.8.7.2: Apply admin authentication middleware. 
            ▪ Subtask 5.8.7.3: Validate productId and ensure the product exists. 
            ▪ Subtask 5.8.7.4: Implement server-side validation for all fields. 
            ▪ Subtask 5.8.7.5: Handle image updates (new uploads, deletion of old images). 
            ▪ Subtask 5.8.7.6: Update existing Product document in MongoDB. 
            ▪ Subtask 5.8.7.7: Audit Logging: Record which admin user made the changes, what changes were made, and when. 
            ▪ Subtask 5.8.7.8: Return the updated product details. 
        ◦ Task 5.8.8: Create Get Single Product Details API Endpoint (for Admin Edit) 
            ▪ Subtask 5.8.8.1: Design and implement GET /api/admin/products/:productId. 
            ▪ Subtask 5.8.8.2: Apply admin authentication middleware. 
            ▪ Subtask 5.8.8.3: Fetch Product document by _id. 
            ▪ Subtask 5.8.8.4: Return full product details. 
        ◦ Task 5.8.9: Image Upload & Storage Integration (Backend) 
            ▪ Subtask 5.8.9.1: Set up image processing library (e.g., Sharp for Node.js) for resizing/optimization. 
            ▪ Subtask 5.8.9.2: Integrate with cloud storage service (S3/GCS) or configure local storage for images. 
            ▪ Subtask 5.8.9.3: Implement logic for deleting old images when new ones are uploaded/removed. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.8.10: Input Sanitization & Validation 
            ▪ Subtask 5.8.10.1: Sanitize all text inputs to prevent XSS. 
            ▪ Subtask 5.8.10.2: Enforce data types and constraints on all fields. 
        ◦ Task 5.8.11: File Upload Security 
            ▪ Subtask 5.8.11.1: Validate file types (only images), file sizes, and potentially scan for malicious content. 
    • Testing Tasks:
        ◦ Task 5.8.12: Write Unit Tests 
            ▪ Subtask 5.8.12.1: Unit tests for frontend form validation. 
            ▪ Subtask 5.8.12.2: Unit tests for backend product creation/update logic, including SKU uniqueness and data validation. 
            ▪ Subtask 5.8.12.3: Unit tests for image processing and storage integration (mocking external services). 
        ◦ Task 5.8.13: Write Integration Tests 
            ▪ Subtask 5.8.13.1: Log in as admin. Test POST /api/admin/products with valid data (including image upload). Verify product creation. 
            ▪ Subtask 5.8.13.2: Test POST /api/admin/products with invalid data (missing required fields, invalid price, non-unique SKU). Expect errors. 
            ▪ Subtask 5.8.13.3: Fetch an existing product via GET /api/admin/products/:productId. 
            ▪ Subtask 5.8.13.4: Test PUT /api/admin/products/:productId with valid updates (text fields, image replacement, image deletion). Verify changes reflected. 
            ▪ Subtask 5.8.13.5: Test PUT /api/admin/products/:productId with invalid updates. Expect errors. 
            ▪ Subtask 5.8.13.6: Test unauthorized access to these endpoints. 
        ◦ Task 5.8.14: Manual End-to-End Testing 
            ▪ Subtask 5.8.14.1: Log in to admin. Navigate to "Manage Products." 
            ▪ Subtask 5.8.14.2: Click "Add New Product." Fill out form with various data types, upload images. Test client-side validation. Submit. Verify product appears in the list. 
            ▪ Subtask 5.8.14.3: Edit the newly created product. Change details, replace/add/remove images. Submit. Verify changes. 
            ▪ Subtask 5.8.14.4: Edit an existing product. 
            ▪ Subtask 5.8.14.5: Try to create a product with an existing SKU. 
            ▪ Subtask 5.8.14.6: Verify product images are correctly displayed on the storefront (once integrated).
Epic: Admin Order Management
Story 5.9: Manage Product Categories (Admin)
Story: As an administrator, I want to be able to add, edit, and delete product categories, and manage their hierarchy, so that I can effectively organize the product catalog for customers.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Categories" link is available in the Admin Dashboard navigation (possibly under "Manage Products" submenu). 
    2. The "Manage Categories" page displays a list of all existing product categories, potentially with their hierarchy (parent/child relationships). 
    3. For each category, the following details are displayed: 
        ◦ Category Name 
        ◦ Slug (URL friendly identifier) 
        ◦ Parent Category (if applicable) 
        ◦ Number of Products in Category (optional, for insights) 
    4. Admins can add a new category by providing a name, slug, and optionally assigning a parent category. 
    5. Admins can edit an existing category's name, slug, and parent category. 
    6. Admins can delete a category. If a category has associated products or child categories, a warning is displayed, and deletion might be prevented or require reassigning products/children. 
    7. All category names and slugs must be unique (slug unique across entire system). 
    8. Changes are immediately reflected in the product creation/editing forms and on the storefront. 
    9. All category management operations are performed securely with admin-level authentication. 

Granular Tasks & Subtasks for Story 5.9:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.9.1: Implement "Manage Categories" Page UI 
            ▪ Subtask 5.9.1.1: Create AdminCategoriesListPage component/route (e.g., /admin/categories). 
            ▪ Subtask 5.9.1.2: Add a navigation link for "Manage Categories" in the Admin Dashboard sidebar/menu (potentially nested under "Products"). 
            ▪ Subtask 5.9.1.3: Design and implement a table or tree-like structure to display categories. 
            ▪ Subtask 5.9.1.4: Include columns for Category Name, Slug, Parent Category, and "Edit" / "Delete" buttons. 
            ▪ Subtask 5.9.1.5: Add an "Add New Category" button. 
        ◦ Task 5.9.2: Implement "Add/Edit Category" Form Modal/Page 
            ▪ Subtask 5.9.2.1: Create a reusable form component (e.g., CategoryForm) that can be used in a modal or dedicated page. 
            ▪ Subtask 5.9.2.2: Include input fields for: 
                • Category Name (text, required) 
                • Category Slug (text, automatically generated from name but editable, required) 
                • Parent Category (dropdown/select, populated with existing categories, allowing "None" for top-level). 
            ▪ Subtask 5.9.2.3: Implement client-side validation for required fields, format (slug), and uniqueness (debounced API call for slug validation). 
            ▪ Subtask 5.9.2.4: For "Edit" mode, pre-populate form fields with existing category data. 
            ▪ Subtask 5.9.2.5: Add "Save" and "Cancel" buttons. 
        ◦ Task 5.9.3: Implement Category Deletion Confirmation 
            ▪ Subtask 5.9.3.1: On clicking "Delete," display a confirmation modal with a warning about associated products/child categories. 
            ▪ Subtask 5.9.3.2: If deletion is prevented, provide a clear message. 
        ◦ Task 5.9.4: Frontend API Integration: Fetch Categories 
            ▪ Subtask 5.9.4.1: Create service/hook to call GET /api/admin/categories to fetch all categories for listing and parent dropdowns. 
        ◦ Task 5.9.5: Frontend API Integration: Add/Edit Category 
            ▪ Subtask 5.9.5.1: Create service/hook to call POST /api/admin/categories for new categories. 
            ▪ Subtask 5.9.5.2: Create service/hook to call PUT /api/admin/categories/:categoryId for editing. 
            ▪ Subtask 5.9.5.3: On successful submission, refresh the category list and display a success notification. 
            ▪ Subtask 5.9.5.4: Handle error responses (e.g., validation errors, unique slug violation). 
        ◦ Task 5.9.6: Frontend API Integration: Delete Category 
            ▪ Subtask 5.9.6.1: Create service/hook to call DELETE /api/admin/categories/:categoryId. 
            ▪ Subtask 5.9.6.2: On successful deletion, remove from list and display success. Handle errors if deletion is prevented. 
    • Backend Tasks (Admin API):
        ◦ Task 5.9.7: Design Category Data Model 
            ▪ Subtask 5.9.7.1: Define MongoDB schema for Category collection. Include _id, name, slug (unique index), parentId (references Category _id, optional), description (optional). 
        ◦ Task 5.9.8: Create Get All Categories API Endpoint 
            ▪ Subtask 5.9.8.1: Design and implement GET /api/admin/categories. 
            ▪ Subtask 5.9.8.2: Apply admin authentication middleware. 
            ▪ Subtask 5.9.8.3: Fetch all categories. Potentially return them in a hierarchical structure or flat list with parentId. 
        ◦ Task 5.9.9: Create Add Category API Endpoint 
            ▪ Subtask 5.9.9.1: Design and implement POST /api/admin/categories. 
            ▪ Subtask 5.9.9.2: Apply admin authentication. 
            ▪ Subtask 5.9.9.3: Implement server-side validation for name, slug (required, uniqueness), parentId (must refer to existing category, prevent self-referencing loops if implementing complex hierarchies). 
            ▪ Subtask 5.9.9.4: Generate slug from name if not provided, ensure uniqueness. 
            ▪ Subtask 5.9.9.5: Create new Category document. 
        ◦ Task 5.9.10: Create Edit Category API Endpoint 
            ▪ Subtask 5.9.10.1: Design and implement PUT /api/admin/categories/:categoryId. 
            ▪ Subtask 5.9.10.2: Apply admin authentication. 
            ▪ Subtask 5.9.10.3: Validate categoryId and ensure category exists. 
            ▪ Subtask 5.9.10.4: Implement server-side validation for updated name, slug, parentId. Ensure unique slug. 
            ▪ Subtask 5.9.10.5: Prevent a category from becoming its own descendant (parent/child loop detection). 
            ▪ Subtask 5.9.10.6: Update existing Category document. 
            ▪ Subtask 5.9.10.7: Audit Logging: Record changes. 
        ◦ Task 5.9.11: Create Delete Category API Endpoint 
            ▪ Subtask 5.9.11.1: Design and implement DELETE /api/admin/categories/:categoryId. 
            ▪ Subtask 5.9.11.2: Apply admin authentication. 
            ▪ Subtask 5.9.11.3: Implement pre-deletion checks: 
                • Check if any products are assigned to this category. If so, prevent deletion or require reassigning products to a default/other category. 
                • Check if any other categories use this as their parentId. If so, prevent deletion or require re-parenting child categories. 
            ▪ Subtask 5.9.11.4: If checks pass, delete the Category document. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.9.12: Strict Validation & Authorization 
            ▪ Subtask 5.9.12.1: Ensure all category management operations are restricted to authenticated admins. 
            ▪ Subtask 5.9.12.2: Robust server-side validation to prevent data corruption (e.g., duplicate slugs, invalid parent IDs, circular dependencies). 
    • Testing Tasks:
        ◦ Task 5.9.13: Write Unit Tests 
            ▪ Subtask 5.9.13.1: Unit tests for frontend form validation and slug generation. 
            ▪ Subtask 5.9.13.2: Unit tests for backend category creation/update logic, including uniqueness and hierarchical validation. 
            ▪ Subtask 5.9.13.3: Unit tests for pre-deletion checks. 
        ◦ Task 5.9.14: Write Integration Tests 
            ▪ Subtask 5.9.14.1: Log in as admin. Test POST /api/admin/categories with valid data. Verify category creation. 
            ▪ Subtask 5.9.14.2: Test POST /api/admin/categories with duplicate name/slug, or invalid parentId. Expect errors. 
            ▪ Subtask 5.9.14.3: Test PUT /api/admin/categories/:categoryId with valid updates. Verify changes. 
            ▪ Subtask 5.9.14.4: Test PUT to create circular dependency (e.g., A -> B, then B -> A). Expect error. 
            ▪ Subtask 5.9.14.5: Test DELETE /api/admin/categories/:categoryId for a category with no dependencies. Verify deletion. 
            ▪ Subtask 5.9.14.6: Test DELETE for a category with associated products/children. Expect error or specific behavior (e.g., reassign). 
            ▪ Subtask 5.9.14.7: Test unauthorized access. 
        ◦ Task 5.9.15: Manual End-to-End Testing 
            ▪ Subtask 5.9.15.1: Log in to admin. Navigate to "Manage Categories." 
            ▪ Subtask 5.9.15.2: Add a new top-level category. Verify it appears. 
            ▪ Subtask 5.9.15.3: Add a child category, assigning the first as its parent. Verify hierarchy. 
            ▪ Subtask 5.9.15.4: Edit a category's name and slug. Verify updates. 
            ▪ Subtask 5.9.15.5: Try to delete a category that has products assigned to it (create a dummy product for this). Verify warning/prevention. 
            ▪ Subtask 5.9.15.6: Delete a category with no dependencies. Verify removal. 
            ▪ Subtask 5.9.15.7: Verify the new/updated categories are available in the product AdminProductFormPage dropdown.
Epic: Admin Order Management
Story 5.10: Delete Product (Admin)
Story: As an administrator, I want to be able to delete products from the catalog so that I can remove discontinued or erroneous product listings.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. On the "Manage Products" list (Story 5.7) and the "Edit Product" page (Story 5.8), a "Delete Product" button is available. 
    2. Clicking "Delete Product" prompts the admin with a confirmation dialog. 
    3. The confirmation dialog explains the implications of deletion (e.g., soft vs. hard delete, impact on past orders). 
    4. Soft Delete (Recommended for MVP): 
        ◦ The product is marked as "Archived" or "Inactive" in the database. 
        ◦ It no longer appears on the storefront or in standard admin product lists. 
        ◦ It remains linked to past orders for historical accuracy. 
        ◦ Option to permanently delete (hard delete) could be a separate, highly restricted function for later. 
    5. Upon successful deletion (soft delete), the product is removed from the active product list. 
    6. Associated product images are retained (for soft delete) or removed from storage (for hard delete). 
    7. Appropriate success/error messages are displayed. 
    8. All product deletion operations are securely logged with an audit trail (who deleted, when). 

Granular Tasks & Subtasks for Story 5.10:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.10.1: Implement "Delete Product" Button UI 
            ▪ Subtask 5.10.1.1: Add a "Delete Product" button to each row in the AdminProductsListPage (Story 5.7). 
            ▪ Subtask 5.10.1.2: Add a "Delete Product" button on the AdminProductFormPage (Story 5.8) when in edit mode. 
        ◦ Task 5.10.2: Implement Delete Confirmation Modal 
            ▪ Subtask 5.10.2.1: On clicking "Delete Product," display a confirmation modal. 
            ▪ Subtask 5.10.2.2: Include warning text explaining "soft delete" behavior (e.g., "This will archive the product, removing it from the storefront but keeping it for historical order data."). 
            ▪ Subtask 5.10.2.3: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 5.10.3: Frontend API Integration: Delete Product 
            ▪ Subtask 5.10.3.1: Create service/hook to call PUT /api/admin/products/:productId/status (to change status to "Archived") or DELETE /api/admin/products/:productId (if a specific "delete" endpoint is preferred for soft delete). 
            ▪ Subtask 5.10.3.2: On successful response, remove the product from the current list/redirect to the product list and display a success notification. 
            ▪ Subtask 5.10.3.3: Handle error responses gracefully. 
    • Backend Tasks (Admin API):
        ◦ Task 5.10.4: Update Product Model for Soft Delete 
            ▪ Subtask 5.10.4.1: Ensure the Product schema has a status field (from Story 5.8) that can be set to "Archived" or "Inactive." If not, add it. 
            ▪ Subtask 5.10.4.2: Modify GET /api/admin/products (Story 5.7) to exclude "Archived" products by default, but allow filtering to show archived products. 
        ◦ Task 5.10.5: Create Delete Product API Endpoint (Soft Delete) 
            ▪ Subtask 5.10.5.1: Design and implement PUT /api/admin/products/:productId/status (or DELETE /api/admin/products/:productId if preferred, but internally it would update the status). 
            ▪ Subtask 5.10.5.2: Apply admin authentication middleware. 
            ▪ Subtask 5.10.5.3: Validate productId and ensure the product exists. 
            ▪ Subtask 5.10.5.4: Update the status field of the Product document to "Archived" (or "Inactive"). 
            ▪ Subtask 5.10.5.5: Audit Logging: Record which admin user deleted the product and when. 
            ▪ Subtask 5.10.5.6: Return success response. 
        ◦ Task 5.10.6: (Optional) Hard Delete Endpoint (for future, very restricted) 
            ▪ Subtask 5.10.6.1: If hard delete is planned, design a separate, highly permission-restricted endpoint. 
            ▪ Subtask 5.10.6.2: Implement logic to truly remove the product document and associated images from storage. 
            ▪ Subtask 5.10.6.3: Consider implications for historical order data before implementing. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.10.7: Authorization and Validation 
            ▪ Subtask 5.10.7.1: Ensure only authorized admins can perform product deletion. 
            ▪ Subtask 5.10.7.2: Server-side validation of productId. 
    • Testing Tasks:
        ◦ Task 5.10.8: Write Unit Tests 
            ▪ Subtask 5.10.8.1: Unit tests for frontend confirmation logic. 
            ▪ Subtask 5.10.8.2: Unit tests for backend product status update logic. 
        ◦ Task 5.10.9: Write Integration Tests 
            ▪ Subtask 5.10.9.1: Create a new product. Log in as admin. 
            ▪ Subtask 5.10.9.2: Call PUT /api/admin/products/:productId/status to set status to "Archived". Verify status change in DB and product is no longer returned by default GET /api/admin/products. 
            ▪ Subtask 5.10.9.3: Test attempting to delete a non-existent product. 
            ▪ Subtask 5.10.9.4: Test unauthorized access. 
        ◦ Task 5.10.10: Manual End-to-End Testing 
            ▪ Subtask 5.10.10.1: Log in to admin. Navigate to "Manage Products." 
            ▪ Subtask 5.10.10.2: Create a test product. 
            ▪ Subtask 5.10.10.3: Go back to the product list, find the test product, and click "Delete." 
            ▪ Subtask 5.10.10.4: Confirm the deletion in the modal. 
            ▪ Subtask 5.10.10.5: Verify the product is no longer in the default "Manage Products" list. 
            ▪ Subtask 5.10.10.6: Try to access the product on the storefront URL (it should result in 404 or product not found). 
            ▪ Subtask 5.10.10.7: (If implemented) Verify the product is still linked to any past orders it was part of.
Epic: Admin Order Management
Story 5.11: Manage Users (Admin)
Story: As an administrator, I want to be able to view, search, and manage customer accounts, including the ability to disable or enable user access, so that I can provide customer support and maintain user security.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Users" link is available in the Admin Dashboard navigation. 
    2. The "Manage Users" page displays a paginated list of all customer accounts. 
    3. For each user, the following key details are displayed: 
        ◦ User ID 
        ◦ Name (First, Last) 
        ◦ Email Address 
        ◦ Registration Date 
        ◦ Last Login Date 
        ◦ Account Status (e.g., "Active," "Disabled") 
        ◦ Number of Orders (optional, for quick insight) 
    4. Admins can search for users by: 
        ◦ Name (First, Last) 
        ◦ Email Address 
    5. Admins can filter users by: 
        ◦ Account Status (Active, Disabled) 
        ◦ Registration Date Range 
    6. Admins can sort users by: 
        ◦ Registration Date (default: newest first) 
        ◦ Last Login Date 
        ◦ Name 
    7. A "View Details" or "Edit" button/link is available for each user to view their full profile and manage their account status. 
    8. The admin can change a user's account status (e.g., from "Active" to "Disabled" and vice versa). 
    9. A confirmation dialog appears before changing account status. 
    10. Email notification is sent to the user when their account status is changed (e.g., "Account Disabled," "Account Re-enabled"). 
    11. All user management operations are securely logged with an audit trail. 

Granular Tasks & Subtasks for Story 5.11:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.11.1: Implement "Manage Users" Page UI 
            ▪ Subtask 5.11.1.1: Create AdminUsersListPage component/route (e.g., /admin/users). 
            ▪ Subtask 5.11.1.2: Add a navigation link for "Manage Users" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.11.1.3: Design and implement a responsive table to display user summaries. 
            ▪ Subtask 5.11.1.4: Include columns for User ID, Name, Email, Registration Date, Last Login Date, Account Status. 
            ▪ Subtask 5.11.1.5: Add "View/Edit" button/link for each user row. 
        ◦ Task 5.11.2: Implement Pagination UI for Users 
            ▪ Subtask 5.11.2.1: Reuse/adapt existing Pagination component. 
            ▪ Subtask 5.11.2.2: Integrate pagination controls with the user list. 
        ◦ Task 5.11.3: Implement Search UI for Users 
            ▪ Subtask 5.11.3.1: Add a search bar for Name and Email. 
        ◦ Task 5.11.4: Implement Filtering UI for Users 
            ▪ Subtask 5.11.4.1: Add dropdowns/selects for filtering by Account Status. 
            ▪ Subtask 5.11.4.2: Add date picker components for Registration Date Range filtering. 
            ▪ Subtask 5.11.4.3: Include "Apply Filters" and "Clear Filters" buttons. 
        ◦ Task 5.11.5: Implement Sorting UI for Users 
            ▪ Subtask 5.11.5.1: Make table headers clickable for sorting (Registration Date, Last Login Date, Name). 
            ▪ Subtask 5.11.5.2: Indicate current sort direction. 
        ◦ Task 5.11.6: Frontend API Integration: Fetch All Users (with Filters/Search/Sorting) 
            ▪ Subtask 5.11.6.1: Create service/hook to call GET /api/admin/users. 
            ▪ Subtask 5.11.6.2: Pass pagination, search, filtering, and sorting parameters. 
            ▪ Subtask 5.11.6.3: Display fetched user data. 
        ◦ Task 5.11.7: Implement "Edit User" Details Page UI (Admin) 
            ▪ Subtask 5.11.7.1: Create AdminUserDetailsPage component/route (e.g., /admin/users/:userId). 
            ▪ Subtask 5.11.7.2: Display user's full profile details (Name, Email, Addresses, Orders history summary, etc.). 
            ▪ Subtask 5.11.7.3: Implement a toggle or button for changing accountStatus (Active/Disabled). 
            ▪ Subtask 5.11.7.4: Implement a confirmation dialog before changing account status. 
        ◦ Task 5.11.8: Frontend API Integration: Update User Status 
            ▪ Subtask 5.11.8.1: Create service/hook to call PUT /api/admin/users/:userId/status. 
            ▪ Subtask 5.11.8.2: Send newStatus (e.g., "active" or "disabled") in the request body. 
            ▪ Subtask 5.11.8.3: On successful response, update UI and display success/error notifications. 
    • Backend Tasks (Admin API):
        ◦ Task 5.11.9: Update User Model for Account Status 
            ▪ Subtask 5.11.9.1: Ensure the User schema includes an accountStatus field (e.g., default "active") and lastLoginDate. 
        ◦ Task 5.11.10: Create Get All Users API Endpoint (for Admin) 
            ▪ Subtask 5.11.10.1: Design and implement GET /api/admin/users. 
            ▪ Subtask 5.11.10.2: Apply admin authentication middleware. 
            ▪ Subtask 5.11.10.3: Implement logic to query the User collection. 
            ▪ Subtask 5.11.10.4: Implement pagination, search (by name, email), filtering (by status, registration date), and sorting (by reg date, last login, name). 
            ▪ Subtask 5.11.10.5: Return the paginated list of users. 
        ◦ Task 5.11.11: Create Get Single User Details API Endpoint (for Admin) 
            ▪ Subtask 5.11.11.1: Design and implement GET /api/admin/users/:userId. 
            ▪ Subtask 5.11.11.2: Apply admin authentication middleware. 
            ▪ Subtask 5.11.11.3: Fetch User document by _id. 
            ▪ Subtask 5.11.11.4: Return full user details (excluding sensitive data like password hash). 
        ◦ Task 5.11.12: Create Update User Status API Endpoint 
            ▪ Subtask 5.11.12.1: Design and implement PUT /api/admin/users/:userId/status. 
            ▪ Subtask 5.11.12.2: Apply admin authentication middleware. 
            ▪ Subtask 5.11.12.3: Validate userId and newStatus (e.g., "active" or "disabled"). 
            ▪ Subtask 5.11.12.4: Update the User document's accountStatus. 
            ▪ Subtask 5.11.12.5: If account is disabled, consider invalidating any active sessions/tokens for that user. 
            ▪ Subtask 5.11.12.6: Audit Logging: Record which admin user changed the status and when. 
            ▪ Subtask 5.11.12.7: Trigger account status change email notification. 
            ▪ Subtask 5.11.12.8: Return updated user data or success message. 
        ◦ Task 5.11.13: Email Service Integration (Account Status Notifications) 
            ▪ Subtask 5.11.13.1: Create email templates for "Account Disabled" and "Account Re-enabled." 
            ▪ Subtask 5.11.13.2: Implement functions to send these emails triggered by the status update API. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.11.14: Secure Access to User Data 
            ▪ Subtask 5.11.14.1: Ensure sensitive user data (e.g., password hashes, full credit card details) are never exposed. 
            ▪ Subtask 5.11.14.2: Only authenticated admins can access and modify user accounts. 
        ◦ Task 5.11.15: Impose Client-Side Login Restrictions 
            ▪ Subtask 5.11.15.1: When a user's accountStatus is "disabled," the frontend login flow should prevent them from logging in. 
    • Testing Tasks:
        ◦ Task 5.11.16: Write Unit Tests 
            ▪ Subtask 5.11.16.1: Unit tests for frontend user list filtering/sorting logic. 
            ▪ Subtask 5.11.16.2: Unit tests for backend user querying and status update logic. 
        ◦ Task 5.11.17: Write Integration Tests 
            ▪ Subtask 5.11.17.1: Create several test user accounts. 
            ▪ Subtask 5.11.17.2: Log in as admin, call GET /api/admin/users. Verify list and pagination. 
            ▪ Subtask 5.11.17.3: Test searching and filtering users. 
            ▪ Subtask 5.11.17.4: Call GET /api/admin/users/:userId for a test user. Verify details. 
            ▪ Subtask 5.11.17.5: Call PUT /api/admin/users/:userId/status to disable a user. Verify status change in DB and mock email trigger. 
            ▪ Subtask 5.11.17.6: Attempt to log in as the disabled user (should fail). 
            ▪ Subtask 5.11.17.7: Re-enable the user. Verify status change and mock email trigger. 
            ▪ Subtask 5.11.17.8: Test unauthorized access. 
        ◦ Task 5.11.18: Manual End-to-End Testing 
            ▪ Subtask 5.11.18.1: Log in to admin. Navigate to "Manage Users." 
            ▪ Subtask 5.11.18.2: Verify list of users, pagination, search, filter, and sort. 
            ▪ Subtask 5.11.18.3: Click "View/Edit" on a test user. 
            ▪ Subtask 5.11.18.4: Change user status to "Disabled." Confirm. Verify UI updates. Try to log in as that user from a separate browser/incognito window (should fail). 
            ▪ Subtask 5.11.18.5: Re-enable the user. Confirm. Verify UI updates. Try to log in as that user (should succeed). 
            ▪ Subtask 5.11.18.6: Verify email notifications for status changes.
Epic: Admin Order Management
Story 5.12: View Reports/Analytics (Admin)
Story: As an administrator, I want to view key business reports and analytics (e.g., sales, revenue, product performance, inventory) so that I can monitor the store's health and make data-driven decisions.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Reports" or "Analytics" link is available in the Admin Dashboard navigation. 
    2. The "Reports" page presents a dashboard with various types of reports. 
    3. Initial Reports to include: 
        ◦ Sales Summary Report: 
            ▪ Total Revenue (configurable period: Daily, Weekly, Monthly, Custom Range) 
            ▪ Number of Orders (configurable period) 
            ▪ Average Order Value (configurable period) 
            ▪ (Optional) Sales Trend Chart over time. 
        ◦ Product Performance Report: 
            ▪ Top N Best-Selling Products (by quantity and/or revenue) 
            ▪ Top N Most-Viewed Products (if tracking implemented in storefront) 
            ▪ (Optional) Products with Lowest Stock. 
        ◦ Customer Report: 
            ▪ New Customer Acquisition over time (configurable period) 
            ▪ (Optional) Top N Customers by Spending. 
        ◦ Inventory Summary: 
            ▪ Total number of products "In Stock," "Out of Stock," "Low Stock." 
            ▪ List of "Low Stock" products (below threshold). 
    4. Each report allows for a configurable date range. 
    5. Data is presented clearly, using tables, summary cards, and potentially simple charts. 
    6. Reports are dynamic and update based on selected filters/date ranges. 
    7. All report data is retrieved securely with admin-level authentication. 

Granular Tasks & Subtasks for Story 5.12:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.12.1: Implement "Reports" Page UI 
            ▪ Subtask 5.12.1.1: Create AdminReportsPage component/route (e.g., /admin/reports). 
            ▪ Subtask 5.12.1.2: Add a navigation link for "Reports" or "Analytics" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.12.1.3: Design a layout for various report widgets/sections. 
            ▪ Subtask 5.12.1.4: Implement a global date range picker component that applies to most reports. 
            ▪ Subtask 5.12.1.5: Implement period selectors (Daily, Weekly, Monthly, Custom) for the date range picker. 
        ◦ Task 5.12.2: Implement Sales Summary Report Widget 
            ▪ Subtask 5.12.2.1: Create a dedicated component for Sales Summary. 
            ▪ Subtask 5.12.2.2: Display Total Revenue, Number of Orders, Average Order Value in summary cards. 
            ▪ Subtask 5.12.2.3: Integrate with charting library (e.g., Chart.js, Recharts) for Sales Trend Chart (optional for MVP, can be line chart). 
        ◦ Task 5.12.3: Implement Product Performance Report Widget 
            ▪ Subtask 5.12.3.1: Create a dedicated component for Product Performance. 
            ▪ Subtask 5.12.3.2: Display Top N Best-Selling Products (table format: Product Name, Quantity Sold, Revenue). 
            ▪ Subtask 5.12.3.3: Display Products with Lowest Stock (table format: Product Name, SKU, Current Stock). 
        ◦ Task 5.12.4: Implement Customer Report Widget 
            ▪ Subtask 5.12.4.1: Create a dedicated component for Customer Report. 
            ▪ Subtask 5.12.4.2: Display New Customer Acquisition over time (summary number and optional trend chart). 
        ◦ Task 5.12.5: Implement Inventory Summary Widget 
            ▪ Subtask 5.12.5.1: Create a dedicated component for Inventory Summary. 
            ▪ Subtask 5.12.5.2: Display counts for "In Stock," "Out of Stock," "Low Stock." 
            ▪ Subtask 5.12.5.3: List actual "Low Stock" products. 
        ◦ Task 5.12.6: Frontend API Integration: Fetch Report Data 
            ▪ Subtask 5.12.6.1: Create services/hooks for each report type to call respective backend endpoints. 
            ▪ Subtask 5.12.6.2: Pass date range and other relevant filters to backend. 
            ▪ Subtask 5.12.6.3: Handle loading states and display "No data available." 
    • Backend Tasks (Admin API):
        ◦ Task 5.12.7: Create Sales Report API Endpoint 
            ▪ Subtask 5.12.7.1: Design and implement GET /api/admin/reports/sales-summary. 
            ▪ Subtask 5.12.7.2: Apply admin authentication middleware. 
            ▪ Subtask 5.12.7.3: Receive startDate and endDate parameters. 
            ▪ Subtask 5.12.7.4: Query Order collection: 
                • Aggregate total revenue (sum of grandTotal) within the date range. 
                • Count total number of orders. 
                • Calculate Average Order Value. 
                • (Optional) Group orders by day/week/month for trend data. 
            ▪ Subtask 5.12.7.5: Return aggregated data. 
        ◦ Task 5.12.8: Create Product Performance Report API Endpoint 
            ▪ Subtask 5.12.8.1: Design and implement GET /api/admin/reports/product-performance. 
            ▪ Subtask 5.12.8.2: Apply admin authentication. 
            ▪ Subtask 5.12.8.3: Query Order collection (and Product collection for low stock): 
                • Aggregate order items to find top selling products by quantity and revenue (using $unwind and $group). 
                • Query Product collection for products with stockQuantity below a threshold. 
            ▪ Subtask 5.12.8.4: Return top products and low stock products. 
        ◦ Task 5.12.9: Create Customer Report API Endpoint 
            ▪ Subtask 5.12.9.1: Design and implement GET /api/admin/reports/customer-acquisition. 
            ▪ Subtask 5.12.9.2: Apply admin authentication. 
            ▪ Subtask 5.12.9.3: Query User collection: 
                • Count new users registered within the date range. 
                • (Optional) Aggregate users by createdAt date for trend data. 
            ▪ Subtask 5.12.9.4: Return counts. 
        ◦ Task 5.12.10: Create Inventory Summary Report API Endpoint 
            ▪ Subtask 5.12.10.1: Design and implement GET /api/admin/reports/inventory-summary. 
            ▪ Subtask 5.12.10.2: Apply admin authentication. 
            ▪ Subtask 5.12.10.3: Query Product collection: 
                • Count products where stockQuantity > 0. 
                • Count products where stockQuantity == 0. 
                • Count products where stockQuantity <= lowStockThreshold (and > 0). 
                • List all products that are "Low Stock." 
            ▪ Subtask 5.12.10.4: Return counts and list of low stock products. 
        ◦ Task 5.12.11: Optimize Database Aggregations 
            ▪ Subtask 5.12.11.1: Ensure efficient use of MongoDB aggregation pipelines for report generation. 
            ▪ Subtask 5.12.11.2: Add necessary indexes to Order and Product collections to speed up aggregations. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.12.12: Data Access Control 
            ▪ Subtask 5.12.12.1: Ensure only authenticated and authorized admins can access report data. No sensitive customer details should be directly exposed without explicit need. 
        ◦ Task 5.12.13: Parameter Validation 
            ▪ Subtask 5.12.13.1: Validate startDate and endDate parameters to prevent malformed queries. 
    • Testing Tasks:
        ◦ Task 5.12.14: Write Unit Tests 
            ▪ Subtask 5.12.14.1: Unit tests for frontend report data display and filtering logic. 
            ▪ Subtask 5.12.14.2: Unit tests for backend aggregation queries with mock data (e.g., test sales calculation, top products logic). 
        ◦ Task 5.12.15: Write Integration Tests 
            ▪ Subtask 5.12.15.1: Create mock orders, products, and users spanning different dates. 
            ▪ Subtask 5.12.15.2: Log in as admin, then call each report endpoint with various date ranges. 
            ▪ Subtask 5.12.15.3: Verify that the returned aggregated data matches expected calculations based on mock data. 
            ▪ Subtask 5.12.15.4: Test unauthorized access to report endpoints. 
        ◦ Task 5.12.16: Manual End-to-End Testing 
            ▪ Subtask 5.12.16.1: Log in to the admin panel. Navigate to "Reports." 
            ▪ Subtask 5.12.16.2: Verify all report widgets are displayed. 
            ▪ Subtask 5.12.16.3: Change the global date range (Daily, Weekly, Monthly, Custom) and verify that all reports update accordingly. 
            ▪ Subtask 5.12.16.4: Confirm that sales numbers, top products, customer counts, and inventory statuses are accurate based on the test data in the database. 
            ▪ Subtask 5.12.16.5: Verify "Low Stock" products list is correct.
Epic: Admin Order Management
Story 5.13: Manage Promotions/Discounts (Admin)
Story: As an administrator, I want to be able to create, edit, activate, deactivate, and delete various types of promotions and discount codes so that I can implement marketing campaigns and offer incentives to customers.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Manage Promotions" or "Discounts" link is available in the Admin Dashboard navigation. 
    2. The "Manage Promotions" page displays a paginated list of all active and inactive promotions/discount codes. 
    3. For each promotion/discount, the following key details are displayed: 
        ◦ Promotion Name/Code 
        ◦ Type (e.g., Percentage Off, Fixed Amount Off, Free Shipping) 
        ◦ Discount Value 
        ◦ Usage Limit (total and per user) 
        ◦ Start Date, End Date 
        ◦ Status (Active, Inactive, Expired, Draft) 
        ◦ Times Used 
    4. Admins can search for promotions by name or code. 
    5. Admins can filter promotions by type and status. 
    6. Admins can add a new promotion/discount with the following configurable attributes: 
        ◦ General: Name (e.g., "Summer Sale"), Code (e.g., "SUMMER20", auto-generated or custom, unique), Description. 
        ◦ Type & Value: Percentage Off (e.g., 10%), Fixed Amount Off (e.g., $10), Free Shipping. 
        ◦ Conditions: Minimum Order Subtotal, Applicable Products/Categories (optional, multiple allowed). 
        ◦ Usage: Total Usage Limit (e.g., 100 uses), Per User Usage Limit (e.g., 1 use per customer). 
        ◦ Dates: Start Date, End Date. 
        ◦ Visibility: Internal Status (Active, Inactive, Draft). 
    7. Admins can edit existing promotions (with restrictions on changing past usage/history). 
    8. Admins can activate/deactivate promotions. 
    9. Admins can delete promotions (soft delete recommended). 
    10. All form fields are validated client-side and server-side. 
    11. Appropriate success/error messages are displayed. 
    12. All promotion management operations are securely logged with an audit trail. 

Granular Tasks & Subtasks for Story 5.13:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.13.1: Implement "Manage Promotions" Page UI 
            ▪ Subtask 5.13.1.1: Create AdminPromotionsListPage component/route (e.g., /admin/promotions). 
            ▪ Subtask 5.13.1.2: Add a navigation link for "Manage Promotions" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.13.1.3: Design and implement a paginated table to display promotion summaries. 
            ▪ Subtask 5.13.1.4: Include columns for Name/Code, Type, Value, Dates, Status, Times Used, and "Edit" / "Activate/Deactivate" / "Delete" buttons. 
            ▪ Subtask 5.13.1.5: Add an "Add New Promotion" button. 
        ◦ Task 5.13.2: Implement Search, Filter & Pagination UI 
            ▪ Subtask 5.13.2.1: Add a search bar for Name/Code. 
            ▪ Subtask 5.13.2.2: Add dropdowns/selects for filtering by Type and Status. 
            ▪ Subtask 5.13.2.3: Reuse/adapt existing Pagination component. 
        ◦ Task 5.13.3: Implement "Add/Edit Promotion" Form UI 
            ▪ Subtask 5.13.3.1: Create AdminPromotionFormPage component (or a modal for form). 
            ▪ Subtask 5.13.3.2: Implement input fields for: 
                • Promotion Name (text, required) 
                • Code (text, auto-generate option, required, unique) 
                • Description (textarea) 
                • Discount Type (radio buttons/dropdown: Percentage, Fixed Amount, Free Shipping) 
                • Discount Value (number input, conditionally shown based on type) 
                • Minimum Order Subtotal (number input, optional) 
                • Applicable Products (multi-select, searchable, fetching from product list in 5.7) 
                • Applicable Categories (multi-select, fetching from categories in 5.9) 
                • Total Usage Limit (number input, optional) 
                • Per User Usage Limit (number input, optional) 
                • Start Date (date picker, required) 
                • End Date (date picker, required) 
                • Status (radio buttons/dropdown: Draft, Active, Inactive) 
            ▪ Subtask 5.13.3.3: For "Edit" mode, pre-populate form fields. 
            ▪ Subtask 5.13.3.4: Add "Save" and "Cancel" buttons. 
        ◦ Task 5.13.4: Implement Client-Side Form Validation 
            ▪ Subtask 5.13.4.1: Validate required fields, numeric values, date ranges (start before end). 
            ▪ Subtask 5.13.4.2: Validate code uniqueness (debounced API call). 
        ◦ Task 5.13.5: Frontend API Integration: Submit Promotion Data 
            ▪ Subtask 5.13.5.1: Create service/hook for POST /api/admin/promotions (add). 
            ▪ Subtask 5.13.5.2: Create service/hook for PUT /api/admin/promotions/:promoId (edit). 
            ▪ Subtask 5.13.5.3: On success, redirect to list and show notification. Handle errors. 
        ◦ Task 5.13.6: Frontend API Integration: Activate/Deactivate/Delete Promotion 
            ▪ Subtask 5.13.6.1: Create service/hook for PUT /api/admin/promotions/:promoId/status. 
            ▪ Subtask 5.13.6.2: Create service/hook for DELETE /api/admin/promotions/:promoId (soft delete). 
            ▪ Subtask 5.13.6.3: Implement confirmation modals for status change and deletion. 
    • Backend Tasks (Admin API):
        ◦ Task 5.13.7: Design Promotion/Discount Data Model 
            ▪ Subtask 5.13.7.1: Define MongoDB schema for Promotion or Discount collection. Include fields for all attributes mentioned in ACs (name, code, type, value, limits, dates, status, etc.). Add timesUsed and usersUsed (array of user IDs) fields. 
            ▪ Subtask 5.13.7.2: Ensure code has a unique index. 
        ◦ Task 5.13.8: Create Get All Promotions API Endpoint 
            ▪ Subtask 5.13.8.1: Design and implement GET /api/admin/promotions. 
            ▪ Subtask 5.13.8.2: Apply admin authentication. 
            ▪ Subtask 5.13.8.3: Implement pagination, search, filtering, and sorting. 
            ▪ Subtask 5.13.8.4: Include logic to determine if a promotion is Expired based on endDate. 
        ◦ Task 5.13.9: Create Add Promotion API Endpoint 
            ▪ Subtask 5.13.9.1: Design and implement POST /api/admin/promotions. 
            ▪ Subtask 5.13.9.2: Apply admin authentication. 
            ▪ Subtask 5.13.9.3: Implement server-side validation for all fields. 
            ▪ Subtask 5.13.9.4: Validate uniqueness of the discount code. 
            ▪ Subtask 5.13.9.5: Create new Promotion document. 
        ◦ Task 5.13.10: Create Edit Promotion API Endpoint 
            ▪ Subtask 5.13.10.1: Design and implement PUT /api/admin/promotions/:promoId. 
            ▪ Subtask 5.13.10.2: Apply admin authentication. 
            ▪ Subtask 5.13.10.3: Validate promoId and existence. 
            ▪ Subtask 5.13.10.4: Implement server-side validation for updated fields. 
            ▪ Subtask 5.13.10.5: Restrict changes to fields that would break existing usage data (e.g., prevent changing type or value if timesUsed > 0). 
            ▪ Subtask 5.13.10.6: Update Promotion document. 
            ▪ Subtask 5.13.10.7: Audit Logging: Record changes. 
        ◦ Task 5.13.11: Create Update Promotion Status API Endpoint 
            ▪ Subtask 5.13.11.1: Design and implement PUT /api/admin/promotions/:promoId/status. 
            ▪ Subtask 5.13.11.2: Apply admin authentication. 
            ▪ Subtask 5.13.11.3: Validate promoId and newStatus. 
            ▪ Subtask 5.13.11.4: Update Promotion document's status. 
            ▪ Subtask 5.13.11.5: Audit Logging: Record status change. 
        ◦ Task 5.13.12: Create Delete Promotion API Endpoint (Soft Delete) 
            ▪ Subtask 5.13.12.1: Design and implement DELETE /api/admin/promotions/:promoId. 
            ▪ Subtask 5.13.12.2: Apply admin authentication. 
            ▪ Subtask 5.13.12.3: Set status to "Archived" or introduce an isDeleted flag. 
            ▪ Subtask 5.13.12.4: Audit Logging: Record deletion. 
    • Logic for Discount Application (Backend - for future order processing):
        ◦ Task 5.13.13: Integrate Discount Logic into Checkout Process 
            ▪ Subtask 5.13.13.1: Modify POST /api/checkout/apply-coupon (or similar endpoint) to validate discount code against Promotion collection. 
            ▪ Subtask 5.13.13.2: Check startDate, endDate, status ("Active"). 
            ▪ Subtask 5.13.13.3: Check totalUsageLimit and perUserUsageLimit (by checking usersUsed array). 
            ▪ Subtask 5.13.13.4: Check minimumOrderSubtotal. 
            ▪ Subtask 5.13.13.5: Check applicableProducts and applicableCategories if specified. 
            ▪ Subtask 5.13.13.6: Calculate discount amount based on type and value. 
            ▪ Subtask 5.13.13.7: Update timesUsed and usersUsed array for the promotion when an order successfully uses it. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.13.14: Robust Authorization & Validation 
            ▪ Subtask 5.13.14.1: Ensure only authenticated admins can manage promotions. 
            ▪ Subtask 5.13.14.2: Comprehensive server-side validation for all promotion attributes. 
    • Testing Tasks:
        ◦ Task 5.13.15: Write Unit Tests 
            ▪ Subtask 5.13.15.1: Unit tests for frontend form validation. 
            ▪ Subtask 5.13.15.2: Unit tests for backend promotion creation/update logic, including uniqueness and date validations. 
            ▪ Subtask 5.13.15.3: Unit tests for discount application logic (mocking promotion, cart, user data). 
        ◦ Task 5.13.16: Write Integration Tests 
            ▪ Subtask 5.13.16.1: Log in as admin. Test POST /api/admin/promotions with valid data (various types: percentage, fixed, free shipping). Verify creation. 
            ▪ Subtask 5.13.16.2: Test POST with invalid data (duplicate code, invalid dates, negative values). 
            ▪ Subtask 5.13.16.3: Test PUT /api/admin/promotions/:promoId to edit various fields. 
            ▪ Subtask 5.13.16.4: Test PUT /api/admin/promotions/:promoId/status to activate/deactivate. 
            ▪ Subtask 5.13.16.5: Test DELETE /api/admin/promotions/:promoId (soft delete). 
            ▪ Subtask 5.13.16.6: Test unauthorized access. 
        ◦ Task 5.13.17: Manual End-to-End Testing 
            ▪ Subtask 5.13.17.1: Log in to admin. Navigate to "Manage Promotions." 
            ▪ Subtask 5.13.17.2: Create a new percentage discount with a limit and specific dates. Verify it appears. 
            ▪ Subtask 5.13.17.3: Try to create a discount with an overlapping code. 
            ▪ Subtask 5.13.17.4: Edit the discount, change its value, dates, and status. 
            ▪ Subtask 5.13.17.5: Deactivate a discount, then activate it. 
            ▪ Subtask 5.13.17.6: Delete a test discount. 
            ▪ Subtask 5.13.17.7: Crucially, test the discount application from the customer side: Add items to cart, try to apply the created discount code (valid, expired, over limit, etc.). Verify discount is applied/rejected correctly. Place an order with the discount and verify timesUsed updates.
Epic: Admin Order Management
Story 5.14: Admin Settings Management
Story: As an administrator, I want to be able to manage various store settings (e.g., general information, shipping methods, tax rates, payment gateways) so that I can configure the store's core functionality and operations.
(Recall the Acceptance Criteria from earlier refinement for context):
    1. A "Settings" or "Configuration" link is available in the Admin Dashboard navigation. 
    2. The "Settings" page is organized into sections (e.g., "General," "Shipping," "Tax," "Payments"). 
    3. General Settings: 
        ◦ Store Name 
        ◦ Store Email Address (for contact forms, order notifications) 
        ◦ Store Phone Number 
        ◦ Store Address (for display on "Contact Us," invoices) 
        ◦ Default Currency 
        ◦ Default Language 
    4. Shipping Settings: 
        ◦ List of supported shipping methods (e.g., "Flat Rate," "Free Shipping," "UPS," "FedEx"). 
        ◦ Configuration for each method (e.g., flat rate cost, API keys for carriers). 
        ◦ Ability to add, edit, and delete shipping methods. 
        ◦ Shipping zones (e.g., domestic, international) with different methods and costs. 
    5. Tax Settings: 
        ◦ Tax calculation method (e.g., tax inclusive, tax exclusive). 
        ◦ Tax rates for different regions/states/countries. 
        ◦ Ability to add, edit, and delete tax rates. 
    6. Payment Gateway Settings: 
        ◦ Integration with supported payment gateways (e.g., Stripe, PayPal, Authorize.net). 
        ◦ API keys and other credentials for each gateway. 
        ◦ Ability to enable/disable payment methods. 
    7. All settings are validated client-side and server-side. 
    8. Appropriate success/error messages are displayed. 
    9. All settings changes are securely logged with an audit trail. 

Granular Tasks & Subtasks for Story 5.14:
    • Frontend Tasks (Admin Panel):
        ◦ Task 5.14.1: Implement "Settings" Page UI 
            ▪ Subtask 5.14.1.1: Create AdminSettingsPage component/route (e.g., /admin/settings). 
            ▪ Subtask 5.14.1.2: Add a navigation link for "Settings" in the Admin Dashboard sidebar/menu. 
            ▪ Subtask 5.14.1.3: Design a tabbed or accordion-style layout to organize settings into sections (General, Shipping, Tax, Payments). 
        ◦ Task 5.14.2: Implement "General Settings" Form 
            ▪ Subtask 5.14.2.1: Implement input fields for Store Name, Email, Phone, Address. 
            ▪ Subtask 5.14.2.2: Implement a dropdown/select for Default Currency. 
            ▪ Subtask 5.14.2.3: Implement a dropdown/select for Default Language. 
        ◦ Task 5.14.3: Implement "Shipping Settings" Management UI 
            ▪ Subtask 5.14.3.1: Display a list of existing shipping methods (table format: Name, Type, Cost). 
            ▪ Subtask 5.14.3.2: Add "Add Shipping Method" button. 
            ▪ Subtask 5.14.3.3: Implement a form (potentially a modal) for adding/editing shipping methods: 
                • Name (text) 
                • Type (dropdown: Flat Rate, Free Shipping, UPS, FedEx, etc.) 
                • Configuration fields (conditionally shown based on type; e.g., flat rate cost, API keys). 
                • Shipping Zones (multi-select, with costs per zone). 
        ◦ Task 5.14.4: Implement "Tax Settings" Management UI 
            ▪ Subtask 5.14.4.1: Display a list of existing tax rates (table format: Region, Rate). 
            ▪ Subtask 5.14.4.2: Add "Add Tax Rate" button. 
            ▪ Subtask 5.14.4.3: Implement a form (potentially a modal) for adding/editing tax rates: 
                • Region/State/Country (text, dropdown, or a more complex geographical selector). 
                • Tax Rate (number input). 
                • Tax Calculation Method (radio buttons: Tax Inclusive, Tax Exclusive). 
        ◦ Task 5.14.5: Implement "Payment Gateway Settings" Management UI 
            ▪ Subtask 5.14.5.1: Display a list of integrated payment gateways (e.g., Stripe, PayPal, Authorize.net). 
            ▪ Subtask 5.14.5.2: For each gateway, display configuration fields (API keys, etc.). 
            ▪ Subtask 5.14.5.3: Implement toggle/checkbox to enable/disable each payment method. 
        ◦ Task 5.14.6: Implement Client-Side Form Validation 
            ▪ Subtask 5.14.6.1: Validate required fields, email format, URL format (for API endpoints), numeric values. 
        ◦ Task 5.14.7: Frontend API Integration: Save Settings Data 
            ▪ Subtask 5.14.7.1: Create services/hooks for each settings section to call respective backend endpoints (e.g., PUT /api/admin/settings/general, PUT /api/admin/settings/shipping, etc.). 
            ▪ Subtask 5.14.7.2: On success, show notification. Handle errors. 
    • Backend Tasks (Admin API):
        ◦ Task 5.14.8: Design Settings Data Model(s) 
            ▪ Subtask 5.14.8.1: Decide whether to use a single Settings collection with nested documents or separate collections for each section (e.g., GeneralSettings, ShippingMethods, TaxRates, PaymentGateways). 
            ▪ Subtask 5.14.8.2: Define MongoDB schemas for each setting type. 
        ◦ Task 5.14.9: Create Get Settings API Endpoints 
            ▪ Subtask 5.14.9.1: Design and implement GET endpoints for each settings section (e.g., GET /api/admin/settings/general, GET /api/admin/settings/shipping, GET /api/admin/settings/taxes, GET /api/admin/settings/payments). 
            ▪ Subtask 5.14.9.2: Apply admin authentication. 
            ▪ Subtask 5.14.9.3: Fetch settings data from the appropriate collection(s). 
        ◦ Task 5.14.10: Create Update Settings API Endpoints 
            ▪ Subtask 5.14.10.1: Design and implement PUT endpoints for each settings section (e.g., PUT /api/admin/settings/general, PUT /api/admin/settings/shipping, PUT /api/admin/settings/taxes, PUT /api/admin/settings/payments). 
            ▪ Subtask 5.14.10.2: Apply admin authentication. 
            ▪ Subtask 5.14.10.3: Implement server-side validation for all fields received for the respective setting. 
            ▪ Subtask 5.14.10.4: Update settings data in the appropriate collection(s). For lists (shipping, tax), implement CRUD logic (add new, update existing, delete by ID). 
            ▪ Subtask 5.14.10.5: Audit Logging: Record changes to settings (who changed what, when). 
    • Core Application Integration Tasks: (These tasks involve using the saved settings in the application logic)
        ◦ Task 5.14.11: Integrate General Settings into Storefront/Emails 
            ▪ Subtask 5.14.11.1: Ensure storefront components dynamically load store name, email, address. 
            ▪ Subtask 5.14.11.2: Update email templates to use configured store email and name. 
        ◦ Task 5.14.12: Integrate Shipping Settings into Checkout 
            ▪ Subtask 5.14.12.1: Modify checkout flow to display available shipping methods based on configured methods and shipping zones. 
            ▪ Subtask 5.14.12.2: Implement shipping cost calculation based on selected method and destination. 
        ◦ Task 5.14.13: Integrate Tax Settings into Checkout 
            ▪ Subtask 5.14.13.1: Modify checkout flow to calculate and apply taxes based on configured tax rates and calculation method. 
        ◦ Task 5.14.14: Integrate Payment Gateway Settings into Checkout 
            ▪ Subtask 5.14.14.1: Modify checkout flow to display only enabled payment methods. 
            ▪ Subtask 5.14.14.2: Load API keys and other credentials for enabled gateways for backend payment processing. 
    • Security & Data Integrity Tasks:
        ◦ Task 5.14.15: Secure Settings Access 
            ▪ Subtask 5.14.15.1: Ensure only authenticated admins can access and modify store settings. 
            ▪ Subtask 5.14.15.2: Crucially, sensitive credentials (API keys) must be encrypted at rest and never exposed to the frontend. They should be stored in environment variables or a secure configuration vault. The admin UI only provides input fields, and the backend handles secure storage and retrieval for its internal use. 
        ◦ Task 5.14.16: Data Validation 
            ▪ Subtask 5.14.16.1: Comprehensive server-side validation for all settings attributes (e.g., email format, URL format, currency codes, language codes, valid numeric rates). 
    • Testing Tasks:
        ◦ Task 5.14.17: Write Unit Tests 
            ▪ Subtask 5.14.17.1: Unit tests for frontend form validation. 
            ▪ Subtask 5.14.17.2: Unit tests for backend settings update logic (each section). 
            ▪ Subtask 5.14.17.3: Unit tests for shipping/tax calculation logic using configured settings. 
        ◦ Task 5.14.18: Write Integration Tests 
            ▪ Subtask 5.14.18.1: Log in as admin. Test GET endpoints for each settings section. Verify data is returned. 
            ▪ Subtask 5.14.18.2: Test PUT endpoints for each settings section with valid data. Verify updates. 
            ▪ Subtask 5.14.18.3: Test PUT endpoints with invalid data. Verify error handling. 
            ▪ Subtask 5.14.18.4: Test unauthorized access to all settings endpoints. 
            ▪ Subtask 5.14.18.5: End-to-end integration tests for checkout flow: Change shipping rates/tax rates in admin, then verify these changes accurately affect the shipping and tax calculations in the customer checkout process. 
        ◦ Task 5.14.19: Manual End-to-End Testing 
            ▪ Subtask 5.14.19.1: Log in to the admin panel. Navigate to "Settings." 
            ▪ Subtask 5.14.19.2: Verify all settings sections are displayed. 
            ▪ Subtask 5.14.19.3: Modify general settings (store name, email, etc.). Verify changes are saved and reflected in the UI. Then, check the storefront "Contact Us" page and order confirmation emails for these updates. 
            ▪ Subtask 5.14.19.4: Add, edit, and delete shipping methods. Verify changes in the admin UI, then go to the customer checkout page and confirm available shipping options and calculated costs. 
            ▪ Subtask 5.14.19.5: Add, edit, and delete tax rates. Verify changes in the admin UI, then proceed through customer checkout and confirm tax calculations are accurate. 
            ▪ Subtask 5.14.19.6: Enable/disable payment gateways. Verify changes in the admin UI, then confirm payment options are correctly displayed/hidden in the customer checkout.
Epic 6: Customer Account Management Enhancements
This epic focuses on features that empower registered customers to manage their personal information, orders, and preferences within their dedicated account area on the storefront.
Story 6.1: Manage Customer Profile
Story: As a registered customer, I want to be able to view and update my personal profile information (name, email, password) so that I can keep my account details accurate and secure.
Acceptance Criteria:
    1. A "My Account" or "Profile" link is prominently available in the user's logged-in navigation. 
    2. Clicking the "My Account" link takes the customer to their account dashboard, with a sub-section for "Profile" or "Personal Details". 
    3. The "Profile" section displays the customer's current: 
        ◦ First Name 
        ◦ Last Name 
        ◦ Email Address 
        ◦ (Optional) Phone Number 
    4. The customer can edit their First Name, Last Name, and (Optional) Phone Number. 
    5. The customer can change their email address, which might require re-verification (optional but good for security). 
    6. The customer can change their password, requiring confirmation of the old password. 
    7. All fields are validated client-side and server-side. 
    8. Upon successful update, a success message is displayed. 
    9. Upon successful password change, the customer should be prompted to re-login for security. 
    10. All profile updates are securely logged. 

Granular Tasks & Subtasks for Story 6.1:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.1.1: Implement "My Account" Navigation & Dashboard 
            ▪ Subtask 6.1.1.1: Add a "My Account" or "Profile" link to the main navigation (e.g., header) visible when the user is logged in. 
            ▪ Subtask 6.1.1.2: Create CustomerAccountDashboardPage component/route (e.g., /account). 
            ▪ Subtask 6.1.1.3: Implement a sidebar or tabbed navigation within the account dashboard for different sections (e.g., "Profile", "Order History", "Address Book"). 
        ◦ Task 6.1.2: Implement "Profile" Section UI 
            ▪ Subtask 6.1.2.1: Create CustomerProfilePage component/route (e.g., /account/profile). 
            ▪ Subtask 6.1.2.2: Display current First Name, Last Name, Email, and Phone Number (if applicable) in read-only format. 
            ▪ Subtask 6.1.2.3: Implement an "Edit" button to switch to edit mode for personal details. 
            ▪ Subtask 6.1.2.4: Implement input fields for editable details (First Name, Last Name, Phone Number). 
            ▪ Subtask 6.1.2.5: Add "Save Changes" and "Cancel" buttons for personal details. 
        ◦ Task 6.1.3: Implement "Change Email" Form UI 
            ▪ Subtask 6.1.3.1: Create a dedicated section or modal for changing email. 
            ▪ Subtask 6.1.3.2: Input fields for New Email and Current Password. 
            ▪ Subtask 6.1.3.3: Add "Update Email" and "Cancel" buttons. 
        ◦ Task 6.1.4: Implement "Change Password" Form UI 
            ▪ Subtask 6.1.4.1: Create a dedicated section or modal for changing password. 
            ▪ Subtask 6.1.4.2: Input fields for Current Password, New Password, Confirm New Password. 
            ▪ Subtask 6.1.4.3: Add "Update Password" and "Cancel" buttons. 
            ▪ Subtask 6.1.4.4: Display password strength indicator/requirements. 
        ◦ Task 6.1.5: Implement Client-Side Form Validation 
            ▪ Subtask 6.1.5.1: Validate required fields, email format, password complexity (min length, special chars etc.). 
            ▪ Subtask 6.1.5.2: Ensure New Password and Confirm New Password match. 
        ◦ Task 6.1.6: Frontend API Integration: Fetch User Profile 
            ▪ Subtask 6.1.6.1: Create service/hook to call GET /api/customer/profile to fetch current user data. 
        ◦ Task 6.1.7: Frontend API Integration: Update Personal Details 
            ▪ Subtask 6.1.7.1: Create service/hook to call PUT /api/customer/profile. 
            ▪ Subtask 6.1.7.2: Send updated first name, last name, phone number. 
            ▪ Subtask 6.1.7.3: Display success/error messages. 
        ◦ Task 6.1.8: Frontend API Integration: Update Email Address 
            ▪ Subtask 6.1.8.1: Create service/hook to call PUT /api/customer/profile/email. 
            ▪ Subtask 6.1.8.2: Send new email and current password. 
            ▪ Subtask 6.1.8.3: Display success/error, and potentially trigger re-login. 
        ◦ Task 6.1.9: Frontend API Integration: Update Password 
            ▪ Subtask 6.1.9.1: Create service/hook to call PUT /api/customer/profile/password. 
            ▪ Subtask 6.1.9.2: Send current password, new password. 
            ▪ Subtask 6.1.9.3: On success, prompt for re-login or automatically log out and redirect to login page. 
    • Backend Tasks (Customer API):
        ◦ Task 6.1.10: Create Get Customer Profile API Endpoint 
            ▪ Subtask 6.1.10.1: Design and implement GET /api/customer/profile. 
            ▪ Subtask 6.1.10.2: Apply customer authentication middleware (ensure user is logged in). 
            ▪ Subtask 6.1.10.3: Fetch user data based on authenticated user ID. 
            ▪ Subtask 6.1.10.4: Return non-sensitive user details (name, email, phone). 
        ◦ Task 6.1.11: Create Update Personal Details API Endpoint 
            ▪ Subtask 6.1.11.1: Design and implement PUT /api/customer/profile. 
            ▪ Subtask 6.1.11.2: Apply customer authentication. 
            ▪ Subtask 6.1.11.3: Validate received firstName, lastName, phoneNumber. 
            ▪ Subtask 6.1.11.4: Update corresponding fields in the User document. 
            ▪ Subtask 6.1.11.5: Audit Logging: Log user profile changes. 
        ◦ Task 6.1.12: Create Update Email Address API Endpoint 
            ▪ Subtask 6.1.12.1: Design and implement PUT /api/customer/profile/email. 
            ▪ Subtask 6.1.12.2: Apply customer authentication. 
            ▪ Subtask 6.1.12.3: Validate newEmail format and ensure it's not already in use by another account. 
            ▪ Subtask 6.1.12.4: Verify currentPassword: Hash and compare with stored password hash. 
            ▪ Subtask 6.1.12.5: Update email in the User document. 
            ▪ Subtask 6.1.12.6: (Optional for MVP, but recommended) Implement email re-verification flow. 
            ▪ Subtask 6.1.12.7: Audit Logging: Log email changes. 
        ◦ Task 6.1.13: Create Update Password API Endpoint 
            ▪ Subtask 6.1.13.1: Design and implement PUT /api/customer/profile/password. 
            ▪ Subtask 6.1.13.2: Apply customer authentication. 
            ▪ Subtask 6.1.13.3: Verify currentPassword: Hash and compare. 
            ▪ Subtask 6.1.13.4: Validate newPassword complexity. 
            ▪ Subtask 6.1.13.5: Hash newPassword and update passwordHash in User document. 
            ▪ Subtask 6.1.13.6: Invalidate existing user sessions/tokens (except the current one if needed for response, or log out immediately). 
            ▪ Subtask 6.1.13.7: Audit Logging: Log password changes. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.1.14: Data Validation & Sanitization 
            ▪ Subtask 6.1.14.1: Robust server-side validation for all input fields (name, email format, password complexity). 
            ▪ Subtask 6.1.14.2: Sanitize inputs to prevent XSS. 
        ◦ Task 6.1.15: Secure Password Hashing & Comparison 
            ▪ Subtask 6.1.15.1: Use strong hashing algorithms (e.g., bcrypt) for storing passwords. 
            ▪ Subtask 6.1.15.2: Implement secure comparison of current password during update. 
        ◦ Task 6.1.16: Authentication & Authorization 
            ▪ Subtask 6.1.16.1: Ensure only the authenticated user can access and modify their own profile. Prevent a user from modifying another user's profile. 
    • Testing Tasks:
        ◦ Task 6.1.17: Write Unit Tests 
            ▪ Subtask 6.1.17.1: Unit tests for frontend form validation logic. 
            ▪ Subtask 6.1.17.2: Unit tests for backend profile update logic (personal details, email, password), including validation and hashing. 
        ◦ Task 6.1.18: Write Integration Tests 
            ▪ Subtask 6.1.18.1: Register a test user. Log in as that user. 
            ▪ Subtask 6.1.18.2: Call GET /api/customer/profile. Verify correct data is returned. 
            ▪ Subtask 6.1.18.3: Call PUT /api/customer/profile with valid and invalid personal details. Verify updates. 
            ▪ Subtask 6.1.18.4: Call PUT /api/customer/profile/email with valid/invalid new email and current password. Verify email change, uniqueness constraint, and password verification. 
            ▪ Subtask 6.1.18.5: Call PUT /api/customer/profile/password with valid/invalid current/new passwords. Verify password change, complexity, and session invalidation. 
            ▪ Subtask 6.1.18.6: Test attempts to modify another user's profile (should fail with authorization error). 
            ▪ Subtask 6.1.18.7: Test unauthenticated access to these endpoints. 
        ◦ Task 6.1.19: Manual End-to-End Testing 
            ▪ Subtask 6.1.19.1: Register a new customer account. 
            ▪ Subtask 6.1.19.2: Log in. Navigate to "My Account" -> "Profile." 
            ▪ Subtask 6.1.19.3: View personal details. Click "Edit." Modify First Name, Last Name, Phone. Save. Verify changes in UI and on next page load. 
            ▪ Subtask 6.1.19.4: Attempt to change email: 
                • With incorrect current password. 
                • To an email already in use by another account. 
                • To a valid new email with correct password. Verify email changes, and potentially re-login. 
            ▪ Subtask 6.1.19.5: Attempt to change password: 
                • With incorrect current password. 
                • With new password not meeting complexity requirements. 
                • With new password not matching confirmation. 
                • With correct current password and valid new password. Verify re-login is required or automated logout occurs.
Epic 6: Customer Account Management Enhancements
Story 6.2: Manage Customer Address Book
Story: As a registered customer, I want to be able to add, edit, and delete shipping and billing addresses in my address book so that I can quickly select preferred addresses during checkout and keep my delivery information organized.
Acceptance Criteria:
    1. A "Address Book" link is available in the "My Account" navigation. 
    2. Clicking the "Address Book" link takes the customer to a page listing all their saved addresses. 
    3. Each address in the list displays key details (e.g., recipient name, first line of address, city, postcode). 
    4. There is an option to mark one address as the "Default Shipping Address" and another as the "Default Billing Address". 
    5. The customer can add a new address by filling out a form with standard address fields: 
        ◦ Full Name (Recipient) 
        ◦ Company Name (optional) 
        ◦ Address Line 1 (required) 
        ◦ Address Line 2 (optional) 
        ◦ City (required) 
        ◦ State/Province (required, may be a dropdown depending on country) 
        ◦ Postcode/Zip Code (required) 
        ◦ Country (required, dropdown) 
        ◦ Phone Number (optional, for delivery contact) 
        ◦ Checkbox options for "Set as Default Shipping Address" and "Set as Default Billing Address". 
    6. The customer can edit an existing address, pre-populating the form with current details. 
    7. The customer can delete an address after a confirmation prompt. 
    8. Addresses used in past orders cannot be deleted or modified in a way that breaks historical order data (they can only be deactivated or removed from active selection). 
    9. All address fields are validated client-side and server-side. 
    10. Upon successful add/edit/delete, a success message is displayed. 
    11. The address book updates are immediately reflected in the checkout process. 

Granular Tasks & Subtasks for Story 6.2:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.2.1: Implement "Address Book" Navigation & List Page 
            ▪ Subtask 6.2.1.1: Add an "Address Book" link to the CustomerAccountDashboardPage sidebar/tabs (from Story 6.1). 
            ▪ Subtask 6.2.1.2: Create CustomerAddressBookPage component/route (e.g., /account/addresses). 
            ▪ Subtask 6.2.1.3: Design and implement a layout to display a list of addresses (e.g., cards or table). 
            ▪ Subtask 6.2.1.4: For each address, display key information and "Edit," "Delete," and "Set as Default Shipping/Billing" (buttons/checkboxes). 
            ▪ Subtask 6.2.1.5: Clearly indicate the current default shipping and billing addresses. 
            ▪ Subtask 6.2.1.6: Add an "Add New Address" button. 
        ◦ Task 6.2.2: Implement "Add/Edit Address" Form UI 
            ▪ Subtask 6.2.2.1: Create a reusable AddressForm component (can be a modal or dedicated page, e.g., /account/addresses/new or /account/addresses/edit/:addressId). 
            ▪ Subtask 6.2.2.2: Implement input fields for all address attributes: Full Name, Company, Address Line 1 & 2, City, State/Province (dynamic based on country), Postcode/Zip, Country (dropdown), Phone Number. 
            ▪ Subtask 6.2.2.3: Include checkboxes for "Set as Default Shipping Address" and "Set as Default Billing Address." 
            ▪ Subtask 6.2.2.4: For "Edit" mode, pre-populate the form with fetched address data. 
            ▪ Subtask 6.2.2.5: Add "Save Address" and "Cancel" buttons. 
        ◦ Task 6.2.3: Implement Client-Side Form Validation 
            ▪ Subtask 6.2.3.1: Validate all required fields (Name, Address1, City, Postcode, Country, State/Province if applicable). 
            ▪ Subtask 6.2.3.2: Validate format (e.g., postcode patterns). 
        ◦ Task 6.2.4: Implement Address Deletion Confirmation 
            ▪ Subtask 6.2.4.1: On clicking "Delete," display a confirmation modal. 
            ▪ Subtask 6.2.4.2: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 6.2.5: Frontend API Integration: Fetch Address Book 
            ▪ Subtask 6.2.5.1: Create service/hook to call GET /api/customer/addresses. 
            ▪ Subtask 6.2.5.2: Display fetched addresses in the list. 
        ◦ Task 6.2.6: Frontend API Integration: Add Address 
            ▪ Subtask 6.2.6.1: Create service/hook to call POST /api/customer/addresses. 
            ▪ Subtask 6.2.6.2: On success, refresh the address list and display notification. 
        ◦ Task 6.2.7: Frontend API Integration: Edit Address 
            ▪ Subtask 6.2.7.1: Create service/hook to call PUT /api/customer/addresses/:addressId. 
            ▪ Subtask 6.2.7.2: On success, refresh the address list and display notification. 
        ◦ Task 6.2.8: Frontend API Integration: Delete Address 
            ▪ Subtask 6.2.8.1: Create service/hook to call DELETE /api/customer/addresses/:addressId. 
            ▪ Subtask 6.2.8.2: On success, remove from list and display notification. 
        ◦ Task 6.2.9: Frontend API Integration: Set Default Addresses 
            ▪ Subtask 6.2.9.1: Create service/hook to call PUT /api/customer/addresses/:addressId/default with type (shipping/billing). 
            ▪ Subtask 6.2.9.2: Update UI to reflect new defaults. 
    • Backend Tasks (Customer API):
        ◦ Task 6.2.10: Update User Model for Address Book 
            ▪ Subtask 6.2.10.1: Modify User schema to include an array of addresses (sub-documents or references to a separate Address collection if complex). Each address should have a unique ID. 
            ▪ Subtask 6.2.10.2: Add fields to User schema for defaultShippingAddressId and defaultBillingAddressId. 
        ◦ Task 6.2.11: Create Get Customer Address Book API Endpoint 
            ▪ Subtask 6.2.11.1: Design and implement GET /api/customer/addresses. 
            ▪ Subtask 6.2.11.2: Apply customer authentication middleware. 
            ▪ Subtask 6.2.11.3: Fetch the authenticated user's address array. 
            ▪ Subtask 6.2.11.4: Return the list of addresses along with default IDs. 
        ◦ Task 6.2.12: Create Add Address API Endpoint 
            ▪ Subtask 6.2.12.1: Design and implement POST /api/customer/addresses. 
            ▪ Subtask 6.2.12.2: Apply customer authentication. 
            ▪ Subtask 6.2.12.3: Implement server-side validation for all address fields. 
            ▪ Subtask 6.2.12.4: Add the new address to the user's addresses array. 
            ▪ Subtask 6.2.12.5: If default flags are set, update defaultShippingAddressId/defaultBillingAddressId. 
            ▪ Subtask 6.2.12.6: Audit Logging: Log new address added. 
        ◦ Task 6.2.13: Create Edit Address API Endpoint 
            ▪ Subtask 6.2.13.1: Design and implement PUT /api/customer/addresses/:addressId. 
            ▪ Subtask 6.2.13.2: Apply customer authentication. 
            ▪ Subtask 6.2.13.3: Validate addressId belongs to the authenticated user. 
            ▪ Subtask 6.2.13.4: Implement server-side validation for updated address fields. 
            ▪ Subtask 6.2.13.5: Update the specific address in the user's addresses array. 
            ▪ Subtask 6.2.13.6: If default flags are set, update defaultShippingAddressId/defaultBillingAddressId. 
            ▪ Subtask 6.2.13.7: Audit Logging: Log address updated. 
        ◦ Task 6.2.14: Create Delete Address API Endpoint 
            ▪ Subtask 6.2.14.1: Design and implement DELETE /api/customer/addresses/:addressId. 
            ▪ Subtask 6.2.14.2: Apply customer authentication. 
            ▪ Subtask 6.2.14.3: Validate addressId belongs to the authenticated user. 
            ▪ Subtask 6.2.14.4: Implement checks: Prevent deletion if the address is currently set as a default. If an address has been used in a past order, consider a soft delete (e.g., isDeleted flag on the address sub-document, or simply remove from active list but keep in DB for historical reference). For MVP, a strict delete might be acceptable, but later, historical data integrity is key. 
            ▪ Subtask 6.2.14.5: Remove the address from the user's addresses array (or set isDeleted flag). 
            ▪ Subtask 6.2.14.6: If the deleted address was a default, clear the default ID. 
            ▪ Subtask 6.2.14.7: Audit Logging: Log address deleted. 
        ◦ Task 6.2.15: Create Set Default Address API Endpoint 
            ▪ Subtask 6.2.15.1: Design and implement PUT /api/customer/addresses/:addressId/default. 
            ▪ Subtask 6.2.15.2: Apply customer authentication. 
            ▪ Subtask 6.2.15.3: Validate addressId belongs to the user and type (shipping/billing) is valid. 
            ▪ Subtask 6.2.15.4: Update defaultShippingAddressId or defaultBillingAddressId in the User document. 
    • Core Application Integration Tasks:
        ◦ Task 6.2.16: Integrate Address Book into Checkout Flow 
            ▪ Subtask 6.2.16.1: During checkout, allow logged-in users to select from their saved addresses. 
            ▪ Subtask 6.2.16.2: Auto-select default shipping/billing addresses if set. 
            ▪ Subtask 6.2.16.3: Provide an option to "Add New Address" directly from checkout. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.2.17: Secure User Address Data 
            ▪ Subtask 6.2.17.1: Ensure only the authenticated user can access, add, edit, or delete their own addresses. 
            ▪ Subtask 6.2.17.2: Robust server-side validation for all address inputs. 
    • Testing Tasks:
        ◦ Task 6.2.18: Write Unit Tests 
            ▪ Subtask 6.2.18.1: Unit tests for frontend address form validation. 
            ▪ Subtask 6.2.18.2: Unit tests for backend address book CRUD logic, default setting, and user ownership checks. 
        ◦ Task 6.2.19: Write Integration Tests 
            ▪ Subtask 6.2.19.1: Register a test user and log in. 
            ▪ Subtask 6.2.19.2: Call POST /api/customer/addresses to add new addresses. Verify addresses are saved. 
            ▪ Subtask 6.2.19.3: Call GET /api/customer/addresses. Verify all added addresses are returned. 
            ▪ Subtask 6.2.19.4: Call PUT /api/customer/addresses/:addressId to edit an address. Verify changes. 
            ▪ Subtask 6.2.19.5: Call PUT /api/customer/addresses/:addressId/default to set defaults. Verify defaults are updated. 
            ▪ Subtask 6.2.19.6: Call DELETE /api/customer/addresses/:addressId. Verify deletion (and protection for defaults). 
            ▪ Subtask 6.2.19.7: Test unauthorized access to all address book endpoints. 
        ◦ Task 6.2.20: Manual End-to-End Testing 
            ▪ Subtask 6.2.20.1: Log in as a customer. Navigate to "My Account" -> "Address Book." 
            ▪ Subtask 6.2.20.2: Add 2-3 new addresses, one shipping default, one billing default. Verify they appear correctly. 
            ▪ Subtask 6.2.20.3: Edit an existing address. Verify changes. 
            ▪ Subtask 6.2.20.4: Change default shipping/billing addresses. Verify indicators update. 
            ▪ Subtask 6.2.20.5: Try to delete a default address (should be prevented or require re-setting default). 
            ▪ Subtask 6.2.20.6: Delete a non-default address. Verify it's removed. 
            ▪ Subtask 6.2.20.7: Go to the checkout page. Verify saved addresses are available for selection, and default addresses are pre-selected.
Epic 6: Customer Account Management Enhancements
Story 6.3: View Customer Order History
Story: As a registered customer, I want to be able to view a list of my past orders and access detailed information for each order so that I can track my purchases and easily re-order items.
Acceptance Criteria:
    1. An "Order History" or "My Orders" link is available in the "My Account" navigation. 
    2. Clicking the "Order History" link takes the customer to a page listing all their past orders. 
    3. The order list displays key summary information for each order: 
        ◦ Order Number/ID 
        ◦ Order Date 
        ◦ Order Status (e.g., "Processing," "Shipped," "Delivered," "Cancelled") 
        ◦ Total Amount 
        ◦ (Optional) Number of Items 
    4. The order list is paginated, with options to sort (e.g., by date descending) and filter (e.g., by status, date range). 
    5. Clicking on an individual order in the list navigates to a detailed "Order Details" page. 
    6. The "Order Details" page displays comprehensive information for that specific order: 
        ◦ Order Number/ID 
        ◦ Order Date & Time 
        ◦ Current Order Status 
        ◦ Billing Address 
        ◦ Shipping Address 
        ◦ Shipping Method 
        ◦ Payment Method used (e.g., "Visa ending in 1234") 
        ◦ List of items purchased: 
            ▪ Product Name 
            ▪ SKU 
            ▪ Quantity 
            ▪ Unit Price 
            ▪ Item Total 
            ▪ (Optional) Product Image 
        ◦ Subtotal 
        ◦ Shipping Cost 
        ◦ Tax Amount 
        ◦ Discount Applied (if any) 
        ◦ Grand Total 
        ◦ (Optional) Tracking number/link if the order is shipped. 
        ◦ (Optional) A "Re-order" button to add all items from that order to the current cart. 
    7. All order history and details are securely retrieved and displayed only to the authenticated customer who owns the order. 

Granular Tasks & Subtasks for Story 6.3:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.3.1: Implement "Order History" Navigation & List Page 
            ▪ Subtask 6.3.1.1: Add an "Order History" link to the CustomerAccountDashboardPage sidebar/tabs (from Story 6.1). 
            ▪ Subtask 6.3.1.2: Create CustomerOrderHistoryPage component/route (e.g., /account/orders). 
            ▪ Subtask 6.3.1.3: Design and implement a table or list layout to display order summaries. 
            ▪ Subtask 6.3.1.4: Include columns/sections for Order Number, Date, Status, Total, and a "View Details" button/link. 
            ▪ Subtask 6.3.1.5: Implement pagination controls for the order list. 
            ▪ Subtask 6.3.1.6: Implement filtering options (e.g., by status dropdown, date range picker). 
            ▪ Subtask 6.3.1.7: Implement sorting options (e.g., by Order Date). 
        ◦ Task 6.3.2: Implement "Order Details" Page UI 
            ▪ Subtask 6.3.2.1: Create CustomerOrderDetailsPage component/route (e.g., /account/orders/:orderId). 
            ▪ Subtask 6.3.2.2: Display all specified detailed order information (Order Number, Date, Status, Addresses, Payment/Shipping Info, Item List, Totals). 
            ▪ Subtask 6.3.2.3: Present product items in a clear table format. 
            ▪ Subtask 6.3.2.4: Integrate tracking number/link display if available. 
            ▪ Subtask 6.3.2.5: Implement a "Re-order" button (optional for MVP, might be a separate story if complex). 
        ◦ Task 6.3.3: Frontend API Integration: Fetch Order History 
            ▪ Subtask 6.3.3.1: Create service/hook to call GET /api/customer/orders. 
            ▪ Subtask 6.3.3.2: Pass pagination, filter, and sort parameters. 
            ▪ Subtask 6.3.3.3: Display fetched order summaries. 
        ◦ Task 6.3.4: Frontend API Integration: Fetch Order Details 
            ▪ Subtask 6.3.4.1: Create service/hook to call GET /api/customer/orders/:orderId. 
            ▪ Subtask 6.3.4.2: Display fetched detailed order data. 
        ◦ Task 6.3.5: (Optional) Frontend Integration: Re-order Functionality 
            ▪ Subtask 6.3.5.1: If "Re-order" button is implemented, integrate with a backend endpoint that adds order items to the current cart. 
    • Backend Tasks (Customer API):
        ◦ Task 6.3.6: Create Get Customer Order History API Endpoint 
            ▪ Subtask 6.3.6.1: Design and implement GET /api/customer/orders. 
            ▪ Subtask 6.3.6.2: Apply customer authentication middleware. 
            ▪ Subtask 6.3.6.3: Query Order collection, filtering by the authenticated user's ID. 
            ▪ Subtask 6.3.6.4: Implement pagination, filtering (by status, orderDate range), and sorting (by orderDate). 
            ▪ Subtask 6.3.6.5: Return a list of summary order data. 
        ◦ Task 6.3.7: Create Get Customer Order Details API Endpoint 
            ▪ Subtask 6.3.7.1: Design and implement GET /api/customer/orders/:orderId. 
            ▪ Subtask 6.3.7.2: Apply customer authentication middleware. 
            ▪ Subtask 6.3.7.3: Fetch Order document by _id, ensuring it belongs to the authenticated user. 
            ▪ Subtask 6.3.7.4: Populate necessary product details within order items (e.g., name, SKU, image URL). 
            ▪ Subtask 6.3.7.5: Return comprehensive order details. 
        ◦ Task 6.3.8: (Optional) Implement Re-order API Endpoint 
            ▪ Subtask 6.3.8.1: Design and implement POST /api/customer/orders/:orderId/reorder. 
            ▪ Subtask 6.3.8.2: Apply customer authentication. 
            ▪ Subtask 6.3.8.3: Validate orderId belongs to the user. 
            ▪ Subtask 6.3.8.4: Retrieve all items from the specified order. 
            ▪ Subtask 6.3.8.5: For each item, verify product existence and current stock availability. 
            ▪ Subtask 6.3.8.6: Add available items to the user's current shopping cart. 
            ▪ Subtask 6.3.8.7: Return success/failure or redirect to cart. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.3.9: Strict Authorization for Order Data 
            ▪ Subtask 6.3.9.1: Ensure a customer can only access their own orders. Prevent access to other users' order data. 
            ▪ Subtask 6.3.9.2: Implement robust checks in backend endpoints. 
    • Testing Tasks:
        ◦ Task 6.3.10: Write Unit Tests 
            ▪ Subtask 6.3.10.1: Unit tests for frontend sorting/filtering logic. 
            ▪ Subtask 6.3.10.2: Unit tests for backend order fetching logic (filtering by user ID, pagination, sorting). 
            ▪ Subtask 6.3.10.3: (If Re-order) Unit tests for re-order logic (checking stock, adding to cart). 
        ◦ Task 6.3.11: Write Integration Tests 
            ▪ Subtask 6.3.11.1: Register a test user. Place several orders for this user with different statuses and dates. 
            ▪ Subtask 6.3.11.2: Log in as the user. Call GET /api/customer/orders. Verify the list of orders, pagination, and sorting/filtering. 
            ▪ Subtask 6.3.11.3: Call GET /api/customer/orders/:orderId for one of the user's orders. Verify all details are correct. 
            ▪ Subtask 6.3.11.4: Test attempting to fetch another user's order (should fail with authorization error). 
            ▪ Subtask 6.3.11.5: Test unauthenticated access to these endpoints. 
            ▪ Subtask 6.3.11.6: (If Re-order) Test POST /api/customer/orders/:orderId/reorder. Verify items are added to cart, and unavailable items are handled. 
        ◦ Task 6.3.12: Manual End-to-End Testing 
            ▪ Subtask 6.3.12.1: Log in as a customer. Place several orders. 
            ▪ Subtask 6.3.12.2: Navigate to "My Account" -> "Order History." 
            ▪ Subtask 6.3.12.3: Verify all past orders are listed correctly with summaries. 
            ▪ Subtask 6.3.12.4: Test pagination, sorting, and filtering on the order list. 
            ▪ Subtask 6.3.12.5: Click on an order to view its details. Verify all information is accurate (addresses, payment, shipping, items, totals, status). 
            ▪ Subtask 6.3.12.6: (If Re-order) Click "Re-order." Verify items are added to the cart, and a message appears for any out-of-stock items.
Epic 6: Customer Account Management Enhancements
Story 6.4: Manage Wishlist
Story: As a registered customer, I want to be able to add products to a personal wishlist, view my wishlist, and remove items from it so that I can save products I'm interested in for later consideration or purchase.
Acceptance Criteria:
    1. A "Add to Wishlist" button/link is available on all product detail pages for logged-in users. 
    2. A "Wishlist" link is available in the user's logged-in navigation (e.g., "My Account" area or header). 
    3. Clicking "Add to Wishlist" on a product page adds the product to the user's wishlist and provides immediate visual feedback (e.g., button changes, notification). 
    4. If the product is already in the wishlist, the button indicates this (e.g., "In Wishlist" or "Remove from Wishlist"). 
    5. Clicking the "Wishlist" link in the navigation takes the customer to their dedicated wishlist page. 
    6. The wishlist page displays a list of all products added by the customer, including: 
        ◦ Product Image 
        ◦ Product Name 
        ◦ Current Price 
        ◦ Stock Availability 
        ◦ (Optional) "Add to Cart" button for each item. 
        ◦ "Remove" button for each item. 
    7. The customer can remove individual items from their wishlist. 
    8. The customer can move items from the wishlist directly to their shopping cart. 
    9. All wishlist actions are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.4:
    • Frontend Tasks (Storefront & Customer Account Panel):
        ◦ Task 6.4.1: Implement "Add to Wishlist" Button on Product Page 
            ▪ Subtask 6.4.1.1: Modify ProductDetailPage (and potentially product listing cards) to include an "Add to Wishlist" button/icon. 
            ▪ Subtask 6.4.1.2: Ensure the button is only visible if the user is logged in. 
            ▪ Subtask 6.4.1.3: Implement logic to dynamically show "Add to Wishlist" or "In Wishlist / Remove from Wishlist" based on the product's presence in the user's wishlist. 
            ▪ Subtask 6.4.1.4: Implement immediate visual feedback (e.g., toast notification, button state change) on successful addition/removal. 
        ◦ Task 6.4.2: Implement "Wishlist" Navigation Link 
            ▪ Subtask 6.4.2.1: Add a "Wishlist" link to the global header navigation (next to Cart, My Account, etc.) and/or within the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.4.2.2: (Optional) Display a count of items in the wishlist next to the link. 
        ◦ Task 6.4.3: Implement "Wishlist" Page UI 
            ▪ Subtask 6.4.3.1: Create CustomerWishlistPage component/route (e.g., /account/wishlist). 
            ▪ Subtask 6.4.3.2: Design and implement a grid or list layout to display wishlist products. 
            ▪ Subtask 6.4.3.3: For each product, display Image, Name, Price, Stock Status. 
            ▪ Subtask 6.4.3.4: Add "Add to Cart" and "Remove" buttons for each item. 
            ▪ Subtask 6.4.3.5: Handle empty wishlist state (display "Your wishlist is empty"). 
        ◦ Task 6.4.4: Frontend API Integration: Add/Remove from Wishlist 
            ▪ Subtask 6.4.4.1: Create service/hook to call POST /api/customer/wishlist (to add a product ID). 
            ▪ Subtask 6.4.4.2: Create service/hook to call DELETE /api/customer/wishlist/:productId (to remove). 
        ◦ Task 6.4.5: Frontend API Integration: Fetch Wishlist Content 
            ▪ Subtask 6.4.5.1: Create service/hook to call GET /api/customer/wishlist. 
            ▪ Subtask 6.4.5.2: Display fetched product data, joining with product details (image, price, stock). 
        ◦ Task 6.4.6: Frontend API Integration: Move from Wishlist to Cart 
            ▪ Subtask 6.4.6.1: Create service/hook to call POST /api/customer/cart/add-from-wishlist (or similar, takes product ID). 
            ▪ Subtask 6.4.6.2: On success, remove item from wishlist and update cart count. 
    • Backend Tasks (Customer API):
        ◦ Task 6.4.7: Update User Model for Wishlist 
            ▪ Subtask 6.4.7.1: Modify User schema to include a wishlist array, storing product IDs (e.g., productId: { type: Schema.Types.ObjectId, ref: 'Product' }). 
        ◦ Task 6.4.8: Create Add to Wishlist API Endpoint 
            ▪ Subtask 6.4.8.1: Design and implement POST /api/customer/wishlist. 
            ▪ Subtask 6.4.8.2: Apply customer authentication middleware. 
            ▪ Subtask 6.4.8.3: Receive productId. 
            ▪ Subtask 6.4.8.4: Validate productId exists and is not already in the user's wishlist. 
            ▪ Subtask 6.4.8.5: Add productId to the authenticated user's wishlist array. 
        ◦ Task 6.4.9: Create Remove from Wishlist API Endpoint 
            ▪ Subtask 6.4.9.1: Design and implement DELETE /api/customer/wishlist/:productId. 
            ▪ Subtask 6.4.9.2: Apply customer authentication. 
            ▪ Subtask 6.4.9.3: Validate productId exists and is in the user's wishlist. 
            ▪ Subtask 6.4.9.4: Remove productId from the authenticated user's wishlist array. 
        ◦ Task 6.4.10: Create Get Wishlist Content API Endpoint 
            ▪ Subtask 6.4.10.1: Design and implement GET /api/customer/wishlist. 
            ▪ Subtask 6.4.10.2: Apply customer authentication. 
            ▪ Subtask 6.4.10.3: Fetch the authenticated user's wishlist array. 
            ▪ Subtask 6.4.10.4: Populate (join) product details for each productId in the wishlist (Name, Price, Image, Stock). 
            ▪ Subtask 6.4.10.5: Return the list of populated wishlist items. 
        ◦ Task 6.4.11: Create Add to Cart from Wishlist API Endpoint 
            ▪ Subtask 6.4.11.1: Design and implement POST /api/customer/cart/add-from-wishlist. 
            ▪ Subtask 6.4.11.2: Apply customer authentication. 
            ▪ Subtask 6.4.11.3: Receive productId. 
            ▪ Subtask 6.4.11.4: Validate product existence and availability (stock). 
            ▪ Subtask 6.4.11.5: Add the product (default quantity 1) to the user's active shopping cart. 
            ▪ Subtask 6.4.11.6: Optionally, remove the item from the wishlist after adding to cart (configurable behavior). 
    • Security & Data Integrity Tasks:
        ◦ Task 6.4.12: Secure Wishlist Data 
            ▪ Subtask 6.4.12.1: Ensure a customer can only manage their own wishlist. Prevent access/modification of other users' wishlists. 
            ▪ Subtask 6.4.12.2: Robust server-side validation for product IDs. 
    • Testing Tasks:
        ◦ Task 6.4.13: Write Unit Tests 
            ▪ Subtask 6.4.13.1: Unit tests for backend add/remove wishlist logic (duplicate checks, removal). 
            ▪ Subtask 6.4.13.2: Unit tests for adding to cart from wishlist (stock checks). 
        ◦ Task 6.4.14: Write Integration Tests 
            ▪ Subtask 6.4.14.1: Register a test user. Create several test products. 
            ▪ Subtask 6.4.14.2: Log in as the user. Call POST /api/customer/wishlist to add products. Verify they are added. 
            ▪ Subtask 6.4.14.3: Call GET /api/customer/wishlist. Verify the list of products is returned with details. 
            ▪ Subtask 6.4.14.4: Call DELETE /api/customer/wishlist/:productId. Verify product is removed. 
            ▪ Subtask 6.4.14.5: Test adding a product already in wishlist, or a non-existent product. 
            ▪ Subtask 6.4.14.6: Test unauthenticated access. 
            ▪ Subtask 6.4.14.7: Test POST /api/customer/cart/add-from-wishlist with available and out-of-stock products. Verify cart updates and wishlist behavior. 
        ◦ Task 6.4.15: Manual End-to-End Testing 
            ▪ Subtask 6.4.15.1: Log in as a customer. Browse products. 
            ▪ Subtask 6.4.15.2: On several product detail pages, click "Add to Wishlist." Verify visual feedback. 
            ▪ Subtask 6.4.15.3: Navigate to "My Account" -> "Wishlist." Verify all added products are displayed with their correct details (price, stock). 
            ▪ Subtask 6.4.15.4: Test "Remove" button for an item. Verify it disappears. 
            ▪ Subtask 6.4.15.5: Test "Add to Cart" for an item. Verify it's added to cart and potentially removed from wishlist. 
            ▪ Subtask 6.4.15.6: Test adding an out-of-stock product to wishlist and then trying to "Add to Cart" from wishlist (should provide feedback).
Epic 6: Customer Account Management Enhancements
Story 6.5: Manage Payment Methods
Story: As a registered customer, I want to be able to securely save, view, and delete my preferred payment methods (e.g., credit cards) so that I can have a faster and more convenient checkout experience for future purchases.
Acceptance Criteria:
    1. A "Payment Methods" link is available in the "My Account" navigation. 
    2. Clicking the "Payment Methods" link takes the customer to a page listing their saved payment methods. 
    3. For each saved payment method, the following details are displayed (without exposing full sensitive data): 
        ◦ Card Type (e.g., Visa, Mastercard) 
        ◦ Last 4 digits of the card number 
        ◦ Expiration Date 
        ◦ (Optional) Cardholder Name 
        ◦ (Optional) Option to mark as "Default" payment method. 
    4. The customer can add a new payment method via a secure payment form (e.g., using a payment gateway's hosted fields or SDK). 
    5. The process of adding a payment method involves: 
        ◦ Capturing card details securely on the client-side (e.g., Stripe Elements). 
        ◦ Tokenizing the card data via the payment gateway. 
        ◦ Storing only the payment token/ID (and necessary non-sensitive details like last 4 digits, expiry) in the store's database, not the actual card number. 
    6. The customer can set a saved payment method as their default. 
    7. The customer can delete a saved payment method after a confirmation prompt. 
    8. Saved payment methods are seamlessly available for selection during the checkout process. 
    9. All payment method management operations adhere to PCI DSS compliance standards. 
    10. Appropriate success/error messages are displayed. 

Granular Tasks & Subtasks for Story 6.5:
    • Frontend Tasks (Customer Account Panel & Checkout):
        ◦ Task 6.5.1: Implement "Payment Methods" Navigation & List Page 
            ▪ Subtask 6.5.1.1: Add a "Payment Methods" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.5.1.2: Create CustomerPaymentMethodsPage component/route (e.g., /account/payment-methods). 
            ▪ Subtask 6.5.1.3: Design and implement a layout to display a list of saved payment methods (e.g., cards or table rows). 
            ▪ Subtask 6.5.1.4: For each payment method, display Card Type, Last 4 digits, Expiration, and "Delete" button. 
            ▪ Subtask 6.5.1.5: Implement "Set as Default" option (radio button or separate action). 
            ▪ Subtask 6.5.1.6: Add an "Add New Payment Method" button. 
        ◦ Task 6.5.2: Implement "Add New Payment Method" Form UI (Gateway Integration) 
            ▪ Subtask 6.5.2.1: Integrate with chosen payment gateway's client-side SDK (e.g., Stripe Elements, PayPal Smart Buttons for tokenization). 
            ▪ Subtask 6.5.2.2: Implement secure input fields for card number, expiry, CVC, name on card (these fields typically provided by the gateway SDK). 
            ▪ Subtask 6.5.2.3: Add "Save Card" and "Cancel" buttons. 
            ▪ Subtask 6.5.2.4: Handle tokenization process on form submission (submit card details to gateway, receive token). 
        ◦ Task 6.5.3: Implement Payment Method Deletion Confirmation 
            ▪ Subtask 6.5.3.1: On clicking "Delete," display a confirmation modal. 
            ▪ Subtask 6.5.3.2: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 6.5.4: Frontend API Integration: Fetch Saved Payment Methods 
            ▪ Subtask 6.5.4.1: Create service/hook to call GET /api/customer/payment-methods. 
            ▪ Subtask 6.5.4.2: Display fetched payment method details. 
        ◦ Task 6.5.5: Frontend API Integration: Add Payment Method (Token) 
            ▪ Subtask 6.5.5.1: Create service/hook to call POST /api/customer/payment-methods. 
            ▪ Subtask 6.5.5.2: Send the payment token received from the gateway, along with non-sensitive details (last 4 digits, expiry, card type). 
            ▪ Subtask 6.5.5.3: On success, refresh the list and display notification. 
        ◦ Task 6.5.6: Frontend API Integration: Delete Payment Method 
            ▪ Subtask 6.5.6.1: Create service/hook to call DELETE /api/customer/payment-methods/:methodId. 
            ▪ Subtask 6.5.6.2: On success, remove from list and display notification. 
        ◦ Task 6.5.7: Frontend API Integration: Set Default Payment Method 
            ▪ Subtask 6.5.7.1: Create service/hook to call PUT /api/customer/payment-methods/:methodId/default. 
            ▪ Subtask 6.5.7.2: Update UI to reflect the new default. 
    • Backend Tasks (Customer API & Payment Gateway Integration):
        ◦ Task 6.5.8: Update User Model for Saved Payment Methods 
            ▪ Subtask 6.5.8.1: Modify User schema to include an array of paymentMethods (sub-documents). 
            ▪ Subtask 6.5.8.2: Each paymentMethod sub-document should store: 
                • gatewayCustomerId (e.g., Stripe Customer ID) 
                • paymentMethodId (token/ID from gateway for this specific card) 
                • cardType (Visa, Mastercard, etc.) 
                • lastFour (last 4 digits) 
                • expiryMonth 
                • expiryYear 
                • isDefault (boolean) 
        ◦ Task 6.5.9: Payment Gateway API Integration: Create Customer 
            ▪ Subtask 6.5.9.1: If using a gateway like Stripe that has "Customer" objects, implement logic to create a corresponding customer object in the gateway when a user first attempts to save a card (or when they register). Store the gatewayCustomerId on the User document. 
        ◦ Task 6.5.10: Create Get Saved Payment Methods API Endpoint 
            ▪ Subtask 6.5.10.1: Design and implement GET /api/customer/payment-methods. 
            ▪ Subtask 6.5.10.2: Apply customer authentication middleware. 
            ▪ Subtask 6.5.10.3: Fetch the authenticated user's paymentMethods array. 
            ▪ Subtask 6.5.10.4: Return non-sensitive details only. 
        ◦ Task 6.5.11: Create Add Payment Method API Endpoint 
            ▪ Subtask 6.5.11.1: Design and implement POST /api/customer/payment-methods. 
            ▪ Subtask 6.5.11.2: Apply customer authentication. 
            ▪ Subtask 6.5.11.3: Receive the payment token from the frontend (from gateway SDK). 
            ▪ Subtask 6.5.11.4: Call Payment Gateway API to attach token to customer: Use the gatewayCustomerId (from user document) to attach the received token to the customer record in the payment gateway. This returns a paymentMethodId (or similar ID specific to the gateway). 
            ▪ Subtask 6.5.11.5: Store the paymentMethodId, cardType, lastFour, expiryMonth, expiryYear, and isDefault flag in the user's paymentMethods array. 
            ▪ Subtask 6.5.11.6: If isDefault is true, update other methods to isDefault: false. 
            ▪ Subtask 6.5.11.7: Audit Logging: Log new payment method added. 
        ◦ Task 6.5.12: Create Delete Payment Method API Endpoint 
            ▪ Subtask 6.5.12.1: Design and implement DELETE /api/customer/payment-methods/:methodId. 
            ▪ Subtask 6.5.12.2: Apply customer authentication. 
            ▪ Subtask 6.5.12.3: Validate methodId belongs to the authenticated user. 
            ▪ Subtask 6.5.12.4: Call Payment Gateway API to detach/delete payment method: Use the gatewayCustomerId and the paymentMethodId to remove the method from the gateway. 
            ▪ Subtask 6.5.12.5: Remove the corresponding payment method sub-document from the user's paymentMethods array. 
            ▪ Subtask 6.5.12.6: If the deleted method was default, clear the default and potentially set another one as default. 
            ▪ Subtask 6.5.12.7: Audit Logging: Log payment method deleted. 
        ◦ Task 6.5.13: Create Set Default Payment Method API Endpoint 
            ▪ Subtask 6.5.13.1: Design and implement PUT /api/customer/payment-methods/:methodId/default. 
            ▪ Subtask 6.5.13.2: Apply customer authentication. 
            ▪ Subtask 6.5.13.3: Validate methodId belongs to the user. 
            ▪ Subtask 6.5.13.4: Update isDefault flag for the specified method to true, and for all others to false within the user's paymentMethods array. 
    • Core Application Integration Tasks:
        ◦ Task 6.5.14: Integrate Saved Payment Methods into Checkout Flow 
            ▪ Subtask 6.5.14.1: Modify checkout payment step to display saved payment methods as an option for logged-in users. 
            ▪ Subtask 6.5.14.2: Allow selection of a saved method or entering new card details. 
            ▪ Subtask 6.5.14.3: When a saved method is selected, use its paymentMethodId (token) with the payment gateway to process the charge, instead of re-tokenizing. 
    • Security & Compliance Tasks (Crucial!):
        ◦ Task 6.5.15: PCI DSS Compliance Review 
            ▪ Subtask 6.5.15.1: Review the entire flow with PCI DSS requirements. (Note: Using a tokenization service like Stripe Elements generally simplifies compliance, but proper handling of tokens, API keys, and server-side processing is still vital). 
            ▪ Subtask 6.5.15.2: Ensure no raw card data ever touches the store's servers or database. 
        ◦ Task 6.5.16: Secure API Key Management 
            ▪ Subtask 6.5.16.1: Store payment gateway API keys (secret keys) securely in environment variables or a secrets manager, not directly in code. 
        ◦ Task 6.5.17: Strong Authentication & Authorization 
            ▪ Subtask 6.5.17.1: Ensure only the authenticated user can access, add, or delete their own payment methods. 
    • Testing Tasks:
        ◦ Task 6.5.18: Write Unit Tests 
            ▪ Subtask 6.5.18.1: Unit tests for backend logic of adding/deleting methods from user profile, setting defaults. 
            ▪ Subtask 6.5.18.2: Mock payment gateway API calls in unit tests. 
        ◦ Task 6.5.19: Write Integration Tests 
            ▪ Subtask 6.5.19.1: Register a test user. Set up mock payment gateway responses for tokenization, attaching, detaching. 
            ▪ Subtask 6.5.19.2: Log in as the user. Simulate frontend calls to POST /api/customer/payment-methods with mock tokens. Verify saved methods appear in GET /api/customer/payment-methods. 
            ▪ Subtask 6.5.19.3: Test DELETE /api/customer/payment-methods/:methodId. Verify deletion. 
            ▪ Subtask 6.5.19.4: Test PUT /api/customer/payment-methods/:methodId/default. Verify default status. 
            ▪ Subtask 6.5.19.5: Test unauthorized access. 
        ◦ Task 6.5.20: Manual End-to-End Testing 
            ▪ Subtask 6.5.20.1: Log in as a customer. Navigate to "My Account" -> "Payment Methods." 
            ▪ Subtask 6.5.20.2: Click "Add New Payment Method." Use test card details provided by the payment gateway (e.g., Stripe's test cards). Verify the card is saved and appears in the list (showing last 4, expiry). 
            ▪ Subtask 6.5.20.3: Add another test card. 
            ▪ Subtask 6.5.20.4: Set one of the cards as default. Verify UI updates. 
            ▪ Subtask 6.5.20.5: Delete a card. Verify confirmation and removal. 
            ▪ Subtask 6.5.20.6: Go to checkout. Verify both saved cards and the default selection appear as payment options. Select a saved card and complete a test purchase. Verify payment goes through and order is created.
Epic 6: Customer Account Management Enhancements
Story 6.6: Customer Support Ticket Submission
Story: As a registered customer, I want to be able to submit support tickets directly from my account and view the status and responses for my open and closed tickets so that I can easily get help with my orders or other inquiries.
Acceptance Criteria:
    1. A "Support Tickets" or "Help Center" link is available in the "My Account" navigation. 
    2. Clicking the "Support Tickets" link takes the customer to a page listing their past and current support tickets. 
    3. The ticket list displays key summary information for each ticket: 
        ◦ Ticket ID 
        ◦ Subject 
        ◦ Submission Date 
        ◦ Current Status (e.g., "Open," "Pending Customer Reply," "Resolved," "Closed") 
        ◦ Last Updated Date 
    4. The ticket list is paginated and sortable (e.g., by submission date, status). 
    5. There is an "Open New Ticket" button/form. 
    6. When opening a new ticket, the customer can provide: 
        ◦ Subject (required) 
        ◦ Department/Category (optional, e.g., "Order Inquiry," "Technical Issue," "Billing") 
        ◦ Associated Order ID (optional, dropdown/search for their past orders) 
        ◦ Message/Description (required, rich text editor optional) 
        ◦ (Optional) Attachments (e.g., screenshots). 
    7. Clicking on an individual ticket in the list navigates to a detailed "Ticket Conversation" page. 
    8. The "Ticket Conversation" page displays: 
        ◦ Full ticket details (ID, Subject, Status, Submission Date). 
        ◦ A chronological log of messages/replies (customer and support agent). 
        ◦ An input field for the customer to add a new reply to an open ticket. 
        ◦ (Optional) Option to close the ticket if resolved by the customer. 
    9. Notifications (e.g., email) are sent to the customer when a support agent replies to their ticket. 
    10. All ticket management operations are secure and only accessible by the customer who created the ticket. 

Granular Tasks & Subtasks for Story 6.6:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.6.1: Implement "Support Tickets" Navigation & List Page 
            ▪ Subtask 6.6.1.1: Add a "Support Tickets" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.6.1.2: Create CustomerSupportTicketsPage component/route (e.g., /account/tickets). 
            ▪ Subtask 6.6.1.3: Design and implement a table or list layout to display ticket summaries (ID, Subject, Status, Dates). 
            ▪ Subtask 6.6.1.4: Implement pagination, sorting, and filtering controls for the ticket list. 
            ▪ Subtask 6.6.1.5: Add an "Open New Ticket" button. 
        ◦ Task 6.6.2: Implement "Open New Ticket" Form UI 
            ▪ Subtask 6.6.2.1: Create NewTicketForm component (can be a modal or dedicated page, e.g., /account/tickets/new). 
            ▪ Subtask 6.6.2.2: Implement input fields for Subject, Message/Description (textarea). 
            ▪ Subtask 6.6.2.3: Implement dropdowns for Department/Category and Associated Order ID (populating from GET /api/customer/orders from 6.3). 
            ▪ Subtask 6.6.2.4: (Optional) Implement file input for attachments. 
            ▪ Subtask 6.6.2.5: Add "Submit Ticket" and "Cancel" buttons. 
        ◦ Task 6.6.3: Implement "Ticket Conversation" Page UI 
            ▪ Subtask 6.6.3.1: Create CustomerTicketDetailsPage component/route (e.g., /account/tickets/:ticketId). 
            ▪ Subtask 6.6.3.2: Display full ticket details (ID, Subject, Status, Dates, initial message). 
            ▪ Subtask 6.6.3.3: Display chronological list of messages/replies (distinguishing customer vs. agent replies). 
            ▪ Subtask 6.6.3.4: Implement an input field/textarea for adding a new reply (only if ticket is open/pending customer reply). 
            ▪ Subtask 6.6.3.5: (Optional) Implement "Close Ticket" button for customer. 
        ◦ Task 6.6.4: Implement Client-Side Form Validation 
            ▪ Subtask 6.6.4.1: Validate required fields (Subject, Message). 
        ◦ Task 6.6.5: Frontend API Integration: Fetch Tickets 
            ▪ Subtask 6.6.5.1: Create service/hook to call GET /api/customer/tickets (for list). 
            ▪ Subtask 6.6.5.2: Create service/hook to call GET /api/customer/tickets/:ticketId (for details). 
            ▪ Subtask 6.6.5.3: Handle loading states and errors. 
        ◦ Task 6.6.6: Frontend API Integration: Submit New Ticket 
            ▪ Subtask 6.6.6.1: Create service/hook to call POST /api/customer/tickets. 
            ▪ Subtask 6.6.6.2: Send subject, message, associated order ID, etc. 
            ▪ Subtask 6.6.6.3: Handle file uploads for attachments (if implemented). 
            ▪ Subtask 6.6.6.4: On success, redirect to ticket list/details and show notification. 
        ◦ Task 6.6.7: Frontend API Integration: Reply to Ticket 
            ▪ Subtask 6.6.7.1: Create service/hook to call POST /api/customer/tickets/:ticketId/reply. 
            ▪ Subtask 6.6.7.2: Send the customer's reply message. 
            ▪ Subtask 6.6.7.3: On success, append reply to conversation and update status if needed. 
        ◦ Task 6.6.8: Frontend API Integration: Close Ticket (Optional) 
            ▪ Subtask 6.6.8.1: Create service/hook to call PUT /api/customer/tickets/:ticketId/close. 
    • Backend Tasks (Customer API & Support System Integration):
        ◦ Task 6.6.9: Design Support Ticket Data Model 
            ▪ Subtask 6.6.9.1: Define MongoDB schema for Ticket collection. Include: ticketId (auto-generated unique), customerId (ref to User), subject, description, status (enum), department (enum), associatedOrderId (ref to Order, optional), createdAt, updatedAt. 
            ▪ Subtask 6.6.9.2: Sub-document array for messages: sender (customer/agent), message, timestamp. 
            ▪ Subtask 6.6.9.3: (Optional) Array for attachments: fileName, url, mimeType. 
        ◦ Task 6.6.10: Create Get Customer Tickets API Endpoint 
            ▪ Subtask 6.6.10.1: Design and implement GET /api/customer/tickets. 
            ▪ Subtask 6.6.10.2: Apply customer authentication. 
            ▪ Subtask 6.6.10.3: Query Ticket collection, filtering by authenticated user's ID. 
            ▪ Subtask 6.6.10.4: Implement pagination, sorting, and filtering. 
            ▪ Subtask 6.6.10.5: Return ticket summaries. 
        ◦ Task 6.6.11: Create Get Single Ticket Details API Endpoint 
            ▪ Subtask 6.6.11.1: Design and implement GET /api/customer/tickets/:ticketId. 
            ▪ Subtask 6.6.11.2: Apply customer authentication. 
            ▪ Subtask 6.6.11.3: Fetch Ticket document, ensuring it belongs to the authenticated user. 
            ▪ Subtask 6.6.11.4: Return full ticket details including message history. 
        ◦ Task 6.6.12: Create Submit New Ticket API Endpoint 
            ▪ Subtask 6.6.12.1: Design and implement POST /api/customer/tickets. 
            ▪ Subtask 6.6.12.2: Apply customer authentication. 
            ▪ Subtask 6.6.12.3: Implement server-side validation for subject, message. 
            ▪ Subtask 6.6.12.4: Create new Ticket document, setting customerId from authenticated user. 
            ▪ Subtask 6.6.12.5: (If attachments) Implement file upload and store URLs. 
            ▪ Subtask 6.6.12.6: Send internal notification to support team (e.g., email, Slack). 
            ▪ Subtask 6.6.12.7: Audit Logging: Log new ticket creation. 
        ◦ Task 6.6.13: Create Add Reply to Ticket API Endpoint 
            ▪ Subtask 6.6.13.1: Design and implement POST /api/customer/tickets/:ticketId/reply. 
            ▪ Subtask 6.6.13.2: Apply customer authentication. 
            ▪ Subtask 6.6.13.3: Validate ticketId belongs to the authenticated user and is not closed/resolved. 
            ▪ Subtask 6.6.13.4: Add new message to the messages array in the Ticket document. 
            ▪ Subtask 6.6.13.5: Update status to "Pending Agent Reply" if necessary. 
            ▪ Subtask 6.6.13.6: Send internal notification to support team. 
            ▪ Subtask 6.6.13.7: Audit Logging: Log new reply. 
        ◦ Task 6.6.14: Create Close Ticket API Endpoint (Optional) 
            ▪ Subtask 6.6.14.1: Design and implement PUT /api/customer/tickets/:ticketId/close. 
            ▪ Subtask 6.6.14.2: Apply customer authentication. 
            ▪ Subtask 6.6.14.3: Validate ticketId belongs to the user and is open. 
            ▪ Subtask 6.6.14.4: Update status to "Closed." 
    • Backend Tasks (Admin Support Interface - New Epic or part of existing Admin):
        ◦ Task 6.6.15: Support Agent Interface (Admin Panel) 
            ▪ Subtask 6.6.15.1: (Consider creating a new "Support Management" section in Admin, or extend 5.1). Implement a view for administrators to see all tickets, filter by status, and reply to them. This might be a separate Epic, but crucial for the other side of the support system. 
    • Email Notification System Integration:
        ◦ Task 6.6.16: Implement Customer Email Notifications 
            ▪ Subtask 6.6.16.1: When an agent replies to a ticket (from Task 6.6.15), trigger an email notification to the customer with the reply content and a link to the ticket. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.6.17: Strict Authorization for Ticket Data 
            ▪ Subtask 6.6.17.1: Ensure a customer can only access their own tickets. 
            ▪ Subtask 6.6.17.2: Robust server-side validation and sanitization of all user-submitted text fields (subject, message) to prevent injection attacks (XSS). 
    • Testing Tasks:
        ◦ Task 6.6.18: Write Unit Tests 
            ▪ Subtask 6.6.18.1: Unit tests for frontend form validation. 
            ▪ Subtask 6.6.18.2: Unit tests for backend ticket creation, reply addition, status updates, and user ownership checks. 
        ◦ Task 6.6.19: Write Integration Tests 
            ▪ Subtask 6.6.19.1: Register a test user. Log in. 
            ▪ Subtask 6.6.19.2: Call POST /api/customer/tickets to submit a new ticket. Verify ticket creation. 
            ▪ Subtask 6.6.19.3: Call GET /api/customer/tickets to get the list. Verify the new ticket appears. 
            ▪ Subtask 6.6.19.4: Call GET /api/customer/tickets/:ticketId for the ticket. Verify details. 
            ▪ Subtask 6.6.19.5: Call POST /api/customer/tickets/:ticketId/reply to add a reply. Verify message is added and status updates. 
            ▪ Subtask 6.6.19.6: Test attempts to access/modify another user's ticket (should fail). 
            ▪ Subtask 6.6.19.7: Test unauthenticated access. 
        ◦ Task 6.6.20: Manual End-to-End Testing 
            ▪ Subtask 6.6.20.1: Log in as a customer. Navigate to "My Account" -> "Support Tickets." 
            ▪ Subtask 6.6.20.2: Click "Open New Ticket." Fill out the form, associate with an order. Submit. Verify it appears in the list. 
            ▪ Subtask 6.6.20.3: Click on the newly created ticket. Verify all details and the initial message. 
            ▪ Subtask 6.6.20.4: (Requires Admin side) Have an admin reply to the ticket. Verify customer receives email notification. 
            ▪ Subtask 6.6.20.5: Go back to the ticket details page. Verify the agent's reply is displayed. 
            ▪ Subtask 6.6.20.6: Add a new reply from the customer side. Verify it appears in the conversation. 
            ▪ Subtask 6.6.20.7: (Optional) Test closing the ticket from the customer side.
Epic 6: Customer Account Management Enhancements
Story 6.7: Loyalty Program Dashboard
Story: As a registered customer, if the store has a loyalty program, I want to be able to view my current points balance, tier status, recent points activity, and any available rewards or benefits so that I can understand my participation in the program and maximize my rewards.
Acceptance Criteria:
    1. A "Loyalty Program" link is available in the "My Account" navigation (only if the program is active). 
    2. Clicking the "Loyalty Program" link takes the customer to their dedicated dashboard. 
    3. The dashboard displays: 
        ◦ Current points balance. 
        ◦ Current tier status (if tiered). 
        ◦ Progress towards the next tier (if applicable). 
        ◦ A history of recent points activity (earned, spent, adjusted). 
        ◦ A list of available rewards or benefits (e.g., discounts, free shipping). 
        ◦ (Optional) A visual representation of their tier progress (e.g., a progress bar). 
        ◦ (Optional) Information on how to earn more points. 
    4. The points activity history displays: 
        ◦ Date 
        ◦ Description (e.g., "Order #1234 - Points Earned," "Redeemed 100 points for discount") 
        ◦ Points Change (+ or -) 
    5. The rewards list displays: 
        ◦ Reward Description 
        ◦ Points Required 
        ◦ (Optional) Expiry Date 
        ◦ (Optional) "Redeem" button (if applicable). 
    6. All loyalty program information is securely retrieved and displayed only to the authenticated customer. 

Granular Tasks & Subtasks for Story 6.7:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.7.1: Implement "Loyalty Program" Navigation Link 
            ▪ Subtask 6.7.1.1: Add a "Loyalty Program" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.7.1.2: Conditionally render this link based on whether the loyalty program is enabled for the store. 
        ◦ Task 6.7.2: Implement "Loyalty Program Dashboard" UI 
            ▪ Subtask 6.7.2.1: Create CustomerLoyaltyDashboardPage component/route (e.g., /account/loyalty). 
            ▪ Subtask 6.7.2.2: Design a layout to display all required information (points balance, tier status, progress, activity, rewards). 
            ▪ Subtask 6.7.2.3: Use clear visual elements (e.g., progress bars, tables) to present the data. 
            ▪ Subtask 6.7.2.4: Implement a table for points activity history. 
            ▪ Subtask 6.7.2.5: Implement a list or grid for available rewards. 
            ▪ Subtask 6.7.2.6: (Optional) Implement a "Redeem" button for rewards that can be directly redeemed. 
        ◦ Task 6.7.3: Frontend API Integration: Fetch Loyalty Data 
            ▪ Subtask 6.7.3.1: Create service/hook to call GET /api/customer/loyalty. 
            ▪ Subtask 6.7.3.2: This endpoint should return all necessary data: points balance, tier, progress, activity, rewards. 
            ▪ Subtask 6.7.3.3: Handle loading states and errors. 
    • Backend Tasks (Customer API & Loyalty System Integration):
        ◦ Task 6.7.4: Design Loyalty Data Model (if separate from User) 
            ▪ Subtask 6.7.4.1: Decide whether loyalty data is stored directly on the User document or in a separate Loyalty collection. 
            ▪ Subtask 6.7.4.2: If separate, the Loyalty collection should have a customerId (ref to User), points, tier, activity (array of objects), and potentially a relationship to a Reward collection. 
        ◦ Task 6.7.5: Create Get Customer Loyalty Data API Endpoint 
            ▪ Subtask 6.7.5.1: Design and implement GET /api/customer/loyalty. 
            ▪ Subtask 6.7.5.2: Apply customer authentication. 
            ▪ Subtask 6.7.5.3: Fetch the authenticated user's loyalty data (either from User document or Loyalty collection). 
            ▪ Subtask 6.7.5.4: Return all necessary information for the dashboard. 
        ◦ Task 6.7.6: (Optional) Implement Reward Redemption API Endpoint 
            ▪ Subtask 6.7.6.1: If rewards can be redeemed directly from the dashboard, implement POST /api/customer/loyalty/rewards/:rewardId. 
            ▪ Subtask 6.7.6.2: Validate sufficient points and apply the reward (e.g., create a discount code, apply free shipping). 
            ▪ Subtask 6.7.6.3: Update points balance and activity log. 
    • Core Application Integration Tasks:
        ◦ Task 6.7.7: Ensure Loyalty Points are Awarded Correctly 
            ▪ Subtask 6.7.7.1: Integrate loyalty point awarding logic into the order completion process (after successful payment). 
            ▪ Subtask 6.7.7.2: Ensure points are correctly calculated based on order total or other rules. 
            ▪ Subtask 6.7.7.3: Update user's points balance and activity log. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.7.8: Secure Loyalty Data 
            ▪ Subtask 6.7.8.1: Ensure only the authenticated user can access their own loyalty data. 
            ▪ Subtask 6.7.8.2: Protect against manipulation of points or reward redemption. 
    • Testing Tasks:
        ◦ Task 6.7.9: Write Unit Tests 
            ▪ Subtask 6.7.9.1: Unit tests for backend logic of calculating and awarding points. 
            ▪ Subtask 6.7.9.2: Unit tests for reward redemption (if implemented). 
        ◦ Task 6.7.10: Write Integration Tests 
            ▪ Subtask 6.7.10.1: Register a test user. Simulate earning points (e.g., placing an order). 
            ▪ Subtask 6.7.10.2: Log in as the user. Call GET /api/customer/loyalty. Verify data is correct. 
            ▪ Subtask 6.7.10.3: (If redemption) Test redeeming a reward. Verify points are deducted and the reward is applied. 
            ▪ Subtask 6.7.10.4: Test unauthenticated access. 
        ◦ Task 6.7.11: Manual End-to-End Testing 
            ▪ Subtask 6.7.11.1: Log in as a customer. Navigate to "My Account" -> "Loyalty Program." 
            ▪ Subtask 6.7.11.2: Verify points balance, tier, and activity history are displayed. 
            ▪ Subtask 6.7.11.3: Simulate earning points (e.g., place a test order). Verify points balance updates. 
            ▪ Subtask 6.7.11.4: (If redemption) Test redeeming a reward. Verify points are deducted and the reward is applied (e.g., a discount appears in the cart). 

Epic 6: Customer Account Management Enhancements
Story 6.8: Email Subscriptions Management
Story: As a registered customer, I want to be able to view and manage my email marketing subscriptions (e.g., newsletters, promotional offers, order updates) so that I can control the types of emails I receive from the store.
Acceptance Criteria:
    1. An "Email Preferences" or "Subscriptions" link is available in the "My Account" navigation. 
    2. Clicking the "Email Preferences" link takes the customer to a page displaying their current subscription status for various email types. 
    3. For each identifiable email subscription type (e.g., "General Newsletter," "Promotional Offers," "Product Announcements"): 
        ◦ The current subscription status (subscribed/unsubscribed) is clearly displayed. 
        ◦ There is an option (e.g., checkbox, toggle) to subscribe or unsubscribe. 
    4. There is an option to globally unsubscribe from all marketing emails. 
    5. (Crucial distinction): Core transactional emails (e.g., order confirmations, shipping updates, password reset) are not included in this management and are always sent regardless of marketing subscription status. This is clearly communicated to the customer. 
    6. Upon saving changes, a confirmation message is displayed. 
    7. Changes to subscriptions are immediately reflected in the backend marketing system. 
    8. All subscription management actions are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.8:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.8.1: Implement "Email Preferences" Navigation Link & Page 
            ▪ Subtask 6.8.1.1: Add an "Email Preferences" or "Subscriptions" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.8.1.2: Create CustomerEmailPreferencesPage component/route (e.g., /account/email-preferences). 
            ▪ Subtask 6.8.1.3: Design a layout to display a list of available subscription types. 
            ▪ Subtask 6.8.1.4: For each subscription type, implement a checkbox or toggle switch to indicate/change status. 
            ▪ Subtask 6.8.1.5: Add a global "Unsubscribe from all marketing emails" checkbox/button. 
            ▪ Subtask 6.8.1.6: Clearly state that transactional emails are not affected by these settings. 
            ▪ Subtask 6.8.1.7: Add "Save Changes" and "Cancel" buttons. 
        ◦ Task 6.8.2: Frontend API Integration: Fetch Current Subscriptions 
            ▪ Subtask 6.8.2.1: Create service/hook to call GET /api/customer/email-preferences. 
            ▪ Subtask 6.8.2.2: Pre-populate the UI with the fetched subscription statuses. 
        ◦ Task 6.8.3: Frontend API Integration: Update Subscriptions 
            ▪ Subtask 6.8.3.1: Create service/hook to call PUT /api/customer/email-preferences. 
            ▪ Subtask 6.8.3.2: Send the updated subscription preferences (e.g., an object with newsletter: true, promotions: false). 
            ▪ Subtask 6.8.3.3: Display success/error messages. 
    • Backend Tasks (Customer API & Marketing System Integration):
        ◦ Task 6.8.4: Update User Model for Email Preferences 
            ▪ Subtask 6.8.4.1: Modify User schema to include subscription preferences, e.g., emailPreferences: { newsletter: { type: Boolean, default: true }, promotions: { type: Boolean, default: true }, ... }. 
            ▪ Subtask 6.8.4.2: Alternatively, integrate with a dedicated marketing automation platform (e.g., Mailchimp, SendGrid Marketing Campaigns). 
        ◦ Task 6.8.5: Create Get Email Preferences API Endpoint 
            ▪ Subtask 6.8.5.1: Design and implement GET /api/customer/email-preferences. 
            ▪ Subtask 6.8.5.2: Apply customer authentication middleware. 
            ▪ Subtask 6.8.5.3: Fetch the authenticated user's stored email preferences. 
            ▪ Subtask 6.8.5.4: Return the preferences. 
        ◦ Task 6.8.6: Create Update Email Preferences API Endpoint 
            ▪ Subtask 6.8.6.1: Design and implement PUT /api/customer/email-preferences. 
            ▪ Subtask 6.8.6.2: Apply customer authentication. 
            ▪ Subtask 6.8.6.3: Receive the updated preferences object from the frontend. 
            ▪ Subtask 6.8.6.4: Validate the incoming preferences. 
            ▪ Subtask 6.8.6.5: Update the emailPreferences in the authenticated user's document. 
            ▪ Subtask 6.8.6.6: Integration with Marketing Platform (if applicable): 
                • Subtask 6.8.6.6.1: Call the external marketing automation API (e.g., Mailchimp API) to update the subscriber's lists/groups based on the new preferences. This might involve adding/removing from lists or updating contact properties. 
            ▪ Subtask 6.8.6.7: Audit Logging: Log email preference changes. 
    • Core Application Integration Tasks:
        ◦ Task 6.8.7: Implement Opt-Out from Unsubscribe Link in Emails 
            ▪ Subtask 6.8.7.1: Ensure all marketing emails include a direct unsubscribe link that, when clicked, updates the user's preferences via an unauthenticated, token-based endpoint (or redirects to the preferences page with pre-filled options). 
            ▪ Subtask 6.8.7.2: This usually involves the marketing platform's own unsubscribe mechanism which then syncs back to your DB or is the primary source of truth. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.8.8: Secure Email Preference Data 
            ▪ Subtask 6.8.8.1: Ensure only the authenticated user can manage their own email preferences. 
            ▪ Subtask 6.8.8.2: Handle cases where the customer's email address itself changes (from 6.1) and ensure consistency in the marketing platform. 
    • Testing Tasks:
        ◦ Task 6.8.9: Write Unit Tests 
            ▪ Subtask 6.8.9.1: Unit tests for backend logic of updating email preferences on the user document. 
            ▪ Subtask 6.8.9.2: Unit tests for integration calls to the marketing platform API (mocking the external API). 
        ◦ Task 6.8.10: Write Integration Tests 
            ▪ Subtask 6.8.10.1: Register a test user. Log in. 
            ▪ Subtask 6.8.10.2: Call GET /api/customer/email-preferences. Verify default/current preferences are returned. 
            ▪ Subtask 6.8.10.3: Call PUT /api/customer/email-preferences to change preferences (e.g., unsubscribe from newsletter, subscribe to promotions). Verify the changes are saved in the database. 
            ▪ Subtask 6.8.10.4: (If marketing platform integration) Verify that the external marketing platform API was called correctly with the updated preferences. 
            ▪ Subtask 6.8.10.5: Test unauthenticated access. 
        ◦ Task 6.8.11: Manual End-to-End Testing 
            ▪ Subtask 6.8.11.1: Log in as a customer. Navigate to "My Account" -> "Email Preferences." 
            ▪ Subtask 6.8.11.2: View current subscription statuses. 
            ▪ Subtask 6.8.11.3: Change a subscription (e.g., unsubscribe from newsletter). Save changes. Verify success message and updated UI. 
            ▪ Subtask 6.8.11.4: (Requires email sending setup) Verify that after unsubscribing, the customer no longer receives marketing emails (e.g., send a test newsletter campaign). 
            ▪ Subtask 6.8.11.5: Test the "Unsubscribe from all marketing emails" option. 
            ▪ Subtask 6.8.11.6: Verify that transactional emails (like order confirmation) are still received regardless of marketing preferences.
Epic 6: Customer Account Management Enhancements
Story 6.9: Security Features (2FA, Login Activity)
Story: As a registered customer, I want to be able to enable/disable Two-Factor Authentication (2FA) for my account and view a log of my recent login activity so that I can add an extra layer of security and monitor for suspicious access.
Acceptance Criteria:
    1. A "Security" link is available in the "My Account" navigation. 
    2. Clicking the "Security" link takes the customer to a page dedicated to account security settings. 
    3. The "Security" page prominently displays the current 2FA status (Enabled/Disabled). 
    4. Two-Factor Authentication (2FA) Setup/Management: 
        ◦ Enable 2FA: The customer can initiate a process to enable 2FA, which involves: 
            ▪ Choosing an authentication method (e.g., authenticator app - TOTP, SMS verification - if supported). 
            ▪ For authenticator app: Displaying a QR code and a secret key for manual entry. 
            ▪ Prompting the user to enter a verification code from their authenticator app to confirm setup. 
            ▪ Generating and displaying a set of recovery codes to the user, with instructions to save them securely. 
        ◦ Disable 2FA: The customer can disable 2FA after providing their password and/or a current 2FA code for verification. 
        ◦ Manage 2FA: Options to generate new recovery codes (invalidating old ones) or reset 2FA (if device lost, typically involving a support process or email verification). 
    5. Login Activity Log: 
        ◦ The "Security" page displays a chronological list of recent login attempts/sessions. 
        ◦ For each entry, the following details are shown: 
            ▪ Date and Time of login. 
            ▪ IP Address. 
            ▪ Estimated Location (city/country based on IP, if lookup is implemented). 
            ▪ Device/Browser (User Agent string). 
            ▪ Status (e.g., "Successful," "Failed"). 
        ◦ The login activity log is paginated. 
    6. Upon successful 2FA setup or change, a confirmation message is displayed. 
    7. If 2FA is enabled, login attempts require both password and a 2FA code. 
    8. Relevant security events (e.g., failed 2FA attempts, 2FA status changes) are logged securely in the backend. 

Granular Tasks & Subtasks for Story 6.9:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.9.1: Implement "Security" Navigation Link & Page 
            ▪ Subtask 6.9.1.1: Add a "Security" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.9.1.2: Create CustomerSecurityPage component/route (e.g., /account/security). 
            ▪ Subtask 6.9.1.3: Design a layout for 2FA management section and Login Activity Log section. 
        ◦ Task 6.9.2: Implement 2FA Setup UI (Authenticator App - TOTP) 
            ▪ Subtask 6.9.2.1: Display current 2FA status (Enabled/Disabled). 
            ▪ Subtask 6.9.2.2: Implement an "Enable 2FA" button. 
            ▪ Subtask 6.9.2.3: Implement a step-by-step wizard/modal for 2FA setup: 
                • Step 1: Display instructions, QR code (generated from secret), and secret key. 
                • Step 2: Input field for verification code from authenticator app. 
                • Step 3: Display recovery codes with strong warning and instructions to save. 
                • Subtask 6.9.2.4: Implement "Disable 2FA" button, requiring password and 2FA code. 
        ◦ Task 6.9.3: Implement Login Activity Log UI 
            ▪ Subtask 6.9.3.1: Design and implement a table to display recent login entries. 
            ▪ Subtask 6.9.3.2: Display Date/Time, IP Address, Location (if available), Device/Browser, Status. 
            ▪ Subtask 6.9.3.3: Implement pagination for the log. 
        ◦ Task 6.9.4: Frontend API Integration: 2FA Management 
            ▪ Subtask 6.9.4.1: Create service/hook for POST /api/customer/security/2fa/generate-secret (to get QR code data). 
            ▪ Subtask 6.9.4.2: Create service/hook for POST /api/customer/security/2fa/verify-enable (to confirm setup with user's code). 
            ▪ Subtask 6.9.4.3: Create service/hook for POST /api/customer/security/2fa/disable (requires password/code). 
            ▪ Subtask 6.9.4.4: Create service/hook for GET /api/customer/security/2fa/recovery-codes (to view/generate new codes - careful security, only if strict verification is done). 
        ◦ Task 6.9.5: Frontend API Integration: Fetch Login Activity 
            ▪ Subtask 6.9.5.1: Create service/hook to call GET /api/customer/security/login-activity. 
            ▪ Subtask 6.9.5.2: Display fetched login entries. 
    • Backend Tasks (Customer API & Security Service):
        ◦ Task 6.9.6: Update User Model for 2FA & Login Activity 
            ▪ Subtask 6.9.6.1: Add has2FAEnabled: { type: Boolean, default: false } to User schema. 
            ▪ Subtask 6.9.6.2: Add twoFactorSecret: { type: String, select: false } to User schema (should be encrypted at rest). 
            ▪ Subtask 6.9.6.3: Add twoFactorRecoveryCodes: [{ type: String, select: false }] to User schema (hashed and encrypted at rest). 
            ▪ Subtask 6.9.6.4: Add loginActivity: [{ ipAddress: String, location: String, userAgent: String, timestamp: Date, status: String }] to User schema. 
        ◦ Task 6.9.7: Implement 2FA Secret Generation Endpoint 
            ▪ Subtask 6.9.7.1: Design and implement POST /api/customer/security/2fa/generate-secret. 
            ▪ Subtask 6.9.7.2: Apply customer authentication. 
            ▪ Subtask 6.9.7.3: Generate a new TOTP secret (e.g., using speakeasy or otplib library). 
            ▪ Subtask 6.9.7.4: Store the encrypted secret temporarily on the user session or in a pending state. 
            ▪ Subtask 6.9.7.5: Return the secret and QR code URL to the frontend. 
        ◦ Task 6.9.8: Implement 2FA Verification and Enable Endpoint 
            ▪ Subtask 6.9.8.1: Design and implement POST /api/customer/security/2fa/verify-enable. 
            ▪ Subtask 6.9.8.2: Apply customer authentication. 
            ▪ Subtask 6.9.8.3: Receive the code from the user. 
            ▪ Subtask 6.9.8.4: Verify the code against the user's pending 2FA secret. 
            ▪ Subtask 6.9.8.5: If successful, generate unique recoveryCodes (hash and encrypt them). 
            ▪ Subtask 6.9.8.6: Update User document: set has2FAEnabled: true, save encrypted twoFactorSecret and twoFactorRecoveryCodes. 
            ▪ Subtask 6.9.8.7: Return the raw (unhashed) recovery codes to the user once. 
            ▪ Subtask 6.9.8.8: Audit Logging: Log 2FA enabled. 
        ◦ Task 6.9.9: Implement 2FA Disable Endpoint 
            ▪ Subtask 6.9.9.1: Design and implement POST /api/customer/security/2fa/disable. 
            ▪ Subtask 6.9.9.2: Apply customer authentication. 
            ▪ Subtask 6.9.9.3: Receive password and 2FACode. 
            ▪ Subtask 6.9.9.4: Verify password and 2FACode. 
            ▪ Subtask 6.9.9.5: Update User document: set has2FAEnabled: false, clear twoFactorSecret and twoFactorRecoveryCodes. 
            ▪ Subtask 6.9.9.6: Audit Logging: Log 2FA disabled. 
        ◦ Task 6.9.10: Implement Login Activity Logging Middleware/Service 
            ▪ Subtask 6.9.10.1: Create a middleware or service that logs every successful and failed login attempt. 
            ▪ Subtask 6.9.10.2: Capture IP address, user agent, timestamp, and success/failure status. 
            ▪ Subtask 6.9.10.3: Store this activity in the User document's loginActivity array (consider capping history length). 
            ▪ Subtask 6.9.10.4: Integrate with a geo-IP lookup service (e.g., MaxMind GeoLite2) to get estimated location from IP. 
        ◦ Task 6.9.11: Create Get Login Activity API Endpoint 
            ▪ Subtask 6.9.11.1: Design and implement GET /api/customer/security/login-activity. 
            ▪ Subtask 6.9.11.2: Apply customer authentication. 
            ▪ Subtask 6.9.11.3: Fetch the authenticated user's loginActivity array. 
            ▪ Subtask 6.9.11.4: Implement pagination. 
            ▪ Subtask 6.9.11.5: Return the log entries. 
        ◦ Task 6.9.12: Modify Login Endpoint for 2FA 
            ▪ Subtask 6.9.12.1: Update the existing POST /api/auth/login endpoint. 
            ▪ Subtask 6.9.12.2: After successful password verification: 
                • If has2FAEnabled is true, return a "2FA_REQUIRED" status/flag in the response. Do not issue a full JWT yet. 
                • If 2FA is not enabled, proceed with standard login (issue JWT). 
            ▪ Subtask 6.9.12.3: Create a new endpoint POST /api/auth/2fa-verify that receives the 2FA code and issues the full JWT if valid. 
    • Security & Data Integrity Tasks (Highly Critical!):
        ◦ Task 6.9.13: Secure 2FA Secrets & Recovery Codes 
            ▪ Subtask 6.9.13.1: Encrypt twoFactorSecret and twoFactorRecoveryCodes at rest in the database. 
            ▪ Subtask 6.9.13.2: Ensure recovery codes are only displayed once to the user during setup. Never retrieve them again via API. 
            ▪ Subtask 6.9.13.3: Implement brute-force protection for 2FA code verification. 
        ◦ Task 6.9.14: Strong Authentication & Authorization 
            ▪ Subtask 6.9.14.1: Ensure all security-related endpoints are protected by robust customer authentication. 
            ▪ Subtask 6.9.14.2: Prevent a user from accessing or modifying another user's security settings or login activity. 
        ◦ Task 6.9.15: Server-Side Time Sync 
            ▪ Subtask 6.9.15.1: Ensure the server's time is synchronized with NTP for accurate TOTP verification. 
    • Testing Tasks:
        ◦ Task 6.9.16: Write Unit Tests 
            ▪ Subtask 6.9.16.1: Unit tests for TOTP secret generation, verification, and recovery code hashing. 
            ▪ Subtask 6.9.16.2: Unit tests for login activity logging (capturing IP, UA). 
        ◦ Task 6.9.17: Write Integration Tests 
            ▪ Subtask 6.9.17.1: Register a test user. 
            ▪ Subtask 6.9.17.2: Log in. Call POST /api/customer/security/2fa/generate-secret. Verify secret and QR data. 
            ▪ Subtask 6.9.17.3: Simulate 2FA setup: Call POST /api/customer/security/2fa/verify-enable with valid/invalid codes. Verify 2FA status update and recovery codes returned. 
            ▪ Subtask 6.9.17.4: Test login flow with 2FA enabled (initial password, then separate 2FA code verification). 
            ▪ Subtask 6.9.17.5: Test POST /api/customer/security/2fa/disable with valid/invalid password/code. 
            ▪ Subtask 6.9.17.6: Perform several successful and failed logins. Call GET /api/customer/security/login-activity. Verify log entries and pagination. 
            ▪ Subtask 6.9.17.7: Test unauthorized access to all security endpoints. 
        ◦ Task 6.9.18: Manual End-to-End Testing 
            ▪ Subtask 6.9.18.1: Log in as a customer. Navigate to "My Account" -> "Security." 
            ▪ Subtask 6.9.18.2: Enable 2FA: Follow the steps, use an authenticator app (e.g., Google Authenticator) to scan the QR code, enter the verification code. Verify setup is successful and recovery codes are displayed. Crucially, save recovery codes in a real test scenario. 
            ▪ Subtask 6.9.18.3: Log out. Attempt to log in. Verify 2FA prompt appears after password. Enter 2FA code. Verify successful login. 
            ▪ Subtask 6.9.18.4: Attempt to log in with incorrect 2FA code. 
            ▪ Subtask 6.9.18.5: Disable 2FA: Provide password and 2FA code. Verify 2FA is disabled. 
            ▪ Subtask 6.9.18.6: View Login Activity: Verify recent logins (successful/failed) are displayed with correct details. Test IP location lookup accuracy. 
            ▪ Subtask 6.9.18.7: (If implemented) Use a recovery code to log in if 2FA device is "lost".
Epic 6: Customer Account Management Enhancements
Story 6.10: Notifications/Alerts (Price Drops, Back in Stock)
Story: As a registered customer, I want to be able to subscribe to email alerts for specific products, such as price drops or when an out-of-stock item becomes available, so that I don't miss opportunities to purchase items I'm interested in.
Acceptance Criteria:
    1. On a product detail page, for a logged-in customer: 
        ◦ If the product is out of stock, a "Notify Me When Back in Stock" button/link is available. 
        ◦ If the product is in stock, a "Notify Me of Price Drops" button/link is available. 
    2. Clicking these buttons subscribes the customer to the respective alert type for that product. 
    3. Immediate visual feedback is provided (e.g., button changes to "Subscribed," notification). 
    4. A "My Alerts" or "Notifications" section is available in the "My Account" navigation. 
    5. The "My Alerts" page lists all active alerts the customer has subscribed to, displaying: 
        ◦ Product Image 
        ◦ Product Name 
        ◦ Alert Type (e.g., "Back in Stock," "Price Drop") 
        ◦ Current Status (e.g., "Active," "Triggered," "Cancelled") 
        ◦ Date Subscribed 
        ◦ Option to unsubscribe from individual alerts. 
    6. When an out-of-stock product becomes available, all subscribed customers receive an email notification. 
    7. When a product's price drops, all subscribed customers receive an email notification (this might require tracking price history). 
    8. Alerts are automatically deactivated after being triggered and sent (e.g., a "back in stock" alert triggers once). 
    9. All alert management actions are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.10:
    • Frontend Tasks (Storefront & Customer Account Panel):
        ◦ Task 6.10.1: Implement "Notify Me" Buttons on Product Page 
            ▪ Subtask 6.10.1.1: Modify ProductDetailPage (and potentially Quick View modals) to include conditional "Notify Me" buttons. 
            ▪ Subtask 6.10.1.2: If product.stock === 0, display "Notify Me When Back in Stock." 
            ▪ Subtask 6.10.1.3: If product.stock > 0, display "Notify Me of Price Drops." 
            ▪ Subtask 6.10.1.4: If the customer is already subscribed to an alert for that product, change button text/state (e.g., "Subscribed - Cancel Alert"). 
            ▪ Subtask 6.10.1.5: Ensure these buttons are only visible/active for logged-in users. 
            ▪ Subtask 6.10.1.6: Implement client-side calls to relevant backend APIs for subscription/unsubscription. 
            ▪ Subtask 6.10.1.7: Provide immediate visual feedback (toast notification, button state change). 
        ◦ Task 6.10.2: Implement "My Alerts" Navigation Link & Page 
            ▪ Subtask 6.10.2.1: Add a "My Alerts" or "Notifications" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.10.2.2: Create CustomerAlertsPage component/route (e.g., /account/alerts). 
            ▪ Subtask 6.10.2.3: Design and implement a table or list layout to display active alerts. 
            ▪ Subtask 6.10.2.4: For each alert, display Product Image, Name, Alert Type, Status, Date Subscribed, and an "Unsubscribe" button. 
            ▪ Subtask 6.10.2.5: Handle empty alerts state. 
        ◦ Task 6.10.3: Frontend API Integration: Subscribe/Unsubscribe to Alerts 
            ▪ Subtask 6.10.3.1: Create service/hook for POST /api/customer/alerts/subscribe (sends productId, alertType). 
            ▪ Subtask 6.10.3.2: Create service/hook for DELETE /api/customer/alerts/:alertId (to unsubscribe from "My Alerts" page). 
        ◦ Task 6.10.4: Frontend API Integration: Fetch Current Alerts 
            ▪ Subtask 6.10.4.1: Create service/hook to call GET /api/customer/alerts. 
            ▪ Subtask 6.10.4.2: Display fetched alerts with product details. 
    • Backend Tasks (Customer API & Alert Management Service):
        ◦ Task 6.10.5: Design Alert Data Model 
            ▪ Subtask 6.10.5.1: Create a new Alert collection schema. Include: 
                • customerId: ObjectId (ref to User) 
                • productId: ObjectId (ref to Product) 
                • alertType: String (enum: 'backInStock', 'priceDrop') 
                • status: String (enum: 'active', 'triggered', 'cancelled') 
                • originalPrice (for price drop alerts): Number 
                • subscribedAt: Date 
                • triggeredAt: Date (optional) 
        ◦ Task 6.10.6: Create Subscribe to Alert API Endpoint 
            ▪ Subtask 6.10.6.1: Design and implement POST /api/customer/alerts/subscribe. 
            ▪ Subtask 6.10.6.2: Apply customer authentication. 
            ▪ Subtask 6.10.6.3: Receive productId and alertType. 
            ▪ Subtask 6.10.6.4: Validate productId exists. 
            ▪ Subtask 6.10.6.5: Check if customer is already subscribed to that alert type for that product. 
            ▪ Subtask 6.10.6.6: Create a new Alert document. Store originalPrice if alertType is 'priceDrop'. 
            ▪ Subtask 6.10.6.7: Audit Logging: Log new alert subscription. 
        ◦ Task 6.10.7: Create Unsubscribe from Alert API Endpoint 
            ▪ Subtask 6.10.7.1: Design and implement DELETE /api/customer/alerts/:alertId. 
            ▪ Subtask 6.10.7.2: Apply customer authentication. 
            ▪ Subtask 6.10.7.3: Validate alertId belongs to the authenticated user. 
            ▪ Subtask 6.10.7.4: Update Alert document status to 'cancelled' (soft delete) or remove it. 
            ▪ Subtask 6.10.7.5: Audit Logging: Log alert unsubscription. 
        ◦ Task 6.10.8: Create Get Customer Alerts API Endpoint 
            ▪ Subtask 6.10.8.1: Design and implement GET /api/customer/alerts. 
            ▪ Subtask 6.10.8.2: Apply customer authentication. 
            ▪ Subtask 6.10.8.3: Query Alert collection for customerId and status: 'active'. 
            ▪ Subtask 6.10.8.4: Populate (join) product details (name, image, current price). 
            ▪ Subtask 6.10.8.5: Return the list of active alerts. 
    • Backend Tasks (Background Workers / Schedulers - Crucial for triggering):
        ◦ Task 6.10.9: Implement "Back in Stock" Alert Trigger 
            ▪ Subtask 6.10.9.1: Modify Product update logic (e.g., when stock changes from 0 to >0). 
            ▪ Subtask 6.10.9.2: On stock change, query Alert collection for 'backInStock' alerts for that productId with status: 'active'. 
            ▪ Subtask 6.10.9.3: For each found alert, trigger an email notification to the customer. 
            ▪ Subtask 6.10.9.4: Update the Alert status to 'triggered' and set triggeredAt timestamp. 
        ◦ Task 6.10.10: Implement "Price Drop" Alert Trigger (Scheduler) 
            ▪ Subtask 6.10.10.1: Develop a scheduled background job (e.g., daily, hourly). 
            ▪ Subtask 6.10.10.2: The job will query Alert collection for 'priceDrop' alerts with status: 'active'. 
            ▪ Subtask 6.10.10.3: For each alert, fetch the currentPrice of the productId. 
            ▪ Subtask 6.10.10.4: Compare currentPrice with originalPrice stored in the alert (or check against a threshold). 
            ▪ Subtask 6.10.10.5: If currentPrice is lower than originalPrice (or dropped by a certain percentage), trigger an email notification. 
            ▪ Subtask 6.10.10.6: Update the Alert status to 'triggered' and set triggeredAt timestamp. (Alternatively, for ongoing price drops, update originalPrice in alert and keep status 'active' and notify only if price drops further than the new originalPrice.) For MVP, a one-time trigger is simpler. 
        ◦ Task 6.10.11: Email Notification Templates & Sending 
            ▪ Subtask 6.10.11.1: Create email templates for "Back in Stock" and "Price Drop" alerts. 
            ▪ Subtask 6.10.11.2: Integrate with an email sending service (e.g., SendGrid, Mailgun) to send these notifications. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.10.12: Secure Alert Data 
            ▪ Subtask 6.10.12.1: Ensure only the authenticated user can manage their own alerts. 
            ▪ Subtask 6.10.12.2: Implement rate limiting on subscription requests to prevent abuse. 
    • Testing Tasks:
        ◦ Task 6.10.13: Write Unit Tests 
            ▪ Subtask 6.10.13.1: Unit tests for backend logic of creating/deleting alerts. 
            ▪ Subtask 6.10.13.2: Unit tests for alert triggering logic (stock change, price change scenarios). 
        ◦ Task 6.10.14: Write Integration Tests 
            ▪ Subtask 6.10.14.1: Register a test user. Create test products (one out of stock, one in stock). 
            ▪ Subtask 6.10.14.2: Log in. Subscribe to a "Back in Stock" alert for the OOS product. 
            ▪ Subtask 6.10.14.3: Subscribe to a "Price Drop" alert for the in-stock product. 
            ▪ Subtask 6.10.14.4: Call GET /api/customer/alerts. Verify subscribed alerts are listed. 
            ▪ Subtask 6.10.14.5: Simulate stock change for the OOS product (e.g., via admin API). Verify the "back in stock" email is triggered and alert status changes. 
            ▪ Subtask 6.10.14.6: Simulate a price drop for the in-stock product. Manually run the price drop cron job. Verify "price drop" email is triggered and alert status changes. 
            ▪ Subtask 6.10.14.7: Test unsubscribing from an alert. Verify its removal from the list. 
            ▪ Subtask 6.10.14.8: Test unauthorized access. 
        ◦ Task 6.10.15: Manual End-to-End Testing 
            ▪ Subtask 6.10.15.1: Log in as a customer. Find an out-of-stock product. Click "Notify Me When Back in Stock." Verify success message. 
            ▪ Subtask 6.10.15.2: Find an in-stock product. Click "Notify Me of Price Drops." Verify success message. 
            ▪ Subtask 6.10.15.3: Navigate to "My Account" -> "My Alerts." Verify both alerts are listed. 
            ▪ Subtask 6.10.15.4: (Requires Admin access) Change the stock of the out-of-stock product to > 0. Verify customer receives "Back in Stock" email. Check alert status on "My Alerts" page. 
            ▪ Subtask 6.10.15.5: (Requires Admin access) Change the price of the in-stock product to a lower value. Manually trigger the price drop checker. Verify customer receives "Price Drop" email. Check alert status. 
            ▪ Subtask 6.10.15.6: Unsubscribe from an active alert from the "My Alerts" page. Verify removal.
Epic 6: Customer Account Management Enhancements
Story 6.11: Saved Product Lists
Story: As a registered customer, I want to be able to create and manage multiple saved product lists (beyond just a wishlist), such as "Gifts for Mom," "Future Home Reno," or "Summer Reading List," so that I can organize products I'm interested in for different purposes or projects.
Acceptance Criteria:
    1. A "Saved Lists" or "My Lists" link is available in the "My Account" navigation. 
    2. Clicking the "Saved Lists" link takes the customer to a page where they can manage their lists. 
    3. The "Saved Lists" page displays a list of all lists created by the customer, showing: 
        ◦ List Name. 
        ◦ Number of Items in the list. 
        ◦ Date Created. 
        ◦ Options to: 
            ▪ View the list. 
            ▪ Edit the list name. 
            ▪ Delete the list. 
    4. The customer can create new lists, providing a name for each list. 
    5. When viewing a list, the customer sees a display of products in that list (similar to the wishlist), including: 
        ◦ Product Image. 
        ◦ Product Name. 
        ◦ Current Price. 
        ◦ Stock Availability. 
        ◦ "Add to Cart" button for each item. 
        ◦ "Remove" button for each item. 
    6. The customer can add products to a specific list from product detail pages (a dropdown to select the list). 
    7. The customer can remove items from a list. 
    8. All list management operations are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.11:
    • Frontend Tasks (Storefront & Customer Account Panel):
        ◦ Task 6.11.1: Implement "Saved Lists" Navigation Link & Page 
            ▪ Subtask 6.11.1.1: Add a "Saved Lists" or "My Lists" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.11.1.2: Create CustomerSavedListsPage component/route (e.g., /account/lists). 
            ▪ Subtask 6.11.1.3: Design a layout to display a list of the customer's lists. 
            ▪ Subtask 6.11.1.4: For each list, show Name, Item Count, Date Created, and "View," "Edit," "Delete" options. 
            ▪ Subtask 6.11.1.5: Add a "Create New List" button. 
        ◦ Task 6.11.2: Implement "Create New List" Modal/Form 
            ▪ Subtask 6.11.2.1: Implement a modal or inline form to allow the customer to enter a name for the new list. 
        ◦ Task 6.11.3: Implement "View List" Page UI 
            ▪ Subtask 6.11.3.1: Create CustomerListViewPage component/route (e.g., /account/lists/:listId). 
            ▪ Subtask 6.11.3.2: Display products in the list (similar to the wishlist). 
            ▪ Subtask 6.11.3.3: Include "Add to Cart" and "Remove" buttons for each item. 
            ▪ Subtask 6.11.3.4: Handle empty list state. 
        ◦ Task 6.11.4: Implement "Add to List" Functionality on Product Page 
            ▪ Subtask 6.11.4.1: On ProductDetailPage, add a dropdown or similar to select which list to add the product to. 
            ▪ Subtask 6.11.4.2: If no lists exist, provide an option to create a new list directly from the product page. 
            ▪ Subtask 6.11.4.3: Implement client-side calls to add the product to the selected list. 
        ◦ Task 6.11.5: Frontend API Integration: Manage Lists 
            ▪ Subtask 6.11.5.1: Create service/hook for GET /api/customer/lists (to get all lists). 
            ▪ Subtask 6.11.5.2: Create service/hook for POST /api/customer/lists (to create a new list). 
            ▪ Subtask 6.11.5.3: Create service/hook for PUT /api/customer/lists/:listId (to edit a list name). 
            ▪ Subtask 6.11.5.4: Create service/hook for DELETE /api/customer/lists/:listId (to delete a list). 
        ◦ Task 6.11.6: Frontend API Integration: Manage List Items 
            ▪ Subtask 6.11.6.1: Create service/hook for GET /api/customer/lists/:listId/items (to get items in a list). 
            ▪ Subtask 6.11.6.2: Create service/hook for POST /api/customer/lists/:listId/items (to add an item to a list). 
            ▪ Subtask 6.11.6.3: Create service/hook for DELETE /api/customer/lists/:listId/items/:productId (to remove an item from a list). 
    • Backend Tasks (Customer API):
        ◦ Task 6.11.7: Design Saved List Data Model 
            ▪ Subtask 6.11.7.1: Create a new SavedList collection schema. Include: 
                • customerId: ObjectId (ref to User). 
                • name: String. 
                • items: [{ productId: ObjectId, ref: 'Product' }]. 
                • createdAt: Date. 
        ◦ Task 6.11.8: Create Get All Lists API Endpoint 
            ▪ Subtask 6.11.8.1: Design and implement GET /api/customer/lists. 
            ▪ Subtask 6.11.8.2: Apply customer authentication. 
            ▪ Subtask 6.11.8.3: Query SavedList collection for lists belonging to the authenticated user. 
            ▪ Subtask 6.11.8.4: Return a list of lists with basic details (name, item count). 
        ◦ Task 6.11.9: Create New List API Endpoint 
            ▪ Subtask 6.11.9.1: Design and implement POST /api/customer/lists. 
            ▪ Subtask 6.11.9.2: Apply customer authentication. 
            ▪ Subtask 6.11.9.3: Receive the name for the new list. 
            ▪ Subtask 6.11.9.4: Create a new SavedList document. 
        ◦ Task 6.11.10: Edit List Name API Endpoint 
            ▪ Subtask 6.11.10.1: Design and implement PUT /api/customer/lists/:listId. 
            ▪ Subtask 6.11.10.2: Apply customer authentication. 
            ▪ Subtask 6.11.10.3: Validate that listId belongs to the authenticated user. 
            ▪ Subtask 6.11.10.4: Update the name of the SavedList document. 
        ◦ Task 6.11.11: Delete List API Endpoint 
            ▪ Subtask 6.11.11.1: Design and implement DELETE /api/customer/lists/:listId. 
            ▪ Subtask 6.11.11.2: Apply customer authentication. 
            ▪ Subtask 6.11.11.3: Validate that listId belongs to the authenticated user. 
            ▪ Subtask 6.11.11.4: Delete the SavedList document. 
        ◦ Task 6.11.12: Get List Items API Endpoint 
            ▪ Subtask 6.11.12.1: Design and implement GET /api/customer/lists/:listId/items. 
            ▪ Subtask 6.11.12.2: Apply customer authentication. 
            ▪ Subtask 6.11.12.3: Validate that listId belongs to the authenticated user. 
            ▪ Subtask 6.11.12.4: Query SavedList collection for the specified list. 
            ▪ Subtask 6.11.12.5: Populate (join) product details for each item in the items array. 
            ▪ Subtask 6.11.12.6: Return the list of items with product details. 
        ◦ Task 6.11.13: Add Item to List API Endpoint 
            ▪ Subtask 6.11.13.1: Design and implement POST /api/customer/lists/:listId/items. 
            ▪ Subtask 6.11.13.2: Apply customer authentication. 
            ▪ Subtask 6.11.13.3: Validate that listId belongs to the authenticated user. 
            ▪ Subtask 6.11.13.4: Receive the productId to add. 
            ▪ Subtask 6.11.13.5: Validate that the productId exists. 
            ▪ Subtask 6.11.13.6: Add the productId to the items array of the SavedList document. 
        ◦ Task 6.11.14: Remove Item from List API Endpoint 
            ▪ Subtask 6.11.14.1: Design and implement DELETE /api/customer/lists/:listId/items/:productId. 
            ▪ Subtask 6.11.14.2: Apply customer authentication. 
            ▪ Subtask 6.11.14.3: Validate that listId belongs to the authenticated user. 
            ▪ Subtask 6.11.14.4: Remove the specified productId from the items array of the SavedList document. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.11.15: Secure Saved List Data 
            ▪ Subtask 6.11.15.1: Ensure a customer can only manage their own saved lists. 
            ▪ Subtask 6.11.15.2: Robust server-side validation for list names and product IDs. 
    • Testing Tasks:
        ◦ Task 6.11.16: Write Unit Tests 
            ▪ Subtask 6.11.16.1: Unit tests for backend logic of creating, editing, and deleting lists. 
            ▪ Subtask 6.11.16.2: Unit tests for adding and removing items from lists. 
        ◦ Task 6.11.17: Write Integration Tests 
            ▪ Subtask 6.11.17.1: Register a test user. Create several test products. 
            ▪ Subtask 6.11.17.2: Log in. Call POST /api/customer/lists to create new lists. Verify they are created. 
            ▪ Subtask 6.11.17.3: Call GET /api/customer/lists to get the list of lists. Verify they are returned. 
            ▪ Subtask 6.11.17.4: Call PUT /api/customer/lists/:listId to edit a list name. Verify the name is updated. 
            ▪ Subtask 6.11.17.5: Call POST /api/customer/lists/:listId/items to add products to a list. Verify they are added. 
            ▪ Subtask 6.11.17.6: Call GET /api/customer/lists/:listId/items to get the items in a list. Verify the products are returned with details. 
            ▪ Subtask 6.11.17.7: Call DELETE /api/customer/lists/:listId/items/:productId to remove a product. Verify it is removed. 
            ▪ Subtask 6.11.17.8: Call DELETE /api/customer/lists/:listId to delete a list. Verify it is deleted. 
            ▪ Subtask 6.11.17.9: Test unauthorized access. 
        ◦ Task 6.11.18: Manual End-to-End Testing 
            ▪ Subtask 6.11.18.1: Log in as a customer. Navigate to "My Account" -> "Saved Lists." 
            ▪ Subtask 6.11.18.2: Click "Create New List." Enter a name and create a list. Verify it appears in the list. 
            ▪ Subtask 6.11.18.3: Click "View" on the newly created list. Verify the page is empty. 
            ▪ Subtask 6.11.18.4: Browse products. On several product detail pages, add products to the created list using the dropdown. 
            ▪ Subtask 6.11.18.5: Go back to the list view. Verify the added products are displayed. 
            ▪ Subtask 6.11.18.6: Test "Add to Cart" and "Remove" buttons for items in the list. 
            ▪ Subtask 6.11.18.7: Test editing the list name. 
            ▪ Subtask 6.11.18.8: Test deleting a list.
Epic 6: Customer Account Management Enhancements
Story 6.12: Customer Data Export/Deletion (GDPR Compliance)
Story: As a registered customer, I want to be able to request an export of my personal data and initiate a request for my account to be deleted so that I can exercise my data rights in accordance with privacy regulations (e.g., GDPR, CCPA).
Acceptance Criteria:
    1. A "Data & Privacy" or "Manage My Data" link is available in the "My Account" navigation. 
    2. Clicking the "Data & Privacy" link takes the customer to a page with options for data export and deletion. 
    3. Data Export: 
        ◦ An "Export My Data" button/link is available. 
        ◦ Clicking this button initiates a process to compile the customer's personal data. 
        ◦ The customer is notified (e.g., by email) when their data export is ready for download. 
        ◦ The exported data is provided in a common, machine-readable format (e.g., JSON, CSV). 
        ◦ The export includes: profile information, order history, addresses, payment method tokens (non-sensitive details), wishlist, saved lists, loyalty data, alert subscriptions, and support ticket history. 
    4. Account Deletion: 
        ◦ An "Request Account Deletion" button/link is available. 
        ◦ Clicking this button initiates a deletion request process. 
        ◦ The customer is required to re-authenticate (e.g., enter password) to confirm the deletion request. 
        ◦ A clear warning is displayed about the irreversible nature of deletion (e.g., loss of order history, points, etc.). 
        ◦ The customer is informed about the typical timeframe for deletion and any data retention policies (e.g., data may be retained for legal/tax purposes for X years). 
        ◦ Upon successful request, a confirmation message is displayed, and the customer receives an email notification. 
        ◦ Actual deletion involves a backend process, potentially requiring manual approval or a timed delay, and careful handling of dependent data (e.g., anonymizing order data, deactivating associated records). 
    5. All data export and deletion requests are securely handled and validated against the authenticated user. 

Granular Tasks & Subtasks for Story 6.12:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.12.1: Implement "Data & Privacy" Navigation Link & Page 
            ▪ Subtask 6.12.1.1: Add a "Data & Privacy" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.12.1.2: Create CustomerPrivacyPage component/route (e.g., /account/privacy). 
            ▪ Subtask 6.12.1.3: Design a layout for the page with clear sections for "Data Export" and "Account Deletion." 
        ◦ Task 6.12.2: Implement "Export My Data" UI 
            ▪ Subtask 6.12.2.1: Add an "Export My Data" button. 
            ▪ Subtask 6.12.2.2: Display an informational message about the process (e.g., "An email will be sent with a download link when your data is ready."). 
            ▪ Subtask 6.12.2.3: Implement client-side call to the export API. 
            ▪ Subtask 6.12.2.4: Show success/error messages. 
        ◦ Task 6.12.3: Implement "Request Account Deletion" UI 
            ▪ Subtask 6.12.3.1: Add a "Request Account Deletion" button. 
            ▪ Subtask 6.12.3.2: Implement a confirmation modal/dialog that: 
                • Clearly warns about data loss and irreversibility. 
                • Requires the customer to re-enter their password for verification. 
                • Informs about the typical deletion timeframe and data retention. 
                • Includes "Confirm Deletion" and "Cancel" buttons. 
            ▪ Subtask 6.12.3.3: Implement client-side call to the deletion request API. 
            ▪ Subtask 6.12.3.4: Show success/error messages, potentially redirecting to a confirmation page or logout. 
    • Backend Tasks (Customer API & Data Processing):
        ◦ Task 6.12.4: Create Data Export Request API Endpoint 
            ▪ Subtask 6.12.4.1: Design and implement POST /api/customer/data/export. 
            ▪ Subtask 6.12.4.2: Apply customer authentication. 
            ▪ Subtask 6.12.4.3: Create a background job/queue entry for data export (to avoid long synchronous requests). 
            ▪ Subtask 6.12.4.4: Return a success message indicating the request is being processed. 
            ▪ Subtask 6.12.4.5: Audit Logging: Log data export request. 
        ◦ Task 6.12.5: Implement Background Data Export Worker 
            ▪ Subtask 6.12.5.1: A dedicated worker process/function that listens for export requests. 
            ▪ Subtask 6.12.5.2: For the given customerId, query all relevant data: User profile, Order history, Address book, PaymentMethod details (non-sensitive), Wishlist, SavedLists, Loyalty data, Alert subscriptions, Ticket history, Reviews (if implemented). 
            ▪ Subtask 6.12.5.3: Format the data into a machine-readable format (e.g., a JSON file for each data type, or a single large JSON/CSV). 
            ▪ Subtask 6.12.5.4: Store the generated export file securely (e.g., temporary storage, S3 bucket with limited access). 
            ▪ Subtask 6.12.5.5: Generate a secure, time-limited download link for the file. 
            ▪ Subtask 6.12.5.6: Send an email to the customer with the download link and instructions. 
            ▪ Subtask 6.12.5.7: Ensure download links expire after a reasonable period (e.g., 24-48 hours). 
        ◦ Task 6.12.6: Create Account Deletion Request API Endpoint 
            ▪ Subtask 6.12.6.1: Design and implement POST /api/customer/data/delete-request. 
            ▪ Subtask 6.12.6.2: Apply customer authentication. 
            ▪ Subtask 6.12.6.3: Receive the customer's password for re-authentication. 
            ▪ Subtask 6.12.6.4: Verify the password. 
            ▪ Subtask 6.12.6.5: Create a record of the deletion request (e.g., in a DeletionRequests collection) with customerId, requestedAt, status (e.g., 'pending', 'processing', 'completed'). 
            ▪ Subtask 6.12.6.6: Send an email confirmation to the customer acknowledging the request and reiterating next steps/timeframes. 
            ▪ Subtask 6.12.6.7: Return a success message to the frontend, indicating the request is processed. 
            ▪ Subtask 6.12.6.8: Invalidate current user session and log out the user. 
            ▪ Subtask 6.12.6.9: Audit Logging: Log account deletion request. 
        ◦ Task 6.12.7: Implement Background Account Deletion Worker/Process 
            ▪ Subtask 6.12.7.1: A dedicated worker/admin process that handles pending deletion requests. 
            ▪ Subtask 6.12.7.2: Implement logic for soft deletion or anonymization for data that needs to be retained for legal/tax purposes (e.g., orders). This means not outright deleting all data. 
            ▪ Subtask 6.12.7.3: For personal data not tied to legal retention (e.g., profile, addresses, wishlist, saved lists, alert subscriptions, support tickets), delete or anonymize it. 
            ▪ Subtask 6.12.7.4: Deactivate the User account (e.g., set isActive: false, isDeleted: true) and clear sensitive User data. 
            ▪ Subtask 6.12.7.5: Update the DeletionRequests record status to 'completed'. 
            ▪ Subtask 6.12.7.6: Send a final email notification to the customer upon completion of deletion. 
        ◦ Task 6.12.8: Data Anonymization/Retention Policy Implementation 
            ▪ Subtask 6.12.8.1: Define what data needs to be retained for legal/tax purposes and for how long. 
            ▪ Subtask 6.12.8.2: Implement strategies for anonymizing retained data (e.g., replacing names/emails with placeholders, zeroing out sensitive fields). 
            ▪ Subtask 6.12.8.3: Ensure no personally identifiable information (PII) remains in retained data beyond the legal necessity. 
    • Security & Compliance Tasks (Highly Critical!):
        ◦ Task 6.12.9: Data Minimization Review 
            ▪ Subtask 6.12.9.1: Review all data collected and stored to ensure only necessary data is kept. 
        ◦ Task 6.12.10: Secure Data Handling for Export 
            ▪ Subtask 6.12.10.1: Ensure export files are generated and stored securely. 
            ▪ Subtask 6.12.10.2: Use secure, one-time or time-limited download links, possibly requiring re-authentication for download. 
        ◦ Task 6.12.11: Comprehensive Audit Logging 
            ▪ Subtask 6.12.11.1: Log all data export and deletion request attempts and their outcomes for compliance. 
        ◦ Task 6.12.12: Legal/Compliance Consultation 
            ▪ Subtask 6.12.12.1: (External Task) Consult with legal experts to ensure the implementation fully complies with GDPR, CCPA, and other relevant privacy regulations. 
    • Testing Tasks:
        ◦ Task 6.12.13: Write Unit Tests 
            ▪ Subtask 6.12.13.1: Unit tests for backend logic for initiating export/deletion requests. 
            ▪ Subtask 6.12.13.2: Unit tests for password re-authentication logic. 
            ▪ Subtask 6.12.13.3: Unit tests for data anonymization routines. 
        ◦ Task 6.12.14: Write Integration Tests 
            ▪ Subtask 6.12.14.1: Register a test user and generate some data (orders, addresses, wishlist items etc.). 
            ▪ Subtask 6.12.14.2: Log in. Call POST /api/customer/data/export. Verify a request is created and a download link email is triggered (mock email sending). 
            ▪ Subtask 6.12.14.3: Simulate the background export worker. Verify the export file is generated correctly and contains expected data. 
            ▪ Subtask 6.12.14.4: Call POST /api/customer/data/delete-request with correct/incorrect password. Verify request creation on success and error on failure. 
            ▪ Subtask 6.12.14.5: Simulate the background deletion worker. Verify user account is deactivated/anonymized, related personal data is removed, and order history is anonymized but retained. 
            ▪ Subtask 6.12.14.6: After deletion, attempt to log in with the deleted account (should fail). 
            ▪ Subtask 6.12.14.7: Test unauthorized access to these endpoints. 
        ◦ Task 6.12.15: Manual End-to-End Testing 
            ▪ Subtask 6.12.15.1: Log in as a customer with existing data. Navigate to "My Account" -> "Data & Privacy." 
            ▪ Subtask 6.12.15.2: Click "Export My Data." Verify the confirmation message. Check email for download link. Download the file and verify its contents. 
            ▪ Subtask 6.12.15.3: Click "Request Account Deletion." Read the warning. Re-enter password. Confirm deletion. Verify success message and customer is logged out. 
            ▪ Subtask 6.12.15.4: Attempt to log in with the deleted account credentials (should fail). 
            ▪ Subtask 6.12.15.5: (Requires Admin access or backend log access) Verify the account and associated personal data has been properly handled (deleted/anonymized) in the database, while non-personal/legal data is retained.
Epic 6: Customer Account Management Enhancements
Story 6.13: Refer a Friend Program Management
Story: As a registered customer, I want to be able to access a unique referral link, share it with friends, track the status of my referrals, and view any rewards I've earned so that I can participate in the store's "Refer a Friend" program and benefit from my referrals.
Acceptance Criteria:
    1. A "Refer a Friend" or "Referral Program" link is available in the "My Account" navigation (only if the program is active). 
    2. Clicking the "Refer a Friend" link takes the customer to their dedicated referral dashboard. 
    3. The referral dashboard prominently displays: 
        ◦ The customer's unique referral link/code. 
        ◦ Easy options to share the link (e.g., direct copy, share via email, social media buttons). 
        ◦ Clear explanation of the program's benefits for both the referrer and the referred friend (e.g., "Give 10%, Get $10"). 
    4. The dashboard includes a section for "Referral Activity" showing: 
        ◦ List of referred friends (e.g., their email/name, or just "Friend 1", "Friend 2" for privacy). 
        ◦ Status of each referral (e.g., "Link Shared," "Friend Registered," "Friend Made First Purchase," "Reward Earned"). 
        ◦ Date of activity. 
    5. The dashboard includes a "My Rewards" section showing: 
        ◦ List of earned rewards (e.g., "$10 Credit," "Free Shipping Coupon"). 
        ◦ Reward code/link (if applicable). 
        ◦ Expiry date of the reward. 
        ◦ Status of reward (e.g., "Active," "Redeemed," "Expired"). 
    6. The customer receives notifications (e.g., email) when a referred friend makes a qualifying purchase and a reward is earned. 
    7. All referral program data is securely managed and displayed only to the authenticated customer. 

Granular Tasks & Subtasks for Story 6.13:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.13.1: Implement "Refer a Friend" Navigation Link & Page 
            ▪ Subtask 6.13.1.1: Add a "Refer a Friend" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.13.1.2: Conditionally render this link based on whether the referral program is enabled globally. 
            ▪ Subtask 6.13.1.3: Create CustomerReferralDashboardPage component/route (e.g., /account/referrals). 
            ▪ Subtask 6.13.1.4: Design a user-friendly layout for the dashboard. 
        ◦ Task 6.13.2: Implement Referral Link & Sharing UI 
            ▪ Subtask 6.13.2.1: Display the unique referral link/code clearly. 
            ▪ Subtask 6.13.2.2: Implement a "Copy Link" button (to clipboard). 
            ▪ Subtask 6.13.2.3: Implement "Share via Email" button (opens mail client with pre-filled subject/body). 
            ▪ Subtask 6.13.2.4: Implement social media share buttons (e.g., Facebook, X/Twitter, WhatsApp) that use share URLs. 
            ▪ Subtask 6.13.2.5: Display program rules and benefits for both referrer and referred. 
        ◦ Task 6.13.3: Implement Referral Activity Table UI 
            ▪ Subtask 6.13.3.1: Design and implement a table/list to show "Referral Activity." 
            ▪ Subtask 6.13.3.2: Display columns for Friend (masked), Status, and Date. 
            ▪ Subtask 6.13.3.3: Handle empty state for no referrals. 
        ◦ Task 6.13.4: Implement "My Rewards" Table UI 
            ▪ Subtask 6.13.4.1: Design and implement a table/list to show "My Rewards." 
            ▪ Subtask 6.13.4.2: Display columns for Reward Description, Code/Link, Expiry, and Status. 
            ▪ Subtask 6.13.4.3: Add "Redeem" button if reward is a coupon/link. 
            ▪ Subtask 6.13.4.4: Handle empty state for no rewards. 
        ◦ Task 6.13.5: Frontend API Integration: Fetch Referral Data 
            ▪ Subtask 6.13.5.1: Create service/hook to call GET /api/customer/referrals. 
            ▪ Subtask 6.13.5.2: This endpoint should return the unique link, activity log, and rewards list. 
            ▪ Subtask 6.13.5.3: Handle loading states and errors. 
    • Backend Tasks (Customer API & Referral Program Service):
        ◦ Task 6.13.6: Design Referral Data Models 
            ▪ Subtask 6.13.6.1: Referral Program Settings (Admin): Define global settings (e.g., reward type, amount, conditions). 
            ▪ Subtask 6.13.6.2: Referrer (User Schema Augmentation): Add referralCode: String (unique, indexed) to User schema. 
            ▪ Subtask 6.13.6.3: Referral Tracking (Referral Collection): 
                • referrerId: ObjectId (ref to User). 
                • referredEmail (if email shared) / referredIP (for tracking). 
                • referredUserId: ObjectId (ref to User, once registered). 
                • status: String (e.g., 'pending_registration', 'registered', 'pending_purchase', 'purchase_completed', 'reward_issued'). 
                • referredPurchaseId: ObjectId (ref to Order, if purchase made). 
                • createdAt, updatedAt. 
            ▪ Subtask 6.13.6.4: Referral Rewards (Reward Collection or User sub-document): 
                • customerId: ObjectId (ref to User, for the referrer). 
                • type: String (e.g., 'discount_coupon', 'store_credit', 'free_shipping'). 
                • value: Number (e.g., 10 for $10, 0.10 for 10%). 
                • code: String (for coupon codes). 
                • status: String ('active', 'redeemed', 'expired'). 
                • expiryDate: Date. 
                • earnedFromReferralId: ObjectId (ref to Referral document). 
        ◦ Task 6.13.7: Implement Referral Code Generation 
            ▪ Subtask 6.13.7.1: Logic to generate a unique referral code for each new registered user (or on first access to referral program). 
            ▪ Subtask 6.13.7.2: Store this referralCode on the User document. 
        ◦ Task 6.13.8: Create Get Customer Referral Data API Endpoint 
            ▪ Subtask 6.13.8.1: Design and implement GET /api/customer/referrals. 
            ▪ Subtask 6.13.8.2: Apply customer authentication. 
            ▪ Subtask 6.13.8.3: Retrieve the authenticated user's referralCode. 
            ▪ Subtask 6.13.8.4: Query Referral collection for referrerId matching the authenticated user. 
            ▪ Subtask 6.13.8.5: Query Reward collection for customerId matching the authenticated user where status is 'active'. 
            ▪ Subtask 6.13.8.6: Return all referral link, activity, and reward data. 
        ◦ Task 6.13.9: Implement Referral Tracking Logic (Middleware/Service) 
            ▪ Subtask 6.13.9.1: Middleware to detect referral codes in URLs (e.g., ?ref=CODE). 
            ▪ Subtask 6.13.9.2: Store the referrer's referralCode in a cookie/session for a period (e.g., 30-60 days). 
            ▪ Subtask 6.13.9.3: When a new user registers, check if a referral code is present in cookie/session. 
            ▪ Subtask 6.13.9.4: If a code is found, validate it against User referralCodes. 
            ▪ Subtask 6.13.9.5: If valid, create a new Referral document linking the referrer and referred user. Set initial status (e.g., 'registered'). 
        ◦ Task 6.13.10: Implement Reward Earning Logic (Order Processing Integration) 
            ▪ Subtask 6.13.10.1: Integrate into Order fulfillment/completion process. 
            ▪ Subtask 6.13.10.2: After a referred friend's first qualifying purchase is completed: 
                • Update the Referral document status (e.g., to 'purchase_completed'). 
                • Generate a Reward (e.g., discount coupon code) for the referrer based on program rules. 
                • Store the Reward in the Reward collection (or on the User document). 
                • Update the Referral document with rewardIssued: true and rewardId. 
                • Send email notification to the referrer about the earned reward. 
        ◦ Task 6.13.11: Implement Reward Redemption Logic 
            ▪ Subtask 6.13.11.1: Integrate reward codes (e.g., coupon codes) into the checkout process (from Epic 3). 
            ▪ Subtask 6.13.11.2: When a reward is redeemed, update its status to 'redeemed' in the Reward collection. 
    • Email Notification System Integration:
        ◦ Task 6.13.12: Implement Referrer Reward Notification Email 
            ▪ Subtask 6.13.12.1: Create an email template for notifying referrers about earned rewards. 
            ▪ Subtask 6.13.12.2: Send this email when a reward is issued (from 6.13.10.2). 
        ◦ Task 6.13.13: Implement Referred Friend Welcome Email (Optional) 
            ▪ Subtask 6.13.13.1: When a friend registers via a referral link, send them a welcome email explaining their benefit (e.g., "Here's your X% off coupon for your first purchase!"). 
    • Security & Data Integrity Tasks:
        ◦ Task 6.13.14: Secure Referral Data 
            ▪ Subtask 6.13.14.1: Ensure only the authenticated user can access their own referral data. 
            ▪ Subtask 6.13.14.2: Implement robust validation for referral codes. 
            ▪ Subtask 6.13.14.3: Prevent self-referrals (a user cannot refer themselves). 
            ▪ Subtask 6.13.14.4: Implement fraud detection for referral program abuse (e.g., multiple accounts from same IP, suspicious registration patterns). 
    • Testing Tasks:
        ◦ Task 6.13.15: Write Unit Tests 
            ▪ Subtask 6.13.15.1: Unit tests for referral code generation. 
            ▪ Subtask 6.13.15.2: Unit tests for reward generation logic. 
            ▪ Subtask 6.13.15.3: Unit tests for referral tracking. 
        ◦ Task 6.13.16: Write Integration Tests 
            ▪ Subtask 6.13.16.1: Create Referrer_User_A. Get their referral link. 
            ▪ Subtask 6.13.16.2: Simulate Referrer_User_A sharing link. 
            ▪ Subtask 6.13.16.3: Simulate Referred_Friend_B registering using Referrer_User_A's link. Verify Referral document created with 'registered' status. 
            ▪ Subtask 6.13.16.4: Log in as Referrer_User_A. Call GET /api/customer/referrals. Verify referral activity is listed. 
            ▪ Subtask 6.13.16.5: Simulate Referred_Friend_B making a qualifying first purchase. Verify Referral status updates to 'purchase_completed' and a Reward is issued to Referrer_User_A. 
            ▪ Subtask 6.13.16.6: Log in as Referrer_User_A again. Call GET /api/customer/referrals. Verify the reward is listed. 
            ▪ Subtask 6.13.16.7: Test reward redemption by Referred_Friend_B at checkout (if that's part of the program). 
            ▪ Subtask 6.13.16.8: Test unauthenticated access. 
            ▪ Subtask 6.13.16.9: Test self-referral attempts (should be blocked). 
        ◦ Task 6.13.17: Manual End-to-End Testing 
            ▪ Subtask 6.13.17.1: Create a new customer account (Customer A). 
            ▪ Subtask 6.13.17.2: Log in as Customer A. Navigate to "My Account" -> "Refer a Friend." 
            ▪ Subtask 6.13.17.3: Copy the referral link. 
            ▪ Subtask 6.13.17.4: Log out. Open an incognito browser window. Navigate to the copied referral link. 
            ▪ Subtask 6.13.17.5: Register a new customer account (Customer B) through this link. 
            ▪ Subtask 6.13.17.6: As Customer B, make a qualifying first purchase. 
            ▪ Subtask 6.13.17.7: Log in as Customer A. Go to "Refer a Friend." Verify Customer B's activity is logged and the reward is shown. 
            ▪ Subtask 6.13.17.8: (If applicable) Use the earned reward (e.g., coupon code) for a test purchase by Customer A. 
            ▪ Subtask 6.13.17.9: Test social media sharing buttons.
Epic 6: Customer Account Management Enhancements
Story 6.14: Customer Reviews Dashboard
Story: As a registered customer, I want to be able to view all the product reviews I have submitted and have the option to edit or delete them so that I can manage my contributions and correct any information.
Acceptance Criteria:
    1. A "My Reviews" link is available in the "My Account" navigation. 
    2. Clicking the "My Reviews" link takes the customer to a page listing all their submitted product reviews. 
    3. For each review, the following details are displayed: 
        ◦ Product Image and Name. 
        ◦ My Rating (e.g., stars). 
        ◦ My Review Title and Content. 
        ◦ Date Submitted. 
        ◦ Current Status (e.g., "Approved," "Pending Approval," "Rejected" - if moderation exists). 
        ◦ Options to: 
            ▪ View the full review on the product page. 
            ▪ Edit the review. 
            ▪ Delete the review. 
    4. When editing a review, the customer is presented with a form pre-filled with their original review details (rating, title, content). 
    5. Edited reviews, if moderation is enabled, should go through the same moderation process as new reviews. 
    6. Deleting a review requires a confirmation prompt. 
    7. All review management actions are securely performed by the authenticated user and only for their own reviews. 

Granular Tasks & Subtasks for Story 6.14:
    • Frontend Tasks (Customer Account Panel & Product Page):
        ◦ Task 6.14.1: Implement "My Reviews" Navigation Link & List Page 
            ▪ Subtask 6.14.1.1: Add a "My Reviews" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.14.1.2: Create CustomerReviewsPage component/route (e.g., /account/reviews). 
            ▪ Subtask 6.14.1.3: Design and implement a layout (e.g., cards or list items) to display review summaries. 
            ▪ Subtask 6.14.1.4: For each review, display Product Image, Name, Rating, Title, partial Content, Date, Status. 
            ▪ Subtask 6.14.1.5: Add "Edit," "Delete," and "View on Product Page" buttons/links for each review. 
            ▪ Subtask 6.14.1.6: Handle empty state for no reviews. 
        ◦ Task 6.14.2: Implement "Edit Review" Form UI 
            ▪ Subtask 6.14.2.1: Create EditReviewForm component (can be a modal or dedicated page, e.g., /account/reviews/:reviewId/edit). 
            ▪ Subtask 6.14.2.2: Pre-fill the form with the existing review's rating, title, and content. 
            ▪ Subtask 6.14.2.3: Implement input fields for rating (e.g., star selector), title, and review content (textarea). 
            ▪ Subtask 6.14.2.4: Add "Save Changes" and "Cancel" buttons. 
        ◦ Task 6.14.3: Implement "Delete Review" Confirmation 
            ▪ Subtask 6.14.3.1: On clicking "Delete," display a confirmation modal/dialog. 
            ▪ Subtask 6.14.3.2: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 6.14.4: Frontend API Integration: Fetch My Reviews 
            ▪ Subtask 6.14.4.1: Create service/hook to call GET /api/customer/reviews. 
            ▪ Subtask 6.14.4.2: Display fetched review data, including associated product details. 
        ◦ Task 6.14.5: Frontend API Integration: Edit Review 
            ▪ Subtask 6.14.5.1: Create service/hook to call PUT /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.14.5.2: Send the updated rating, title, and content. 
            ▪ Subtask 6.14.5.3: Display success/error messages. 
        ◦ Task 6.14.6: Frontend API Integration: Delete Review 
            ▪ Subtask 6.14.6.1: Create service/hook to call DELETE /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.14.6.2: On success, remove the review from the list and display notification. 
    • Backend Tasks (Customer API & Review Service):
        ◦ Task 6.14.7: Update Review Data Model (if necessary) 
            ▪ Subtask 6.14.7.1: Ensure the existing Review schema includes customerId: ObjectId (ref to User), status: String (e.g., 'pending', 'approved', 'rejected'). 
        ◦ Task 6.14.8: Create Get Customer Reviews API Endpoint 
            ▪ Subtask 6.14.8.1: Design and implement GET /api/customer/reviews. 
            ▪ Subtask 6.14.8.2: Apply customer authentication middleware. 
            ▪ Subtask 6.14.8.3: Query Review collection, filtering by authenticated user's ID. 
            ▪ Subtask 6.14.8.4: Populate (join) associated Product details (name, image). 
            ▪ Subtask 6.14.8.5: Return the list of reviews. 
        ◦ Task 6.14.9: Create Edit Review API Endpoint 
            ▪ Subtask 6.14.9.1: Design and implement PUT /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.14.9.2: Apply customer authentication. 
            ▪ Subtask 6.14.9.3: Validate reviewId belongs to the authenticated user. 
            ▪ Subtask 6.14.9.4: Receive updated rating, title, content. 
            ▪ Subtask 6.14.9.5: Implement server-side validation and sanitization for updated content. 
            ▪ Subtask 6.14.9.6: Update the Review document. 
            ▪ Subtask 6.14.9.7: If moderation is enabled, set the status to 'pending' after edit, requiring re-approval. 
            ▪ Subtask 6.14.9.8: Audit Logging: Log review edit. 
        ◦ Task 6.14.10: Create Delete Review API Endpoint 
            ▪ Subtask 6.14.10.1: Design and implement DELETE /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.14.10.2: Apply customer authentication. 
            ▪ Subtask 6.14.10.3: Validate reviewId belongs to the authenticated user. 
            ▪ Subtask 6.14.10.4: Delete the Review document (or soft-delete by setting status to 'deleted'). 
            ▪ Subtask 6.14.10.5: Update product's average rating/review count (if cached). 
            ▪ Subtask 6.14.10.6: Audit Logging: Log review deletion. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.14.11: Strict Authorization for Reviews 
            ▪ Subtask 6.14.11.1: Ensure a customer can only manage their own reviews. Prevent access/modification of other users' reviews. 
            ▪ Subtask 6.14.11.2: Robust server-side input sanitization to prevent XSS in review content. 
    • Testing Tasks:
        ◦ Task 6.14.12: Write Unit Tests 
            ▪ Subtask 6.14.12.1: Unit tests for backend logic of retrieving, editing, and deleting reviews based on customerId. 
            ▪ Subtask 6.14.12.2: Unit tests for input validation and sanitization. 
        ◦ Task 6.14.13: Write Integration Tests 
            ▪ Subtask 6.14.13.1: Register a test user. Submit several reviews for different products (via existing review submission endpoint, if any). 
            ▪ Subtask 6.14.13.2: Log in as the user. Call GET /api/customer/reviews. Verify the submitted reviews are returned. 
            ▪ Subtask 6.14.13.3: Call PUT /api/customer/reviews/:reviewId to edit a review. Verify the review content/rating updates in the database. 
            ▪ Subtask 6.14.13.4: Call DELETE /api/customer/reviews/:reviewId. Verify the review is removed. 
            ▪ Subtask 6.14.13.5: Test attempts to edit/delete another user's review (should fail). 
            ▪ Subtask 6.14.13.6: Test unauthenticated access. 
        ◦ Task 6.14.14: Manual End-to-End Testing 
            ▪ Subtask 6.14.14.1: Log in as a customer. Submit a new review for a product (if possible, through the regular product page review form). 
            ▪ Subtask 6.14.14.2: Navigate to "My Account" -> "My Reviews." Verify the newly submitted review appears. 
            ▪ Subtask 6.14.14.3: Click "Edit" on a review. Change the rating, title, and/or content. Save changes. Verify success message and updated review in the list. 
            ▪ Subtask 6.14.14.4: Click "Delete" on a review. Confirm deletion. Verify the review disappears from the list. 
            ▪ Subtask 6.14.14.5: Navigate to the product page of a deleted review and verify it's no longer visible there. 
            ▪ Subtask 6.14.14.6: (If moderation is enabled) Edit a review and ve
Epic 6: Customer Account Management Enhancements
Story 6.15: Multi-Factor Authentication (Advanced - WebAuthn/FIDO2)
Story: As a registered customer, I want to be able to register and manage multiple WebAuthn (FIDO2) authenticators (e.g., Touch ID, Windows Hello, YubiKey) for my account so that I can use modern, phishing-resistant multi-factor authentication methods for enhanced security and convenience.
Acceptance Criteria:
    1. A "Security" link (from 6.9) is enhanced to include "Advanced MFA" options. 
    2. The "Advanced MFA" section displays a list of currently registered WebAuthn authenticators (e.g., "Face ID on MacBook Pro," "My YubiKey"). 
    3. Registering a New Authenticator: 
        ◦ The customer can initiate the registration of a new WebAuthn authenticator. 
        ◦ The process guides the user through browser/OS prompts (e.g., "Touch your security key," "Scan your fingerprint"). 
        ◦ Upon successful registration, the authenticator is added to their list with a user-friendly name (e.g., auto-generated or user-provided). 
        ◦ Recovery codes (from 6.9) are still critical backup and their importance is reiterated. 
    4. Managing Registered Authenticators: 
        ◦ For each registered authenticator, the customer can: 
            ▪ Rename it (e.g., "My Home YubiKey"). 
            ▪ Remove/Deregister it (requires re-authentication using another MFA method or password). 
    5. Login Flow with WebAuthn: 
        ◦ If WebAuthn authenticators are registered, during login (after password or as a passwordless option): 
            ▪ The customer is prompted to use one of their registered authenticators. 
            ▪ The browser/OS handles the WebAuthn challenge. 
            ▪ If successful, the login completes. 
    6. All WebAuthn registration, management, and authentication processes adhere to FIDO2/WebAuthn specifications and best security practices. 
    7. Relevant security events (e.g., authenticator registration/deregistration, failed WebAuthn attempts) are logged securely. 

Granular Tasks & Subtasks for Story 6.15:
    • Frontend Tasks (Customer Account Panel & Login Page):
        ◦ Task 6.15.1: Enhance "Security" Page for WebAuthn Management 
            ▪ Subtask 6.15.1.1: On the CustomerSecurityPage (from 6.9), add a dedicated section for "WebAuthn / Security Keys." 
            ▪ Subtask 6.15.1.2: Display a list of registered authenticators, showing a friendly name and a "Remove" button. 
            ▪ Subtask 6.15.1.3: Add a "Register New Security Key / Biometric Device" button. 
        ◦ Task 6.15.2: Implement WebAuthn Registration Flow UI 
            ▪ Subtask 6.15.2.1: Implement logic to initiate WebAuthn navigator.credentials.create() API call when "Register New..." button is clicked. 
            ▪ Subtask 6.15.2.2: Handle browser/OS prompts for authenticator interaction. 
            ▪ Subtask 6.15.2.3: Prompt user to provide a friendly name for the new authenticator upon successful registration. 
            ▪ Subtask 6.15.2.4: Display success/error messages for registration attempts. 
        ◦ Task 6.15.3: Implement WebAuthn Authenticator Management UI 
            ▪ Subtask 6.15.3.1: For each listed authenticator, add an "Edit" button to rename it. 
            ▪ Subtask 6.15.3.2: For each listed authenticator, add a "Remove" button with a confirmation modal/dialog, requiring re-authentication. 
        ◦ Task 6.15.4: Implement WebAuthn Login Flow UI (Enhance Login) 
            ▪ Subtask 6.15.4.1: Modify LoginPage (from 6.0) to detect if the user has WebAuthn enabled. 
            ▪ Subtask 6.15.4.2: If has2FAEnabled (from 6.9) includes WebAuthn, offer WebAuthn as a 2FA option after password. 
            ▪ Subtask 6.15.4.3: (Optional, for advanced) Offer "Login with Security Key" as a passwordless primary login option. 
            ▪ Subtask 6.15.4.4: Implement logic to initiate WebAuthn navigator.credentials.get() API call during login. 
            ▪ Subtask 6.15.4.5: Handle browser/OS prompts and display success/error messages during login. 
        ◦ Task 6.15.5: Frontend API Integration: WebAuthn Management 
            ▪ Subtask 6.15.5.1: Create service/hook for POST /api/customer/security/webauthn/registration-options (to get server challenge). 
            ▪ Subtask 6.15.5.2: Create service/hook for POST /api/customer/security/webauthn/register-authenticator (to send client response and store). 
            ▪ Subtask 6.15.5.3: Create service/hook for GET /api/customer/security/webauthn/authenticators (to get list). 
            ▪ Subtask 6.15.5.4: Create service/hook for PUT /api/customer/security/webauthn/authenticators/:id (to rename). 
            ▪ Subtask 6.15.5.5: Create service/hook for DELETE /api/customer/security/webauthn/authenticators/:id (to remove). 
    • Backend Tasks (Customer API & WebAuthn Service):
        ◦ Task 6.15.6: Update User Model for WebAuthn Authenticators 
            ▪ Subtask 6.15.6.1: Add webAuthnCredentials: [{ credentialId: Buffer, publicKey: Buffer, transports: [String], counter: Number, friendlyName: String, createdAt: Date }] to User schema. (Buffer for binary data). 
        ◦ Task 6.15.7: Implement WebAuthn Relying Party (RP) Server Logic 
            ▪ Subtask 6.15.7.1: Choose and integrate a robust WebAuthn server library (e.g., @simplewebauthn/server for Node.js). 
            ▪ Subtask 6.15.7.2: Configure Relying Party ID, Origin, etc. 
        ◦ Task 6.15.8: Create WebAuthn Registration Options Endpoint 
            ▪ Subtask 6.15.8.1: Design and implement POST /api/customer/security/webauthn/registration-options. 
            ▪ Subtask 6.15.8.2: Apply customer authentication. 
            ▪ Subtask 6.15.8.3: Generate a WebAuthn registration challenge (using the WebAuthn library). 
            ▪ Subtask 6.15.8.4: Store the challenge securely in session or a temporary store for verification. 
            ▪ Subtask 6.15.8.5: Return the challenge to the frontend. 
        ◦ Task 6.15.9: Create WebAuthn Register Authenticator Endpoint 
            ▪ Subtask 6.15.9.1: Design and implement POST /api/customer/security/webauthn/register-authenticator. 
            ▪ Subtask 6.15.9.2: Apply customer authentication. 
            ▪ Subtask 6.15.9.3: Receive the clientAttestationResponse from the frontend. 
            ▪ Subtask 6.15.9.4: Verify the response against the stored challenge (using the WebAuthn library). 
            ▪ Subtask 6.15.9.5: If valid, extract credentialId, publicKey, counter, transports, and store them on the User document's webAuthnCredentials array. 
            ▪ Subtask 6.15.9.6: Update has2FAEnabled flag (if this is the first MFA method). 
            ▪ Subtask 6.15.9.7: Audit Logging: Log new WebAuthn authenticator registration. 
        ◦ Task 6.15.10: Create Get WebAuthn Authenticators Endpoint 
            ▪ Subtask 6.15.10.1: Design and implement GET /api/customer/security/webauthn/authenticators. 
            ▪ Subtask 6.15.10.2: Apply customer authentication. 
            ▪ Subtask 6.15.10.3: Return the list of registered authenticators (friendly name, id, creation date). 
        ◦ Task 6.15.11: Create Rename WebAuthn Authenticator Endpoint 
            ▪ Subtask 6.15.11.1: Design and implement PUT /api/customer/security/webauthn/authenticators/:id. 
            ▪ Subtask 6.15.11.2: Apply customer authentication. 
            ▪ Subtask 6.15.11.3: Validate authenticator id belongs to the authenticated user. 
            ▪ Subtask 6.15.11.4: Update the friendlyName. 
        ◦ Task 6.15.12: Create Remove WebAuthn Authenticator Endpoint 
            ▪ Subtask 6.15.12.1: Design and implement DELETE /api/customer/security/webauthn/authenticators/:id. 
            ▪ Subtask 6.15.12.2: Apply customer authentication, and potentially require re-authentication (password or another MFA). 
            ▪ Subtask 6.15.12.3: Validate authenticator id belongs to the authenticated user. 
            ▪ Subtask 6.15.12.4: Remove the authenticator from the webAuthnCredentials array. 
            ▪ Subtask 6.15.12.5: If it was the last/only MFA method, update has2FAEnabled accordingly. 
            ▪ Subtask 6.15.12.6: Audit Logging: Log WebAuthn authenticator removal. 
        ◦ Task 6.15.13: Modify Login Endpoint for WebAuthn MFA 
            ▪ Subtask 6.15.13.1: Enhance POST /api/auth/login (from 6.9) to handle WebAuthn challenges. 
            ▪ Subtask 6.15.13.2: If user has WebAuthn credentials, after password verification, return a WebAuthn authenticationOptions challenge. 
            ▪ Subtask 6.15.13.3: Create new endpoint POST /api/auth/webauthn-verify to receive the clientAssertionResponse and verify it against the challenge and stored credentials. 
            ▪ Subtask 6.15.13.4: If valid, issue the full JWT. 
            ▪ Subtask 6.15.13.5: Update the counter for the used authenticator. 
        ◦ Task 6.15.14: (Optional) Implement WebAuthn Passwordless Login 
            ▪ Subtask 6.15.14.1: Create POST /api/auth/webauthn-login-options to initiate login challenge based on username/email. 
            ▪ Subtask 6.15.14.2: Create POST /api/auth/webauthn-login-verify to verify assertion response and issue JWT. 
    • Security & Data Integrity Tasks (Extremely Critical!):
        ◦ Task 6.15.15: WebAuthn Protocol Adherence 
            ▪ Subtask 6.15.15.1: Rigorously follow FIDO2/WebAuthn specifications for challenge generation, response verification, and counter management. 
            ▪ Subtask 6.15.15.2: Ensure server-side verification of all WebAuthn parameters (flags, signatures, rpIdHash, origin, challenge, credentialId, counter). 
        ◦ Task 6.15.16: Secure Storage of Credentials 
            ▪ Subtask 6.15.16.1: Store publicKey and credentialId as binary data (Buffer) and encrypt at rest. 
        ◦ Task 6.15.17: Recovery Mechanism 
            ▪ Subtask 6.15.17.1: Ensure recovery codes (from 6.9) are still the primary backup. Emphasize their importance. 
            ▪ Subtask 6.15.17.2: Implement a secure account recovery process in case all MFA methods are lost/inaccessible (e.g., email verification, support ticket with ID verification). 
    • Testing Tasks:
        ◦ Task 6.15.18: Write Unit Tests 
            ▪ Subtask 6.15.18.1: Unit tests for WebAuthn server-side challenge generation and response verification (mocking client responses). 
            ▪ Subtask 6.15.18.2: Unit tests for authenticator management (add, remove, rename). 
        ◦ Task 6.15.19: Write Integration Tests 
            ▪ Subtask 6.15.19.1: Register a test user. Log in. 
            ▪ Subtask 6.15.19.2: Call POST /api/customer/security/webauthn/registration-options. Simulate client response and call POST /api/customer/security/webauthn/register-authenticator. Verify authenticator is added. 
            ▪ Subtask 6.15.19.3: Call GET /api/customer/security/webauthn/authenticators. Verify the new authenticator is listed. 
            ▪ Subtask 6.15.19.4: Test login flow: Password then WebAuthn authentication. 
            ▪ Subtask 6.15.19.5: Test renaming an authenticator. 
            ▪ Subtask 6.15.19.6: Test removing an authenticator (requires re-auth). 
            ▪ Subtask 6.15.19.7: Test unauthorized access. 
        ◦ Task 6.15.20: Manual End-to-End Testing (Requires physical device/browser support) 
            ▪ Subtask 6.15.20.1: Log in as a customer. Navigate to "My Account" -> "Security." 
            ▪ Subtask 6.15.20.2: Initiate "Register New Security Key / Biometric Device." Follow browser/OS prompts to register Touch ID/Face ID/Windows Hello or a physical FIDO key. Verify success and authenticator appears in the list. 
            ▪ Subtask 6.15.20.3: Log out. Attempt to log in. After password, verify WebAuthn MFA prompt appears. Use the registered authenticator to complete login. 
            ▪ Subtask 6.15.20.4: Test renaming an authenticator. 
            ▪ Subtask 6.15.20.5: Test removing an authenticator. 
            ▪ Subtask 6.15.20.6: (If passwordless is implemented) Test logging in without a password using only a WebAuthn authenticator.
Epic 6: Customer Account Management Enhancements
Story 6.16: Social Media Account Linking/Unlinking
Story: As a registered customer, I want to be able to link my store account to popular social media accounts (e.g., Google, Facebook) for easier login, and unlink them if desired, so that I have flexible login options.
Acceptance Criteria:
    1. A "Social Accounts" or "Linked Accounts" section is available in the "My Account" navigation (potentially within the "Security" page from 6.9, or a new dedicated page). 
    2. The "Social Accounts" section displays: 
        ◦ A list of supported social providers (e.g., Google, Facebook). 
        ◦ For each provider, its current linking status (e.g., "Linked," "Not Linked"). 
        ◦ A "Link" button for unlinked accounts. 
        ◦ An "Unlink" button for linked accounts. 
    3. Linking Process: 
        ◦ Clicking "Link" redirects the user to the social provider's authorization page. 
        ◦ After successful authorization, the user is redirected back to the store, and the account is linked. 
        ◦ A confirmation message is displayed, and the social account's status updates to "Linked." 
        ◦ If linking an account that already exists as a separate user in the system (same email), the system should prompt the user to merge or choose. For simplicity of this story, we assume the social account's email must match the current logged-in user's email, or a new email is prompted. 
    4. Unlinking Process: 
        ◦ Clicking "Unlink" prompts a confirmation dialog. 
        ◦ Upon confirmation, the social account is unlinked from the store account. 
        ◦ The store account remains accessible via its primary password login. 
        ◦ A confirmation message is displayed, and the social account's status updates to "Not Linked." 
        ◦ A customer cannot unlink their last remaining login method (if their only method is social login and they don't have a password set). 
    5. Social Login on Primary Login Page: 
        ◦ On the main login/registration page, "Login with [Social Provider]" buttons are available. 
        ◦ If a customer logs in via social media and their account is already linked, they are logged in directly. 
        ◦ If a customer logs in via social media and their account (by email) does not exist, a new account is created and automatically linked. 
        ◦ If a customer logs in via social media and their account (by email) already exists but is not linked, the system should prompt them to link the accounts, possibly requiring their existing password for verification. 
    6. User data (email, name) retrieved from social providers is used to populate/update the user's profile during linking/registration. 
    7. All social linking/unlinking operations are securely handled via OAuth 2.0. 

Granular Tasks & Subtasks for Story 6.16:
    • Frontend Tasks (Login/Registration Page & Customer Account Panel):
        ◦ Task 6.16.1: Implement Social Login Buttons on Login/Registration Pages 
            ▪ Subtask 6.16.1.1: Add "Continue with Google" and "Continue with Facebook" (and others) buttons to LoginPage and RegistrationPage. 
            ▪ Subtask 6.16.1.2: Implement click handlers that initiate the OAuth flow (redirect to backend endpoint, e.g., /api/auth/google). 
        ◦ Task 6.16.2: Implement "Social Accounts" Section in My Account 
            ▪ Subtask 6.16.2.1: Add a "Social Accounts" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.16.2.2: Create CustomerSocialAccountsPage component/route (e.g., /account/social). 
            ▪ Subtask 6.16.2.3: Display a list of supported social providers (icons, names). 
            ▪ Subtask 6.16.2.4: For each provider, display status ("Linked"/"Not Linked"). 
            ▪ Subtask 6.16.2.5: Implement "Link" button that initiates OAuth flow. 
            ▪ Subtask 6.16.2.6: Implement "Unlink" button with confirmation modal. 
            ▪ Subtask 6.16.2.7: Provide clear messaging regarding primary login method and unlinking rules. 
        ◦ Task 6.16.3: Handle OAuth Redirects & UI Updates 
            ▪ Subtask 6.16.3.1: Design a success/error page or notification handling for post-OAuth redirects (e.g., /auth/callback?status=success&provider=google). 
            ▪ Subtask 6.16.3.2: Update the UI on the "Social Accounts" page to reflect linking/unlinking status changes. 
    • Backend Tasks (Authentication Service & User Management):
        ◦ Task 6.16.4: Update User Model for Social Links 
            ▪ Subtask 6.16.4.1: Add a field socialLogins: [{ provider: String, socialId: String, email: String, linkedAt: Date }] to the User schema. 
            ▪ Subtask 6.16.4.2: Ensure the email field on the User model is unique and indexed. 
        ◦ Task 6.16.5: Configure OAuth Providers 
            ▪ Subtask 6.16.5.1: Register your application with Google, Facebook, etc., to obtain Client ID and Client Secret. 
            ▪ Subtask 6.16.5.2: Configure authorized redirect URIs in social provider settings. 
            ▪ Subtask 6.16.5.3: Store Client IDs/Secrets securely (environment variables). 
        ◦ Task 6.16.6: Implement OAuth Initiation Endpoints 
            ▪ Subtask 6.16.6.1: Create endpoints for each provider (e.g., GET /api/auth/google, GET /api/auth/facebook) that redirect to the social provider's authorization URL. 
            ▪ Subtask 6.16.6.2: Include scope (e.g., email, profile) and state parameters. 
        ◦ Task 6.16.7: Implement OAuth Callback Endpoints 
            ▪ Subtask 6.16.7.1: Create callback endpoints for each provider (e.g., GET /api/auth/google/callback, GET /api/auth/facebook/callback) to receive authorization codes. 
            ▪ Subtask 6.16.7.2: Exchange the authorization code for an accessToken from the social provider. 
            ▪ Subtask 6.16.7.3: Use the accessToken to fetch user profile data (email, name, social ID). 
            ▪ Subtask 6.16.7.4: Login Logic: 
                • If the social ID is already linked to an existing user: log in that user. 
                • If the social ID is not linked, but the email matches an existing user: 
                    ◦ If the user is currently logged in, link the social account to their existing account. 
                    ◦ If the user is not logged in, prompt them to log in with password to link (or create a new account if they confirm it's a separate entity). 
                • If neither social ID nor email exists: Create a new user account and link the social ID. 
            ▪ Subtask 6.16.7.5: Issue the store's authentication token (JWT) to the user. 
            ▪ Subtask 6.16.7.6: Redirect back to frontend with success/error status. 
        ◦ Task 6.16.8: Create Get Linked Social Accounts API Endpoint 
            ▪ Subtask 6.16.8.1: Design and implement GET /api/customer/social-accounts. 
            ▪ Subtask 6.16.8.2: Apply customer authentication. 
            ▪ Subtask 6.16.8.3: Return the socialLogins array from the authenticated user's document. 
        ◦ Task 6.16.9: Create Unlink Social Account API Endpoint 
            ▪ Subtask 6.16.9.1: Design and implement POST /api/customer/social-accounts/unlink. 
            ▪ Subtask 6.16.9.2: Apply customer authentication. 
            ▪ Subtask 6.16.9.3: Receive the provider to unlink. 
            ▪ Subtask 6.16.9.4: Check if the user has other login methods (e.g., password, another social link) before unlinking to prevent locking them out. 
            ▪ Subtask 6.16.9.5: Remove the social entry from the socialLogins array in the User document. 
            ▪ Subtask 6.16.9.6: Audit Logging: Log social account unlinking. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.16.10: CSRF Protection for OAuth Redirects 
            ▪ Subtask 6.16.10.1: Implement state parameter verification during OAuth callback to prevent CSRF attacks. 
        ◦ Task 6.16.11: Secure Storage of Tokens/Secrets 
            ▪ Subtask 6.16.11.1: Client secrets should never be exposed on the frontend. 
            ▪ Subtask 6.16.11.2: If refreshToken is obtained (not always necessary for simple login), store it securely if persistence is needed. 
        ◦ Task 6.16.12: Email Consistency / Merging Logic 
            ▪ Subtask 6.16.12.1: Carefully design logic for handling cases where a social account's email matches an existing store account not yet linked. 
            ▪ Subtask 6.16.12.2: Consider requiring password re-authentication for account merging to prevent malicious linking. 
    • Testing Tasks:
        ◦ Task 6.16.13: Write Unit Tests 
            ▪ Subtask 6.16.13.1: Unit tests for backend logic of processing OAuth callbacks (mocking social provider responses). 
            ▪ Subtask 6.16.13.2: Unit tests for linking/unlinking logic on User model. 
        ◦ Task 6.16.14: Write Integration Tests 
            ▪ Subtask 6.16.14.1: Test new user registration via social login (e.g., Google). Verify account creation and linking. 
            ▪ Subtask 6.16.14.2: Create a user with password. Log in. Link a social account. Verify socialLogins array is updated. 
            ▪ Subtask 6.16.14.3: Test login using the newly linked social account. 
            ▪ Subtask 6.16.14.4: Unlink the social account. Verify socialLogins array is updated and password login still works. 
            ▪ Subtask 6.16.14.5: Test edge cases: attempting to link a social account that's already linked to another user. 
            ▪ Subtask 6.16.14.6: Test unlinking the only login method (should be prevented). 
        ◦ Task 6.16.15: Manual End-to-End Testing (Requires real social media accounts) 
            ▪ Subtask 6.16.15.1: On a clean browser, use "Login with Google" to create a brand new account. Verify registration and login. 
            ▪ Subtask 6.16.15.2: Create a regular account with email/password. Log in. Navigate to "My Account" -> "Social Accounts." 
            ▪ Subtask 6.16.15.3: Click "Link" for Google. Go through the Google authorization flow. Verify the account is linked in the UI. 
            ▪ Subtask 6.16.15.4: Log out. Try logging in using the linked Google account. Verify successful login. 
            ▪ Subtask 6.16.15.5: Log in with email/password. Navigate to "Social Accounts." Click "Unlink" for Google. Confirm. Verify the account is unlinked. 
            ▪ Subtask 6.16.15.6: Test the "unlink last method" scenario by having only a social login, then attempting to unlink (should show an error/warning).
Epic 6: Customer Account Management Enhancements
Story 6.17: Gift Card Management
Story: As a registered customer, I want to be able to view the balance of gift cards I own, redeem new gift cards to my account, and potentially apply them directly to purchases, so that I can easily manage my store credit.
Acceptance Criteria:
    1. A "Gift Cards" or "Store Credit" link is available in the "My Account" navigation. 
    2. Clicking the "Gift Cards" link takes the customer to a dashboard displaying their gift card information. 
    3. The Gift Card dashboard displays: 
        ◦ A list of all gift cards currently associated with their account. 
        ◦ For each gift card: 
            ▪ The Gift Card Code (masked, with an option to reveal). 
            ▪ Current Balance. 
            ▪ Original Value. 
            ▪ Expiry Date (if applicable). 
            ▪ Status (e.g., "Active," "Used," "Expired"). 
            ▪ Date Added/Redeemed. 
    4. There is an option to "Add a New Gift Card" to the account. This involves: 
        ◦ An input field for the gift card code. 
        ◦ A confirmation of the card's value and successful addition. 
        ◦ The balance is added to the customer's overall store credit, or the card is listed with its balance. 
    5. Gift cards can be applied during the checkout process (if not fully redeemed to account balance). 
    6. Customers can view transactions related to their gift card balance (e.g., "Used $X for Order #Y"). 
    7. All gift card operations are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.17:
    • Frontend Tasks (Customer Account Panel & Checkout Page):
        ◦ Task 6.17.1: Implement "Gift Cards" Navigation Link & Dashboard 
            ▪ Subtask 6.17.1.1: Add a "Gift Cards" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.17.1.2: Create CustomerGiftCardsPage component/route (e.g., /account/gift-cards). 
            ▪ Subtask 6.17.1.3: Design a layout to display the list of owned gift cards. 
            ▪ Subtask 6.17.1.4: For each card, show masked code, current balance, original value, expiry, status, and date. 
            ▪ Subtask 6.17.1.5: Implement a toggle/button to reveal the full gift card code (for copying/manual use). 
            ▪ Subtask 6.17.1.6: Add a form/modal for "Add New Gift Card" with an input field for the code. 
            ▪ Subtask 6.17.1.7: Display success/error messages for adding cards. 
            ▪ Subtask 6.17.1.8: (Optional) Display a summarized overall "Store Credit" balance. 
        ◦ Task 6.17.2: Frontend API Integration: Gift Card Management 
            ▪ Subtask 6.17.2.1: Create service/hook for GET /api/customer/gift-cards (to fetch all cards). 
            ▪ Subtask 6.17.2.2: Create service/hook for POST /api/customer/gift-cards/redeem (to add a new card by code). 
            ▪ Subtask 6.17.2.3: (Optional) Create service/hook for GET /api/customer/gift-cards/:id/transactions to view history. 
        ◦ Task 6.17.3: Integrate Gift Card Application into Checkout (if not already done in Epic 3) 
            ▪ Subtask 6.17.3.1: On the checkout page (e.g., payment step), provide an option to apply a gift card code or use available store credit. 
            ▪ Subtask 6.17.3.2: Implement frontend validation for gift card codes before applying. 
            ▪ Subtask 6.17.3.3: Display the applied gift card balance and update the order total. 
    • Backend Tasks (Gift Card Service & Customer API):
        ◦ Task 6.17.4: Design Gift Card Data Model 
            ▪ Subtask 6.17.4.1: Create a new GiftCard collection schema. Include: 
                • code: String (unique, indexed). 
                • originalValue: Number. 
                • currentBalance: Number. 
                • ownerId: ObjectId (ref to User, optional, for cards added to account). 
                • expiryDate: Date (optional). 
                • status: String (e.g., 'active', 'redeemed', 'expired'). 
                • createdAt, updatedAt. 
                • transactions: [{ type: String, amount: Number, orderId: ObjectId, timestamp: Date }] (for audit trail). 
        ◦ Task 6.17.5: Create Get Customer Gift Cards API Endpoint 
            ▪ Subtask 6.17.5.1: Design and implement GET /api/customer/gift-cards. 
            ▪ Subtask 6.17.5.2: Apply customer authentication. 
            ▪ Subtask 6.17.5.3: Query GiftCard collection for cards with ownerId matching the authenticated user. 
            ▪ Subtask 6.17.5.4: Return relevant gift card details (masking code). 
        ◦ Task 6.17.6: Create Redeem Gift Card API Endpoint 
            ▪ Subtask 6.17.6.1: Design and implement POST /api/customer/gift-cards/redeem. 
            ▪ Subtask 6.17.6.2: Apply customer authentication. 
            ▪ Subtask 6.17.6.3: Receive the giftCardCode. 
            ▪ Subtask 6.17.6.4: Validate the giftCardCode (exists, not expired, active, not already fully redeemed, not already assigned to another user). 
            ▪ Subtask 6.17.6.5: Assign ownerId to the authenticated user on the GiftCard document. 
            ▪ Subtask 6.17.6.6: Add a transaction record to the GiftCard's transactions array for redemption. 
            ▪ Subtask 6.17.6.7: Return the redeemed card's details. 
            ▪ Subtask 6.17.6.8: Audit Logging: Log gift card redemption. 
        ◦ Task 6.17.7: Implement Gift Card Application Logic (Checkout/Order Processing) 
            ▪ Subtask 6.17.7.1: Modify the order calculation/payment processing logic (e.g., in POST /api/checkout/process-order). 
            ▪ Subtask 6.17.7.2: If a gift card code is provided, or if the user has available store credit (from owned cards): 
                • Validate the gift card(s) and their available balance. 
                • Deduct amount from the gift card(s) or overall store credit. 
                • Update currentBalance of the GiftCard document(s). 
                • Add transaction records to the GiftCard's transactions array linking to the orderId. 
                • Adjust the total payment due from other methods. 
            ▪ Subtask 6.17.7.3: Handle cases where gift card balance is insufficient or exceeds order total. 
            ▪ Subtask 6.17.7.4: Audit Logging: Log gift card usage in order. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.17.8: Secure Gift Card Codes & Balances 
            ▪ Subtask 6.17.8.1: Ensure gift card codes are unique and sufficiently complex/long to prevent brute-forcing. 
            ▪ Subtask 6.17.8.2: Implement rate limiting on gift card redemption attempts. 
            ▪ Subtask 6.17.8.3: Ensure only the ownerId (or admin) can see a gift card's full details or use its balance. 
            ▪ Subtask 6.17.8.4: Implement transactional integrity for balance updates (e.g., database transactions) to prevent race conditions during redemption/usage. 
    • Testing Tasks:
        ◦ Task 6.17.9: Write Unit Tests 
            ▪ Subtask 6.17.9.1: Unit tests for gift card balance updates. 
            ▪ Subtask 6.17.9.2: Unit tests for redemption logic (valid/invalid codes, expired cards). 
            ▪ Subtask 6.17.9.3: Unit tests for gift card application during checkout (various scenarios of balance). 
        ◦ Task 6.17.10: Write Integration Tests 
            ▪ Subtask 6.17.10.1: Create a test gift card in the database (e.g., code GC123, value $50). 
            ▪ Subtask 6.17.10.2: Register a test user. Log in. 
            ▪ Subtask 6.17.10.3: Call POST /api/customer/gift-cards/redeem with GC123. Verify it's added to the user's account and balance is correct. 
            ▪ Subtask 6.17.10.4: Call GET /api/customer/gift-cards. Verify GC123 is listed with correct details (masked code). 
            ▪ Subtask 6.17.10.5: Place an order, applying GC123. Verify the order total is reduced, and the currentBalance of GC123 is updated. 
            ▪ Subtask 6.17.10.6: Attempt to use an expired/invalid gift card. 
            ▪ Subtask 6.17.10.7: Test unauthorized access. 
        ◦ Task 6.17.11: Manual End-to-End Testing 
            ▪ Subtask 6.17.11.1: Log in as a customer. Navigate to "My Account" -> "Gift Cards." 
            ▪ Subtask 6.17.11.2: Obtain a valid test gift card code from the admin panel or test data. 
            ▪ Subtask 6.17.11.3: Use the "Add New Gift Card" form to redeem the gift card. Verify it appears in the list with the correct balance. 
            ▪ Subtask 6.17.11.4: Add items to cart. Proceed to checkout. In the payment section, apply the gift card. Verify the discount is applied to the order. Complete the purchase. 
            ▪ Subtask 6.17.11.5: Return to "My Account" -> "Gift Cards." Verify the balance of the used gift card is updated. 
            ▪ Subtask 6.17.11.6: Test with an invalid/expired gift card. 
            ▪ Subtask 6.17.11.7: Test revealing the masked gift card code.
Epic 6: Customer Account Management Enhancements
Story 6.18: Address Book Management
Story: As a registered customer, I want to be able to save, edit, and delete multiple shipping and billing addresses in my account's address book, and designate a default shipping and billing address, so that I can quickly select addresses during checkout without re-entering them.
Acceptance Criteria:
    1. An "Addresses" or "Address Book" link is available in the "My Account" navigation. 
    2. Clicking the "Addresses" link takes the customer to a page displaying all their saved addresses. 
    3. For each saved address, the following details are displayed: 
        ◦ Full Address (formatted for readability). 
        ◦ Address Nickname (e.g., "Home," "Work," "Mom's House"). 
        ◦ Indication if it's the current "Default Shipping" or "Default Billing" address. 
        ◦ Options to: 
            ▪ Edit the address. 
            ▪ Delete the address. 
            ▪ Set as "Default Shipping Address." 
            ▪ Set as "Default Billing Address." 
    4. The customer can add a new address by providing all required address fields (Name, Street, City, State/Province, Postal Code, Country, Phone, optional Nickname). 
    5. The customer can edit an existing address, updating any of its fields. 
    6. The customer can delete an address (with a confirmation prompt). 
    7. Designating an address as default shipping or billing updates the default settings, making it pre-selected during checkout. 
    8. The checkout process should automatically use the default addresses, but allow selection from the address book or entering a new one. 
    9. All address book operations are securely performed by the authenticated user and only for their own addresses. 

Granular Tasks & Subtasks for Story 6.18:
    • Frontend Tasks (Customer Account Panel & Checkout Page):
        ◦ Task 6.18.1: Implement "Addresses" Navigation Link & List Page 
            ▪ Subtask 6.18.1.1: Add an "Addresses" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.18.1.2: Create CustomerAddressesPage component/route (e.g., /account/addresses). 
            ▪ Subtask 6.18.1.3: Design and implement a layout to display a list of saved addresses. 
            ▪ Subtask 6.18.1.4: For each address, display formatted address, nickname, and default status indicators. 
            ▪ Subtask 6.18.1.5: Add "Edit," "Delete," "Set as Default Shipping," and "Set as Default Billing" buttons/links for each address. 
            ▪ Subtask 6.18.1.6: Handle empty state (no addresses saved). 
        ◦ Task 6.18.2: Implement "Add New Address" Form UI 
            ▪ Subtask 6.18.2.1: Add an "Add New Address" button. 
            ▪ Subtask 6.18.2.2: Create AddressForm component (can be a modal or dedicated page, e.g., /account/addresses/new). 
            ▪ Subtask 6.18.2.3: Implement input fields for all address components (name, street, city, postal code, country, phone, nickname). 
            ▪ Subtask 6.18.2.4: Include dropdown for Country (pre-populated with available countries). 
            ▪ Subtask 6.18.2.5: Add "Save" and "Cancel" buttons. 
        ◦ Task 6.18.3: Implement "Edit Address" Form UI 
            ▪ Subtask 6.18.3.1: Re-use AddressForm component, pre-filling with existing address data when editing. 
        ◦ Task 6.18.4: Implement "Delete Address" Confirmation 
            ▪ Subtask 6.18.4.1: On clicking "Delete," display a confirmation modal/dialog. 
            ▪ Subtask 6.18.4.2: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 6.18.5: Frontend API Integration: Address Book Management 
            ▪ Subtask 6.18.5.1: Create service/hook for GET /api/customer/addresses (to fetch all addresses and defaults). 
            ▪ Subtask 6.18.5.2: Create service/hook for POST /api/customer/addresses (to add a new address). 
            ▪ Subtask 6.18.5.3: Create service/hook for PUT /api/customer/addresses/:addressId (to edit an address). 
            ▪ Subtask 6.18.5.4: Create service/hook for DELETE /api/customer/addresses/:addressId (to delete an address). 
            ▪ Subtask 6.18.5.5: Create service/hook for PUT /api/customer/addresses/default-shipping/:addressId (to set default shipping). 
            ▪ Subtask 6.18.5.6: Create service/hook for PUT /api/customer/addresses/default-billing/:addressId (to set default billing). 
        ◦ Task 6.18.6: Integrate Address Book into Checkout Flow 
            ▪ Subtask 6.18.6.1: On the shipping/billing steps of CheckoutPage, display saved addresses. 
            ▪ Subtask 6.18.6.2: Implement radio buttons or a dropdown to select a saved address. 
            ▪ Subtask 6.18.6.3: Ensure default addresses are pre-selected. 
            ▪ Subtask 6.18.6.4: Provide an option to "Enter a new address" which brings up the AddressForm. 
    • Backend Tasks (Customer API & Address Service):
        ◦ Task 6.18.7: Update User Model for Address Book & Defaults 
            ▪ Subtask 6.18.7.1: Add addresses: [{ ...addressFields, _id: ObjectId }] (sub-document array) to User schema. 
            ▪ Subtask 6.18.7.2: Add defaultShippingAddressId: ObjectId and defaultBillingAddressId: ObjectId to User schema. 
        ◦ Task 6.18.8: Create Get Customer Addresses API Endpoint 
            ▪ Subtask 6.18.8.1: Design and implement GET /api/customer/addresses. 
            ▪ Subtask 6.18.8.2: Apply customer authentication. 
            ▪ Subtask 6.18.8.3: Return the addresses array, defaultShippingAddressId, and defaultBillingAddressId for the authenticated user. 
        ◦ Task 6.18.9: Create Add New Address API Endpoint 
            ▪ Subtask 6.18.9.1: Design and implement POST /api/customer/addresses. 
            ▪ Subtask 6.18.9.2: Apply customer authentication. 
            ▪ Subtask 6.18.9.3: Receive address data. 
            ▪ Subtask 6.18.9.4: Implement server-side validation for all address fields (required fields, format). 
            ▪ Subtask 6.18.9.5: Add the new address object to the addresses array of the User document. 
            ▪ Subtask 6.18.9.6: If this is the first address, set it as both default shipping and billing. 
            ▪ Subtask 6.18.9.7: Audit Logging: Log new address creation. 
        ◦ Task 6.18.10: Create Edit Address API Endpoint 
            ▪ Subtask 6.18.10.1: Design and implement PUT /api/customer/addresses/:addressId. 
            ▪ Subtask 6.18.10.2: Apply customer authentication. 
            ▪ Subtask 6.18.10.3: Validate addressId belongs to the authenticated user. 
            ▪ Subtask 6.18.10.4: Receive updated address data. 
            ▪ Subtask 6.18.10.5: Update the specific address sub-document in the addresses array. 
            ▪ Subtask 6.18.10.6: Audit Logging: Log address edit. 
        ◦ Task 6.18.11: Create Delete Address API Endpoint 
            ▪ Subtask 6.18.11.1: Design and implement DELETE /api/customer/addresses/:addressId. 
            ▪ Subtask 6.18.11.2: Apply customer authentication. 
            ▪ Subtask 6.18.11.3: Validate addressId belongs to the authenticated user. 
            ▪ Subtask 6.18.11.4: Remove the address sub-document from the addresses array. 
            ▪ Subtask 6.18.11.5: If the deleted address was a default, clear the respective defaultShippingAddressId/defaultBillingAddressId. 
            ▪ Subtask 6.18.11.6: Audit Logging: Log address deletion. 
        ◦ Task 6.18.12: Create Set Default Shipping/Billing Address Endpoints 
            ▪ Subtask 6.18.12.1: Design and implement PUT /api/customer/addresses/default-shipping/:addressId. 
            ▪ Subtask 6.18.12.2: Design and implement PUT /api/customer/addresses/default-billing/:addressId. 
            ▪ Subtask 6.18.12.3: Apply customer authentication. 
            ▪ Subtask 6.18.12.4: Validate addressId exists in the user's addresses array. 
            ▪ Subtask 6.18.12.5: Update defaultShippingAddressId or defaultBillingAddressId on the User document. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.18.13: Strict Authorization for Addresses 
            ▪ Subtask 6.18.13.1: Ensure a customer can only manage their own addresses. 
            ▪ Subtask 6.18.13.2: Implement robust server-side validation for all address fields to prevent invalid data. 
            ▪ Subtask 6.18.13.3: Sanitize all address inputs to prevent injection attacks. 
    • Testing Tasks:
        ◦ Task 6.18.14: Write Unit Tests 
            ▪ Subtask 6.18.14.1: Unit tests for backend logic of adding, editing, and deleting addresses within the User document. 
            ▪ Subtask 6.18.14.2: Unit tests for setting/clearing default addresses. 
            ▪ Subtask 6.18.14.3: Unit tests for address validation. 
        ◦ Task 6.18.15: Write Integration Tests 
            ▪ Subtask 6.18.15.1: Register a test user. Log in. 
            ▪ Subtask 6.18.15.2: Call POST /api/customer/addresses to add several addresses. Verify they are added. 
            ▪ Subtask 6.18.15.3: Call GET /api/customer/addresses. Verify all addresses are returned, and defaults are initially set if it was the first address. 
            ▪ Subtask 6.18.15.4: Call PUT /api/customer/addresses/:addressId to edit an address. Verify updates. 
            ▪ Subtask 6.18.15.5: Call PUT /api/customer/addresses/default-shipping/:addressId and default-billing. Verify default IDs are updated. 
            ▪ Subtask 6.18.15.6: Call DELETE /api/customer/addresses/:addressId. Verify deletion and default cleanup. 
            ▪ Subtask 6.18.15.7: Test unauthorized access. 
        ◦ Task 6.18.16: Manual End-to-End Testing 
            ▪ Subtask 6.18.16.1: Log in as a customer. Navigate to "My Account" -> "Addresses." 
            ▪ Subtask 6.18.16.2: Click "Add New Address." Fill out the form and save. Verify the new address appears. 
            ▪ Subtask 6.18.16.3: Add a second address. Set one as "Default Shipping" and another as "Default Billing." Verify indicators update correctly. 
            ▪ Subtask 6.18.16.4: Click "Edit" on an address. Make changes and save. Verify updates. 
            ▪ Subtask 6.18.16.5: Click "Delete" on an address. Confirm. Verify it's removed. 
            ▪ Subtask 6.18.16.6: Add items to cart. Proceed to checkout. On the shipping/billing steps, verify saved addresses are available for selection, and default addresses are pre-selected. Test selecting a different address from the book. 
            ▪ Subtask 6.18.16.7: Test adding a new address directly from checkout.
Epic 6: Customer Account Management Enhancements
Story 6.19: Order Tracking Enhancements
Story: As a registered customer, I want to be able to view a detailed, visual, and up-to-date tracking status for my orders, including carrier information and estimated delivery dates, so that I can easily monitor my package's journey without needing to leave the store's website.
Acceptance Criteria:
    1. On the "My Orders" page (from previous stories, e.g., 6.6), each order with a "Shipped" or similar status has a clear "Track Order" button or link. 
    2. Clicking "Track Order" takes the customer to a dedicated "Order Tracking Detail" page for that specific order. 
    3. The "Order Tracking Detail" page displays: 
        ◦ Order Summary: Order Number, Date Placed, Total. 
        ◦ Shipping Information: Shipping Address, Carrier Name, Tracking Number (clickable link to carrier's tracking page as a fallback). 
        ◦ Visual Progress Bar/Timeline: A clear, graphical representation of the package's journey (e.g., "Order Placed" -> "Processing" -> "Shipped" -> "In Transit" -> "Out for Delivery" -> "Delivered"). 
        ◦ Latest Tracking Event: The most recent status update (e.g., "Package arrived at sorting facility," "Out for delivery"). 
        ◦ Detailed Tracking History: A chronological list of all tracking events (date, time, location, status description). 
        ◦ Estimated Delivery Date: If available from the carrier. 
        ◦ Contact Information: Link to customer support regarding the order. 
    4. Tracking information is updated dynamically (e.g., via webhooks from carrier APIs or frequent polling). 
    5. All order tracking details are securely displayed only to the authenticated customer for their own orders. 

Granular Tasks & Subtasks for Story 6.19:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.19.1: Enhance "My Orders" List with "Track Order" Button 
            ▪ Subtask 6.19.1.1: Modify CustomerOrdersPage (from 6.6) to add a "Track Order" button or link next to each relevant order (status like 'Shipped', 'Partial Shipped', etc.). 
            ▪ Subtask 6.19.1.2: Ensure the link points to the new OrderTrackingDetailPage with the orderId. 
        ◦ Task 6.19.2: Implement Order Tracking Detail Page UI 
            ▪ Subtask 6.19.2.1: Create OrderTrackingDetailPage component/route (e.g., /account/orders/:orderId/track). 
            ▪ Subtask 6.19.2.2: Design sections for order summary, shipping details (carrier, tracking number). 
            ▪ Subtask 6.19.2.3: Implement a visual timeline/progress bar component (e.g., using SVG or CSS steps). 
            ▪ Subtask 6.19.2.4: Implement a table or list to display detailed tracking events. 
            ▪ Subtask 6.19.2.5: Display estimated delivery date and latest status prominently. 
            ▪ Subtask 6.19.2.6: Add fallback link to external carrier tracking page. 
            ▪ Subtask 6.19.2.7: Handle loading states and errors (e.g., "Tracking info not available yet"). 
        ◦ Task 6.19.3: Frontend API Integration: Fetch Order Tracking Details 
            ▪ Subtask 6.19.3.1: Create service/hook to call GET /api/customer/orders/:orderId/tracking. 
            ▪ Subtask 6.19.3.2: Map the received tracking data to the UI components (timeline, events). 
    • Backend Tasks (Order Service & Tracking Integration):
        ◦ Task 6.19.4: Update Order Data Model for Tracking Information 
            ▪ Subtask 6.19.4.1: Augment Order schema to include: 
                • trackingNumber: String (nullable). 
                • carrier: String (e.g., 'UPS', 'FedEx', 'DHL'). 
                • trackingURL: String (dynamically generated or provided by carrier). 
                • trackingHistory: [{ status: String, description: String, location: String, timestamp: Date }] (array of tracking events). 
                • estimatedDeliveryDate: Date (optional). 
        ◦ Task 6.19.5: Implement Carrier Tracking API Integration 
            ▪ Subtask 6.19.5.1: Research and select a tracking API aggregator (e.g., AfterShip, EasyPost, ShipStation) or integrate directly with major carriers (UPS, FedEx, DHL, USPS). 
            ▪ Subtask 6.19.5.2: Obtain API keys and credentials for chosen tracking provider(s). 
            ▪ Subtask 6.19.5.3: Implement a service to make API calls to fetch tracking details using carrier and trackingNumber. 
            ▪ Subtask 6.19.5.4: Handle different carrier responses and error codes. 
        ◦ Task 6.19.6: Create Get Order Tracking API Endpoint 
            ▪ Subtask 6.19.6.1: Design and implement GET /api/customer/orders/:orderId/tracking. 
            ▪ Subtask 6.19.6.2: Apply customer authentication. 
            ▪ Subtask 6.19.6.3: Validate orderId belongs to the authenticated user. 
            ▪ Subtask 6.19.6.4: Retrieve the order document. 
            ▪ Subtask 6.19.6.5: If trackingNumber and carrier exist, call the internal Carrier Tracking Service (from 6.19.5.3) to fetch the latest tracking data. 
            ▪ Subtask 6.19.6.6: Store (cache) the fetched tracking history on the Order document or a separate OrderTracking document to reduce external API calls. Define caching strategy (e.g., refresh every 15-30 mins or on webhook). 
            ▪ Subtask 6.19.6.7: Return formatted tracking details. 
        ◦ Task 6.19.7: Integrate Tracking Number Assignment into Order Fulfillment 
            ▪ Subtask 6.19.7.1: Modify the order fulfillment process (e.g., when an admin marks an order as 'Shipped'). 
            ▪ Subtask 6.19.7.2: When the tracking number and carrier are provided, save them to the Order document. 
            ▪ Subtask 6.19.7.3: (Optional, but recommended) Implement webhook listeners from carrier APIs to automatically update trackingHistory when a package status changes. 
            ▪ Subtask 6.19.7.4: Trigger initial tracking status retrieval on shipment. 
    • Data Storage & Performance Tasks:
        ◦ Task 6.19.8: Data Synchronization & Caching Strategy 
            ▪ Subtask 6.19.8.1: Determine how frequently trackingHistory should be updated from carrier APIs (e.g., on page load if old, via background job/webhook). 
            ▪ Subtask 6.19.8.2: Implement caching for tracking data to avoid hitting external APIs too often. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.19.9: Access Control for Order Tracking 
            ▪ Subtask 6.19.9.1: Ensure customers can only track their own orders. 
            ▪ Subtask 6.19.9.2: Validate all inputs (order ID, tracking number). 
        ◦ Task 6.19.10: Handle Carrier API Errors Gracefully 
            ▪ Subtask 6.19.10.1: Implement robust error handling for external carrier API calls (timeouts, rate limits, invalid tracking numbers). 
            ▪ Subtask 6.19.10.2: Provide informative error messages to the customer if tracking is unavailable. 
    • Testing Tasks:
        ◦ Task 6.19.11: Write Unit Tests 
            ▪ Subtask 6.19.11.1: Unit tests for the internal Carrier Tracking Service (mocking external API responses). 
            ▪ Subtask 6.19.11.2: Unit tests for parsing and storing tracking history. 
        ◦ Task 6.19.12: Write Integration Tests 
            ▪ Subtask 6.19.12.1: Place an order. Simulate fulfillment and assignment of a dummy tracking number/carrier. 
            ▪ Subtask 6.19.12.2: Log in as the ordering customer. Call GET /api/customer/orders/:orderId/tracking. Verify initial tracking data is returned. 
            ▪ Subtask 6.19.12.3: Simulate updates from the carrier (e.g., by directly manipulating the trackingHistory in the mock external service or database). Call the API again and verify updated data. 
            ▪ Subtask 6.19.12.4: Test with an invalid orderId or orderId belonging to another user. 
        ◦ Task 6.19.13: Manual End-to-End Testing 
            ▪ Subtask 6.19.13.1: Place a test order (or use an existing one that has been "shipped" with a real/mock tracking number). 
            ▪ Subtask 6.19.13.2: Log in as the customer. Navigate to "My Orders." Click "Track Order" for the relevant order. 
            ▪ Subtask 6.19.13.3: Verify the "Order Tracking Detail" page loads, showing the order summary, carrier, tracking number, and a visual timeline. 
            ▪ Subtask 6.19.13.4: Check if the latest status and detailed history are present. 
            ▪ Subtask 6.19.13.5: Click the tracking number to verify it links to the external carrier's site. 
            ▪ Subtask 6.19.13.6: (If possible) Simulate a real tracking update from a carrier and observe if the page updates. 
            ▪ Subtask 6.19.13.7: Test an order that hasn't shipped yet (should show appropriate message).
Epic 6: Customer Account Management Enhancements
Story 6.20: Payment Method Management
Story: As a registered customer, I want to be able to securely save multiple payment methods (e.g., credit/debit cards, digital wallets) to my account, designate a default method, and easily add, view, or remove them, so that I can have a faster and more convenient checkout experience.
Acceptance Criteria:
    1. A "Payment Methods" or "My Wallet" link is available in the "My Account" navigation. 
    2. Clicking the "Payment Methods" link takes the customer to a secure page displaying their saved payment methods. 
    3. For each saved payment method, the following details are displayed: 
        ◦ Card Type (e.g., Visa, MasterCard) or Digital Wallet (e.g., PayPal, Apple Pay). 
        ◦ Last 4 digits of the card number (masked). 
        ◦ Expiry Date (if applicable). 
        ◦ Nickname (e.g., "Work Card," "Personal Debit"). 
        ◦ Indication if it's the current "Default Payment Method." 
        ◦ Options to: 
            ▪ Set as "Default Payment Method." 
            ▪ Remove the payment method. 
    4. The customer can add a new payment method: 
        ◦ This process should be securely handled by a PCI-compliant payment gateway (e.g., Stripe Elements, Braintree Drop-in UI) to prevent sensitive card data from hitting the store's servers. 
        ◦ The customer provides card details or authorizes via a digital wallet. 
        ◦ Upon successful tokenization/authorization, the tokenized payment method is saved to their account. 
        ◦ The customer can optionally provide a nickname for the method. 
    5. The customer can remove a saved payment method (with a confirmation prompt). 
    6. Designating a payment method as default makes it pre-selected during checkout. 
    7. The checkout process should automatically use the default payment method, but allow selection from saved methods or entering a new one. 
    8. All payment method operations are securely performed by the authenticated user and only for their own methods. 

Granular Tasks & Subtasks for Story 6.20:
    • Frontend Tasks (Customer Account Panel & Checkout Page):
        ◦ Task 6.20.1: Implement "Payment Methods" Navigation Link & List Page 
            ▪ Subtask 6.20.1.1: Add a "Payment Methods" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.20.1.2: Create CustomerPaymentMethodsPage component/route (e.g., /account/payment-methods). 
            ▪ Subtask 6.20.1.3: Design and implement a layout to display a list of saved payment methods. 
            ▪ Subtask 6.20.1.4: For each method, display masked details (last 4, expiry), type, nickname, and default status. 
            ▪ Subtask 6.20.1.5: Add "Remove" and "Set as Default" buttons/links for each method. 
            ▪ Subtask 6.20.1.6: Handle empty state (no payment methods saved). 
        ◦ Task 6.20.2: Implement "Add New Payment Method" UI (PCI Compliant) 
            ▪ Subtask 6.20.2.1: Add an "Add New Payment Method" button. 
            ▪ Subtask 6.20.2.2: Integrate a payment gateway's secure UI component (e.g., Stripe Elements, Braintree Drop-in, Adyen Checkout) into a modal or dedicated form for collecting card details. 
            ▪ Subtask 6.20.2.3: Handle the success/error callbacks from the payment gateway's client-side SDK. 
            ▪ Subtask 6.20.2.4: Allow customer to add a nickname for the new method. 
            ▪ Subtask 6.20.2.5: Display success/error messages for adding methods. 
        ◦ Task 6.20.3: Implement "Remove Payment Method" Confirmation 
            ▪ Subtask 6.20.3.1: On clicking "Remove," display a confirmation modal/dialog. 
            ▪ Subtask 6.20.3.2: Add "Confirm Remove" and "Cancel" buttons. 
        ◦ Task 6.20.4: Frontend API Integration: Payment Method Management 
            ▪ Subtask 6.20.4.1: Create service/hook for GET /api/customer/payment-methods (to fetch all methods and defaults). 
            ▪ Subtask 6.20.4.2: Create service/hook for POST /api/customer/payment-methods (to save a new tokenized method). 
            ▪ Subtask 6.20.4.3: Create service/hook for DELETE /api/customer/payment-methods/:token (to remove a method). 
            ▪ Subtask 6.20.4.4: Create service/hook for PUT /api/customer/payment-methods/default/:token (to set default). 
        ◦ Task 6.20.5: Integrate Saved Payment Methods into Checkout Flow (if not already done in Epic 3) 
            ▪ Subtask 6.20.5.1: On the payment step of CheckoutPage, display saved payment methods. 
            ▪ Subtask 6.20.5.2: Implement radio buttons or a dropdown to select a saved method. 
            ▪ Subtask 6.20.5.3: Ensure the default method is pre-selected. 
            ▪ Subtask 6.20.5.4: Provide an option to "Use a new payment method" which integrates the gateway's secure UI for one-time use. 
    • Backend Tasks (Customer API & Payment Service):
        ◦ Task 6.20.6: Update User Model for Saved Payment Methods & Default 
            ▪ Subtask 6.20.6.1: Add savedPaymentMethods: [{ token: String, type: String, last4: String, expiryMonth: String, expiryYear: String, nickname: String, createdAt: Date }] to User schema. (Note: token is the payment gateway's token, not raw card data). 
            ▪ Subtask 6.20.6.2: Add defaultPaymentMethodToken: String to User schema. 
        ◦ Task 6.20.7: Payment Gateway Customer Vault Integration 
            ▪ Subtask 6.20.7.1: Configure your payment gateway (e.g., Stripe, Braintree) to create/manage customers and store payment method tokens securely in their "customer vault." 
            ▪ Subtask 6.20.7.2: When a user registers or saves a payment method, create/update a customer record in the payment gateway. 
            ▪ Subtask 6.20.7.3: Store the customer_id from the gateway on your User model. 
        ◦ Task 6.20.8: Create Get Customer Payment Methods API Endpoint 
            ▪ Subtask 6.20.8.1: Design and implement GET /api/customer/payment-methods. 
            ▪ Subtask 6.20.8.2: Apply customer authentication. 
            ▪ Subtask 6.20.8.3: Retrieve the customer_id from the authenticated user's profile. 
            ▪ Subtask 6.20.8.4: Call the payment gateway's API to fetch the list of saved payment methods associated with that customer_id. 
            ▪ Subtask 6.20.8.5: Map gateway responses to your internal savedPaymentMethods structure and return. 
        ◦ Task 6.20.9: Create Save New Payment Method API Endpoint 
            ▪ Subtask 6.20.9.1: Design and implement POST /api/customer/payment-methods. 
            ▪ Subtask 6.20.9.2: Apply customer authentication. 
            ▪ Subtask 6.20.9.3: Receive the payment method token (e.g., Stripe pm_... or Braintree nonce) from the frontend. 
            ▪ Subtask 6.20.9.4: Call the payment gateway's API to associate this token with the customer's vault. 
            ▪ Subtask 6.20.9.5: Store the returned token (id from gateway), type, last4, expiry, and nickname in the savedPaymentMethods array on the User document. 
            ▪ Subtask 6.20.9.6: If this is the first method, set it as default. 
            ▪ Subtask 6.20.9.7: Audit Logging: Log new payment method save. 
        ◦ Task 6.20.10: Create Remove Payment Method API Endpoint 
            ▪ Subtask 6.20.10.1: Design and implement DELETE /api/customer/payment-methods/:token. 
            ▪ Subtask 6.20.10.2: Apply customer authentication. 
            ▪ Subtask 6.20.10.3: Validate that the token belongs to the authenticated user. 
            ▪ Subtask 6.20.10.4: Call the payment gateway's API to delete the payment method from the customer's vault. 
            ▪ Subtask 6.20.10.5: Remove the method from the savedPaymentMethods array on the User document. 
            ▪ Subtask 6.20.10.6: If the deleted method was the default, clear defaultPaymentMethodToken. 
            ▪ Subtask 6.20.10.7: Audit Logging: Log payment method removal. 
        ◦ Task 6.20.11: Create Set Default Payment Method Endpoint 
            ▪ Subtask 6.20.11.1: Design and implement PUT /api/customer/payment-methods/default/:token. 
            ▪ Subtask 6.20.11.2: Apply customer authentication. 
            ▪ Subtask 6.20.11.3: Validate token exists in the user's savedPaymentMethods array. 
            ▪ Subtask 6.20.11.4: Update defaultPaymentMethodToken on the User document. 
    • Security & Compliance Tasks (Highly Critical!):
        ◦ Task 6.20.12: PCI DSS Compliance 
            ▪ Subtask 6.20.12.1: Crucial: Ensure sensitive card data never touches your servers. All card collection must be handled client-side by the payment gateway's SDK. 
            ▪ Subtask 6.20.12.2: Store only non-sensitive data and gateway-provided tokens. 
        ◦ Task 6.20.13: Strict Authorization for Payment Methods 
            ▪ Subtask 6.20.13.1: Ensure a customer can only manage their own payment methods. 
            ▪ Subtask 6.20.13.2: Implement robust error handling for payment gateway API calls. 
    • Testing Tasks:
        ◦ Task 6.20.14: Write Unit Tests 
            ▪ Subtask 6.20.14.1: Unit tests for backend logic of managing savedPaymentMethods on the User model. 
            ▪ Subtask 6.20.14.2: Unit tests for setting/clearing default payment methods. 
            ▪ Subtask 6.20.14.3: Mock payment gateway API calls for GET, POST, DELETE operations on customer vault. 
        ◦ Task 6.20.15: Write Integration Tests 
            ▪ Subtask 6.20.15.1: Register a test user. Log in. 
            ▪ Subtask 6.20.15.2: Simulate client-side tokenization and call POST /api/customer/payment-methods with a mock token. Verify it's added. 
            ▪ Subtask 6.20.15.3: Call GET /api/customer/payment-methods. Verify the method is returned, and default is set if first. 
            ▪ Subtask 6.20.15.4: Call PUT /api/customer/payment-methods/default/:token to set a default. Verify it updates. 
            ▪ Subtask 6.20.15.5: Call DELETE /api/customer/payment-methods/:token. Verify deletion and default cleanup. 
            ▪ Subtask 6.20.15.6: Test unauthorized access. 
        ◦ Task 6.20.16: Manual End-to-End Testing (Requires a payment gateway test environment) 
            ▪ Subtask 6.20.16.1: Log in as a customer. Navigate to "My Account" -> "Payment Methods." 
            ▪ Subtask 6.20.16.2: Click "Add New Payment Method." Use test card details provided by the payment gateway's sandbox environment. Verify the card is added and appears in the list. 
            ▪ Subtask 6.20.16.3: Add a second payment method. Set one as "Default." Verify indicators update. 
            ▪ Subtask 6.20.16.4: Click "Remove" on a method. Confirm. Verify it's removed. 
            ▪ Subtask 6.20.16.5: Add items to cart. Proceed to checkout. On the payment step, verify saved payment methods are available for selection, and the default is pre-selected. Test selecting a different saved method. 
            ▪ Subtask 6.20.16.6: Test entering a new payment method directly from checkout.
Epic 6: Customer Account Management Enhancements
Story 6.21: Customer Support Ticket History/Submission
Story: As a registered customer, I want to be able to view my past support ticket history and submit new support requests from within my account, so that I can easily track my interactions with customer service and get help when needed.
Acceptance Criteria:
    1. A "Support" or "Help" or "Contact Us" link is available in the "My Account" navigation (or potentially a global footer link). 
    2. Clicking the link takes the customer to a page displaying their support ticket history. 
    3. For each support ticket, the following details are displayed: 
        ◦ Ticket ID. 
        ◦ Subject. 
        ◦ Status (e.g., "Open," "Pending," "Resolved," "Closed"). 
        ◦ Date Submitted. 
        ◦ Last Updated Date. 
        ◦ A link to view the full ticket conversation. 
    4. The customer can submit a new support ticket: 
        ◦ A form is provided with fields for: 
            ▪ Subject. 
            ▪ Description (a rich text editor is preferred). 
            ▪ Category/Department (e.g., "Order Issue," "Product Inquiry," "Return Request"). 
            ▪ Order Number (optional, if applicable). 
            ▪ Attachment (optional). 
        ◦ A confirmation message is displayed upon successful submission. 
    5. Viewing a ticket shows the full conversation history (customer messages and support agent replies). 
    6. (Optional) Customers can reply to open tickets, adding new messages to the conversation. 
    7. All support ticket operations are securely performed by the authenticated user and only for their own tickets. 

Granular Tasks & Subtasks for Story 6.21:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.21.1: Implement "Support" Navigation Link & Ticket List Page 
            ▪ Subtask 6.21.1.1: Add a "Support" or "Help" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.21.1.2: Create CustomerSupportTicketsPage component/route (e.g., /account/support). 
            ▪ Subtask 6.21.1.3: Design a layout to display a list of support tickets. 
            ▪ Subtask 6.21.1.4: For each ticket, show ID, subject, status, dates, and a "View" link. 
            ▪ Subtask 6.21.1.5: Handle empty state (no tickets yet). 
        ◦ Task 6.21.2: Implement "New Support Ticket" Form UI 
            ▪ Subtask 6.21.2.1: Add a "Submit New Ticket" button. 
            ▪ Subtask 6.21.2.2: Create NewSupportTicketForm component (modal or dedicated page, e.g., /account/support/new). 
            ▪ Subtask 6.21.2.3: Implement input fields for subject, description (rich text editor), category, order number (optional), and file attachment (optional). 
            ▪ Subtask 6.21.2.4: Add "Submit" and "Cancel" buttons. 
            ▪ Subtask 6.21.2.5: Display success/error messages. 
        ◦ Task 6.21.3: Implement "View Ticket" Conversation UI 
            ▪ Subtask 6.21.3.1: Create SupportTicketDetailPage component/route (e.g., /account/support/:ticketId). 
            ▪ Subtask 6.21.3.2: Display the full conversation history in chronological order (customer and agent messages). 
            ▪ Subtask 6.21.3.3: (Optional) Implement a reply input field for customers to add new messages. 
            ▪ Subtask 6.21.3.4: Display timestamps for each message. 
            ▪ Subtask 6.21.3.5: Display ticket status and any attachments. 
        ◦ Task 6.21.4: Frontend API Integration: Support Ticket Management 
            ▪ Subtask 6.21.4.1: Create service/hook for GET /api/customer/support-tickets (to fetch all tickets). 
            ▪ Subtask 6.21.4.2: Create service/hook for GET /api/customer/support-tickets/:ticketId (to fetch a specific ticket and its messages). 
            ▪ Subtask 6.21.4.3: Create service/hook for POST /api/customer/support-tickets (to submit a new ticket). 
            ▪ Subtask 6.21.4.4: (Optional) Create service/hook for POST /api/customer/support-tickets/:ticketId/replies (to add a reply). 
    • Backend Tasks (Support Ticket Service & Customer API):
        ◦ Task 6.21.5: Design Support Ticket Data Model 
            ▪ Subtask 6.21.5.1: Create a new SupportTicket collection schema. Include: 
                • ticketId: String (unique, auto-generated). 
                • customerId: ObjectId (ref to User). 
                • subject: String. 
                • status: String (e.g., 'open', 'pending', 'resolved', 'closed'). 
                • category: String (e.g., 'order', 'product', 'account'). 
                • orderId: ObjectId (optional, ref to Order). 
                • messages: [{ sender: String ('customer' or 'agent'), content: String, timestamp: Date, attachments: [String] }]. 
                • createdAt, updatedAt. 
        ◦ Task 6.21.6: Create Get Customer Support Tickets API Endpoint 
            ▪ Subtask 6.21.6.1: Design and implement GET /api/customer/support-tickets. 
            ▪ Subtask 6.21.6.2: Apply customer authentication. 
            ▪ Subtask 6.21.6.3: Query SupportTicket collection for tickets with customerId matching the authenticated user. 
            ▪ Subtask 6.21.6.4: Return the list of tickets (excluding full message history). 
        ◦ Task 6.21.7: Create Get Customer Support Ticket Detail API Endpoint 
            ▪ Subtask 6.21.7.1: Design and implement GET /api/customer/support-tickets/:ticketId. 
            ▪ Subtask 6.21.7.2: Apply customer authentication. 
            ▪ Subtask 6.21.7.3: Validate that the ticketId belongs to the authenticated user. 
            ▪ Subtask 6.21.7.4: Retrieve the SupportTicket document, including the full messages array. 
            ▪ Subtask 6.21.7.5: Return the ticket details and conversation history. 
        ◦ Task 6.21.8: Create Submit New Support Ticket API Endpoint 
            ▪ Subtask 6.21.8.1: Design and implement POST /api/customer/support-tickets. 
            ▪ Subtask 6.21.8.2: Apply customer authentication. 
            ▪ Subtask 6.21.8.3: Receive the subject, description, category, orderId (optional), and attachments (optional). 
            ▪ Subtask 6.21.8.4: Generate a unique ticketId. 
            ▪ Subtask 6.21.8.5: Create a new SupportTicket document. 
            ▪ Subtask 6.21.8.6: Add an initial message from the customer to the messages array. 
            ▪ Subtask 6.21.8.7: (Optional) Send a notification (email, internal system) to customer support agents about the new ticket. 
            ▪ Subtask 6.21.8.8: Return the new ticket's details (including ticketId). 
        ◦ Task 6.21.9: (Optional) Implement Add Reply API Endpoint 
            ▪ Subtask 6.21.9.1: Design and implement POST /api/customer/support-tickets/:ticketId/replies. 
            ▪ Subtask 6.21.9.2: Apply customer authentication. 
            ▪ Subtask 6.21.9.3: Validate that the ticketId belongs to the authenticated user. 
            ▪ Subtask 6.21.9.4: Receive the reply message and any attachments. 
            ▪ Subtask 6.21.9.5: Add a new message object to the messages array of the SupportTicket document. 
            ▪ Subtask 6.21.9.6: Update the updatedAt field on the SupportTicket. 
            ▪ Subtask 6.21.9.7: (Optional) Send a notification to customer support agents about the new reply. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.21.10: Access Control for Support Tickets 
            ▪ Subtask 6.21.10.1: Ensure customers can only view and manage their own support tickets. 
            ▪ Subtask 6.21.10.2: Sanitize all user-provided input (subject, description, reply messages) to prevent XSS. 
        ◦ Task 6.21.11: Secure Attachment Handling 
            ▪ Subtask 6.21.11.1: If attachments are allowed, implement secure file storage (e.g., cloud storage) and prevent direct access. 
            ▪ Subtask 6.21.11.2: Validate file types and sizes. 
    • Testing Tasks:
        ◦ Task 6.21.12: Write Unit Tests 
            ▪ Subtask 6.21.12.1: Unit tests for backend logic of retrieving and creating support tickets. 
            ▪ Subtask 6.21.12.2: Unit tests for sanitizing user input. 
        ◦ Task 6.21.13: Write Integration Tests 
            ▪ Subtask 6.21.13.1: Register a test user. Log in. 
            ▪ Subtask 6.21.13.2: Call POST /api/customer/support-tickets to submit a new ticket. Verify it's created. 
            ▪ Subtask 6.21.13.3: Call GET /api/customer/support-tickets. Verify the new ticket is listed. 
            ▪ Subtask 6.21.13.4: Call GET /api/customer/support-tickets/:ticketId. Verify the ticket details and initial message are returned. 
            ▪ Subtask 6.21.13.5: (If replies are implemented) Call POST /api/customer/support-tickets/:ticketId/replies. Verify the reply is added to the conversation. 
            ▪ Subtask 6.21.13.6: Test unauthorized access (attempting to view another user's ticket). 
        ◦ Task 6.21.14: Manual End-to-End Testing 
            ▪ Subtask 6.21.14.1: Log in as a customer. Navigate to "My Account" -> "Support." 
            ▪ Subtask 6.21.14.2: Click "Submit New Ticket." Fill out the form and submit. Verify the ticket is created and a success message is displayed. 
            ▪ Subtask 6.21.14.3: Verify the new ticket appears in the ticket list. 
            ▪ Subtask 6.21.14.4: Click "View" on the ticket. Verify the full conversation is displayed. 
            ▪ Subtask 6.21.14.5: (If replies are implemented) Add a reply. Verify it appears in the conversation. 
            ▪ Subtask 6.21.14.6: Test with different ticket categories and optional fields (order number, attachments).
Epic 6: Customer Account Management Enhancements
Story 6.22: Loyalty Program Dashboard
Story: As a registered customer, I want to be able to view my current loyalty points balance, my loyalty tier status, a history of points earned and spent, and available rewards I can redeem, so that I can understand and actively participate in the store's loyalty program.
Acceptance Criteria:
    1. A "Loyalty Program" or "My Rewards" link is available in the "My Account" navigation. 
    2. Clicking the "Loyalty Program" link takes the customer to their dedicated loyalty dashboard. 
    3. The Loyalty Dashboard prominently displays: 
        ◦ Current Points Balance: A clear display of accumulated loyalty points. 
        ◦ Loyalty Tier Status: (e.g., "Bronze," "Silver," "Gold") with an indication of progress towards the next tier. 
        ◦ Progress Bar: A visual representation of points needed to reach the next tier. 
        ◦ Available Rewards: A list or gallery of rewards that can be redeemed with current points (e.g., discount coupons, free products, exclusive access). 
            ▪ For each reward: points cost, description, and a "Redeem" button. 
        ◦ Points History: A chronological log of points earned and spent: 
            ▪ Date of transaction. 
            ▪ Description (e.g., "Earned for Order #XYZ," "Spent for $10 off coupon"). 
            ▪ Points change (+X or -X). 
            ▪ Running balance. 
    4. Redeeming a reward deducts the points from the customer's balance and provides the reward (e.g., adds a coupon to their account, visible in a "My Coupons" section or similar). 
    5. All loyalty program data and actions are securely performed by the authenticated user. 
    6. (Optional) A clear explanation of "How to Earn Points" and "Tier Benefits" is accessible on the dashboard. 

Granular Tasks & Subtasks for Story 6.22:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.22.1: Implement "Loyalty Program" Navigation Link & Dashboard Page 
            ▪ Subtask 6.22.1.1: Add a "Loyalty Program" or "My Rewards" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.22.1.2: Create CustomerLoyaltyDashboardPage component/route (e.g., /account/loyalty). 
            ▪ Subtask 6.22.1.3: Design a layout for the loyalty dashboard, including sections for balance, tier, rewards, and history. 
            ▪ Subtask 6.22.1.4: Implement a visual progress bar component for tier progression. 
            ▪ Subtask 6.22.1.5: Display points balance and tier status prominently. 
        ◦ Task 6.22.2: Implement Available Rewards Display & Redemption UI 
            ▪ Subtask 6.22.2.1: Design and implement a grid or list to display available rewards. 
            ▪ Subtask 6.22.2.2: For each reward, show its description, points cost, and a "Redeem" button. 
            ▪ Subtask 6.22.2.3: Implement logic to disable "Redeem" button if customer has insufficient points. 
            ▪ Subtask 6.22.2.4: On "Redeem" click, show a confirmation modal/dialog before proceeding. 
            ▪ Subtask 6.22.2.5: Display success/error messages after redemption. 
        ◦ Task 6.22.3: Implement Points History Table UI 
            ▪ Subtask 6.22.3.1: Design and implement a table or list for "Points History." 
            ▪ Subtask 6.22.3.2: Display columns for Date, Description, Points Change, and Running Balance. 
            ▪ Subtask 6.22.3.3: Handle pagination for long history lists. 
            ▪ Subtask 6.22.3.4: Handle empty state for no loyalty activity. 
        ◦ Task 6.22.4: Frontend API Integration: Loyalty Data 
            ▪ Subtask 6.22.4.1: Create service/hook for GET /api/customer/loyalty (to fetch points, tier, history, and available rewards). 
            ▪ Subtask 6.22.4.2: Create service/hook for POST /api/customer/loyalty/redeem (to redeem a reward). 
    • Backend Tasks (Loyalty Program Service & Customer API):
        ◦ Task 6.22.5: Design Loyalty Data Models 
            ▪ Subtask 6.22.5.1: Loyalty Program Configuration (Admin): Define tiers (name, points threshold), points earning rules (e.g., 1 point per $1 spent), and available rewards (type, points cost, coupon code/value, expiry). 
            ▪ Subtask 6.22.5.2: Customer Loyalty Profile (User Schema Augmentation or separate collection): 
                • loyaltyPoints: Number (current balance). 
                • totalPointsEarnedLifetime: Number (for tier calculation). 
                • currentTier: String. 
                • loyaltyHistory: [{ type: String ('earn'/'redeem'), description: String, pointsChange: Number, balanceAfter: Number, referenceId: ObjectId (e.g., OrderId, RewardId), timestamp: Date }]. 
            ▪ Subtask 6.22.5.3: Reward (Reward Collection or GiftCard like): If rewards are distinct from gift cards, define a schema similar to 6.17 for redeemed rewards, associating them with a customer. 
        ◦ Task 6.22.6: Implement Points Earning Logic (Order Processing Integration) 
            ▪ Subtask 6.22.6.1: Integrate into Order fulfillment/completion process (e.g., OrderService.markOrderAsCompleted). 
            ▪ Subtask 6.22.6.2: Calculate points earned based on order total (and rules). 
            ▪ Subtask 6.22.6.3: Update loyaltyPoints and totalPointsEarnedLifetime for the customer. 
            ▪ Subtask 6.22.6.4: Add an 'earn' entry to loyaltyHistory. 
            ▪ Subtask 6.22.6.5: Re-evaluate customer's currentTier. 
        ◦ Task 6.22.7: Implement Tier Calculation Logic 
            ▪ Subtask 6.22.7.1: A function to determine currentTier based on totalPointsEarnedLifetime and defined tier thresholds. 
            ▪ Subtask 6.22.7.2: This function should be called when points are earned or periodically. 
        ◦ Task 6.22.8: Create Get Customer Loyalty Data API Endpoint 
            ▪ Subtask 6.22.8.1: Design and implement GET /api/customer/loyalty. 
            ▪ Subtask 6.22.8.2: Apply customer authentication. 
            ▪ Subtask 6.22.8.3: Retrieve customer's loyaltyPoints, currentTier, totalPointsEarnedLifetime. 
            ▪ Subtask 6.22.8.4: Retrieve loyaltyHistory. 
            ▪ Subtask 6.22.8.5: Fetch list of availableRewards (from configuration) and filter based on customer's loyaltyPoints. 
            ▪ Subtask 6.22.8.6: Return all loyalty data. 
        ◦ Task 6.22.9: Create Redeem Reward API Endpoint 
            ▪ Subtask 6.22.9.1: Design and implement POST /api/customer/loyalty/redeem. 
            ▪ Subtask 6.22.9.2: Apply customer authentication. 
            ▪ Subtask 6.22.9.3: Receive rewardId (or similar identifier for the reward being redeemed). 
            ▪ Subtask 6.22.9.4: Validate customer has enough points for the reward. 
            ▪ Subtask 6.22.9.5: Deduct points from loyaltyPoints. 
            ▪ Subtask 6.22.9.6: Add a 'redeem' entry to loyaltyHistory. 
            ▪ Subtask 6.22.9.7: Reward Fulfillment: Generate and assign the actual reward (e.g., generate a unique coupon code and add it to a customer's "My Coupons" section, or credit their account with store credit). 
            ▪ Subtask 6.22.9.8: Audit Logging: Log reward redemption. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.22.10: Transactional Integrity for Points 
            ▪ Subtask 6.22.10.1: Ensure points updates (earning, spending) are atomic and consistent to prevent discrepancies. Use database transactions where possible. 
        ◦ Task 6.22.11: Access Control for Loyalty Data 
            ▪ Subtask 6.22.11.1: Ensure customers can only view and manage their own loyalty data. 
            ▪ Subtask 6.22.11.2: Prevent redemption of rewards if points are insufficient or if the reward is unavailable. 
    • Testing Tasks:
        ◦ Task 6.22.12: Write Unit Tests 
            ▪ Subtask 6.22.12.1: Unit tests for points calculation based on order total. 
            ▪ Subtask 6.22.12.2: Unit tests for tier calculation logic. 
            ▪ Subtask 6.22.12.3: Unit tests for reward redemption logic (sufficient/insufficient points). 
        ◦ Task 6.22.13: Write Integration Tests 
            ▪ Subtask 6.22.13.1: Register a test user. Log in. 
            ▪ Subtask 6.22.13.2: Simulate an order completion for the user. Verify loyaltyPoints and loyaltyHistory are updated. 
            ▪ Subtask 6.22.13.3: Call GET /api/customer/loyalty. Verify points balance, tier, and history are returned correctly. 
            ▪ Subtask 6.22.13.4: Call POST /api/customer/loyalty/redeem for an available reward. Verify points are deducted and the reward is issued (e.g., coupon appears in their account). 
            ▪ Subtask 6.22.13.5: Attempt to redeem a reward with insufficient points (should fail). 
            ▪ Subtask 6.22.13.6: Test unauthorized access. 
        ◦ Task 6.22.14: Manual End-to-End Testing 
            ▪ Subtask 6.22.14.1: Log in as a customer with some initial points (or earn some via a test order). 
            ▪ Subtask 6.22.14.2: Navigate to "My Account" -> "Loyalty Program." 
            ▪ Subtask 6.22.14.3: Verify points balance, tier, and progress bar are displayed correctly. 
            ▪ Subtask 6.22.14.4: Check the "Available Rewards" section. Click "Redeem" on a reward. Confirm. Verify points are deducted and a confirmation message appears. 
            ▪ Subtask 6.22.14.5: Verify the "Points History" table reflects the earning and spending activities. 
            ▪ Subtask 6.22.14.6: Place another order to earn more points and verify the balance updates. 
            ▪ Subtask 6.22.14.7: Test reaching a new tier if possible.
Epic 6: Customer Account Management Enhancements
Story 6.23: Personalization Preferences
Story: As a registered customer, I want to be able to manage my communication preferences, including email subscriptions, and opt-in or opt-out of personalized features like product recommendations, so that I can control how the store communicates with me and tailor my shopping experience.
Acceptance Criteria:
    1. A "Preferences" or "Communication Settings" link is available in the "My Account" navigation. 
    2. Clicking the link takes the customer to a page displaying their personalization settings. 
    3. The Preferences page displays: 
        ◦ Email Subscriptions: Checkboxes or toggles for different types of email communications (e.g., "Promotional Offers," "Order Updates," "New Product Announcements," "Abandoned Cart Reminders," "Newsletter"). 
        ◦ Personalized Recommendations: A toggle to enable or disable personalized product recommendations (e.g., on homepage, product pages, emails). 
        ◦ (Optional) SMS Notifications: Opt-in/out for text message alerts. 
        ◦ (Optional) Push Notifications: Opt-in/out for browser push notifications. 
    4. The customer can update these preferences by changing the settings and clicking a "Save" button. 
    5. Saving changes results in a confirmation message. 
    6. Updates to email subscriptions should be reflected in the underlying marketing automation system (e.g., Mailchimp, Salesforce Marketing Cloud). 
    7. Opting out of recommendations should immediately cease the display of personalized recommendations for that customer. 
    8. All preference updates are securely handled by the authenticated user and only for their own account. 

Granular Tasks & Subtasks for Story 6.23:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.23.1: Implement "Preferences" Navigation Link & Page 
            ▪ Subtask 6.23.1.1: Add a "Preferences" or "Communication Settings" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.23.1.2: Create CustomerPreferencesPage component/route (e.g., /account/preferences). 
            ▪ Subtask 6.23.1.3: Design a form layout for different preference sections. 
        ◦ Task 6.23.2: Implement Email Subscription Controls UI 
            ▪ Subtask 6.23.2.1: Use checkboxes or toggle switches for each email subscription type. 
            ▪ Subtask 6.23.2.2: Pre-populate the state of these controls based on current user preferences. 
            ▪ Subtask 6.23.2.3: Add a "Save Changes" button. 
        ◦ Task 6.23.3: Implement Personalized Recommendations Toggle UI 
            ▪ Subtask 6.23.3.1: Add a toggle switch for "Enable Personalized Recommendations." 
            ▪ Subtask 6.23.3.2: Pre-populate its state. 
        ◦ Task 6.23.4: (Optional) Implement SMS/Push Notification Controls UI 
            ▪ Subtask 6.23.4.1: If applicable, add similar toggles/checkboxes for SMS and Push notifications. 
        ◦ Task 6.23.5: Frontend API Integration: Fetch & Update Preferences 
            ▪ Subtask 6.23.5.1: Create service/hook for GET /api/customer/preferences (to fetch current settings). 
            ▪ Subtask 6.23.5.2: Create service/hook for PUT /api/customer/preferences (to save updated settings). 
            ▪ Subtask 6.23.5.3: Display success/error messages after saving. 
    • Backend Tasks (Customer API & Preference/Marketing Service):
        ◦ Task 6.23.6: Update User Model for Preferences 
            ▪ Subtask 6.23.6.1: Add a sub-document or fields to User schema for preferences: 
                • preferences: { 
                • emailSubscriptions: { promotional: Boolean, newsletter: Boolean, orderUpdates: Boolean, abandonedCart: Boolean, ... } 
                • enableRecommendations: Boolean 
                • smsEnabled: Boolean (optional) 
                • pushEnabled: Boolean (optional) 
                • } 
        ◦ Task 6.23.7: Create Get Customer Preferences API Endpoint 
            ▪ Subtask 6.23.7.1: Design and implement GET /api/customer/preferences. 
            ▪ Subtask 6.23.7.2: Apply customer authentication. 
            ▪ Subtask 6.23.7.3: Return the preferences object for the authenticated user. 
        ◦ Task 6.23.8: Create Update Customer Preferences API Endpoint 
            ▪ Subtask 6.23.8.1: Design and implement PUT /api/customer/preferences. 
            ▪ Subtask 6.23.8.2: Apply customer authentication. 
            ▪ Subtask 6.23.8.3: Receive the updated preferences object from the frontend. 
            ▪ Subtask 6.23.8.4: Implement server-side validation for preference values. 
            ▪ Subtask 6.23.8.5: Update the preferences object on the User document. 
            ▪ Subtask 6.23.8.6: Marketing System Integration: If integrated with an external marketing automation platform (e.g., Mailchimp, Braze), trigger an API call to update the user's subscription status in that system. 
            ▪ Subtask 6.23.8.7: Recommendation Engine Integration: If an external recommendation engine is used, trigger an update or flag for that user's recommendation profile to disable/enable personalized results. 
            ▪ Subtask 6.23.8.8: Audit Logging: Log preference changes. 
    • Integrations (if external systems are used):
        ◦ Task 6.23.9: Marketing Automation Platform Integration 
            ▪ Subtask 6.23.9.1: Set up API keys and necessary configurations for the chosen marketing platform. 
            ▪ Subtask 6.23.9.2: Develop a service/module to interact with its API for subscribing/unsubscribing users to specific lists or tags. 
        ◦ Task 6.23.10: Recommendation Engine Integration 
            ▪ Subtask 6.23.10.1: If using a dedicated recommendation engine, understand its API for user preferences or opt-out flags. 
            ▪ Subtask 6.23.10.2: Implement logic to update the user's profile in the recommendation engine when enableRecommendations changes. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.23.11: Access Control for Preferences 
            ▪ Subtask 6.23.11.1: Ensure customers can only manage their own preferences. 
            ▪ Subtask 6.23.11.2: Validate all input to prevent malicious updates. 
    • Testing Tasks:
        ◦ Task 6.23.12: Write Unit Tests 
            ▪ Subtask 6.23.12.1: Unit tests for backend logic of updating preferences on the User document. 
            ▪ Subtask 6.23.12.2: Unit tests for preference validation. 
            ▪ Subtask 6.23.12.3: (If applicable) Unit tests for mocking marketing automation/recommendation engine API calls. 
        ◦ Task 6.23.13: Write Integration Tests 
            ▪ Subtask 6.23.13.1: Register a test user. Log in. 
            ▪ Subtask 6.23.13.2: Call GET /api/customer/preferences. Verify default/initial preferences are returned. 
            ▪ Subtask 6.23.13.3: Call PUT /api/customer/preferences to change some email subscriptions and the recommendation toggle. Verify preferences are updated in the database. 
            ▪ Subtask 6.23.13.4: (If external systems integrated) Verify that the changes are reflected in the marketing automation platform and recommendation engine (requires access to their test environments). 
            ▪ Subtask 6.23.13.5: Test unauthorized access. 
        ◦ Task 6.23.14: Manual End-to-End Testing 
            ▪ Subtask 6.23.14.1: Log in as a customer. Navigate to "My Account" -> "Preferences." 
            ▪ Subtask 6.23.14.2: Change some email subscription checkboxes/toggles. Click "Save Changes." Verify success message and that the UI reflects the new state. 
            ▪ Subtask 6.23.14.3: Toggle "Enable Personalized Recommendations" off. Save. Verify change. Browse products and verify recommendations are no longer shown (or are generic). 
            ▪ Subtask 6.23.14.4: Subscribe to a promotional email list. (If possible) Verify a test email is received from the marketing platform. Unsubscribe and verify no further emails of that type are received. 

Epic 6: Customer Account Management Enhancements
Story 6.24: Order Returns/Exchanges Initiation
Story: As a registered customer, I want to be able to initiate a return or exchange for items from my past orders directly from my account, so that I can easily handle returns and exchanges without contacting customer support.
Acceptance Criteria:
    1. On the "My Orders" page (from previous stories, e.g., 6.6), each eligible order has a "Return/Exchange" button or link. 
        ◦ Eligibility for return/exchange should be based on a time window after the order date (e.g., 30 days) and potentially product type. 
    2. Clicking "Return/Exchange" takes the customer to a dedicated "Return/Exchange Request" page for that order. 
    3. The "Return/Exchange Request" page displays: 
        ◦ Order Summary: Order Number, Date Placed, Total. 
        ◦ List of Items: Each item in the order with its image, name, and quantity. 
        ◦ Return/Exchange Options: 
            ▪ For each item: 
                • A dropdown to select "Return" or "Exchange." 
                • If "Exchange" is selected, a dropdown to choose the desired exchange item (if applicable, e.g., different size/color). 
                • A text area for the customer to provide a reason for the return/exchange. 
                • (Optional) An upload field for photos of the item/issue. 
        ◦ Shipping Address: Display of the original shipping address. 
        ◦ Return Shipping Options: (If applicable) Display available return shipping methods (e.g., pre-paid label, customer's own shipping) and instructions. 
        ◦ Summary of Request: A summary of the selected returns/exchanges for confirmation. 
        ◦ Submit Request Button. 
    4. Submitting the request creates a new return/exchange record in the system. 
    5. The customer receives a confirmation email with details of their request. 
    6. The customer can view the status of their return/exchange requests on a "My Returns/Exchanges" page (similar to "My Orders"). 
    7. All return/exchange operations are securely performed by the authenticated user and only for their own orders. 

Granular Tasks & Subtasks for Story 6.24:
    • Frontend Tasks (Customer Account Panel):
        ◦ Task 6.24.1: Enhance "My Orders" List with "Return/Exchange" Button 
            ▪ Subtask 6.24.1.1: Modify CustomerOrdersPage (from 6.6) to add a "Return/Exchange" button/link next to each eligible order. 
            ▪ Subtask 6.24.1.2: The button should be disabled or hidden for orders outside the return window or with ineligible items. 
            ▪ Subtask 6.24.1.3: Link points to the new ReturnExchangeRequestPage with the orderId. 
        ◦ Task 6.24.2: Implement Return/Exchange Request Page UI 
            ▪ Subtask 6.24.2.1: Create ReturnExchangeRequestPage component/route (e.g., /account/orders/:orderId/return). 
            ▪ Subtask 6.24.2.2: Display order summary. 
            ▪ Subtask 6.24.2.3: List order items with images, names, quantities. 
            ▪ Subtask 6.24.2.4: For each item, implement "Return" or "Exchange" dropdowns. 
            ▪ Subtask 6.24.2.5: If "Exchange," implement a dropdown to select the desired exchange item (if applicable). 
            ▪ Subtask 6.24.2.6: Add a text area for the return/exchange reason. 
            ▪ Subtask 6.24.2.7: (Optional) Implement an upload field for photos. 
            ▪ Subtask 6.24.2.8: Display original shipping address. 
            ▪ Subtask 6.24.2.9: Display available return shipping options and instructions (if applicable). 
            ▪ Subtask 6.24.2.10: Implement a summary of the selected returns/exchanges. 
            ▪ Subtask 6.24.2.11: Add a "Submit Request" button. 
            ▪ Subtask 6.24.2.12: Display success/error messages. 
        ◦ Task 6.24.3: Implement "My Returns/Exchanges" List Page 
            ▪ Subtask 6.24.3.1: Add a "Returns/Exchanges" link to the CustomerAccountDashboardPage. 
            ▪ Subtask 6.24.3.2: Create CustomerReturnsExchangesPage component/route (e.g., /account/returns). 
            ▪ Subtask 6.24.3.3: Display a list of return/exchange requests with: 
                • Request ID. 
                • Order Number. 
                • Date Requested. 
                • Status (e.g., "Pending," "Approved," "Shipped Back," "Completed," "Rejected"). 
                • A link to view the request details. 
        ◦ Task 6.24.4: Implement "View Return/Exchange Request Details" Page 
            ▪ Subtask 6.24.4.1: Create ReturnExchangeDetailPage component/route (e.g., /account/returns/:returnId). 
            ▪ Subtask 6.24.4.2: Display the details of the return/exchange request, similar to the submission page, but with the current status and any admin comments. 
        ◦ Task 6.24.5: Frontend API Integration: Returns/Exchanges 
            ▪ Subtask 6.24.5.1: Create service/hook for GET /api/customer/orders/:orderId/return-eligibility (to check if an order/items are eligible for return/exchange). 
            ▪ Subtask 6.24.5.2: Create service/hook for GET /api/customer/orders/:orderId/return-options (to get exchange item options, if applicable). 
            ▪ Subtask 6.24.5.3: Create service/hook for POST /api/customer/orders/:orderId/returns (to submit a new return/exchange request). 
            ▪ Subtask 6.24.5.4: Create service/hook for GET /api/customer/returns (to fetch all return/exchange requests). 
            ▪ Subtask 6.24.5.5: Create service/hook for GET /api/customer/returns/:returnId (to fetch details of a specific request). 
    • Backend Tasks (Order Service & Return/Exchange Service):
        ◦ Task 6.24.6: Update Order Data Model for Return Eligibility 
            ▪ Subtask 6.24.6.1: Add fields to the Order schema to track return eligibility: 
                • returnWindowEndDate: Date (calculated based on order date and return policy). 
                • items: Augment the items array to include a flag for isReturnable: Boolean (default true, but could be set to false for specific products). 
        ◦ Task 6.24.7: Design Return/Exchange Request Data Model 
            ▪ Subtask 6.24.7.1: Create a new ReturnExchange collection schema: 
                • returnId: String (unique, auto-generated). 
                • customerId: ObjectId (ref to User). 
                • orderId: ObjectId (ref to Order). 
                • items: [{ itemId: ObjectId (ref to Order.items[]), returnOrExchange: String ('return' or 'exchange'), exchangeToItemId: ObjectId (optional, if exchange), reason: String, photoUrls: [String] (optional) }]. 
                • shippingAddress: Object (copy of the original shipping address from the Order). 
                • returnShippingMethod: String (e.g., 'prepaid', 'customer'). 
                • returnShippingLabelUrl: String (if applicable). 
                • status: String (e.g., 'pending', 'approved', 'shipped', 'completed', 'rejected'). 
                • adminComments: String (for internal use). 
                • createdAt, updatedAt. 
        ◦ Task 6.24.8: Create Get Order Return Eligibility API Endpoint 
            ▪ Subtask 6.24.8.1: Design and implement GET /api/customer/orders/:orderId/return-eligibility. 
            ▪ Subtask 6.24.8.2: Apply customer authentication. 
            ▪ Subtask 6.24.8.3: Validate orderId belongs to the authenticated user. 
            ▪ Subtask 6.24.8.4: Retrieve the Order document. 
            ▪ Subtask 6.24.8.5: Check if the current date is within the returnWindowEndDate. 
            ▪ Subtask 6.24.8.6: Filter the items array to only include those that are isReturnable. 
            ▪ Subtask 6.24.8.7: Return the eligibility status and the list of returnable items. 
        ◦ Task 6.24.9: Create Get Order Return Options API Endpoint 
            ▪ Subtask 6.24.9.1: Design and implement GET /api/customer/orders/:orderId/return-options. 
            ▪ Subtask 6.24.9.2: Apply customer authentication. 
            ▪ Subtask 6.24.9.3: Validate orderId belongs to the authenticated user. 
            ▪ Subtask 6.24.9.4: Retrieve the Order document. 
            ▪ Subtask 6.24.9.5: For each item requested for exchange, fetch potential exchange options (e.g., different sizes/colors of the same product). This might involve querying the product catalog. 
            ▪ Subtask 6.24.9.6: Return the exchange options for each item. 
        ◦ Task 6.24.10: Create Submit Return/Exchange Request API Endpoint 
            ▪ Subtask 6.24.10.1: Design and implement POST /api/customer/orders/:orderId/returns. 
            ▪ Subtask 6.24.10.2: Apply customer authentication. 
            ▪ Subtask 6.24.10.3: Validate orderId belongs to the authenticated user. 
            ▪ Subtask 6.24.10.4: Receive the return/exchange request data (items, return/exchange selections, reasons, optional photos). 
            ▪ Subtask 6.24.10.5: Validate that the requested items are eligible for return/exchange (using the logic from 6.24.8). 
            ▪ Subtask 6.24.10.6: Create a new ReturnExchange document. 
            ▪ Subtask 6.24.10.7: (Optional) Generate a return shipping label if the return policy includes pre-paid labels. 
            ▪ Subtask 6.24.10.8: Send a confirmation email to the customer with the return/exchange details and instructions. 
            ▪ Subtask 6.24.10.9: (Optional) Notify customer support about the new request. 
            ▪ Subtask 6.24.10.10: Return the new returnId. 
        ◦ Task 6.24.11: Create Get Customer Returns/Exchanges API Endpoint 
            ▪ Subtask 6.24.11.1: Design and implement GET /api/customer/returns. 
            ▪ Subtask 6.24.11.2: Apply customer authentication. 
            ▪ Subtask 6.24.11.3: Query the ReturnExchange collection for requests with customerId matching the authenticated user. 
            ▪ Subtask 6.24.11.4: Return a list of return/exchange requests (excluding full details). 
        ◦ Task 6.24.12: Create Get Customer Return/Exchange Detail API Endpoint 
            ▪ Subtask 6.24.12.1: Design and implement GET /api/customer/returns/:returnId. 
            ▪ Subtask 6.24.12.2: Apply customer authentication. 
            ▪ Subtask 6.24.12.3: Validate that the returnId belongs to the authenticated user. 
            ▪ Subtask 6.24.12.4: Retrieve the ReturnExchange document. 
            ▪ Subtask 6.24.12.5: Return the full details of the return/exchange request. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.24.13: Access Control for Returns/Exchanges 
            ▪ Subtask 6.24.13.1: Ensure customers can only view and manage their own return/exchange requests. 
            ▪ Subtask 6.24.13.2: Prevent submission of return/exchange requests for ineligible orders/items. 
            ▪ Subtask 6.24.13.3: Securely handle any uploaded photos. 
        ◦ Task 6.24.14: Transactional Integrity 
            ▪ Subtask 6.24.14.1: Ensure that return/exchange requests are created and tracked consistently in the database. 
    • Testing Tasks:
        ◦ Task 6.24.15: Write Unit Tests
            ▪ Subtask 6.24.15.1: Unit tests for backend logic of checking return eligibility. 
            ▪ Subtask 6.24.15.2: Unit tests for creating and retrieving return/exchange requests. 
            ▪ Subtask 6.24.15.3: Unit tests for generating return shipping labels (if applicable). 
        ◦ Task 6.24.16: Write Integration Tests
            ▪ Subtask 6.24.16.1: Place a test order. Simulate shipment and delivery. 
            ▪ Subtask 6.24.16.2: Log in as the customer. 
            ▪ Subtask 6.24.16.3: Call GET /api/customer/orders/:orderId/return-eligibility. Verify the order is eligible (if within the return window). 
            ▪ Subtask 6.24.16.4: Call POST /api/customer/orders/:orderId/returns to submit a return/exchange request. Verify it's created. 
            ▪ Subtask 6.24.16.5: Call GET /api/customer/returns. Verify the new request is listed. 
            ▪ Subtask 6.24.16.6: Call GET /api/customer/returns/:returnId. Verify the details are returned. 
            ▪ Subtask 6.24.16.7: Test submitting a return/exchange request for an ineligible order/item (should fail). 
            ▪ Subtask 6.24.16.8: Test unauthorized access. 
        ◦ Task 6.24.17: Manual End-to-End Testing
            ▪ Subtask 6.24.17.1: Log in as a customer with a past order that is within the return window. 
            ▪ Subtask 6.24.17.2: Navigate to "My Account" -> "Returns/Exchanges." 
            ▪ Subtask 6.24.17.3: Select items for return/exchange, provide reasons, and submit the request. Verify success message. 
            ▪ Subtask 6.24.17.4: Verify the new return/exchange request appears in the "My Returns/Exchanges" list. 
            ▪ Subtask 6.24.17.5: Click to view the details of the request. Verify all information is displayed correctly. 
            ▪ Subtask 6.24.17.6: Test with an order outside the return window (should not have the "Return/Exchange" button).
Epic 6: Customer Account Management Enhancements
Story 6.27: Refer a Friend Program Dashboard
Story: As a registered customer, I want to be able to access my unique referral link, track the status of my referred friends, and view any rewards I've earned through the "Refer a Friend" program, so that I can easily share and benefit from referring new customers.
Acceptance Criteria:
    1. A "Refer a Friend" or "Referral Program" link is available in the "My Account" navigation. 
    2. Clicking this link takes the customer to their dedicated referral dashboard. 
    3. The Referral Dashboard prominently displays: 
        ◦ Unique Referral Link/Code: A clearly visible and copyable link or code that the customer can share. 
        ◦ Referral Sharing Options: Buttons to easily share the link via email, social media (e.g., Facebook, X/Twitter), or messaging apps (e.g., WhatsApp). 
        ◦ Program Explanation: A concise summary of how the program works (e.g., "Refer a friend, they get X% off, you get Y% off when they make their first purchase"). 
        ◦ Referral Status Tracker: A list or table showing: 
            ▪ Referred Friend's Name/Email (if available and privacy-compliant). 
            ▪ Status (e.g., "Invited," "Signed Up," "Purchased," "Reward Earned," "Declined"). 
            ▪ Date of Referral/Status Change. 
            ▪ (Optional) Reward amount earned for that referral. 
        ◦ Earned Rewards: A section listing rewards earned through referrals (e.g., coupon codes, store credit balances) with their status (e.g., "Available," "Redeemed," "Expired"). 
        ◦ Total Referrals/Rewards: A summary of overall performance (e.g., "X friends referred," "Y rewards earned"). 
    4. Sharing options pre-fill messages with the referral link/code. 
    5. All referral program data and actions are securely performed by the authenticated user and only for their own referrals. 

Granular Tasks & Subtasks for Story 6.27:
    • Frontend Tasks (Customer Account Panel & Global Elements):
        ◦ Task 6.27.1: Implement "Refer a Friend" Navigation Link & Dashboard Page 
            ▪ Subtask 6.27.1.1: Add a "Refer a Friend" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.27.1.2: Create CustomerReferralDashboardPage component/route (e.g., /account/referrals). 
            ▪ Subtask 6.27.1.3: Design a layout for the referral dashboard, including sections for the referral link, sharing options, status tracker, and earned rewards. 
        ◦ Task 6.27.2: Display Unique Referral Link/Code & Sharing Options 
            ▪ Subtask 6.27.2.1: Fetch the customer's unique referral link/code from the backend. 
            ▪ Subtask 6.27.2.2: Display the link/code clearly with a "Copy" button. 
            ▪ Subtask 6.27.2.3: Implement share buttons for email, Facebook, X (Twitter), WhatsApp, etc., dynamically embedding the referral link. 
        ◦ Task 6.27.3: Implement Referral Status Tracker UI 
            ▪ Subtask 6.27.3.1: Design and implement a table or list to display referred friends' status. 
            ▪ Subtask 6.27.3.2: Display friend's name/email, current status, and relevant dates. 
            ▪ Subtask 6.27.3.3: Handle pagination for a long list of referrals. 
            ▪ Subtask 6.27.3.4: Handle empty state (no referrals yet). 
        ◦ Task 6.27.4: Implement Earned Rewards Display UI 
            ▪ Subtask 6.27.4.1: Display a list of earned rewards (e.g., coupon codes, store credit values). 
            ▪ Subtask 6.27.4.2: For coupon codes, provide a "Copy" button or direct application link. 
            ▪ Subtask 6.27.4.3: Indicate reward status (e.g., "Available," "Redeemed," "Expired"). 
        ◦ Task 6.27.5: Frontend API Integration: Referral Data 
            ▪ Subtask 6.27.5.1: Create service/hook for GET /api/customer/referral-program (to fetch referral link, status, and rewards). 
    • Backend Tasks (Referral Service & Customer API):
        ◦ Task 6.27.6: Design Referral Program Data Models 
            ▪ Subtask 6.27.6.1: Referral Program Configuration (Admin): Define referral rules (e.g., referrer reward, referred reward), referral link generation logic, eligibility criteria. 
            ▪ Subtask 6.27.6.2: Customer Referral Profile (User Schema Augmentation or separate collection): 
                • referralCode: String (unique, auto-generated for each user). 
                • referralLink: String (derived from referralCode). 
                • referredFriends: [{ referredEmail: String, referredUserId: ObjectId (nullable), status: String ('invited', 'signed_up', 'purchased', 'reward_earned', 'declined'), statusDate: Date, rewardEarnedId: ObjectId (nullable) }]. 
                • earnedReferralRewards: [{ rewardId: ObjectId (ref to Coupon/GiftCard), earnedDate: Date, status: String ('available', 'redeemed', 'expired') }]. 
        ◦ Task 6.27.7: Implement Referral Code Generation 
            ▪ Subtask 6.27.7.1: Logic to generate a unique referralCode for each new registered user (or on first access to the dashboard). 
            ▪ Subtask 6.27.7.2: Logic to construct the full referralLink (e.g., https://yourstore.com/refer?ref=ABCDE). 
        ◦ Task 6.27.8: Create Get Customer Referral Program Data API Endpoint 
            ▪ Subtask 6.27.8.1: Design and implement GET /api/customer/referral-program. 
            ▪ Subtask 6.27.8.2: Apply customer authentication. 
            ▪ Subtask 6.27.8.3: Retrieve customer's referralCode, referredFriends list, and earnedReferralRewards. 
            ▪ Subtask 6.27.8.4: Populate reward details (e.g., coupon code value, expiry). 
            ▪ Subtask 6.27.8.5: Return all relevant referral data. 
        ◦ Task 6.27.9: Implement Referral Tracking Logic (New User Sign-up/First Purchase) 
            ▪ Subtask 6.27.9.1: When a new user signs up via a referral link, identify the referrer's referralCode. 
            ▪ Subtask 6.27.9.2: Update the referrer's referredFriends array: add an entry for the new user, set status to 'signed_up'. 
            ▪ Subtask 6.27.9.3: When a referred friend makes their first eligible purchase: 
                • Update the status of the corresponding entry in the referrer's referredFriends array to 'purchased' and then 'reward_earned'. 
                • Trigger reward issuance for both referrer and referred friend (e.g., generate and apply a coupon or store credit). 
                • Add the earned reward to the referrer's earnedReferralRewards list. 
                • Send notifications to both referrer and referred friend about the reward. 
        ◦ Task 6.27.10: Integrate with Reward Management (e.g., Coupons/Gift Cards) 
            ▪ Subtask 6.27.10.1: Utilize or extend the coupon/gift card system (from previous stories if implemented, or part of new dev) to issue referral rewards. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.27.11: Access Control for Referral Data 
            ▪ Subtask 6.27.11.1: Ensure customers can only view their own referral information. 
            ▪ Subtask 6.27.11.2: Protect the integrity of referral tracking to prevent fraudulent referrals. 
        ◦ Task 6.27.12: Privacy Considerations 
            ▪ Subtask 6.27.12.1: Only display minimal, non-sensitive information about referred friends (e.g., a masked email or status) to the referrer, respecting privacy laws. 
    • Testing Tasks:
        ◦ Task 6.27.13: Write Unit Tests 
            ▪ Subtask 6.27.13.1: Unit tests for referral code generation. 
            ▪ Subtask 6.27.13.2: Unit tests for tracking referral status updates. 
            ▪ Subtask 6.27.13.3: Unit tests for reward issuance logic. 
        ◦ Task 6.27.14: Write Integration Tests 
            ▪ Subtask 6.27.14.1: Register a "referrer" user. Log in. Call GET /api/customer/referral-program to get their link/code. 
            ▪ Subtask 6.27.14.2: Create a "referred friend" user via the referrer's link. Verify the referrer's dashboard now shows the friend as "Signed Up." 
            ▪ Subtask 6.27.14.3: As the "referred friend," make an eligible first purchase. 
            ▪ Subtask 6.27.14.4: Call GET /api/customer/referral-program for the "referrer." Verify the friend's status is "Purchased" / "Reward Earned" and the reward is listed. 
            ▪ Subtask 6.27.14.5: Verify the reward (e.g., coupon) is available in the referrer's account. 
            ▪ Subtask 6.27.14.6: Test edge cases like multiple referrals, ineligible purchases. 
            ▪ Subtask 6.27.14.7: Test unauthorized access. 
        ◦ Task 6.27.15: Manual End-to-End Testing 
            ▪ Subtask 6.27.15.1: Log in as a customer. Navigate to "My Account" -> "Refer a Friend." 
            ▪ Subtask 6.27.15.2: Copy the referral link/code. Use the sharing buttons to verify they pre-fill messages. 
            ▪ Subtask 6.27.15.3: In an incognito browser, use the referral link to sign up as a new customer. 
            ▪ Subtask 6.27.15.4: Log back in as the referrer. Verify the new friend appears in the "Referral Status Tracker" with "Signed Up" status. 
            ▪ Subtask 6.27.15.5: As the new friend, make an eligible first purchase. 
            ▪ Subtask 6.27.15.6: Log back in as the referrer. Verify the friend's status updates to "Reward Earned" and the reward appears in "Earned Rewards." 
            ▪ Subtask 6.27.15.7: Try to use the earned reward during checkout.
Epic 6: Customer Account Management Enhancements
Story 6.29: Customer Reviews Management
Story: As a registered customer, I want to be able to view all the product reviews I've submitted, and have the option to edit or delete them, so that I can manage my contributions and ensure their accuracy.
Acceptance Criteria:
    1. A "My Reviews" link is available in the "My Account" navigation. 
    2. Clicking this link takes the customer to a page displaying all product reviews they have submitted. 
    3. For each review, the following details are displayed: 
        ◦ Product Image and Name (linked to the product page). 
        ◦ Star Rating given. 
        ◦ Review Title. 
        ◦ Review Content. 
        ◦ Date Submitted. 
        ◦ Date Last Edited (if applicable). 
        ◦ Current status (e.g., "Approved," "Pending Approval," "Rejected"). 
        ◦ "Edit Review" button/link. 
        ◦ "Delete Review" button/link. 
    4. Clicking "Edit Review" opens a form pre-populated with the existing review content, allowing the customer to modify the rating, title, and content. 
    5. Edited reviews may go through a re-approval process (if moderation is enabled). 
    6. Clicking "Delete Review" prompts a confirmation and, upon confirmation, permanently removes the review. 
    7. All review management operations are securely performed by the authenticated user and only for their own reviews. 

Granular Tasks & Subtasks for Story 6.29:
    • Frontend Tasks (Customer Account Panel & Product Detail Pages):
        ◦ Task 6.29.1: Implement "My Reviews" Navigation Link & List Page 
            ▪ Subtask 6.29.1.1: Add a "My Reviews" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.29.1.2: Create CustomerMyReviewsPage component/route (e.g., /account/my-reviews). 
            ▪ Subtask 6.29.1.3: Design a layout to display a list of submitted reviews. 
        ◦ Task 6.29.2: Display My Reviews List UI 
            ▪ Subtask 6.29.2.1: For each review, display product image, name, rating, title, content preview, dates, and status. 
            ▪ Subtask 6.29.2.2: Add "Edit Review" and "Delete Review" buttons/links for each review. 
            ▪ Subtask 6.29.2.3: Handle empty state (no reviews submitted yet). 
        ◦ Task 6.29.3: Implement "Edit Review" Form UI 
            ▪ Subtask 6.29.3.1: On "Edit Review" click, navigate to or open a modal with an editing form (e.g., /account/my-reviews/edit/:reviewId). 
            ▪ Subtask 6.29.3.2: Pre-populate the form fields (star rating, title, content) with the existing review data. 
            ▪ Subtask 6.29.3.3: Add "Save Changes" and "Cancel" buttons. 
            ▪ Subtask 6.29.3.4: Display success/error messages after saving. 
        ◦ Task 6.29.4: Implement "Delete Review" Confirmation 
            ▪ Subtask 6.29.4.1: On "Delete Review" click, display a confirmation modal/dialog. 
            ▪ Subtask 6.29.4.2: Add "Confirm Delete" and "Cancel" buttons. 
        ◦ Task 6.29.5: Frontend API Integration: Review Management 
            ▪ Subtask 6.29.5.1: Create service/hook for GET /api/customer/reviews (to fetch all customer's reviews). 
            ▪ Subtask 6.29.5.2: Create service/hook for GET /api/customer/reviews/:reviewId (to fetch a specific review for editing). 
            ▪ Subtask 6.29.5.3: Create service/hook for PUT /api/customer/reviews/:reviewId (to update a review). 
            ▪ Subtask 6.29.5.4: Create service/hook for DELETE /api/customer/reviews/:reviewId (to delete a review). 
    • Backend Tasks (Review Service & Customer API):
        ◦ Task 6.29.6: Update Review Data Model (if necessary for status) 
            ▪ Subtask 6.29.6.1: Ensure the Review schema (assuming it exists from previous user stories like 1.10 - Product Reviews) includes fields like: 
                • customerId: ObjectId (ref to User). 
                • status: String (e.g., 'approved', 'pending_approval', 'rejected', 'deleted'). 
                • lastEditedAt: Date (optional, for tracking edits). 
        ◦ Task 6.29.7: Create Get Customer Reviews API Endpoint 
            ▪ Subtask 6.29.7.1: Design and implement GET /api/customer/reviews. 
            ▪ Subtask 6.29.7.2: Apply customer authentication. 
            ▪ Subtask 6.29.7.3: Query the Review collection for reviews with customerId matching the authenticated user. 
            ▪ Subtask 6.29.7.4: Populate relevant Product details (name, image) for each review. 
            ▪ Subtask 6.29.7.5: Return the list of reviews. 
        ◦ Task 6.29.8: Create Get Single Review API Endpoint (for editing) 
            ▪ Subtask 6.29.8.1: Design and implement GET /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.29.8.2: Apply customer authentication. 
            ▪ Subtask 6.29.8.3: Validate reviewId belongs to the authenticated user. 
            ▪ Subtask 6.29.8.4: Return the full review content. 
        ◦ Task 6.29.9: Create Update Review API Endpoint 
            ▪ Subtask 6.29.9.1: Design and implement PUT /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.29.9.2: Apply customer authentication. 
            ▪ Subtask 6.29.9.3: Validate reviewId belongs to the authenticated user. 
            ▪ Subtask 6.29.9.4: Receive updated rating, title, and content. 
            ▪ Subtask 6.29.9.5: Update the Review document. 
            ▪ Subtask 6.29.9.6: If moderation is enabled, set status to 'pending_approval' after edit. 
            ▪ Subtask 6.29.9.7: Update lastEditedAt timestamp. 
            ▪ Subtask 6.29.9.8: (Optional) Notify admin if re-moderation is triggered. 
        ◦ Task 6.29.10: Create Delete Review API Endpoint 
            ▪ Subtask 6.29.10.1: Design and implement DELETE /api/customer/reviews/:reviewId. 
            ▪ Subtask 6.29.10.2: Apply customer authentication. 
            ▪ Subtask 6.29.10.3: Validate reviewId belongs to the authenticated user. 
            ▪ Subtask 6.29.10.4: Change status to 'deleted' (soft delete) or remove the Review document entirely (hard delete - consider data retention policies). 
            ▪ Subtask 6.29.10.5: (Optional) Recalculate product's average rating if reviews are hard-deleted. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.29.11: Access Control for Reviews 
            ▪ Subtask 6.29.11.1: Ensure customers can only view, edit, or delete their own reviews. 
            ▪ Subtask 6.29.11.2: Sanitize all user-provided input for review content to prevent XSS. 
        ◦ Task 6.29.12: Moderation Workflow Integration 
            ▪ Subtask 6.29.12.1: Ensure that edited reviews correctly enter the moderation queue if such a system is in place. 
    • Testing Tasks:
        ◦ Task 6.29.13: Write Unit Tests 
            ▪ Subtask 6.29.13.1: Unit tests for backend logic of retrieving, updating, and deleting reviews. 
            ▪ Subtask 6.29.13.2: Unit tests for authorization (ensuring only owner can modify). 
        ◦ Task 6.29.14: Write Integration Tests 
            ▪ Subtask 6.29.14.1: Register a test user. Log in. 
            ▪ Subtask 6.29.14.2: Submit a test review for a product (via the existing product review submission flow). 
            ▪ Subtask 6.29.14.3: Call GET /api/customer/reviews. Verify the review is listed. 
            ▪ Subtask 6.29.14.4: Call PUT /api/customer/reviews/:reviewId to edit the review. Verify content updates and status changes (if moderation). 
            ▪ Subtask 6.29.14.5: Call DELETE /api/customer/reviews/:reviewId. Verify it's removed/status changed. 
            ▪ Subtask 6.29.14.6: Test unauthorized access (attempting to edit/delete another user's review). 
        ◦ Task 6.29.15: Manual End-to-End Testing 
            ▪ Subtask 6.29.15.1: Log in as a customer. Submit a review for a product. 
            ▪ Subtask 6.29.15.2: Navigate to "My Account" -> "My Reviews." Verify the review is displayed. 
            ▪ Subtask 6.29.15.3: Click "Edit Review." Modify the rating, title, and content. Save. Verify updates and (if applicable) that the review enters pending state. 
            ▪ Subtask 6.29.15.4: Click "Delete Review." Confirm. Verify the review is removed from the list and from the product page. 
            ▪ Subtask 6.29.15.5: Test with a review that has been moderated (e.g., if status is "Rejected," verify it's still shown in "My Reviews" but not on the product page).
Epic 6: Customer Account Management Enhancements
Story 6.32: Multi-Factor Authentication (MFA) Setup
Story: As a registered customer, I want to be able to enable and manage Multi-Factor Authentication (MFA) for my account, using an authenticator app, so that I can add an extra layer of security and protect my account from unauthorized access.
Acceptance Criteria:
    1. A "Multi-Factor Authentication" or "2-Step Verification" link is available in the "My Account" security settings. 
    2. Clicking this link takes the customer to an MFA setup and management page. 
    3. MFA Setup Flow: 
        ◦ The page displays instructions on how to set up MFA. 
        ◦ A unique QR code and a manual setup key are displayed for linking with an authenticator app (e.g., Google Authenticator, Authy). 
        ◦ The customer is prompted to enter a code from their authenticator app to verify the setup. 
        ◦ Upon successful verification, MFA is enabled for their account. 
        ◦ (Optional but Recommended) The customer is provided with a list of backup/recovery codes to save in case they lose access to their authenticator device. 
    4. MFA Login Flow (post-setup): 
        ◦ After entering their username and password during login, the customer is prompted to enter an MFA code from their authenticator app. 
        ◦ Successful MFA code validation grants access to the account. 
    5. MFA Management: 
        ◦ Once enabled, the MFA page allows the customer to: 
            ▪ Disable MFA (with re-authentication and confirmation). 
            ▪ Generate new backup codes (with re-authentication). 
            ▪ (Optional) Re-link authenticator app (e.g., if switching devices). 
    6. The system properly handles incorrect MFA codes and lockout scenarios. 
    7. All MFA operations are securely performed by the authenticated user. 

Granular Tasks & Subtasks for Story 6.32:
    • Frontend Tasks (Customer Account Panel & Login Page):
        ◦ Task 6.32.1: Add "Multi-Factor Authentication" Link 
            ▪ Subtask 6.32.1.1: Add a "Multi-Factor Authentication" or "2-Step Verification" link to the CustomerAccountDashboardPage or a dedicated CustomerSecuritySettingsPage. 
            ▪ Subtask 6.32.1.2: Create CustomerMFASetupPage component/route (e.g., /account/security/mfa). 
        ◦ Task 6.32.2: Implement MFA Setup UI Flow 
            ▪ Subtask 6.32.2.1: Display clear step-by-step instructions for MFA setup. 
            ▪ Subtask 6.32.2.2: Render a QR code generated from the backend for authenticator app scanning. 
            ▪ Subtask 6.32.2.3: Display the manual setup key (e.g., Base32 encoded secret). 
            ▪ Subtask 6.32.2.4: Provide an input field for the user to enter the authenticator code for verification. 
            ▪ Subtask 6.32.2.5: Display confirmation/error messages for setup. 
            ▪ Subtask 6.32.2.6: (Optional) Implement a section to display and allow printing/copying of backup codes after successful setup. 
        ◦ Task 6.32.3: Implement MFA Management UI 
            ▪ Subtask 6.32.3.1: Once MFA is enabled, update the CustomerMFASetupPage to show MFA status ("Enabled"). 
            ▪ Subtask 6.32.3.2: Add "Disable MFA" button (requires re-authentication). 
            ▪ Subtask 6.32.3.3: Add "Generate New Backup Codes" button (requires re-authentication). 
            ▪ Subtask 6.32.3.4: (Optional) Add "Re-link Authenticator" button. 
        ◦ Task 6.32.4: Integrate MFA into Login UI 
            ▪ Subtask 6.32.4.1: Modify the LoginPage component. After successful username/password, if MFA is enabled for the user, display a new input field for the MFA code. 
            ▪ Subtask 6.32.4.2: Add options for "Use a backup code" if the user has lost their authenticator. 
            ▪ Subtask 6.32.4.3: Display error messages for invalid MFA codes. 
        ◦ Task 6.32.5: Frontend API Integration: MFA 
            ▪ Subtask 6.32.5.1: Create service/hook for GET /api/customer/mfa/setup (to get QR code secret and backup codes). 
            ▪ Subtask 6.32.5.2: Create service/hook for POST /api/customer/mfa/enable (to verify code and enable MFA). 
            ▪ Subtask 6.32.5.3: Create service/hook for POST /api/customer/mfa/disable (to disable MFA). 
            ▪ Subtask 6.32.5.4: Create service/hook for POST /api/auth/login/mfa (for MFA step during login). 
            ▪ Subtask 6.32.5.5: Create service/hook for POST /api/customer/mfa/generate-backup-codes. 
    • Backend Tasks (Authentication Service & Customer API):
        ◦ Task 6.32.6: Update User Model for MFA 
            ▪ Subtask 6.32.6.1: Add fields to the User schema: 
                • mfaEnabled: Boolean (default false). 
                • mfaSecret: String (stores the Base32 secret for the authenticator app). 
                • mfaBackupCodes: [String] (hashed or encrypted backup codes). 
        ◦ Task 6.32.7: Create MFA Setup Initiate Endpoint 
            ▪ Subtask 6.32.7.1: Design and implement GET /api/customer/mfa/setup. 
            ▪ Subtask 6.32.7.2: Apply customer authentication. 
            ▪ Subtask 6.32.7.3: Generate a new unique mfaSecret (e.g., using speakeasy or similar library). 
            ▪ Subtask 6.32.7.4: Store the mfaSecret temporarily (or persist and overwrite on success). 
            ▪ Subtask 6.32.7.5: Generate the QR code URL (e.g., otpauth://totp/YourStore:user@example.com?secret=ABCDE&issuer=YourStore). 
            ▪ Subtask 6.32.7.6: Return the QR code URL and the mfaSecret (Base32 format). 
        ◦ Task 6.32.8: Create MFA Enable Verification Endpoint 
            ▪ Subtask 6.32.8.1: Design and implement POST /api/customer/mfa/enable. 
            ▪ Subtask 6.32.8.2: Apply customer authentication. 
            ▪ Subtask 6.32.8.3: Receive the mfaCode from the frontend. 
            ▪ Subtask 6.32.8.4: Use the stored mfaSecret to verify the mfaCode using TOTP logic. 
            ▪ Subtask 6.32.8.5: If valid: 
                • Set mfaEnabled to true on the User document. 
                • Generate and store multiple (e.g., 5-10) unique, single-use mfaBackupCodes (hashed). 
                • Return success and the generated mfaBackupCodes to the frontend. 
            ▪ Subtask 6.32.8.6: If invalid, return error. 
        ◦ Task 6.32.9: Create MFA Disable Endpoint 
            ▪ Subtask 6.32.9.1: Design and implement POST /api/customer/mfa/disable. 
            ▪ Subtask 6.32.9.2: Apply customer re-authentication (require password and current MFA code). 
            ▪ Subtask 6.32.9.3: If valid: 
                • Set mfaEnabled to false. 
                • Clear mfaSecret and mfaBackupCodes from the User document. 
        ◦ Task 6.32.10: Integrate MFA into Login Endpoint 
            ▪ Subtask 6.32.10.1: Modify the POST /api/auth/login endpoint. 
            ▪ Subtask 6.32.10.2: After successful username/password validation: 
                • If mfaEnabled is true for the user, return a response indicating MFA is required (e.g., a specific status code or flag) and do not issue a full session token yet. 
                • The client then prompts for MFA code. 
            ▪ Subtask 6.32.10.3: Create a new POST /api/auth/login/mfa endpoint. 
                • Receives a temporary token (from initial login step) and the mfaCode (or backup code). 
                • Verify the mfaCode against mfaSecret or check against mfaBackupCodes (and mark used backup code). 
                • If valid, issue the full session token/cookie. 
                • Implement rate limiting for MFA attempts. 
        ◦ Task 6.32.11: Create Generate New Backup Codes Endpoint 
            ▪ Subtask 6.32.11.1: Design and implement POST /api/customer/mfa/generate-backup-codes. 
            ▪ Subtask 6.32.11.2: Apply customer re-authentication (require password and current MFA code). 
            ▪ Subtask 6.32.11.3: Generate and replace existing mfaBackupCodes. Return new codes. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.32.12: Secure MFA Secrets and Backup Codes 
            ▪ Subtask 6.32.12.1: Store mfaSecret securely (e.g., encrypted at rest). 
            ▪ Subtask 6.32.12.2: Store mfaBackupCodes as one-way hashed values. Mark them as used after a single successful use. 
        ◦ Task 6.32.13: Rate Limiting and Brute Force Protection 
            ▪ Subtask 6.32.13.1: Implement strong rate limiting on all MFA verification endpoints to prevent brute-force attacks on MFA codes. 
            ▪ Subtask 6.32.13.2: Implement temporary account lockout after multiple failed MFA attempts. 
    • Testing Tasks:
        ◦ Task 6.32.14: Write Unit Tests 
            ▪ Subtask 6.32.14.1: Unit tests for TOTP code generation and validation. 
            ▪ Subtask 6.32.14.2: Unit tests for backup code generation and usage. 
            ▪ Subtask 6.32.14.3: Unit tests for updating user MFA status. 
        ◦ Task 6.32.15: Write Integration Tests 
            ▪ Subtask 6.32.15.1: Create a test user. Log in. 
            ▪ Subtask 6.32.15.2: Call GET /api/customer/mfa/setup. Verify QR URL and secret are returned. 
            ▪ Subtask 6.32.15.3: Simulate generating an MFA code using the secret. Call POST /api/customer/mfa/enable with the code. Verify MFA is enabled, and backup codes are returned. 
            ▪ Subtask 6.32.15.4: Test login flow: log out, attempt login. Verify first step succeeds, then MFA prompt appears. Submit correct/incorrect MFA codes. 
            ▪ Subtask 6.32.15.5: Test login using a backup code. 
            ▪ Subtask 6.32.15.6: Call POST /api/customer/mfa/disable (with re-auth). Verify MFA is disabled. 
            ▪ Subtask 6.32.15.7: Test rate limiting on MFA endpoints. 
            ▪ Subtask 6.32.15.8: Test unauthorized access. 
        ◦ Task 6.32.16: Manual End-to-End Testing 
            ▪ Subtask 6.32.16.1: Log in as a customer. Navigate to "My Account" -> "Multi-Factor Authentication." 
            ▪ Subtask 6.32.16.2: Follow the setup steps: scan QR code with an authenticator app, enter code, confirm. Verify MFA is enabled. 
            ▪ Subtask 6.32.16.3: Save/print backup codes provided. 
            ▪ Subtask 6.32.16.4: Log out. Log in again. Verify the MFA challenge appears after password entry. Enter the code from the authenticator app. Verify successful login. 
            ▪ Subtask 6.32.16.5: Test with an incorrect MFA code. 
            ▪ Subtask 6.32.16.6: Test using a backup code during login. 
            ▪ Subtask 6.32.16.7: Once logged in, navigate back to MFA settings. Disable MFA (requires re-auth). Verify it's disabled.
Epic 6: Customer Account Management Enhancements
Story 6.33: GDPR/Privacy Settings
Story: As a registered customer, I want to be able to manage my data privacy preferences, request a copy of my personal data, and request the deletion of my account, so that I have control over my personal information in compliance with privacy regulations like GDPR.
Acceptance Criteria:
    1. A "Privacy Settings" or "Data & Privacy" link is available in the "My Account" navigation. 
    2. Clicking this link takes the customer to a dedicated Privacy Settings page. 
    3. The Privacy Settings page clearly displays: 
        ◦ Data Consent Management: 
            ▪ Options to view and adjust consent for various data uses (e.g., marketing emails, personalized recommendations, analytics tracking). 
            ▪ Clear explanations of what each consent option entails. 
            ▪ An option to review past consent history. 
        ◦ Data Export Request: 
            ▪ A "Request Data Export" button. 
            ▪ Upon request, the customer is informed that a copy of their data will be sent to their registered email address (after verification). 
            ▪ The data export format should be a common, machine-readable format (e.g., JSON, CSV). 
        ◦ Account Deletion Request: 
            ▪ A "Request Account Deletion" button. 
            ▪ A clear warning about the implications of deletion (e.g., irreversible, loss of order history, loyalty points). 
            ▪ A confirmation step, potentially requiring re-authentication or a strong verification method (e.g., email confirmation link). 
            ▪ Information about the typical timeframe for deletion and any data retention policies. 
        ◦ Privacy Policy Link: A prominent link to the full privacy policy document. 
    4. Consent changes are immediately reflected and applied to data processing. 
    5. Data export requests are processed securely and within a reasonable timeframe (e.g., 30 days as per GDPR). 
    6. Account deletion requests are handled securely and permanently remove customer data according to legal and business retention policies. 
    7. All privacy operations are securely performed by the authenticated user and their actions are logged for auditing purposes. 

Granular Tasks & Subtasks for Story 6.33:
    • Frontend Tasks (Customer Account Panel & Email Templates):
        ◦ Task 6.33.1: Add "Privacy Settings" Navigation Link 
            ▪ Subtask 6.33.1.1: Add a "Privacy Settings" or "Data & Privacy" link to the CustomerAccountDashboardPage sidebar/tabs. 
            ▪ Subtask 6.33.1.2: Create CustomerPrivacySettingsPage component/route (e.g., /account/privacy-settings). 
        ◦ Task 6.33.2: Implement Data Consent Management UI 
            ▪ Subtask 6.33.2.1: Display checkboxes or toggles for different consent types (e.g., marketing_email_consent, personalization_consent). 
            ▪ Subtask 6.33.2.2: Provide descriptive text for each consent option. 
            ▪ Subtask 6.33.2.3: Add a "Save Changes" button for consent preferences. 
            ▪ Subtask 6.33.2.4: (Optional) Display a simple audit log of past consent changes. 
        ◦ Task 6.33.3: Implement Data Export Request UI 
            ▪ Subtask 6.33.3.1: Add a "Request Data Export" button. 
            ▪ Subtask 6.33.3.2: On click, display a confirmation message with information about the process (email delivery, timeframe). 
            ▪ Subtask 6.33.3.3: (Optional) Provide a brief explanation of the data format. 
        ◦ Task 6.33.4: Implement Account Deletion Request UI 
            ▪ Subtask 6.33.4.1: Add a "Request Account Deletion" button. 
            ▪ Subtask 6.33.4.2: On click, display a confirmation modal/dialog with warnings about data loss. 
            ▪ Subtask 6.33.4.3: Require re-authentication (password confirmation) within the modal. 
            ▪ Subtask 6.33.4.4: Display information about the deletion process and timeframe. 
            ▪ Subtask 6.33.4.5: On successful request, redirect to a confirmation page and log out the user. 
        ◦ Task 6.33.5: Integrate Privacy Policy Link 
            ▪ Subtask 6.33.5.1: Add a prominent link to the Privacy Policy document. 
        ◦ Task 6.33.6: Frontend API Integration: Privacy Settings 
            ▪ Subtask 6.33.6.1: Create service/hook for GET /api/customer/privacy-settings (to fetch current consent status). 
            ▪ Subtask 6.33.6.2: Create service/hook for PUT /api/customer/privacy-settings/consent (to update consent preferences). 
            ▪ Subtask 6.33.6.3: Create service/hook for POST /api/customer/privacy-settings/data-export (to request data export). 
            ▪ Subtask 6.33.6.4: Create service/hook for POST /api/customer/privacy-settings/delete-account (to request account deletion). 
    • Backend Tasks (User Service, Data Service, Notification Service):
        ◦ Task 6.33.7: Update User Data Model for Consent 
            ▪ Subtask 6.33.7.1: Add a privacyConsents: { marketingEmail: Boolean, personalization: Boolean, analytics: Boolean, /* etc. */ } object to the User schema. 
            ▪ Subtask 6.33.7.2: Add consentUpdatedAt: Date to track last consent change. 
        ◦ Task 6.33.8: Create Get Privacy Settings API Endpoint 
            ▪ Subtask 6.33.8.1: Design and implement GET /api/customer/privacy-settings. 
            ▪ Subtask 6.33.8.2: Apply customer authentication. 
            ▪ Subtask 6.33.8.3: Return the current privacyConsents for the authenticated user. 
        ◦ Task 6.33.9: Create Update Consent Preferences API Endpoint 
            ▪ Subtask 6.33.9.1: Design and implement PUT /api/customer/privacy-settings/consent. 
            ▪ Subtask 6.33.9.2: Apply customer authentication. 
            ▪ Subtask 6.33.9.3: Receive the new privacyConsents object. 
            ▪ Subtask 6.33.9.4: Validate inputs and update the User document. 
            ▪ Subtask 6.33.9.5: Update consentUpdatedAt. 
            ▪ Subtask 6.33.9.6: Integrate with other services (e.g., unsubscribe from email lists if marketing consent is revoked). 
        ◦ Task 6.33.10: Create Data Export Request API Endpoint 
            ▪ Subtask 6.33.10.1: Design and implement POST /api/customer/privacy-settings/data-export. 
            ▪ Subtask 6.33.10.2: Apply customer authentication (and potentially re-authentication). 
            ▪ Subtask 6.33.10.3: Log the data export request. 
            ▪ Subtask 6.33.10.4: Initiate a background job to collect all personal data associated with the customerId from various services (e.g., user profile, order history, reviews, loyalty points, addresses). 
            ▪ Subtask 6.33.10.5: Format the data into a machine-readable archive (e.g., JSON files in a ZIP). 
            ▪ Subtask 6.33.10.6: Send an email to the customer with a secure, time-limited download link to the data archive. (This link must be heavily secured and only accessible by the requesting user after re-auth). 
            ▪ Subtask 6.33.10.7: Notify relevant internal teams. 
        ◦ Task 6.33.11: Create Account Deletion Request API Endpoint 
            ▪ Subtask 6.33.11.1: Design and implement POST /api/customer/privacy-settings/delete-account. 
            ▪ Subtask 6.33.11.2: Apply customer authentication and require re-authentication (password verification). 
            ▪ Subtask 6.33.11.3: Log the account deletion request. 
            ▪ Subtask 6.33.11.4: Set User status to 'pending_deletion' or similar, rather than immediate hard delete. 
            ▪ Subtask 6.33.11.5: Send a confirmation email to the user with a final verification link (e.g., "Click here to confirm account deletion within 48 hours"). 
            ▪ Subtask 6.33.11.6: (Optional) Initiate a cool-off period or grace period before actual deletion. 
        ◦ Task 6.33.12: Implement Background Job for Data Deletion 
            ▪ Subtask 6.33.12.1: Create a scheduled job that processes users with status: 'pending_deletion' (after cool-off/confirmation). 
            ▪ Subtask 6.33.12.2: Implement logic to redact or permanently delete personal data across all relevant databases and services (e.g., user table, order history, review data, shipping addresses, loyalty points). 
            ▪ Subtask 6.33.12.3: Ensure compliance with any necessary data retention laws (e.g., financial transaction records might need to be kept for longer). 
            ▪ Subtask 6.33.12.4: Log the successful deletion for auditing. 
    • Security & Compliance Tasks:
        ◦ Task 6.33.13: Data Access Control 
            ▪ Subtask 6.33.13.1: Ensure all data operations are strictly tied to the authenticated user. 
        ◦ Task 6.33.14: Secure Data Export Delivery 
            ▪ Subtask 6.33.14.1: Ensure data export links are one-time use, time-limited, and require re-authentication. 
            ▪ Subtask 6.33.14.2: Encrypt the data archive at rest and in transit. 
        ◦ Task 6.33.15: Auditing and Logging 
            ▪ Subtask 6.33.15.1: Log all changes to consent preferences, data export requests, and account deletion requests for compliance. 
    • Testing Tasks:
        ◦ Task 6.33.16: Write Unit Tests 
            ▪ Subtask 6.33.16.1: Unit tests for backend consent update logic. 
            ▪ Subtask 6.33.16.2: Unit tests for data export initiation logic (mocking data retrieval and email sending). 
            ▪ Subtask 6.33.16.3: Unit tests for account deletion request initiation and the background deletion process (mocking data redaction). 
        ◦ Task 6.33.17: Write Integration Tests 
            ▪ Subtask 6.33.17.1: Register a test user. Log in. 
            ▪ Subtask 6.33.17.2: Call GET /api/customer/privacy-settings. 
            ▪ Subtask 6.33.17.3: Call PUT /api/customer/privacy-settings/consent to change preferences. Verify update. 
            ▪ Subtask 6.33.17.4: Call POST /api/customer/privacy-settings/data-export. Verify email trigger and log entry. 
            ▪ Subtask 6.33.17.5: Call POST /api/customer/privacy-settings/delete-account (with re-auth). Verify user status changes to 'pending_deletion' and confirmation email is sent. 
            ▪ Subtask 6.33.17.6: Simulate confirmation link click and verify subsequent deletion by background job. 
            ▪ Subtask 6.33.17.7: Test unauthorized access. 
        ◦ Task 6.33.18: Manual End-to-End Testing 
            ▪ Subtask 6.33.18.1: Log in as a customer. Navigate to "My Account" -> "Privacy Settings." 
            ▪ Subtask 6.33.18.2: Adjust consent toggles/checkboxes. Save changes. Verify the changes persist. 
            ▪ Subtask 6.33.18.3: Click "Request Data Export." Verify confirmation message. Check registered email for the data link. 
            ▪ Subtask 6.33.18.4: Click "Request Account Deletion." Read warnings, re-authenticate, confirm. Verify logout and confirmation email. 
            ▪ Subtask 6.33.18.5: If possible, simulate the background deletion (e.g., via admin tool) and attempt to log in with the deleted account. Verify account no longer exists. 
            ▪ Subtask 6.33.18.6: Verify the Privacy Policy link works.
Epic 6: Customer Account Management Enhancements
Story 6.34: Order Cancellation Request
Story: As a registered customer, I want to be able to request the cancellation of an eligible order directly from my account's order history, so that I can quickly cancel an order before it's shipped, without needing to contact customer support.
Acceptance Criteria:
    1. On the "Order History" page, for each eligible order, a "Request Cancellation" button/link is visible. 
    2. An order is considered "eligible for cancellation" if it has not yet been processed for shipping (e.g., status is "Pending," "Processing," or "Awaiting Fulfillment" but not "Shipped" or "Completed"). 
    3. Clicking "Request Cancellation" prompts a confirmation dialog outlining the implications and confirming eligibility. 
    4. Upon confirmation, the cancellation request is submitted, and the order status is updated (e.g., "Cancellation Requested"). 
    5. The customer receives an email confirmation that their cancellation request has been received. 
    6. If the cancellation is successful (approved by the system/admin), the order status changes to "Cancelled," and a refund process is initiated (if payment was taken). 
    7. If the cancellation is not possible (e.g., order already shipped), the customer is informed immediately, and the "Request Cancellation" button is hidden or disabled for that order. 
    8. The customer can view the status of their cancellation request on the order details page. 
    9. All cancellation operations are securely performed by the authenticated user and only for their own orders. 

Granular Tasks & Subtasks for Story 6.34:
    • Frontend Tasks (Order History & Order Details Pages):
        ◦ Task 6.34.1: Implement "Request Cancellation" Button on Order History/Details 
            ▪ Subtask 6.34.1.1: Modify CustomerOrderHistoryPage and CustomerOrderDetailsPage components. 
            ▪ Subtask 6.34.1.2: Add a "Request Cancellation" button/link conditionally, based on order eligibility status (e.g., check order.cancellable flag from backend). 
            ▪ Subtask 6.34.1.3: On click, display a confirmation modal with clear text about irreversible action and potential refund process. 
            ▪ Subtask 6.34.1.4: Add "Confirm Cancellation" and "Cancel" buttons to the modal. 
        ◦ Task 6.34.2: Display Cancellation Request Status 
            ▪ Subtask 6.34.2.1: Update CustomerOrderDetailsPage to show the cancellation status (e.g., "Cancellation Requested," "Cancelled," "Cancellation Rejected"). 
            ▪ Subtask 6.34.2.2: Adjust UI based on status (e.g., remove "Request Cancellation" button once requested). 
        ◦ Task 6.34.3: Frontend API Integration: Order Cancellation 
            ▪ Subtask 6.34.3.1: Create service/hook for POST /api/customer/orders/:orderId/cancel-request (to submit cancellation request). 
            ▪ Subtask 6.34.3.2: Ensure GET /api/customer/orders/:orderId returns the cancellable status and current cancellation status. 
    • Backend Tasks (Order Service, Payment Service, Notification Service):
        ◦ Task 6.34.4: Update Order Model for Cancellation Status 
            ▪ Subtask 6.34.4.1: Add fields to the Order schema: 
                • cancellationStatus: String (e.g., 'none', 'requested', 'approved', 'rejected', 'cancelled'). 
                • cancellationRequestedAt: Date (nullable). 
                • cancellationProcessedAt: Date (nullable). 
                • cancellationReason: String (optional, for admin/internal use). 
        ◦ Task 6.34.5: Implement Order Eligibility Logic 
            ▪ Subtask 6.34.5.1: Create a function isOrderCancellable(order) that checks the order's current status (e.g., status !== 'shipped' && status !== 'completed' && cancellationStatus === 'none'). 
            ▪ Subtask 6.34.5.2: This logic should be used by the GET /api/customer/orders/:orderId endpoint to populate the cancellable flag. 
        ◦ Task 6.34.6: Create Order Cancellation Request API Endpoint 
            ▪ Subtask 6.34.6.1: Design and implement POST /api/customer/orders/:orderId/cancel-request. 
            ▪ Subtask 6.34.6.2: Apply customer authentication. 
            ▪ Subtask 6.34.6.3: Verify orderId belongs to the authenticated user. 
            ▪ Subtask 6.34.6.4: Call isOrderCancellable(order). If not cancellable, return an error. 
            ▪ Subtask 6.34.6.5: Update order.cancellationStatus to 'requested' and set cancellationRequestedAt. 
            ▪ Subtask 6.34.6.6: Send a confirmation email to the customer ("Your cancellation request for Order #XYZ has been received."). 
            ▪ Subtask 6.34.6.7: (Optional) Send an internal notification to customer support/fulfillment team. 
        ◦ Task 6.34.7: Implement Order Cancellation Processing Logic 
            ▪ Subtask 6.34.7.1: Automated Cancellation (if applicable): For simple orders that meet specific criteria (e.g., no items packed yet), implement immediate automated cancellation: 
                • Update order.cancellationStatus to 'cancelled'. 
                • Set cancellationProcessedAt. 
                • Call Payment Service to initiate a full refund. 
                • Update inventory levels for cancelled items. 
                • Send "Order Cancelled" confirmation email. 
            ▪ Subtask 6.34.7.2: Manual Review/Admin Approval: For complex orders or if automation is not feasible, the 'requested' status will require an admin to review and manually approve/reject. 
                • Develop a corresponding admin endpoint/UI for this (e.g., PUT /api/admin/orders/:orderId/process-cancellation). 
                • This admin action would then trigger the refund, inventory update, and email as above. 
        ◦ Task 6.34.8: Integrate with Payment Gateway for Refunds 
            ▪ Subtask 6.34.8.1: Implement a refund function in the Payment Service (if not already done). 
            ▪ Subtask 6.34.8.2: Call this function when a cancellation is approved/processed. 
        ◦ Task 6.34.9: Integrate with Inventory Management 
            ▪ Subtask 6.34.9.1: Ensure that when an order is cancelled, the stock of the items in that order is correctly returned to inventory. 
    • Security & Data Integrity Tasks:
        ◦ Task 6.34.10: Access Control 
            ▪ Subtask 6.34.10.1: Ensure customers can only request cancellation for their own orders. 
        ◦ Task 6.34.11: Prevent Race Conditions 
            ▪ Subtask 6.34.11.1: Ensure that an order cannot be processed for shipping and cancelled simultaneously. Use locking mechanisms or careful transaction management. 
    • Testing Tasks:
        ◦ Task 6.34.12: Write Unit Tests 
            ▪ Subtask 6.34.12.1: Unit tests for isOrderCancellable logic. 
            ▪ Subtask 6.34.12.2: Unit tests for cancellation request and status updates. 
            ▪ Subtask 6.34.12.3: Unit tests for refund initiation and inventory return (mocking external services). 
        ◦ Task 6.34.13: Write Integration Tests 
            ▪ Subtask 6.34.13.1: Register a test user. Place a new order (status 'Pending'). 
            ▪ Subtask 6.34.13.2: Call GET /api/customer/orders/:orderId. Verify cancellable is true. 
            ▪ Subtask 6.34.13.3: Call POST /api/customer/orders/:orderId/cancel-request. Verify order status changes to 'Cancellation Requested' and email is sent. 
            ▪ Subtask 6.34.13.4: Simulate the automated cancellation (or admin approval). Verify status changes to 'Cancelled', refund is initiated, and inventory is updated. 
            ▪ Subtask 6.34.13.5: Place another order. Update its status to 'Shipped' manually. 
            ▪ Subtask 6.34.13.6: Attempt to call POST /api/customer/orders/:orderId/cancel-request on the 'Shipped' order. Verify it's rejected as not cancellable. 
            ▪ Subtask 6.34.13.7: Test unauthorized access. 
        ◦ Task 6.34.14: Manual End-to-End Testing 
            ▪ Subtask 6.34.14.1: Log in as a customer. Place a new order. 
            ▪ Subtask 6.34.14.2: Go to "My Account" -> "Order History." Click on the new order. 
            ▪ Subtask 6.34.14.3: Verify "Request Cancellation" button is visible. Click it. Confirm. 
            ▪ Subtask 6.34.14.4: Verify order status updates to "Cancellation Requested." Check email for confirmation. 
            ▪ Subtask 6.34.14.5: (If automated) Verify status changes to "Cancelled" shortly after. Check email for cancellation confirmation. 
            ▪ Subtask 6.34.14.6: Place another order, wait for it to be marked as "Shipped" by an admin or fulfillment system. 
            ▪ Subtask 6.34.14.7: Go to its order details page. Verify "Request Cancellation" is either hidden or disabled. 
            ▪ Subtask 6.34.14.8: If you try to cancel a non-cancellable order, verify an appropriate error message is shown.
Epic 7: Search & Discovery Enhancements
Epic Goal: To significantly improve the user's ability to find desired products or content through robust search capabilities, intuitive filtering, and intelligent recommendations, leading to higher engagement and conversion rates.
Let's start with the foundational element of discovery: improving the core search functionality.
Story 7.101: Enhanced Keyword Search & Autocomplete
Story: As a customer, when I use the search bar, I want the system to provide more relevant and faster search results, including intelligent autocomplete suggestions, so that I can quickly find what I'm looking for even with imprecise queries.
Acceptance Criteria:
    1. Improved Search Relevance: 
        ◦ Search results prioritize items matching keywords in product/content titles, descriptions, and relevant attributes. 
        ◦ Results are robust against minor typos, singular/plural differences, and common synonyms (e.g., "sneakers" for "running shoes"). 
        ◦ Search supports partial word matches (e.g., "lap" finds "laptop"). 
    2. Fast & Responsive Autocomplete/Search Suggestions: 
        ◦ As the user types in the search bar, relevant suggestions appear instantly (within milliseconds). 
        ◦ Suggestions include: 
            ▪ Matching Product/Content Names: Direct matches to existing items. 
            ▪ Popular Search Queries: Commonly searched terms. 
            ▪ Category Suggestions: Suggesting a category that matches the input. 
        ◦ Clicking a suggestion immediately navigates to the search results page for that term or directly to the product/category page. 
    3. No Results Found Experience: 
        ◦ If no direct matches are found, the system provides: 
            ▪ Suggestions for similar terms. 
            ▪ Options to broaden the search (e.g., "search all categories"). 
            ▪ A link to contact support or browse popular categories. 
    4. Search History (Optional): 
        ◦ (Optional) The search bar suggests recent personal searches when empty or starting to type. 
    5. Performance: 
        ◦ Search queries and autocomplete suggestions return results very quickly, ideally within 50-100ms. 

Granular Tasks & Subtasks for Story 7.101:
    • Frontend Tasks (Global Search Bar, Search Results Page):
        ◦ Task 7.101.1: Integrate Autocomplete UI into Search Bar 
            ▪ Subtask 7.101.1.1: Implement a dropdown or overlay UI component that appears below the search bar as the user types. 
            ▪ Subtask 7.101.1.2: Style the autocomplete suggestions (e.g., bold matching text, distinguish between product/query/category suggestions). 
            ▪ Subtask 7.101.1.3: Implement keyboard navigation (up/down arrows to select, Enter to confirm). 
            ▪ Subtask 7.101.1.4: Implement click handling for suggestions to navigate to the appropriate search results or product page. 
        ◦ Task 7.101.2: Implement Search Results Page Display 
            ▪ Subtask 7.101.2.1: Design and develop the layout for displaying search results (e.g., grid view, list view). 
            ▪ Subtask 7.101.2.2: Display product/content name, image, price, rating, and a short description for each result. 
            ▪ Subtask 7.101.2.3: (Future Story) Implement pagination for results. 
        ◦ Task 7.101.3: Implement No Results Found UI 
            ▪ Subtask 7.101.3.1: Design a friendly "No results found" message. 
            ▪ Subtask 7.101.3.2: Display suggested alternative search terms or categories. 
            ▪ Subtask 7.101.3.3: Provide options to browse popular categories or contact support. 
        ◦ Task 7.101.4: Frontend API Integration: Search & Autocomplete 
            ▪ Subtask 7.101.4.1: Create service/hook for GET /api/search/suggest?query={term} (for autocomplete suggestions). 
            ▪ Subtask 7.101.4.2: Create service/hook for GET /api/search?query={term} (for main search results). 
            ▪ Subtask 7.101.4.3: Implement debouncing for autocomplete requests to reduce API calls. 
            ▪ Subtask 7.101.4.4: Handle loading states and errors for search results. 
    • Backend Tasks (Search Service, Indexing Service, Product/Content Service):
        ◦ Task 7.101.5: Select and Integrate Search Engine 
            ▪ Subtask 7.101.5.1: Research and select an appropriate search engine technology (e.g., Elasticsearch, Apache Solr, Algolia, MeiliSearch). 
            ▪ Subtask 7.101.5.2: Set up and configure the chosen search engine cluster/instance. 
            ▪ Subtask 7.101.5.3: Develop a dedicated Search Service API layer to interact with the search engine. 
        ◦ Task 7.101.6: Implement Data Indexing Service 
            ▪ Subtask 7.101.6.1: Develop an indexing pipeline to feed product/content data into the search engine. 
            ▪ Subtask 7.101.6.2: Define the schema for search documents (fields to index: id, name, description, category, tags, price, brand, rating, image_url, etc.). 
            ▪ Subtask 7.101.6.3: Implement initial full data import. 
            ▪ Subtask 7.101.6.4: Implement real-time or near-real-time updates to the search index when product/content data changes (e.g., using change data capture, message queues, webhooks from Product Service). 
        ◦ Task 7.101.7: Implement Autocomplete API Endpoint 
            ▪ Subtask 7.101.7.1: Design and implement GET /api/search/suggest?query={term}. 
            ▪ Subtask 7.101.7.2: Query the search engine for autocomplete suggestions based on the input term. 
            ▪ Subtask 7.101.7.3: Implement logic for: 
                • Prefix matching. 
                • Fuzzy matching (for typos). 
                • Popularity boosting (show more popular terms higher). 
                • Type differentiation (e.g., mark as "Product," "Category," "Search Term"). 
            ▪ Subtask 7.101.7.4: Return a structured JSON response of suggestions. 
        ◦ Task 7.101.8: Implement Main Search API Endpoint 
            ▪ Subtask 7.101.8.1: Design and implement GET /api/search?query={term}. 
            ▪ Subtask 7.101.8.2: Query the search engine for relevant results based on the input term. 
            ▪ Subtask 7.101.8.3: Implement search query logic: 
                • Full-text search across defined fields (name, description, etc.). 
                • Relevance scoring (boost exact matches, title matches). 
                • Fuzzy matching for robustness. 
                • Synonym handling (e.g., map "car" to "automobile"). 
                • Stemming/Lemmatization (e.g., "running" finds "run"). 
            ▪ Subtask 7.101.8.4: Fetch necessary data (e.g., full product details) from the Product/Content Service based on search IDs. 
            ▪ Subtask 7.101.8.5: Return paginated search results. 
        ◦ Task 7.101.9: Implement No Results Found Backend Logic 
            ▪ Subtask 7.101.9.1: In the search API, detect zero results. 
            ▪ Subtask 7.101.9.2: Implement logic to suggest alternative terms or broader categories if no results found. 
            ▪ Subtask 7.101.9.3: (Optional) Log no-results queries for analysis. 
    • Data & Performance Tasks:
        ◦ Task 7.101.10: Data Schema Optimization for Search 
            ▪ Subtask 7.101.10.1: Review and optimize product/content data structures for efficient indexing. 
            ▪ Subtask 7.101.10.2: Identify and extract relevant keywords, tags, or properties. 
        ◦ Task 7.101.11: Performance Tuning 
            ▪ Subtask 7.101.11.1: Optimize search engine configuration for speed (e.g., caching, shard allocation). 
            ▪ Subtask 7.101.11.2: Monitor query times and resource usage. 
        ◦ Task 7.101.12: Analytics Integration (Optional) 
            ▪ Subtask 7.101.12.1: Integrate search analytics to track popular queries, no-results queries, click-through rates. 
    • Testing Tasks:
        ◦ Task 7.101.13: Write Unit Tests (Backend) 
            ▪ Subtask 7.101.13.1: Unit tests for search query parsing, synonym mapping, and stemming logic. 
            ▪ Subtask 7.101.13.2: Unit tests for indexing pipeline logic (mocking search engine interaction). 
            ▪ Subtask 7.101.13.3: Unit tests for autocomplete suggestion generation. 
        ◦ Task 7.101.14: Write Integration Tests 
            ▪ Subtask 7.101.14.1: Populate the search engine with sample product/content data. 
            ▪ Subtask 7.101.14.2: Test GET /api/search/suggest with various queries (exact, partial, typos). Verify relevant suggestions are returned. 
            ▪ Subtask 7.101.14.3: Test GET /api/search with various queries. Verify results are relevant and include expected products. 
            ▪ Subtask 7.101.14.4: Test searches with no results. Verify correct "no results" response. 
            ▪ Subtask 7.101.14.5: Test performance under load. 
        ◦ Task 7.101.15: Manual End-to-End Testing: 
            ▪ Subtask 7.101.15.1: Use the global search bar. Type partial words and observe autocomplete suggestions. Click suggestions. 
            ▪ Subtask 7.101.15.2: Perform searches with exact product names, categories, and descriptions. Verify results. 
            ▪ Subtask 7.101.15.3: Introduce typos (e.g., "laptoop" instead of "laptop"). Verify relevant results still appear. 
            ▪ Subtask 7.101.15.4: Use synonyms (e.g., "couch" for "sofa"). Verify results. 
            ▪ Subtask 7.101.15.5: Search for a non-existent term. Verify the "no results found" experience is helpful. 
            ▪ Subtask 7.101.15.6: Test speed and responsiveness of both autocomplete and full search.
Epic 7: Search & Discovery Enhancements
Story 7.102: Faceted Search & Filtering
Story: As a customer, when I view search results or browse a category, I want to be able to filter the results by various attributes (e.g., price, brand, size, color, rating) and see the number of results for each filter option, so that I can quickly narrow down the list to items relevant to my specific needs.
Acceptance Criteria:
    1. Dynamic Filter Display: 
        ◦ A dedicated "Filters" or "Refine Results" sidebar/section appears on search results and category pages. 
        ◦ The available filter categories (facets) are dynamic and relevant to the current set of results (e.g., if searching for "laptop", "processor type" and "RAM" filters appear; if for "t-shirt", "size" and "color" appear). 
        ◦ Each filter category (e.g., "Brand," "Price," "Color") is clearly labeled. 
    2. Filter Options (Facet Values) with Counts: 
        ◦ Under each filter category, specific options (facet values) are listed (e.g., "Apple," "Samsung" under "Brand"; "Red," "Blue" under "Color"). 
        ◦ Each filter option clearly displays the count of matching results (e.g., "Apple (125)"). 
        ◦ Counts dynamically update as other filters are applied. 
    3. Interactive Filter Selection: 
        ◦ Users can select one or multiple values within a filter category (e.g., select both "Red" and "Blue" colors). 
        ◦ Different interaction types are used based on facet type (e.g., checkboxes for multiple selections, radio buttons for single selection, range sliders for price/numerical ranges). 
        ◦ Applying a filter immediately updates the displayed search results. 
    4. Active Filters Display: 
        ◦ Currently active filters are clearly displayed, typically at the top of the results area, with an option to remove individual filters (e.g., "Active Filters: Brand: Apple [x], Color: Blue [x]"). 
        ◦ A "Clear All Filters" option is available. 
    5. Performance: 
        ◦ Applying or clearing filters updates the results and facet counts very quickly (ideally within 100-200ms). 
    6. URL Management (Optional but Recommended): 
        ◦ Applied filters are reflected in the URL parameters, allowing users to share filtered results and for bookmarking. 

Granular Tasks & Subtasks for Story 7.102:
    • Frontend Tasks (Search Results Page, Category Pages):
        ◦ Task 7.102.1: Design & Implement Filters Sidebar UI 
            ▪ Subtask 7.102.1.1: Create a reusable "Filters" component (sidebar or collapsible section). 
            ▪ Subtask 7.102.1.2: Implement visual components for various filter types (checkbox lists, radio button groups, range sliders, dropdowns). 
            ▪ Subtask 7.102.1.3: Ensure responsiveness for different screen sizes (e.g., filters collapsing into a modal on mobile). 
        ◦ Task 7.102.2: Dynamically Render Filter Categories & Options 
            ▪ Subtask 7.102.2.1: Parse the facet data received from the backend. 
            ▪ Subtask 7.102.2.2: Loop through available facet categories and render corresponding filter UI components. 
            ▪ Subtask 7.102.2.3: For each option, display its label and dynamically updated count. 
        ◦ Task 7.102.3: Implement Filter Interaction Logic 
            ▪ Subtask 7.102.3.1: Attach event listeners to filter options (checkboxes, sliders, etc.). 
            ▪ Subtask 7.102.3.2: When a filter is selected/changed, update the active filters state in the frontend. 
            ▪ Subtask 7.102.3.3: Trigger a new search API request with the updated filter parameters. 
            ▪ Subtask 7.102.3.4: Implement client-side loading indicators while new results load. 
        ◦ Task 7.102.4: Implement Active Filters Display UI 
            ▪ Subtask 7.102.4.1: Create a component to display selected filters (e.g., "chip" format). 
            ▪ Subtask 7.102.4.2: Add "x" icon to each filter chip to remove it. 
            ▪ Subtask 7.102.4.3: Implement a "Clear All Filters" button. 
            ▪ Subtask 7.102.4.4: Update search API request when filters are removed/cleared. 
        ◦ Task 7.102.5: Manage URL Parameters for Filters 
            ▪ Subtask 7.102.5.1: Synchronize frontend filter state with URL query parameters (e.g., ?query=laptop&brand=Dell,HP&price_min=500). 
            ▪ Subtask 7.102.5.2: Read URL parameters on page load to pre-select filters. 
        ◦ Task 7.102.6: Frontend API Integration: Faceted Search 
            ▪ Subtask 7.102.6.1: Modify GET /api/search and GET /api/category/:id to accept filter parameters. 
            ▪ Subtask 7.102.6.2: Expect the API response to include filtered results and a list of available facets with their values and counts. 
    • Backend Tasks (Search Service, Indexing Service, Product/Content Service):
        ◦ Task 7.102.7: Enhance Search Engine Schema for Facets 
            ▪ Subtask 7.102.7.1: For each attribute that will be a filter, ensure it's indexed correctly in the search engine as a "facet" or "aggregatable" field (e.g., brand, color, size, price, rating). 
            ▪ Subtask 7.102.7.2: For numerical filters (like price, rating), configure appropriate ranges or numerical analysis. 
        ◦ Task 7.102.8: Modify Main Search API to Handle Filters 
            ▪ Subtask 7.102.8.1: Update GET /api/search?query={term} and introduce GET /api/category/:id/products (if not already existing) to accept query parameters for filtering (e.g., filters[brand]=value1,value2, filters[price_min]=X, filters[price_max]=Y). 
            ▪ Subtask 7.102.8.2: Pass these filter parameters to the underlying search engine query. 
            ▪ Subtask 7.102.8.3: Implement logic to perform facet aggregation (calculating counts for each filter option) based on the current filtered results. 
        ◦ Task 7.102.9: Return Facet Data in API Response 
            ▪ Subtask 7.102.9.1: Ensure the search API response includes a facets object alongside the results array. 
            ▪ Subtask 7.102.9.2: The facets object should contain: 
              JSON
Epic 7: Search & Discovery Enhancements
Story 7.103: Advanced Sorting Options
Story: As a customer, when I view search results or browse a category, I want to be able to sort the results by various criteria, so that I can arrange the list in an order that best suits my current needs (e.g., by price, relevance, or newest first).
Acceptance Criteria:
    1. Available Sorting Options: 
        ◦ A clear sorting control (e.g., a dropdown or a set of radio buttons) is prominently displayed on search results and category pages. 
        ◦ Standard sorting options are provided, such as: 
            ▪ Relevance (default for search results) 
            ▪ Price: Low to High 
            ▪ Price: High to Low 
            ▪ Newest Arrivals (based on product creation/listing date) 
            ▪ Top Rated (based on average customer review score) 
            ▪ Most Popular (based on sales volume or views, if applicable) 
    2. Single Selection: 
        ◦ Users can select only one sorting option at a time. 
        ◦ Selecting a new sorting option overrides any previously selected sort. 
    3. Dynamic Results Update: 
        ◦ Changing the sorting option immediately reorders and redisplays the search results according to the new criteria. 
    4. Active Sort Indicator: 
        ◦ The currently active sorting option is clearly indicated in the UI (e.g., dropdown shows selected value, selected button is highlighted). 
    5. Performance: 
        ◦ Changing the sort order updates the results quickly (ideally within 100-200ms). 
    6. URL Management (Optional but Recommended): 
        ◦ The selected sort order is reflected in the URL parameters, allowing users to share sorted results and for bookmarking. 

Granular Tasks & Subtasks for Story 7.103:
    • Frontend Tasks (Search Results Page, Category Pages):
        ◦ Task 7.103.1: Design & Implement Sorting Control UI 
            ▪ Subtask 7.103.1.1: Create a reusable UI component for sorting (e.g., a dropdown menu with "Sort by:" label). 
            ▪ Subtask 7.103.1.2: Populate the dropdown with the defined sorting options (Relevance, Price Low to High, etc.). 
            ▪ Subtask 7.103.1.3: Ensure the currently selected option is visible in the dropdown. 
        ◦ Task 7.103.2: Implement Sorting Interaction Logic 
            ▪ Subtask 7.103.2.1: Attach event listeners to the sorting control. 
            ▪ Subtask 7.103.2.2: When a new sorting option is selected, update the frontend's sort state. 
            ▪ Subtask 7.103.2.3: Trigger a new search API request with the updated sort parameter. 
            ▪ Subtask 7.103.2.4: Implement client-side loading indicators while new results load. 
        ◦ Task 7.103.3: Manage URL Parameters for Sorting 
            ▪ Subtask 7.103.3.1: Synchronize frontend sort state with URL query parameters (e.g., ?query=shirts&sort=price_asc). 
            ▪ Subtask 7.103.3.2: Read URL parameters on page load to set the initial sort order. 
        ◦ Task 7.103.4: Frontend API Integration: Sorted Search 
            ▪ Subtask 7.103.4.1: Modify GET /api/search and GET /api/category/:id/products to accept a sort parameter (e.g., sort=price_asc, sort=newest, sort=relevance). 
            ▪ Subtask 7.103.4.2: Expect the API response to return results ordered according to the sort parameter. 
    • Backend Tasks (Search Service, Indexing Service):
        ◦ Task 7.103.5: Enhance Search Engine Schema for Sorting 
            ▪ Subtask 7.103.5.1: For each attribute that will be used for sorting, ensure it's indexed in the search engine in a sortable manner (e.g., numerical fields like price, rating, date_created; text fields for relevance). 
            ▪ Subtask 7.103.5.2: Ensure relevance is properly configured as the default sort for keyword searches. 
        ◦ Task 7.103.6: Modify Main Search API to Handle Sorting 
            ▪ Subtask 7.103.6.1: Update GET /api/search and GET /api/category/:id/products to process the sort query parameter. 
            ▪ Subtask 7.103.6.2: Translate the received sort parameter into the appropriate sort directives for the underlying search engine (e.g., _score for relevance, price:asc, price:desc, date_created:desc, average_rating:desc). 
            ▪ Subtask 7.103.6.3: Pass these sort directives to the search engine query. 
            ▪ Subtask 7.103.6.4: Ensure the search engine returns results in the requested order. 
    • Data & Performance Tasks:
        ◦ Task 7.103.7: Data Consistency for Sorting Attributes 
            ▪ Subtask 7.103.7.1: Verify that all products/content have valid values for sortable attributes (e.g., all products have a price, a creation date, and can be rated). 
            ▪ Subtask 7.103.7.2: Handle cases where sort attributes might be missing (e.g., default to end of list, or exclude if not sortable). 
        ◦ Task 7.103.8: Performance Tuning for Sorted Queries 
            ▪ Subtask 7.103.8.1: Optimize search engine indexing and query execution for efficient sorting, especially for large datasets. 
            ▪ Subtask 7.103.8.2: Monitor query times for different sort criteria. 
    • Testing Tasks:
        ◦ Task 7.103.9: Write Unit Tests (Backend) 
            ▪ Subtask 7.103.9.1: Unit tests for parsing the sort parameter and converting it into search engine sort instructions. 
            ▪ Subtask 7.103.9.2: Unit tests for default sort behavior when no sort parameter is provided. 
        ◦ Task 7.103.10: Write Integration Tests 
            ▪ Subtask 7.103.10.1: Populate the search engine with a diverse dataset including products with varying prices, dates, and ratings. 
            ▪ Subtask 7.103.10.2: Perform a general search or go to a category page. 
            ▪ Subtask 7.103.10.3: Call GET /api/search (or category API) with sort=price_asc. Verify the first and last few results reflect ascending price order. 
            ▪ Subtask 7.103.10.4: Repeat for sort=price_desc, sort=newest, sort=top_rated. 
            ▪ Subtask 7.103.10.5: Combine sorting with filtering (from Story 7.102). Apply filters and then sort results. Verify both are applied correctly. 
            ▪ Subtask 7.103.10.6: Test with empty search results. 
            ▪ Subtask 7.103.10.7: Test edge cases (e.g., all products have the same price). 
        ◦ Task 7.103.11: Manual End-to-End Testing: 
            ▪ Subtask 7.103.11.1: Go to a search results page or category page. 
            ▪ Subtask 7.103.11.2: Locate the sorting control. 
            ▪ Subtask 7.103.11.3: Select each sorting option one by one (Price: Low to High, Price: High to Low, Newest, Top Rated). 
            ▪ Subtask 7.103.11.4: Visually verify that the product/content list reorders correctly based on the selected criterion. 
            ▪ Subtask 7.103.11.5: Confirm the active sort option is clearly displayed in the UI. 
            ▪ Subtask 7.103.11.6: Apply filters (from Story 7.102) and then try sorting. Ensure both functions work together seamlessly. 
            ▪ Subtask 7.103.11.7: Observe URL parameters changing with sorting. Test refreshing the page with sort in the URL. 
            ▪ Subtask 7.103.11.8: Test speed and responsiveness of sorting changes.
Epic 7: Search & Discovery Enhancements
Story 7.104: Search Term Landing Pages
Story: As a customer, when I search for a popular or strategically important term, I want to land on a dedicated, curated page that provides relevant products, helpful information, and promotions specific to that term, so that I can find what I need faster and have a richer discovery experience.
Acceptance Criteria:
    1. Dedicated Landing Page Creation: 
        ◦ An internal tool or CMS allows administrators to create and manage specific landing pages for designated search terms (e.g., "Gaming Laptops," "Summer Dresses," "Smart Home Devices"). 
        ◦ Each landing page has a unique, SEO-friendly URL (e.g., /search/gaming-laptops). 
    2. Configurable Content: 
        ◦ Administrators can configure various elements on these landing pages: 
            ▪ Hero Banner/Image: Specific to the search term. 
            ▪ Curated Product Listings: Ability to select specific products to feature prominently. 
            ▪ Dynamic Product Grids: Display products matching the term, potentially with pre-applied filters/sorting. 
            ▪ Promotional Content: Links to relevant offers or campaigns. 
            ▪ Informational Content: Short introductory text, FAQs, buying guides related to the term. 
            ▪ Featured Categories/Brands: Links to sub-categories or popular brands relevant to the term. 
            ▪ SEO Metadata: Configurable title tags, meta descriptions, and keywords for the page. 
    3. Search Integration: 
        ◦ When a customer searches for a designated term, they are automatically redirected to its corresponding landing page instead of the generic search results page. 
        ◦ This includes variations of the search term (e.g., "gaming laptop" redirects to "Gaming Laptops" page). 
    4. Fallback to Generic Search: 
        ◦ If no specific landing page exists for a search term, the system defaults to the regular dynamic search results page (from Story 7.101/7.102/7.103). 
    5. Analytics Tracking: 
        ◦ All interactions on these landing pages are trackable for analytics purposes (e.g., views, clicks on products/banners). 
    6. Performance & Scalability: 
        ◦ Landing pages load quickly and efficiently. 

Granular Tasks & Subtasks for Story 7.104:
    • Admin/CMS Tasks (Content Management System or Internal Admin Tool):
        ◦ Task 7.104.1: Develop Search Term Landing Page Management Interface 
            ▪ Subtask 7.104.1.1: Create a new section in the admin panel (e.g., "Search Landing Pages" under "Content" or "Marketing"). 
            ▪ Subtask 7.104.1.2: Implement "Add New Landing Page" functionality. 
            ▪ Subtask 7.104.1.3: Implement "Edit/Delete Existing Landing Page" functionality. 
            ▪ Subtask 7.104.1.4: Design form fields for: 
                • Target Search Terms: A list of exact terms that should trigger this page (e.g., "gaming laptops", "gaming laptop", "gaming notebook"). 
                • Page URL Slug: (e.g., gaming-laptops). 
                • Page Title, Meta Description, SEO Keywords. 
                • Hero Section: Image upload, headline, subtitle, call-to-action button. 
                • Curated Product Selection: Ability to search and add specific product IDs, control display order. 
                • Dynamic Product Section: Configuration for default filters, sort order for the dynamic grid (e.g., "show all products for 'gaming laptops' sorted by price_desc"). 
                • Text/HTML Blocks: For introductory content, FAQs, buying guides. 
                • Promotional Banners: Image upload, link. 
                • Featured Categories/Brands: Selection of categories/brands to highlight. 
                • Status: Draft/Published/Archived. 
            ▪ Subtask 7.104.1.5: Implement validation for inputs (e.g., unique URL slug). 
            ▪ Subtask 7.104.1.6: Implement user authentication and authorization for admin access. 
    • Backend Tasks (Search Service, CMS Service, Product Service):
        ◦ Task 7.104.7: Develop Search Term Landing Page Data Model 
            ▪ Subtask 7.104.7.1: Create a SearchLandingPage schema/collection in the database: 
              JSON
Epic 8: Order Fulfillment & Post-Purchase Experience
Epic Goal: To provide customers with comprehensive tools and information to manage their orders, track shipments, initiate returns, and resolve issues, ensuring a seamless and transparent experience from purchase to delivery and beyond.
Let's begin with one of the most requested post-purchase features: clear and accessible order tracking.
Story 8.101: Enhanced Order Tracking & Status Updates
Story: As a customer, after placing an order, I want to be able to easily track its real-time status and view detailed shipping information, so that I can stay informed about my delivery and anticipate its arrival.
Acceptance Criteria:
    1. Accessible Order Tracking: 
        ◦ A clear "Track Order" link or button is available: 
            ▪ On the order confirmation page. 
            ▪ Within the "My Orders" section of the customer account. 
            ▪ In order confirmation and shipping notification emails. 
    2. Detailed Order Status Display: 
        ◦ The order tracking page displays a clear, chronological status history for the entire order (e.g., "Order Placed," "Processing," "Shipped," "Out for Delivery," "Delivered," "Canceled"). 
        ◦ Each status update includes a timestamp. 
    3. Real-Time Shipment Tracking Integration: 
        ◦ For "Shipped" and subsequent statuses, direct integration with the shipping carrier's tracking system (e.g., UPS, FedEx, Royal Mail, DHL) provides granular detail. 
        ◦ This includes: 
            ▪ The tracking number. 
            ▪ A direct, clickable link to the carrier's tracking page for the specific shipment. 
            ▪ Key transit events displayed directly on our platform (e.g., "Left warehouse," "Arrived at sorting facility," "Out for delivery in Edgware, England, United Kingdom"). 
            ▪ Estimated delivery date/time (if provided by carrier). 
    4. Multi-Item/Multi-Shipment Handling: 
        ◦ If an order is fulfilled in multiple shipments (e.g., items from different warehouses), tracking information is available for each individual shipment. 
        ◦ The UI clearly distinguishes between shipments for the same order. 
    5. Notifications (Optional but Recommended): 
        ◦ Customers receive email notifications for key status changes (e.g., "Shipped," "Out for Delivery," "Delivered"). 
    6. "No Tracking Available" Handling: 
        ◦ For orders that are not yet shipped or for carriers that don't provide granular tracking, the system clearly indicates "Tracking information will be available once your order ships." 
    7. Guest Order Tracking: 
        ◦ A dedicated public-facing page (e.g., /track-order) allows guest users to track their order using their order number and email address (or billing zip code). 
    8. Performance: 
        ◦ Order tracking pages load quickly, and tracking information updates promptly. 

Granular Tasks & Subtasks for Story 8.101:
    • Backend Tasks (Order Service, Shipping Service, Notification Service):
        ◦ Task 8.101.1: Enhance Order Data Model for Tracking 
            ▪ Subtask 8.101.1.1: Update Order schema/collection to store: 
                • currentStatus: "placed", "processing", "shipped", "delivered", "canceled", etc. 
                • statusHistory: Array of objects [{ status: "placed", timestamp: Date, details: "Order received" }]. 
                • shipments: Array of objects for multi-shipment orders. Each shipment object should contain: 
                    ◦ shipmentId: Unique ID for the shipment. 
                    ◦ trackingNumber: String. 
                    ◦ carrier: String (e.g., "UPS", "Royal Mail"). 
                    ◦ carrierTrackingUrl: Dynamic URL to carrier's tracking page. 
                    ◦ status: Current status of this shipment. 
                    ◦ statusHistory: Array of [{ status: "shipped", timestamp: Date, location: "Warehouse A" }]. 
                    ◦ estimatedDeliveryDate: Date (if available). 
                    ◦ items: Array of product IDs/quantities included in this shipment. 
        ◦ Task 8.101.2: Implement Order Status Update Logic 
            ▪ Subtask 8.101.2.1: Develop internal APIs/listeners for order status changes (e.g., from warehouse management system, payment gateway, shipping system). 
            ▪ Subtask 8.101.2.2: Ensure status updates are correctly recorded in statusHistory for both the order and individual shipments. 
        ◦ Task 8.101.3: Integrate with Shipping Carrier APIs (or 3rd Party Tracking Service) 
            ▪ Subtask 8.101.3.1: Research and select suitable shipping carrier APIs (e.g., UPS API, FedEx API, Royal Mail API) or a universal tracking API service (e.g., AfterShip, ShipStation). 
            ▪ Subtask 8.101.3.2: Obtain necessary API keys and credentials. 
            ▪ Subtask 8.101.3.3: Develop a ShippingTrackingService to: 
                • Accept a tracking number and carrier. 
                • Call the respective carrier's API (or the universal service). 
                • Parse the response to extract current status, status history, and estimated delivery. 
                • Handle errors/rate limits from external APIs. 
            ▪ Subtask 8.101.3.4: Implement a background job to periodically poll carrier APIs for updates to active shipments, pushing updates to the Order data model. 
        ◦ Task 8.101.4: Develop Customer-Facing Order Tracking API 
            ▪ Subtask 8.101.4.1: Design and implement GET /api/customer/orders/:orderId/track. 
            ▪ Subtask 8.101.4.2: Apply customer authentication and authorization (ensure user can only track their own orders). 
            ▪ Subtask 8.101.4.3: Fetch Order and Shipment data. 
            ▪ Subtask 8.101.4.4: Include the carrier's direct tracking URL and any relevant recent tracking events. 
        ◦ Task 8.101.5: Develop Guest Order Tracking API 
            ▪ Subtask 8.101.5.1: Design and implement POST /api/public/track-order (using POST to avoid exposing sensitive data in URL). 
            ▪ Subtask 8.101.5.2: Accepts orderNumber and customerEmail (or billingZipCode). 
            ▪ Subtask 8.101.5.3: Validate the provided credentials. 
            ▪ Subtask 8.101.5.4: Return only necessary tracking information (no customer PII). 
        ◦ Task 8.101.6: Integrate with Notification Service 
            ▪ Subtask 8.101.6.1: Develop event listeners for key order/shipment status changes. 
            ▪ Subtask 8.101.6.2: Trigger email notifications (e.g., "Your Order Has Shipped," "Out for Delivery," "Delivered") with dynamic content including tracking number and link. 
    • Frontend Tasks (Order Confirmation, My Account, Public Tracking Page):
        ◦ Task 8.101.7: Update Order Confirmation Page UI 
            ▪ Subtask 8.101.7.1: Add a prominent "Track Your Order" button/link, pointing to the authenticated tracking page. 
        ◦ Task 8.101.8: Update "My Orders" Section UI 
            ▪ Subtask 8.101.8.1: In the customer's "My Orders" list, add a "View Details" or "Track" button/link next to each order. 
            ▪ Subtask 8.101.8.2: Display the current high-level status for each order. 
        ◦ Task 8.101.9: Implement Authenticated Order Tracking Page UI 
            ▪ Subtask 8.101.9.1: Create a CustomerOrderTrackingPage component/route (e.g., /account/orders/:orderId/track). 
            ▪ Subtask 8.101.9.2: Call GET /api/customer/orders/:orderId/track to fetch data. 
            ▪ Subtask 8.101.9.3: Display the overall order status and statusHistory visually (e.g., timeline, progress bar). 
            ▪ Subtask 8.101.9.4: For each shipment: 
                • Display tracking number and carrier logo. 
                • Provide direct link to carrier's website. 
                • Display specific shipment status and granular events from the carrier API. 
                • Clearly indicate which items are in which shipment. 
            ▪ Subtask 8.101.9.5: Handle "no tracking available yet" messages. 
        ◦ Task 8.101.10: Implement Guest Order Tracking Page UI 
            ▪ Subtask 8.101.10.1: Create a PublicOrderTrackingPage component/route (e.g., /track-order). 
            ▪ Subtask 8.101.10.2: Implement a form with input fields for Order Number and Email (or billing zip). 
            ▪ Subtask 8.101.10.3: Call POST /api/public/track-order on form submission. 
            ▪ Subtask 8.101.10.4: Display tracking information similarly to the authenticated page, but without any customer-specific details beyond the tracking. 
            ▪ Subtask 8.101.10.5: Handle incorrect credentials gracefully (e.g., "Order not found or details incorrect"). 
        ◦ Task 8.101.11: Update Order Confirmation & Shipping Email Templates 
            ▪ Subtask 8.101.11.1: Embed tracking number and direct links to carrier/our tracking page in relevant email templates. 
    • Testing Tasks:
        ◦ Task 8.101.12: Write Unit Tests (Backend) 
            ▪ Subtask 8.101.12.1: Unit tests for parsing carrier API responses. 
            ▪ Subtask 8.101.12.2: Unit tests for validating guest tracking credentials. 
            ▪ Subtask 8.101.12.3: Unit tests for order status update logic. 
        ◦ Task 8.101.13: Write Integration Tests 
            ▪ Subtask 8.101.13.1: Create a test order. Simulate status changes (processing, shipped). Verify statusHistory is updated. 
            ▪ Subtask 8.101.13.2: Mock carrier API responses for various statuses (in transit, out for delivery, delivered, exception). Verify the ShippingTrackingService correctly processes them. 
            ▪ Subtask 8.101.13.3: Test authenticated tracking (GET /api/customer/orders/:orderId/track). Verify correct data for single and multi-shipment orders. 
            ▪ Subtask 8.101.13.4: Test guest tracking (POST /api/public/track-order). Verify successful tracking with valid credentials and failure with invalid ones. 
            ▪ Subtask 8.101.13.5: Verify notifications are triggered on status changes. 
            ▪ Subtask 8.101.13.6: Test access control (user cannot track another user's order). 
        ◦ Task 8.101.14: Manual End-to-End Testing: 
            ▪ Subtask 8.101.14.1: Place an order (as a registered user and as a guest). 
            ▪ Subtask 8.101.14.2: Verify "Track Order" link on confirmation page works. 
            ▪ Subtask 8.101.14.3: Log in, go to "My Orders," click "Track" for the new order. Verify basic status. 
            ▪ Subtask 8.101.14.4: Simulate the order being marked "Shipped" (in dev environment). Verify the status updates on the tracking page. 
            ▪ Subtask 8.101.14.5: Verify the tracking number and direct link to the carrier's website are present and functional. 
            ▪ Subtask 8.101.14.6: If multi-shipment is implemented, verify all shipments are displayed correctly. 
            ▪ Subtask 8.101.14.7: Test the public /track-order page with the guest order number and email. 
            ▪ Subtask 8.101.14.8: Verify email notifications are received for key status changes. 
            ▪ Subtask 8.101.14.9: Test cases with "no tracking available yet." 
            ▪ Subtask 8.101.14.10: Check page load times for tracking pages.
Epic 8: Order Fulfillment & Post-Purchase Experience
Story 8.102: Easy Returns & Exchange Process
Story: As a customer, I want to be able to easily initiate and track a return or exchange for items purchased online, so that I can conveniently send back products that don't meet my needs without needing to contact customer support directly.
Acceptance Criteria:
    1. Initiate Return from "My Orders": 
        ◦ For eligible orders, a "Request Return" or "Start Return" button/link is available in the "My Orders" section of the customer account (typically on the order detail page). 
        ◦ This option is only visible for orders/items that are within the defined return window. 
    2. Guided Return Workflow: 
        ◦ The return initiation process is guided and user-friendly, allowing the customer to: 
            ▪ Select specific items from the order for return/exchange. 
            ▪ Specify a reason for return/exchange from a predefined list (e.g., "Too small," "Damaged," "Wrong item received," "Changed mind"). 
            ▪ (Optional) Add comments or upload images for clarification (especially for damaged/wrong items). 
            ▪ Choose between a refund, store credit, or exchange (if applicable). 
    3. Automated Eligibility Check: 
        ◦ The system automatically checks if the selected items/order are eligible for return based on: 
            ▪ Return Policy Window: (e.g., within 30 days of delivery). 
            ▪ Item Type Restrictions: (e.g., final sale items, digital products, hygiene items). 
            ▪ Order Status: (e.g., only for "Delivered" orders, not "Processing"). 
        ◦ Ineligible items are clearly indicated with reasons. 
    4. Return Merchandise Authorization (RMA): 
        ◦ Upon successful submission, a unique Return Merchandise Authorization (RMA) number is generated for the return. 
        ◦ The customer receives confirmation of the RMA. 
    5. Return Shipping Label Generation: 
        ◦ The system generates a printable, pre-paid return shipping label (or instructions for printing). 
        ◦ The label is provided to the customer via: 
            ▪ Download link on the confirmation page. 
            ▪ Link in an email confirmation. 
    6. Return Status Tracking: 
        ◦ The customer can view the status of their return request in "My Returns" or within the original order details (e.g., "Return Requested," "Label Issued," "Item Received," "Refund Processed," "Exchange Shipped"). 
    7. Automated Notifications: 
        ◦ Customers receive email notifications for key return status changes (e.g., "Return Request Approved," "Return Received," "Refund Processed," "Exchange Shipped"). 
    8. Backend Integration: 
        ◦ The return process integrates with: 
            ▪ Inventory Management System: To expect returned items. 
            ▪ Payment Gateway/Accounting System: To process refunds. 
            ▪ Shipping Carrier API: For label generation (if not using a dedicated return service). 
    9. Admin Review & Approval (Optional): 
        ◦ (Optional) For certain return reasons (e.g., "Damaged"), the request may be flagged for manual review and approval by an administrator before label issuance. 
    10. Guest Returns (Optional): 
        ◦ (Optional) A public-facing return portal allows guests to initiate returns using order number and email. 

Granular Tasks & Subtasks for Story 8.102:
    • Backend Tasks (Order Service, Return Service, Inventory Service, Payment Service, Notification Service, Admin Service):
        ◦ Task 8.102.1: Enhance Order & Product Data Models for Returns 
            ▪ Subtask 8.102.1.1: Add returnWindowExpiresAt to Order or OrderItem level. 
            ▪ Subtask 8.102.1.2: Add isReturnable flag/rules to Product model. 
            ▪ Subtask 8.102.1.3: Create a Return schema/collection: 
              JSON
Epic 8: Order Fulfillment & Post-Purchase Experience
Story 8.104: Delivery Preferences Management
Story: As a customer, I want to be able to set and manage my delivery preferences (e.g., preferred time slots, safe place instructions, or alternative delivery locations) so that I can ensure my packages are delivered securely and conveniently, even when I'm not home.
Acceptance Criteria:
    1. "My Delivery Preferences" Section: 
        ◦ A dedicated section (e.g., "Delivery Preferences" or "Shipping Options") is available within the customer's account settings (My Account). 
    2. Configurable Preference Types (at least two): 
        ◦ Preferred Delivery Time Windows: Ability to select general time frames (e.g., "Morning: 9 AM - 12 PM," "Afternoon: 1 PM - 5 PM," "Evening: 6 PM - 9 PM"). 
        ◦ Safe Place Instructions: A free-text field for instructions (e.g., "Leave in porch," "Behind garden gate," "With neighbour at No. 5"). 
        ◦ Alternative Delivery Locations (e.g., Pickup Points/Lockers): Integration with a network of local pickup points or smart lockers. 
        ◦ (Initially, focus on Preferred Delivery Time Windows and Safe Place Instructions. Pickup points can be a stretch goal or a separate follow-up story). 
    3. Application during Checkout: 
        ◦ During the checkout process, the customer's saved delivery preferences are automatically suggested or displayed. 
        ◦ Customers can apply or modify these preferences for the current order. 
    4. Carrier Integration: 
        ◦ The system passes the chosen delivery preferences to the selected shipping carrier during label generation or manifest submission (from Story 8.101). 
        ◦ Validation ensures that the selected preferences are supported by the chosen carrier for the specific delivery address. 
    5. Preference Validation: 
        ◦ The system provides clear feedback if a preference is not available for a given order or carrier (e.g., "Evening delivery not available for this postcode"). 
    6. Saved Preferences: 
        ◦ Once set, preferences are saved to the customer's profile for future use, simplifying subsequent orders. 
    7. Performance: 
        ◦ Setting and applying preferences do not add significant delay to the checkout or order placement process. 

Granular Tasks & Subtasks for Story 8.104:
    • Backend Tasks (Customer Service, Order Service, Shipping Service):
        ◦ Task 8.104.1: Enhance Customer Profile Data Model for Preferences 
            ▪ Subtask 8.104.1.1: Update Customer schema/collection (from Epic 6) to include: 
              JSON
Story 8.105: Product Review Reminder Notifications
Story: As a customer, after my order has been delivered, I want to receive a polite and timely email reminder to review the products I purchased, so that I can easily share my feedback and help other shoppers.
Acceptance Criteria:
    1. Automated Trigger: 
        ◦ An automated process sends a review reminder email to the customer a configurable number of days (e.g., 7-14 days) after an order's status changes to "Delivered" (from Story 8.101). 
    2. Targeted Products: 
        ◦ The reminder email lists the specific products from the delivered order that the customer can review. 
        ◦ Each product listed includes its image, name, and a direct link to the review submission form for that product. 
    3. Review Submission Link: 
        ◦ Clicking the product link in the email takes the customer directly to the product detail page with the review submission form pre-selected or easily accessible. 
        ◦ If the customer is logged in, their name/email can be pre-filled in the review form. 
    4. Single Reminder Policy: 
        ◦ Customers receive only one review reminder email per order, regardless of how many products are in it. 
        ◦ The system prevents sending reminders for products that have already been reviewed by that customer. 
    5. Exclusion Criteria: 
        ◦ Reminders are not sent for: 
            ▪ Canceled orders. 
            ▪ Returned items (if a return is initiated before the reminder is sent). 
            ▪ Digital products (if not applicable for review). 
            ▪ Products already reviewed by the customer. 
    6. Personalized Email Content: 
        ◦ The email is personalized with the customer's name and references their order. 
        ◦ It has a clear call to action and explains the value of their feedback. 
    7. Performance: 
        ◦ The reminder process runs efficiently in the background without impacting site performance. 
    8. Reporting: 
        ◦ Ability to track the number of review reminders sent and the conversion rate (how many lead to reviews). 

Granular Tasks & Subtasks for Story 8.105:
    • Backend Tasks (Order Service, Product Service, Review Service, Notification Service, Scheduled Jobs Service):
        ◦ Task 8.105.1: Enhance Order Status Tracking for "Delivered" State 
            ▪ Subtask 8.105.1.1: Ensure Order Service reliably updates order status to "Delivered" and captures the deliveredAt timestamp (from Story 8.101). 
        ◦ Task 8.105.2: Develop "Review Eligibility" Check Logic 
            ▪ Subtask 8.105.2.1: Create a function/service that, given an orderId and customerId, determines which orderItems are eligible for a review reminder. 
            ▪ Subtask 8.105.2.2: Eligibility rules: 
                • Order status is "Delivered". 
                • Item is not marked as returned (integrate with Return Service from Story 8.102). 
                • Item is not a digital-only product (if applicable). 
                • Customer has not already submitted a review for this productId on this orderId (integrate with Review Service). 
                • A review reminder has not already been sent for this orderId. 
        ◦ Task 8.105.3: Create & Manage "Review Reminder Sent" Flag 
            ▪ Subtask 8.105.3.1: Add a reviewReminderSent boolean flag to the Order data model (default false). 
            ▪ Subtask 8.105.3.2: Ensure this flag is set to true once a reminder email is successfully queued/sent for an order. 
        ◦ Task 8.105.4: Implement Scheduled Job for Review Reminders 
            ▪ Subtask 8.105.4.1: Develop a daily (or configurable frequency) background job (cron job) to: 
                • Query Order Service for "Delivered" orders where reviewReminderSent is false and deliveredAt is X days ago (e.g., 7-14 days). 
                • For each such order, call the "Review Eligibility" check (Task 8.105.2). 
                • If eligible products are found, trigger the reminder email (Task 8.105.5). 
                • Update the reviewReminderSent flag to true for the order. 
        ◦ Task 8.105.5: Design & Integrate Review Reminder Email Template 
            ▪ Subtask 8.105.5.1: Work with marketing/design to create a compelling email template for review reminders. 
            ▪ Subtask 8.105.5.2: The template must support dynamic injection of: 
                • Customer's Name. 
                • Order Number. 
                • List of reviewable products (image, name, direct review link). 
            ▪ Subtask 8.105.5.3: Integrate this template with the Notification Service (from Epic 6 or general Notification Service). 
            ▪ Subtask 8.105.5.4: Develop an API endpoint or internal function that the scheduled job calls to send the reminder, passing the necessary dynamic data. 
    • Frontend Tasks (Product Detail Page - Review Form):
        ◦ Task 8.105.6: Ensure Review Submission Flow is Seamless 
            ▪ Subtask 8.105.6.1: On the Product Detail Page (PDP), ensure the review submission form (from Epic 7, or a new feature) is easily discoverable and usable. 
            ▪ Subtask 8.105.6.2: If the customer lands on the PDP via a review reminder link and is logged in, optionally pre-fill their name/email in the review form. 
            ▪ Subtask 8.105.6.3: (Optional) If the URL contains ?review=true or similar, automatically scroll to/expand the review form section. 
            ▪ Subtask 8.105.6.4: Ensure successful review submission gives clear confirmation. 
    • Reporting & Analytics Tasks:
        ◦ Task 8.105.7: Implement Review Reminder Reporting 
            ▪ Subtask 8.105.7.1: Log events for review_reminder_sent and review_submitted_from_reminder. 
            ▪ Subtask 8.105.7.2: Develop a simple dashboard or report (e.g., in analytics tool or admin panel) to show: 
                • Total review reminders sent. 
                • Number of reviews received from reminders. 
                • Conversion rate of reminders to reviews. 
                • (Optional) Average rating from reminder-driven reviews. 
    • Testing Tasks:
        ◦ Task 8.105.8: Write Unit Tests (Backend) 
            ▪ Subtask 8.105.8.1: Unit tests for the "Review Eligibility" logic, covering various scenarios (delivered, returned, already reviewed, digital product). 
            ▪ Subtask 8.105.8.2: Unit tests for the scheduled job's query logic (correctly identifying orders X days old). 
            ▪ Subtask 8.105.8.3: Unit tests for the reviewReminderSent flag being correctly set. 
        ◦ Task 8.105.9: Write Integration Tests 
            ▪ Subtask 8.105.9.1: Create a test order with multiple reviewable products. Simulate it being marked "Delivered." 
            ▪ Subtask 8.105.9.2: Simulate running the scheduled job X days later. Verify: 
                • A single review reminder email is sent to the customer (mock Notification Service). 
                • The email contains correct dynamic data (customer name, order number, product images/names/links). 
                • The reviewReminderSent flag for the order is set to true. 
            ▪ Subtask 8.105.9.3: Simulate a customer submitting a review for one of the products. Rerun the scheduled job. Verify no new reminder is sent for that order. 
            ▪ Subtask 8.105.9.4: Simulate a return for an item before the reminder is due. Verify that item is not included in the reminder, or the reminder is not sent if all items are returned. 
            ▪ Subtask 8.105.9.5: Verify tracking events are logged correctly for reporting. 
        ◦ Task 8.105.10: Manual End-to-End Testing: 
            ▪ Subtask 8.105.10.1: Place a test order with 2-3 physical products. (Ensure order is marked "Delivered" via admin tools/simulation). 
            ▪ Subtask 8.105.10.2: Wait for the scheduled reminder job to run (or manually trigger in dev/staging). 
            ▪ Subtask 8.105.10.3: Check the customer's email inbox. Verify a single review reminder email is received with personalized content. 
            ▪ Subtask 8.105.10.4: Verify all purchased, reviewable products are listed with correct images/names. 
            ▪ Subtask 8.105.10.5: Click on a product link in the email. Verify it navigates to the correct PDP and makes the review form easily accessible. 
            ▪ Subtask 8.105.10.6: Submit a review for one product. 
            ▪ Subtask 8.105.10.7: (After next scheduled job run) Verify no additional reminder emails are received for that order. 
            ▪ Subtask 8.110.10.8: (Optional) Test the reporting dashboard to see reminders sent and reviews received.
Epic 8: Order Fulfillment & Post-Purchase Experience
Story 8.109: Self-Service FAQ & Knowledge Base
Story: As a customer, when I have a common question or need information, I want to be able to easily search or browse a comprehensive FAQ and knowledge base, so that I can find answers quickly without needing to contact customer support.
Acceptance Criteria:
    1. Dedicated Knowledge Base Portal: 
        ◦ A clear link (e.g., "Help Center," "FAQ," "Support") in the site footer or header navigates to a dedicated knowledge base portal. 
    2. Categorized Content: 
        ◦ Articles are organized into logical categories (e.g., "Ordering & Payment," "Shipping & Delivery," "Returns & Refunds," "Product Information," "Account Management"). 
        ◦ Customers can browse articles by category. 
    3. Knowledge Base Search: 
        ◦ A dedicated search bar within the knowledge base allows customers to search for articles by keywords. 
        ◦ Search results are relevant and prioritized. 
    4. Individual Article Pages: 
        ◦ Each FAQ or knowledge base article has its own dedicated page with clear title, content, and (optional) related articles. 
        ◦ Articles support rich text formatting, images, and embedded videos. 
    5. Content Management System (CMS) for Articles: 
        ◦ An internal tool or CMS allows administrators/content creators to: 
            ▪ Create, edit, publish, and unpublish articles. 
            ▪ Assign articles to categories and add tags. 
            ▪ (Optional) Set publish/unpublish dates. 
            ▪ Manage SEO metadata (title, description) for each article. 
    6. Contextual Linking: 
        ◦ Relevant FAQ articles are suggested or linked from other parts of the site (e.g., "Shipping & Delivery" FAQs on the checkout page, "Returns & Refunds" FAQs on the My Orders page). 
    7. Article Feedback (Optional): 
        ◦ (Optional) Customers can provide feedback on an article's helpfulness (e.g., "Was this article helpful? Yes/No"). 
    8. Performance & SEO: 
        ◦ Knowledge base pages load quickly. 
        ◦ Articles are SEO-friendly and discoverable by external search engines. 

Granular Tasks & Subtasks for Story 8.109:
    • Admin/CMS Tasks (Content Management System or Internal Admin Tool):
        ◦ Task 8.109.1: Develop Knowledge Base Content Management Interface 
            ▪ Subtask 8.109.1.1: Create a new section in the admin panel (e.g., "Knowledge Base" or "Help Center"). 
            ▪ Subtask 8.109.1.2: Implement "Manage Categories" functionality: Create, edit, delete categories, set display order. 
            ▪ Subtask 8.109.1.3: Implement "Manage Articles" functionality: 
                • Create/Edit Article form fields: Title, Content (rich text editor), Category Assignment (multi-select), Tags (free text), URL Slug, Status (Draft/Published), SEO Meta Title, Meta Description. 
                • (Optional) Publish Date, Unpublish Date. 
                • Author tracking. 
            ▪ Subtask 8.109.1.4: Implement article listing with search/filter by title, status, category. 
            ▪ Subtask 8.109.1.5: Ensure user authentication and authorization for admin access. 
    • Backend Tasks (Knowledge Base Service, Search Service):
        ◦ Task 8.109.2: Define Knowledge Base Data Models 
            ▪ Subtask 8.109.2.1: Create KB_Category schema/collection: id, name, slug, description, order. 
            ▪ Subtask 8.109.2.2: Create KB_Article schema/collection: 
              JSON
Epic 9: Marketing & Promotions Management
Epic Goal: To provide the business with flexible and powerful tools to create, manage, and execute diverse marketing campaigns, discounts, and promotional offers, thereby attracting new customers, retaining existing ones, and driving sales.
Let's start with a core component of almost any e-commerce marketing strategy: discount codes and coupons.
Story 9.101: Discount Code & Coupon System
Story: As an administrator, I want to be able to create, manage, and configure various types of discount codes and coupons, so that I can run promotional campaigns, offer incentives to customers, and track their usage.
Acceptance Criteria:
    1. Admin Interface for Coupon Management: 
        ◦ A dedicated section in the admin panel (e.g., "Promotions" or "Discounts") allows for the creation and management of coupons. 
    2. Coupon Attributes: 
        ◦ Ability to define the following attributes for each coupon: 
            ▪ Code: Unique alphanumeric string (e.g., "SUMMER20," "WELCOME10"). 
            ▪ Discount Type: 
                • Percentage discount (e.g., 10% off). 
                • Fixed amount discount (e.g., £10 off). 
                • Free shipping. 
            ▪ Value: The percentage or fixed amount (e.g., "10" for 10% or £10). 
            ▪ Applies To: 
                • Entire order. 
                • Specific products (by ID or SKU). 
                • Specific categories (by ID or slug). 
                • Specific collections/tags. 
            ▪ Usage Limits: 
                • Per coupon (total number of times the code can be used across all customers). 
                • Per customer (max number of times a single customer can use the code). 
            ▪ Active Dates: Start date and end date/time for the coupon's validity. 
            ▪ Minimum Purchase Amount: (Optional) Minimum order subtotal required to apply the discount. 
            ▪ Customer Eligibility (Optional): 
                • All customers. 
                • Specific customer groups (e.g., "Wholesale," "VIP"). 
                • New customers only (e.g., no prior purchases). 
            ▪ Stackability (Optional): Whether this coupon can be combined with other coupons or promotions. 
            ▪ Internal Name/Description: For admin reference. 
            ▪ Status: (Active, Inactive, Expired). 
    3. Coupon Usage Tracking: 
        ◦ The system tracks each time a coupon is successfully applied to an order. 
        ◦ For each usage, record: orderId, customerId, timestamp. 
    4. Reporting & Analytics (Basic): 
        ◦ Administrators can view basic metrics for each coupon: 
            ▪ Total times used. 
            ▪ Total discount value provided. 
            ▪ (Optional) Remaining usage limit. 
    5. Secure & Unique Codes: 
        ◦ Generated codes are unique. 
        ◦ (Optional) Ability to generate bulk unique codes (e.g., 100 one-time-use codes for an email campaign). 
    6. API for Coupon Application: 
        ◦ A public API endpoint for customers to apply a coupon code during checkout. 
    7. API for Coupon Validation: 
        ◦ An API endpoint to validate a coupon code's eligibility against an order/cart before application. 
    8. Performance: 
        ◦ Coupon creation, management, and application do not impact site performance. 

Granular Tasks & Subtasks for Story 9.101:
    • Admin/CMS Tasks (Admin Panel):
        ◦ Task 9.101.1: Develop Coupon Management UI 
            ▪ Subtask 9.101.1.1: Create a new "Discounts" or "Promotions" section in the admin panel navigation. 
            ▪ Subtask 9.101.1.2: Implement a "Create New Coupon" form with all specified attributes (Code, Discount Type, Value, Applies To, Usage Limits, Dates, Min Purchase, Eligibility, Stackability, Name). 
            ▪ Subtask 9.101.1.3: Implement coupon listing table with filters and search (by code, name, status). 
            ▪ Subtask 9.101.1.4: Implement "Edit Coupon" functionality for existing coupons (with restrictions on editing code if already used). 
            ▪ Subtask 9.101.1.5: Implement "View Usage" details for each coupon (listing order IDs, customer IDs, dates). 
            ▪ Subtask 9.101.1.6: (Optional) Implement "Generate Bulk Codes" interface. 
            ▪ Subtask 9.101.1.7: Ensure proper authentication and authorization for admin users. 
    • Backend Tasks (Promotion Service, Order Service, Customer Service, Product Service):
        ◦ Task 9.101.2: Define Coupon Data Model 
            ▪ Subtask 9.101.2.1: Create a Coupon schema/collection: 
              JSON
Epic 9: Marketing & Promotions Management
Story 9.104: Loyalty Program Framework
Story: As a customer, I want to be part of a loyalty program where I can earn points for my purchases and activities, track my points balance, and redeem those points for discounts or exclusive rewards, so that I feel valued and incentivized to shop more.
Acceptance Criteria:
    1. Points Earning System: 
        ◦ Customers earn points based on their order value (e.g., 1 point per £1 spent). 
        ◦ Points are awarded after an order is successfully completed and payment confirmed. 
        ◦ (Optional) Points can be earned for other activities (e.g., signing up, leaving a review – but focus on purchase initially). 
    2. Customer Points Balance: 
        ◦ A dedicated "My Loyalty" or "My Points" section in the customer's account displays their current points balance. 
        ◦ This section also shows a history of points earned and redeemed. 
    3. Point Redemption at Checkout: 
        ◦ Customers can apply their available points for a discount during the checkout process. 
        ◦ The system clearly shows the value of points (e.g., 100 points = £1). 
        ◦ The maximum points redeemable per order can be configured. 
    4. Loyalty Rewards Management (Admin): 
        ◦ An admin interface allows marketing managers to configure: 
            ▪ Earning Rules: Points per currency unit spent. 
            ▪ Redemption Rules: Value of points (e.g., X points = Y currency). 
            ▪ Point Expiration: (Optional) Points expire after a certain period of inactivity or a fixed duration. 
    5. Handling Returns & Cancellations: 
        ◦ If an order for which points were earned is returned or canceled, the corresponding points are deducted from the customer's balance. 
    6. Admin Points Adjustment: 
        ◦ Administrators can manually add or subtract points from a customer's balance (e.g., for customer service resolution, bonus points). 
    7. Order Integration: 
        ◦ Points earned and points redeemed are recorded as part of the order details. 
    8. Performance: 
        ◦ Loyalty calculations and updates do not significantly impact checkout or order processing times. 

Granular Tasks & Subtasks for Story 9.104:
    • Admin/CMS Tasks (Admin Panel):
        ◦ Task 9.104.1: Develop Loyalty Program Configuration UI 
            ▪ Subtask 9.104.1.1: Create a new "Loyalty Program" section in the admin panel. 
            ▪ Subtask 9.104.1.2: Implement configuration for Points Earning Rate (e.g., input field for "Points per £1 spent"). 
            ▪ Subtask 9.104.1.3: Implement configuration for Points Redemption Rate (e.g., input field for "Value of 1 point in £"). 
            ▪ Subtask 9.104.1.4: Implement configuration for Max Points Redeemable per Order. 
            ▪ Subtask 9.104.1.5: (Optional) Implement configuration for Point Expiration Rules (e.g., "Points expire after X months of inactivity" or "Points expire X months after earned"). 
        ◦ Task 9.104.2: Develop Customer Points Management (Admin View) 
            ▪ Subtask 9.104.2.1: Add a "Loyalty" tab/section to individual Customer Detail pages in the admin panel. 
            ▪ Subtask 9.104.2.2: Display the customer's current points balance. 
            ▪ Subtask 9.104.2.3: Display the customer's points history (earned, redeemed, adjusted, expired) with timestamps and associated order/reason. 
            ▪ Subtask 9.104.2.4: Implement "Adjust Points" functionality (add/subtract points, with reason/notes). 
            ▪ Subtask 9.104.2.5: Ensure proper authentication and authorization for admin users. 
    • Backend Tasks (Loyalty Service, Customer Service, Order Service, Payment Service, Return Service, Scheduled Jobs):
        ◦ Task 9.104.3: Define Loyalty Data Models 
            ▪ Subtask 9.104.3.1: Enhance Customer schema (from Epic 6) to include: 
              JSON
Epic 10: Analytics & Business Intelligence
Epic Goal: To provide comprehensive data insights and reporting tools for business stakeholders (marketing, sales, operations, product, finance) to monitor platform performance, identify trends, understand customer behavior, and make data-driven strategic decisions.
Let's begin with the most fundamental aspect of e-commerce analytics: sales and order performance.
Story 10.101: Core Sales & Order Reporting
Story: As a business stakeholder (e.g., Sales Manager, CEO), I want to access comprehensive reports on sales and order performance, so that I can monitor key metrics, track revenue, identify popular products, and understand overall business health.
Acceptance Criteria:
    1. Admin Dashboard Integration: 
        ◦ A new section in the admin panel (e.g., "Analytics" or "Reports") provides access to core sales and order reports. 
    2. Key Sales Metrics: 
        ◦ Reports display essential sales metrics, including: 
            ▪ Total Revenue: Gross sales, net sales (after discounts, returns). 
            ▪ Number of Orders. 
            ▪ Average Order Value (AOV). 
            ▪ Conversion Rate: (Optional, might come later with more detailed funnel tracking). 
    3. Time Period Selection: 
        ◦ Users can select specific time periods for reports (e.g., "Today," "Yesterday," "Last 7 Days," "Last 30 Days," "This Month," "Last Month," "Custom Date Range"). 
        ◦ Data is presented clearly for the selected period. 
    4. Sales Trends Visualization: 
        ◦ Visualizations (e.g., line charts) show sales trends over time for revenue and number of orders, broken down by day, week, or month depending on the selected period. 
    5. Top Products/Categories by Sales: 
        ◦ Reports identify and rank: 
            ▪ Top Selling Products (by revenue and/or quantity). 
            ▪ Top Performing Categories (by revenue and/or number of orders). 
    6. Order Status Breakdown: 
        ◦ A report showing the distribution of orders by status (e.g., "Pending," "Processing," "Shipped," "Delivered," "Canceled," "Returned"). 
    7. Data Export: 
        ◦ Ability to export report data (e.g., CSV, Excel) for further analysis. 
    8. Data Accuracy & Consistency: 
        ◦ All reported metrics are accurate and consistent with the transactional data. 
    9. Performance: 
        ◦ Reports load within acceptable timeframes, even for large datasets. 

Granular Tasks & Subtasks for Story 10.101:
    • Backend Tasks (Analytics Service, Order Service, Product Service):
        ◦ Task 10.101.1: Design Analytics Data Model & Aggregation Strategy 
            ▪ Subtask 10.101.1.1: Determine whether to aggregate data on-the-fly from transactional tables (for smaller scale/real-time) or pre-aggregate into dedicated analytics tables (for larger scale/performance). Start with transactional and plan for pre-aggregation. 
            ▪ Subtask 10.101.1.2: Identify key data points from Order and OrderItem schemas required for reporting: orderId, customerId, totalAmount, subtotal, discountAmount, shippingCost, taxAmount, status, createdAt, deliveredAt, productId, productName, quantity, price. 
        ◦ Task 10.101.2: Implement Core Sales Metric Calculation Logic 
            ▪ Subtask 10.101.2.1: Develop functions to calculate totalRevenue (sum of order totals), netRevenue (total - discounts - returns), numberOfOrders, averageOrderValue for a given date range and optional filters. 
            ▪ Subtask 10.101.2.2: Account for different order statuses in calculations (e.g., only "Delivered" or "Shipped" for final revenue, "Canceled" excluded). 
        ◦ Task 10.101.3: Implement Top Products/Categories Calculation Logic 
            ▪ Subtask 10.101.3.1: Develop functions to group OrderItems by productId/productName and categoryId/categoryName for a given date range. 
            ▪ Subtask 10.101.3.2: Calculate sum of quantity and totalAmount for each product/category. 
            ▪ Subtask 10.101.3.3: Sort and return top N results. 
        ◦ Task 10.101.4: Implement Order Status Breakdown Logic 
            ▪ Subtask 10.101.4.1: Develop a function to count orders by their status for a given date range. 
        ◦ Task 10.101.5: Implement Analytics API Endpoints 
            ▪ Subtask 10.101.5.1: GET /api/admin/reports/sales-overview: Returns key metrics (total revenue, AOV, etc.) for a specified period. 
            ▪ Subtask 10.101.5.2: GET /api/admin/reports/sales-trend: Returns time-series data for revenue and order count. 
            ▪ Subtask 10.101.5.3: GET /api/admin/reports/top-products: Returns ranked list of top products. 
            ▪ Subtask 10.101.5.4: GET /api/admin/reports/top-categories: Returns ranked list of top categories. 
            ▪ Subtask 10.101.5.5: GET /api/admin/reports/order-status-breakdown: Returns counts by status. 
            ▪ Subtask 10.101.5.6: All endpoints accept startDate, endDate, and (optional) granularity (day, week, month). 
            ▪ Subtask 10.101.5.7: Implement authentication and authorization for admin access to these endpoints. 
        ◦ Task 10.101.6: Implement Data Export Functionality 
            ▪ Subtask 10.101.6.1: For each report endpoint, add an option to return data in CSV or Excel format (e.g., GET /api/admin/reports/sales-overview?format=csv). 
            ▪ Subtask 10.101.6.2: Ensure proper headers and formatting for CSV/Excel. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 10.101.7: Create "Analytics" Section in Admin UI 
            ▪ Subtask 10.101.7.1: Add a new "Analytics" or "Reports" item to the main admin navigation. 
            ▪ Subtask 10.101.7.2: Create a SalesOverviewDashboard component/route (e.g., /admin/analytics/sales). 
        ◦ Task 10.101.8: Implement Date Range Selector Component 
            ▪ Subtask 10.101.8.1: Develop a reusable UI component for selecting date ranges (predefined options and custom range picker). 
            ▪ Subtask 10.101.8.2: This component will update the startDate and endDate parameters for API calls. 
        ◦ Task 10.101.9: Build Sales Metrics Display 
            ▪ Subtask 10.101.9.1: Display Total Revenue, Net Revenue, Number of Orders, AOV prominently. 
            ▪ Subtask 10.101.9.2: Call GET /api/admin/reports/sales-overview based on selected date range. 
        ◦ Task 10.101.10: Implement Sales Trends Visualization 
            ▪ Subtask 10.101.10.1: Integrate a charting library (e.g., Chart.js, Recharts, Nivo) to visualize sales-trend data. 
            ▪ Subtask 10.101.10.2: Display line charts for revenue and number of orders over time. 
            ▪ Subtask 10.101.10.3: Call GET /api/admin/reports/sales-trend. 
        ◦ Task 10.101.11: Display Top Products/Categories Reports 
            ▪ Subtask 10.101.11.1: Display data in sortable tables. 
            ▪ Subtask 10.101.11.2: Call GET /api/admin/reports/top-products and GET /api/admin/reports/top-categories. 
        ◦ Task 10.101.12: Display Order Status Breakdown Chart 
            ▪ Subtask 10.101.12.1: Use a pie chart or bar chart to visualize order-status-breakdown data. 
            ▪ Subtask 10.101.12.2: Call GET /api/admin/reports/order-status-breakdown. 
        ◦ Task 10.101.13: Implement Data Export Buttons 
            ▪ Subtask 10.101.13.1: Add "Export to CSV" or "Export to Excel" buttons for each report table/chart. 
            ▪ Subtask 10.101.13.2: These buttons should trigger download of data from the corresponding backend export endpoint (Task 10.101.6). 
    • Testing Tasks:
        ◦ Task 10.101.14: Write Unit Tests (Backend) 
            ▪ Subtask 10.101.14.1: Unit tests for all calculation logic (revenue, AOV, top products, status counts) with mocked order data. 
            ▪ Subtask 10.101.14.2: Unit tests for date range filtering. 
        ◦ Task 10.101.15: Write Integration Tests 
            ▪ Subtask 10.101.15.1: Create a controlled set of test orders with various statuses, products, dates, discounts, and returns. 
            ▪ Subtask 10.101.15.2: Call each GET /api/admin/reports/* endpoint for specific date ranges. 
            ▪ Subtask 10.101.15.3: Verify calculated metrics (total revenue, AOV, counts) match expected values. 
            ▪ Subtask 10.101.15.4: Verify top products/categories and order status breakdowns are correct. 
            ▪ Subtask 10.101.15.5: Test data export: download CSV/Excel and verify content. 
            ▪ Subtask 10.101.15.6: Test authorization: ensure non-admin users cannot access report APIs. 
        ◦ Task 10.101.16: Manual End-to-End Testing: 
            ▪ Subtask 10.101.16.1: Log in as an admin. Navigate to the new "Analytics" section. 
            ▪ Subtask 10.101.16.2: Observe the default date range (e.g., Last 30 Days). Verify key metrics and charts populate. 
            ▪ Subtask 10.101.16.3: Change the date range (e.g., "This Month," "Last 7 Days," "Custom"). Verify all reports dynamically update. 
            ▪ Subtask 10.101.16.4: Check the "Top Products" and "Top Categories" lists for accuracy based on known test data. 
            ▪ Subtask 10.101.16.5: Verify the "Order Status Breakdown" chart. 
            ▪ Subtask 10.101.16.6: Click "Export to CSV/Excel" for each report. Open the downloaded files and verify content. 
            ▪ Subtask 10.101.16.7: Perform common admin tasks (e.g., creating orders, refunding, canceling) and then re-check reports to ensure data updates correctly. 
            ▪ Subtask 10.101.16.8: Test performance: how quickly do reports load for different date ranges and data volumes.
Epic 10: Analytics & Business Intelligence
Story 10.102: Customer Demographics & Behavior Reporting
Story: As a business stakeholder (e.g., Marketing Manager, Product Manager), I want to access reports on customer demographics and purchasing behavior, so that I can segment our customer base, personalize marketing efforts, and understand customer lifetime value.
Acceptance Criteria:
    1. Customer Overview Metrics: 
        ◦ Reports display key customer metrics: 
            ▪ Total Registered Customers. 
            ▪ New Customers (for a selected period). 
            ▪ Returning Customers (for a selected period, customers with >1 order). 
    2. Geographical Distribution: 
        ◦ A report or visualization (e.g., a simple table or chart showing top countries/regions) indicating customer distribution by billing/shipping address. 
    3. Customer Cohort Analysis (Basic): 
        ◦ Ability to compare performance of new customers acquired within different periods (e.g., how many orders did customers acquired in Jan 2024 place in their first 3 months vs. customers acquired in Feb 2024). This can start simply as "Customers by Acquisition Month/Year". 
    4. Customer Behavior Metrics: 
        ◦ Reports display averages related to customer purchasing habits: 
            ▪ Average Orders Per Customer. 
            ▪ Average Order Value Per Customer. 
            ▪ Average Purchase Frequency (e.g., days between orders for returning customers). 
            ▪ Customer Lifetime Value (CLV): Total revenue generated by a customer over their entire relationship with the business. 
    5. Segmentation for Reporting: 
        ◦ Ability to filter or segment reports by: 
            ▪ Customer Group/Type (e.g., wholesale vs. retail, if implemented). 
            ▪ (Optional) First Purchase Date Cohort. 
    6. Data Visualizations: 
        ◦ Use appropriate charts (e.g., bar charts for distribution, pie charts, line charts for trends). 
    7. Time Period Selection: 
        ◦ All metrics are configurable for specific time periods (e.g., "Last Month," "This Year," "Custom Date Range"). 
    8. Data Export: 
        ◦ Ability to export report data (e.g., CSV, Excel) for deeper analysis. 
    9. Data Accuracy & Privacy: 
        ◦ Reported metrics are accurate and respect customer privacy (e.g., aggregate data, no individual customer identifiable in general reports). 

Granular Tasks & Subtasks for Story 10.102:
    • Backend Tasks (Analytics Service, Customer Service, Order Service):
        ◦ Task 10.102.1: Enhance Analytics Data Model for Customer Data 
            ▪ Subtask 10.102.1.1: Ensure efficient access to Customer registration date, Order placement dates, Order customer IDs, and Order totals. 
            ▪ Subtask 10.102.1.2: Consider creating pre-aggregated views or materialized views in the database for common customer metrics (e.g., customer_order_summary: customerId, firstOrderDate, lastOrderDate, totalOrders, totalSpend). This is crucial for performance with CLV. 
        ◦ Task 10.102.2: Implement Customer Demographic Reporting Logic 
            ▪ Subtask 10.102.2.1: Function to count totalRegisteredCustomers (no date filter, for general overview). 
            ▪ Subtask 10.102.2.2: Function to count newCustomers (customer.createdAt within period). 
            ▪ Subtask 10.102.2.3: Function to count returningCustomers (customers with totalOrders > 1 and an order within the period). 
            ▪ Subtask 10.102.2.4: Function to aggregate customer counts by billingAddress.country or shippingAddress.country. 
        ◦ Task 10.102.3: Implement Customer Behavior Metric Calculation Logic 
            ▪ Subtask 10.102.3.1: Function to calculate averageOrdersPerCustomer: totalOrdersInPeriod / numberOfActiveCustomersInPeriod. 
            ▪ Subtask 10.102.3.2: Function to calculate averageOrderValuePerCustomer: totalRevenueInPeriod / numberOfActiveCustomersInPeriod. 
            ▪ Subtask 10.102.3.3: Function to calculate averagePurchaseFrequency: Average days between consecutive orders for returning customers. (This requires iterating through individual customer order histories). 
            ▪ Subtask 10.102.3.4: Function to calculate Customer Lifetime Value (CLV): Sum of totalAmount for all orders placed by customers acquired within a specific cohort (or overall). 
        ◦ Task 10.102.4: Implement Customer Analytics API Endpoints 
            ▪ Subtask 10.102.4.1: GET /api/admin/reports/customer-overview: Returns total/new/returning customer counts for a period. 
            ▪ Subtask 10.102.4.2: GET /api/admin/reports/customer-geography: Returns customer counts by country/region. 
            ▪ Subtask 10.102.4.3: GET /api/admin/reports/customer-behavior-metrics: Returns AOV/customer, avg orders/customer, avg purchase frequency, CLV for a period. 
            ▪ Subtask 10.102.4.4: All endpoints accept startDate, endDate, and (optional) filters for customerGroup or acquisitionCohort. 
            ▪ Subtask 10.102.4.5: Implement authentication and authorization for admin access. 
        ◦ Task 10.102.5: Integrate Data Export Functionality 
            ▪ Subtask 10.102.5.1: For each report endpoint, add an option to return data in CSV/Excel format. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 10.102.6: Create "Customer Analytics" Sub-section in Admin UI 
            ▪ Subtask 10.102.6.1: Add a new tab or sub-menu item within the "Analytics" section (from Story 10.101) for "Customers." 
            ▪ Subtask 10.102.6.2: Create a CustomerAnalyticsDashboard component/route (e.g., /admin/analytics/customers). 
        ◦ Task 10.102.7: Implement Date Range Selector & Filters 
            ▪ Subtask 10.102.7.1: Reuse the date range selector component from Story 10.101. 
            ▪ Subtask 10.102.7.2: Add dropdowns/filters for customerGroup (if applicable) and potentially acquisitionCohort. 
        ◦ Task 10.102.8: Display Customer Overview Metrics 
            ▪ Subtask 10.102.8.1: Display Total Registered Customers, New Customers (for selected period), Returning Customers (for selected period). 
            ▪ Subtask 10.102.8.2: Call GET /api/admin/reports/customer-overview. 
        ◦ Task 10.102.9: Visualize Geographical Distribution 
            ▪ Subtask 10.102.9.1: Display a table showing top 5-10 countries by customer count. 
            ▪ Subtask 10.102.9.2: (Optional) Integrate a simple map visualization or pie chart for broad distribution. 
            ▪ Subtask 10.102.9.3: Call GET /api/admin/reports/customer-geography. 
        ◦ Task 10.102.10: Display Customer Behavior Metrics 
            ▪ Subtask 10.102.10.1: Display Average Orders Per Customer, Average Order Value Per Customer, Average Purchase Frequency, Customer Lifetime Value. 
            ▪ Subtask 10.102.10.2: Use clear labels and appropriate formatting (e.g., currency, decimals). 
            ▪ Subtask 10.102.10.3: Call GET /api/admin/reports/customer-behavior-metrics. 
        ◦ Task 10.102.11: Implement Data Export Buttons 
            ▪ Subtask 10.102.11.1: Add "Export to CSV/Excel" buttons for relevant sections. 
    • Testing Tasks:
        ◦ Task 10.102.12: Write Unit Tests (Backend) 
            ▪ Subtask 10.102.12.1: Unit tests for calculating new/returning customers given various customer.createdAt and order.createdAt dates. 
            ▪ Subtask 10.102.12.2: Unit tests for geographical distribution counts. 
            ▪ Subtask 10.102.12.3: Unit tests for averageOrdersPerCustomer, averageOrderValuePerCustomer, averagePurchaseFrequency. 
            ▪ Subtask 10.102.12.4: Unit tests for CLV calculation, considering various customer purchase histories. 
        ◦ Task 10.102.13: Write Integration Tests 
            ▪ Subtask 10.102.13.1: Create test customer accounts with specific registration dates and purchase histories (some new, some returning with multiple orders). 
            ▪ Subtask 10.102.13.2: Call each GET /api/admin/reports/customer-* endpoint for specific date ranges. 
            ▪ Subtask 10.102.13.3: Verify calculated metrics match expected values based on test data. 
            ▪ Subtask 10.102.13.4: Test geographical reporting by creating customers with different addresses. 
            ▪ Subtask 10.102.13.5: Test data export: download CSV/Excel and verify content. 
            ▪ Subtask 10.102.13.6: Test authorization: ensure non-admin users cannot access. 
        ◦ Task 10.102.14: Manual End-to-End Testing: 
            ▪ Subtask 10.102.14.1: Log in as an admin. Navigate to "Analytics" -> "Customers." 
            ▪ Subtask 10.102.14.2: Observe the default date range. Verify total/new/returning customer counts. 
            ▪ Subtask 10.102.14.3: Change the date range and observe dynamic updates across all reports. 
            ▪ Subtask 10.102.14.4: Check the geographical distribution table. 
            ▪ Subtask 10.102.14.5: Verify the average behavior metrics (AOV, orders per customer, frequency). 
            ▪ Subtask 10.102.14.6: If applicable, test filtering by customer groups or acquisition cohorts. 
            ▪ Subtask 10.102.14.7: Export data and spot-check its accuracy in a spreadsheet. 
            ▪ Subtask 10.102.14.8: Perform typical customer activities (register, place orders, multi-orders) and then re-check reports to ensure data updates correctly after a reasonable refresh period. 
            ▪ Subtask 10.102.14.9: Test report loading performance.
Epic 10: Analytics & Business Intelligence
Story 10.103: Product Performance Analytics
Story: As a business stakeholder (e.g., Product Manager, Merchandiser), I want to access detailed reports on individual product and category performance, including views, add-to-cart rates, and purchase conversion rates, so that I can identify top sellers, underperforming products, and optimize our catalog and inventory.
Acceptance Criteria:
    1. Product Funnel Metrics: 
        ◦ Reports display key conversion metrics for products: 
            ▪ Product Views: Total unique views for each product. 
            ▪ Add-to-Cart Events: Number of times a product was added to a cart. 
            ▪ Purchases: Number of times a product was purchased (quantity sold). 
            ▪ View-to-Add-to-Cart Rate: Percentage of views that lead to an add-to-cart. 
            ▪ Add-to-Cart-to-Purchase Rate: Percentage of add-to-carts that lead to a purchase. 
            ▪ Product-level Conversion Rate: Percentage of views that lead to a purchase. 
    2. Product Sales Performance: 
        ◦ Reports include: 
            ▪ Total Revenue per Product/SKU. 
            ▪ Total Quantity Sold per Product/SKU. 
            ▪ Average Price Sold (considering discounts). 
    3. Ranking & Filtering: 
        ◦ Ability to rank products by views, quantity sold, revenue, or conversion rates. 
        ◦ Ability to filter reports by category, brand, or other product attributes. 
    4. Time Period Selection: 
        ◦ All metrics are configurable for specific time periods (e.g., "Last 7 Days," "This Month," "Custom Date Range"). 
    5. Data Granularity: 
        ◦ Metrics can be viewed for: 
            ▪ Individual Products (including variations/SKUs where applicable). 
            ▪ Product Categories. 
            ▪ Brands. 
    6. Visualizations: 
        ◦ Use charts (e.g., bar charts for rankings, line charts for trends) where appropriate. 
    7. Data Export: 
        ◦ Ability to export report data (e.g., CSV, Excel) for further analysis. 
    8. Data Accuracy: 
        ◦ All reported metrics are accurate and derived from tracked events and transactional data. 

Granular Tasks & Subtasks for Story 10.103:
    • Backend Tasks (Analytics Service, Product Service, Order Service, Event Tracking):
        ◦ Task 10.103.1: Implement Product Event Tracking & Storage 
            ▪ Subtask 10.103.1.1: Product View Event: 
                • Create an endpoint or integrate with a client-side tracking solution (e.g., Google Analytics, or internal API like POST /api/events/product-view). 
                • Capture productId, variantId (if applicable), timestamp, customerId (if logged in), sessionId. 
                • Store these events efficiently (e.g., a dedicated ProductView collection/table or a NoSQL database optimized for time-series data). 
            ▪ Subtask 10.103.1.2: Add-to-Cart Event: 
                • Enhance POST /api/cart/items (add item to cart) to also record a AddToCart event. 
                • Capture productId, variantId, quantity, price, timestamp, customerId (if logged in), sessionId. 
                • Store these events. 
            ▪ Subtask 10.103.1.3: Purchase Event: 
                • Ensure Order Service (from Epic 6) records productId, variantId, quantity, price, discount for each orderItem upon order completion. This data is already available in the order for GET /api/admin/reports/sales-overview. 
        ◦ Task 10.103.2: Implement Product Performance Calculation Logic 
            ▪ Subtask 10.103.2.1: Develop functions to query and aggregate ProductView events for totalProductViews within a period. 
            ▪ Subtask 10.103.2.2: Develop functions to query and aggregate AddToCart events for totalAddtoCarts within a period. 
            ▪ Subtask 10.103.2.3: Develop functions to query OrderItems to calculate totalQuantitySold and totalRevenue for each product/variant/category/brand. 
            ▪ Subtask 10.103.2.4: Implement conversion rate calculations: 
                • View-to-Add-to-Cart Rate = (Total Add-to-Carts / Total Product Views) * 100. 
                • Add-to-Cart-to-Purchase Rate = (Total Purchases / Total Add-to-Carts) * 100. 
                • Product-level Conversion Rate = (Total Purchases / Total Product Views) * 100. 
            ▪ Subtask 10.103.2.5: Implement ranking logic based on chosen metrics. 
        ◦ Task 10.103.3: Implement Product Performance Analytics API Endpoints 
            ▪ Subtask 10.103.3.1: GET /api/admin/reports/product-performance: Returns a list of products/variants with all funnel and sales metrics. 
            ▪ Subtask 10.103.3.2: GET /api/admin/reports/category-performance: Returns a list of categories with aggregated metrics. 
            ▪ Subtask 10.103.3.3: GET /api/admin/reports/product-trends: Returns time-series data for views, adds-to-cart, or purchases for a specific product. 
            ▪ Subtask 10.103.3.4: All endpoints accept startDate, endDate, and (optional) filter parameters (e.g., categoryId, brandId). 
            ▪ Subtask 10.103.3.5: Implement authentication and authorization for admin access. 
        ◦ Task 10.103.4: Implement Data Export Functionality 
            ▪ Subtask 10.103.4.1: Add option to return data in CSV/Excel for each report endpoint. 
        ◦ Task 10.103.5: Optimize Data Aggregation (Scalability) 
            ▪ Subtask 10.103.5.1: For high-volume sites, consider implementing daily/hourly batch jobs to pre-aggregate event data into summary tables to speed up report generation. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 10.103.6: Create "Product Analytics" Sub-section in Admin UI 
            ▪ Subtask 10.103.6.1: Add a new tab or sub-menu item within the "Analytics" section for "Products." 
            ▪ Subtask 10.103.6.2: Create a ProductAnalyticsDashboard component/route (e.g., /admin/analytics/products). 
        ◦ Task 10.103.7: Implement Date Range Selector & Filters 
            ▪ Subtask 10.103.7.1: Reuse the date range selector component from Story 10.101. 
            ▪ Subtask 10.103.7.2: Add dropdowns/filters for Category, Brand, and Product Search to narrow down reports. 
        ◦ Task 10.103.8: Display Product Performance Table 
            ▪ Subtask 10.103.8.1: Display a sortable table listing products/variants with columns for: Product Name, SKU, Views, Adds to Cart, Purchases, Revenue, View-to-Add-to-Cart Rate, Add-to-Cart-to-Purchase Rate, Product Conversion Rate. 
            ▪ Subtask 10.103.8.2: Call GET /api/admin/reports/product-performance. 
        ◦ Task 10.103.9: Display Category/Brand Performance Table 
            ▪ Subtask 10.103.9.1: Similar to product table, but aggregated by category/brand. 
            ▪ Subtask 10.103.9.2: Call GET /api/admin/reports/category-performance. 
        ◦ Task 10.103.10: (Optional) Product Trend Chart 
            ▪ Subtask 10.103.10.1: Allow selection of a single product to view its views, adds-to-cart, and purchases trends over time using a line chart. 
            ▪ Subtask 10.103.10.2: Call GET /api/admin/reports/product-trends. 
        ◦ Task 10.103.11: Implement Data Export Buttons 
            ▪ Subtask 10.103.11.1: Add "Export to CSV/Excel" buttons for report tables. 
    • Testing Tasks:
        ◦ Task 10.103.12: Write Unit Tests (Backend) 
            ▪ Subtask 10.103.12.1: Unit tests for product view and add-to-cart event recording. 
            ▪ Subtask 10.103.12.2: Unit tests for conversion rate calculations with various mocked event and order data. 
            ▪ Subtask 10.103.12.3: Unit tests for revenue and quantity sold aggregation per product/category. 
        ◦ Task 10.103.13: Write Integration Tests 
            ▪ Subtask 10.103.13.1: Simulate a user Browse several products, adding some to cart, and purchasing a subset. 
            ▪ Subtask 10.103.13.2: Call GET /api/admin/reports/product-performance and GET /api/admin/reports/category-performance for the relevant period. 
            ▪ Subtask 10.103.13.3: Verify views, adds-to-cart, purchases, and all calculated conversion rates are accurate for each product/category involved. 
            ▪ Subtask 10.103.13.4: Test filtering by category/brand. 
            ▪ Subtask 10.103.13.5: Verify data export provides correct content. 
            ▪ Subtask 10.103.13.6: Test authorization. 
        ◦ Task 10.103.14: Manual End-to-End Testing: 
            ▪ Subtask 10.103.14.1: Log in as a customer. Browse several products (some in different categories/brands). Add a few to cart. Abandon one cart. Complete an order for another. 
            ▪ Subtask 10.103.14.2: Log in as an admin. Navigate to "Analytics" -> "Products." 
            ▪ Subtask 10.103.14.3: Select a date range covering your activities. 
            ▪ Subtask 10.103.14.4: Verify the product performance table reflects the views, add-to-carts, and purchases accurately. Check conversion rates. 
            ▪ Subtask 10.103.14.5: Use the category/brand filters and verify the data changes accordingly. 
            ▪ Subtask 10.103.14.6: (If implemented) Check product trend charts. 
            ▪ Subtask 10.103.14.7: Export data and spot-check its contents. 
            ▪ Subtask 10.103.14.8: Verify reports load efficiently.
Epic 10: Analytics & Business Intelligence
Story 10.104: Marketing Campaign Performance Reporting
Story: As a marketing manager, I want to track the performance of my marketing campaigns and promotional activities, so that I can understand their effectiveness, optimize my budget, and make data-driven decisions on future strategies.
Acceptance Criteria:
    1. Campaign Data Capture: 
        ◦ The system accurately captures campaign source data (e.g., UTM parameters like utm_source, utm_medium, utm_campaign) when a user first lands on the site. 
        ◦ This campaign data is associated with the user's session, then their customer account (if they register/log in), and ultimately their order. 
    2. Order Attribution: 
        ◦ Each completed order is attributed to the marketing campaign that drove the initial visit (first-touch or last-touch attribution, defaulting to first-touch for simplicity initially). 
        ◦ Orders placed using a specific discount code (from Story 9.101) are also explicitly linked to that discount code's data for reporting. 
    3. Key Campaign Metrics: 
        ◦ Reports display the following metrics for each tracked campaign (or aggregated by source/medium): 
            ▪ Total Revenue Attributed. 
            ▪ Number of Orders Attributed. 
            ▪ Number of New Customers Acquired. 
            ▪ Average Order Value (AOV) for attributed orders. 
            ▪ (Optional) Discount Amount Attributed (sum of discounts from codes linked to the campaign). 
    4. Reporting Interface: 
        ◦ A dedicated section in the admin panel's "Analytics" provides reports on campaign performance. 
        ◦ Campaigns can be filtered by source, medium, campaign name, and date range. 
    5. Discount Code to Campaign Linkage: 
        ◦ When creating a discount code (Story 9.101), administrators can optionally link it to a specific marketing campaign identifier. This enables dedicated reporting on discount code performance within the context of campaigns. 
    6. Data Visualizations: 
        ◦ Use charts (e.g., bar charts for comparison, line charts for trends) to visualize campaign performance. 
    7. Data Export: 
        ◦ Ability to export campaign performance data (e.g., CSV, Excel) for deeper analysis. 
    8. Data Accuracy: 
        ◦ All reported metrics are accurate and consistently attributed. 

Granular Tasks & Subtasks for Story 10.104:
    • Backend Tasks (Analytics Service, Customer Service, Order Service, Session Management):
        ◦ Task 10.104.1: Implement Campaign Data Storage & Association 
            ▪ Subtask 10.104.1.1: Session-level Tracking: Enhance session management (from Epic 6, Story 6.101) to store utm_source, utm_medium, utm_campaign, utm_content, utm_term (and possibly gclid, fbclid if integrating with specific ad platforms later). These should be captured from the URL query parameters upon initial landing. 
            ▪ Subtask 10.104.1.2: Customer-level Association: When a user registers or logs in, associate their current session's campaign data with their Customer profile (e.g., add firstTouchCampaign fields to Customer schema). 
            ▪ Subtask 10.104.1.3: Order-level Association: When an order is placed, capture the campaign data from the current session (or from the Customer's firstTouchCampaign data) and store it with the Order record. Add fields like campaignSource, campaignMedium, campaignName to the Order schema. 
            ▪ Subtask 10.104.1.4: Discount Code Linkage: Enhance Coupon schema (from Story 9.101) to include an optional linkedCampaignId or linkedCampaignName field. 
        ◦ Task 10.104.2: Implement Campaign Attribution Logic 
            ▪ Subtask 10.104.2.1: Develop logic to classify orders. By default, an order's revenue/count is attributed to the campaignSource/campaignMedium/campaignName stored on that Order record. 
            ▪ Subtask 10.104.2.2: Identify newCustomersAcquired by checking if the customerId associated with the order has customer.createdAt within the report period and this is their first order. 
        ◦ Task 10.104.3: Implement Marketing Campaign Reporting API Endpoints 
            ▪ Subtask 10.104.3.1: GET /api/admin/reports/campaign-performance: 
                • Accepts startDate, endDate, and optional groupBy (e.g., campaignName, source, medium). 
                • Returns aggregated data: campaignIdentifier, totalRevenue, numberOfOrders, newCustomersAcquired, aov. 
            ▪ Subtask 10.104.3.2: Implement authentication and authorization for admin access. 
        ◦ Task 10.104.4: Optimize Data Aggregation (Scalability) 
            ▪ Subtask 10.104.4.1: Consider daily/hourly batch jobs to aggregate Order data by campaign attributes into summary tables for faster reporting on large datasets. 
    • Frontend Tasks (Admin Panel, Site-wide):
        ◦ Task 10.104.5: Update Admin Panel for Discount Code Linking 
            ▪ Subtask 10.104.5.1: In the "Create/Edit Coupon" form (from Story 9.101), add an optional input field or dropdown for "Linked Campaign Name" or "Campaign ID." This will be a simple string input for now. 
        ◦ Task 10.104.6: Create "Marketing Analytics" Sub-section in Admin UI 
            ▪ Subtask 10.104.6.1: Add a new tab or sub-menu item within the "Analytics" section for "Marketing" or "Campaigns." 
            ▪ Subtask 10.104.6.2: Create a MarketingAnalyticsDashboard component/route (e.g., /admin/analytics/marketing). 
        ◦ Task 10.104.7: Implement Date Range Selector & Grouping Filters 
            ▪ Subtask 10.104.7.1: Reuse the date range selector component from Story 10.101. 
            ▪ Subtask 10.104.7.2: Add a "Group By" filter (e.g., Campaign Name, Source, Medium). 
        ◦ Task 10.104.8: Display Campaign Performance Table 
            ▪ Subtask 10.104.8.1: Display a sortable table showing: Campaign Name/Source/Medium, Total Revenue, Number of Orders, New Customers Acquired, AOV. 
            ▪ Subtask 10.104.8.2: Call GET /api/admin/reports/campaign-performance based on selected filters. 
        ◦ Task 10.104.9: (Optional) Visualize Campaign Performance 
            ▪ Subtask 10.104.9.1: Use bar charts to compare revenue or orders across different campaigns within a period. 
        ◦ Task 10.104.10: Implement Data Export Buttons 
            ▪ Subtask 10.104.10.1: Add "Export to CSV/Excel" buttons for the report table. 
    • Testing Tasks:
        ◦ Task 10.104.11: Write Unit Tests (Backend) 
            ▪ Subtask 10.104.11.1: Unit tests for campaign data parsing from URLs and storage. 
            ▪ Subtask 10.104.11.2: Unit tests for attributing campaign data to sessions, customers, and orders. 
            ▪ Subtask 10.104.11.3: Unit tests for aggregating campaign metrics (revenue, orders, new customers) from mocked order data. 
        ◦ Task 10.104.12: Write Integration Tests 
            ▪ Subtask 10.104.12.1: Simulate user visits with different UTM parameters (e.g., ?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale). 
            ▪ Subtask 10.104.12.2: Have some users register as new customers, others log in as existing customers. 
            ▪ Subtask 10.104.12.3: Have users complete orders. 
            ▪ Subtask 10.104.12.4: Create a discount code (e.g., "SALE10") linked to a specific campaign name ("SummerSale"). 
            ▪ Subtask 10.104.12.5: Place orders using that discount code and other orders without a code. 
            ▪ Subtask 10.104.12.6: Call GET /api/admin/reports/campaign-performance with various date ranges and grouping options. 
            ▪ Subtask 10.104.12.7: Verify revenue, order count, and new customer attribution are accurate for each campaign/source/medium. 
            ▪ Subtask 10.104.12.8: Verify orders placed with the linked discount code are correctly attributed to its campaign. 
            ▪ Subtask 10.104.12.9: Test data export. 
        ◦ Task 10.104.13: Manual End-to-End Testing: 
            ▪ Subtask 10.104.13.1: Create a discount code "WELCOME10" and link it to campaign "NewCustomerEmail." 
            ▪ Subtask 10.104.13.2: Simulate a user arriving via a URL: yourstore.com?utm_source=email&utm_medium=newsletter&utm_campaign=weekly_deals. Browse, add to cart, check out. 
            ▪ Subtask 10.104.13.3: Simulate another user arriving via yourstore.com?utm_source=google&utm_medium=organic. Register as a new customer and place an order using the "WELCOME10" discount code. 
            ▪ Subtask 10.104.13.4: Log in as admin. Navigate to "Analytics" -> "Marketing." 
            ▪ Subtask 10.104.13.5: Select the relevant date range. 
            ▪ Subtask 10.104.13.6: Verify the reports accurately show: 
                • "weekly_deals" campaign with attributed revenue/orders. 
                • "NewCustomerEmail" campaign (or whatever utm_campaign was used) with revenue/orders, and correctly showing 1 new customer acquired. 
                • If grouped by source/medium, verify "email/newsletter" and "google/organic" show correct aggregated data. 
            ▪ Subtask 10.104.13.7: Export data and spot-check its accuracy. 
            ▪ Subtask 10.104.13.8: Check report loading performance.
Epic 10: Analytics & Business Intelligence
Story 10.105: Inventory & Fulfillment Reporting
Story: As an operations manager or warehouse supervisor, I want to access reports on inventory levels, order fulfillment metrics, and return rates, so that I can optimize stock, identify fulfillment bottlenecks, and reduce costs associated with returns.
Acceptance Criteria:
    1. Current Inventory Snapshot: 
        ◦ A report showing the current stock level for each product/SKU. 
        ◦ Ability to filter by category, brand, or search by product name/SKU. 
        ◦ Highlights products that are low in stock (below a configurable threshold). 
        ◦ (Optional) "Days of Stock" metric based on recent sales velocity. 
    2. Inventory Movement Tracking: 
        ◦ A report showing stock changes over a period: stock added, stock sold, stock returned, stock adjusted. 
    3. Order Fulfillment Time Metrics: 
        ◦ Reports displaying average fulfillment times for orders: 
            ▪ Order-to-Shipped Time: Average duration from "Order Placed" to "Order Shipped" status. 
            ▪ Order-to-Delivered Time: Average duration from "Order Placed" to "Order Delivered" status (integrating with Story 8.101). 
            ▪ Ability to view these times by shipping method or warehouse (if multi-warehouse). 
    4. Order Processing Breakdown: 
        ◦ A report showing the number of orders in each fulfillment stage (e.g., "New," "Pending Fulfillment," "Picked," "Packed," "Shipped"). 
    5. Return Rate Analysis: 
        ◦ A report showing the overall return rate (number of returned items/orders divided by total items/orders sold) for a selected period. 
        ◦ Breakdown of return reasons (from Story 8.102) by frequency. 
        ◦ Identification of top returned products/SKUs. 
    6. Time Period Selection: 
        ◦ All metrics are configurable for specific time periods (e.g., "Today," "Last 7 Days," "Last Month," "Custom Date Range"). 
    7. Data Export: 
        ◦ Ability to export report data (e.g., CSV, Excel) for further analysis. 
    8. Data Accuracy: 
        ◦ All reported metrics are accurate and derived from inventory, order, and return logs. 

Granular Tasks & Subtasks for Story 10.105:
    • Backend Tasks (Analytics Service, Inventory Service, Order Service, Return Service):
        ◦ Task 10.105.1: Enhance Data Models for Fulfillment & Returns 
            ▪ Subtask 10.105.1.1: Ensure Order status timestamps are accurately recorded (createdAt, shippedAt, deliveredAt). 
            ▪ Subtask 10.105.1.2: Ensure Return records (from Story 8.102) include returnReason, productId, quantity, returnDate. 
            ▪ Subtask 10.105.1.3: Ensure Product/SKU inventory levels are always current in the Inventory Service and track stock adjustments (additions, subtractions beyond sales). 
        ◦ Task 10.105.2: Implement Inventory Reporting Logic 
            ▪ Subtask 10.105.2.1: Function to query Inventory Service for current stockLevel for all products/SKUs. 
            ▪ Subtask 10.105.2.2: Implement logic for lowStockThreshold (configurable in admin) and flag products below it. 
            ▪ Subtask 10.105.2.3: (Optional) Logic to calculate "Days of Stock" based on average daily sales of a product over a recent period. 
            ▪ Subtask 10.105.2.4: Function to query Inventory Transaction logs (if implemented) for stock movement over time (e.g., stock_in, stock_out, adjustments). 
        ◦ Task 10.105.3: Implement Fulfillment Time & Stage Calculation Logic 
            ▪ Subtask 10.105.3.1: Function to calculate Order-to-Shipped Time: Average of (shippedAt - createdAt) for completed/shipped orders within a period. 
            ▪ Subtask 10.105.3.2: Function to calculate Order-to-Delivered Time: Average of (deliveredAt - createdAt) for delivered orders within a period. 
            ▪ Subtask 10.105.3.3: Function to count orders by their current fulfillmentStatus (e.g., "new", "pending pick", "picked", "packed", "shipped"). 
            ▪ Subtask 10.105.3.4: Allow filtering these calculations by shippingMethod or warehouseId. 
        ◦ Task 10.105.4: Implement Return Rate Analysis Logic 
            ▪ Subtask 10.105.4.1: Function to calculate overallReturnRate: (totalReturnedOrders / totalShippedOrders) or (totalReturnedItems / totalSoldItems) within a period. 
            ▪ Subtask 10.105.4.2: Function to aggregate Return records by returnReason and productId for counts. 
            ▪ Subtask 10.105.4.3: Identify topReturnedProducts by frequency or value. 
        ◦ Task 10.105.5: Implement Analytics API Endpoints 
            ▪ Subtask 10.105.5.1: GET /api/admin/reports/inventory-snapshot: Returns current stock levels and low stock alerts. 
            ▪ Subtask 10.105.5.2: GET /api/admin/reports/inventory-movement: Returns stock changes over time. 
            ▪ Subtask 10.105.5.3: GET /api/admin/reports/fulfillment-times: Returns average order-to-shipped/delivered times. 
            ▪ Subtask 10.105.5.4: GET /api/admin/reports/fulfillment-stages: Returns order counts per stage. 
            ▪ Subtask 10.105.5.5: GET /api/admin/reports/return-analysis: Returns return rates, reasons, top returned products. 
            ▪ Subtask 10.105.5.6: All endpoints accept startDate, endDate, and relevant filters. 
            ▪ Subtask 10.105.5.7: Implement authentication and authorization. 
        ◦ Task 10.105.6: Implement Data Export Functionality 
            ▪ Subtask 10.105.6.1: Add option to return data in CSV/Excel. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 10.105.7: Create "Operations Analytics" Sub-section in Admin UI 
            ▪ Subtask 10.105.7.1: Add a new tab or sub-menu item within the "Analytics" section for "Operations" or "Inventory & Fulfillment." 
            ▪ Subtask 10.105.7.2: Create InventoryFulfillmentDashboard component/route (e.g., /admin/analytics/operations). 
        ◦ Task 10.105.8: Implement Date Range Selector & Filters 
            ▪ Subtask 10.105.8.1: Reuse the date range selector from Story 10.101. 
            ▪ Subtask 10.105.8.2: Add filters for shippingMethod, warehouse, category, product search. 
        ◦ Task 10.105.9: Display Inventory Reports 
            ▪ Subtask 10.105.9.1: Display current stock levels in a sortable table, highlighting low stock items. 
            ▪ Subtask 10.105.9.2: (Optional) Display stock movement summary or chart. 
            ▪ Subtask 10.105.9.3: Call GET /api/admin/reports/inventory-snapshot and inventory-movement. 
        ◦ Task 10.105.10: Display Fulfillment Time & Stage Reports 
            ▪ Subtask 10.105.10.1: Display average order-to-shipped/delivered times prominently. 
            ▪ Subtask 10.105.10.2: Use a bar or pie chart to show order counts per fulfillment stage. 
            ▪ Subtask 10.105.10.3: Call GET /api/admin/reports/fulfillment-times and fulfillment-stages. 
        ◦ Task 10.105.11: Display Return Analytics Reports 
            ▪ Subtask 10.105.11.1: Display overall return rate percentage. 
            ▪ Subtask 10.105.11.2: Display table/chart of top return reasons and top returned products. 
            ▪ Subtask 10.105.11.3: Call GET /api/admin/reports/return-analysis. 
        ◦ Task 10.105.12: Implement Data Export Buttons 
            ▪ Subtask 10.105.12.1: Add "Export to CSV/Excel" buttons for all tables. 
    • Testing Tasks:
        ◦ Task 10.105.13: Write Unit Tests (Backend) 
            ▪ Subtask 10.105.13.1: Unit tests for calculating fulfillment times based on mocked createdAt, shippedAt, deliveredAt. 
            ▪ Subtask 10.105.13.2: Unit tests for return rate calculations. 
            ▪ Subtask 10.105.13.3: Unit tests for identifying low stock based on threshold. 
        ◦ Task 10.105.14: Write Integration Tests 
            ▪ Subtask 10.105.14.1: Create products with varying stock levels. Simulate sales to reduce stock. Verify inventory snapshot. 
            ▪ Subtask 10.105.14.2: Create orders and advance them through various fulfillment statuses (pending, shipped, delivered). 
            ▪ Subtask 10.105.14.3: Create return requests (from Story 8.102) for some orders with different reasons. 
            ▪ Subtask 10.105.14.4: Call each GET /api/admin/reports/inventory-*, fulfillment-*, return-* endpoint. 
            ▪ Subtask 10.105.14.5: Verify average fulfillment times are accurate. 
            ▪ Subtask 10.105.14.6: Verify order status breakdown is correct. 
            ▪ Subtask 10.105.14.7: Verify overall return rate, top reasons, and top returned products are accurate. 
            ▪ Subtask 10.105.14.8: Test data export. 
        ◦ Task 10.105.15: Manual End-to-End Testing: 
            ▪ Subtask 10.105.15.1: Log in as admin. Navigate to "Analytics" -> "Operations." 
            ▪ Subtask 10.105.15.2: Set a few products to have very low stock (e.g., 2-3 units). Verify they are highlighted as "low stock." 
            ▪ Subtask 10.105.15.3: Place several customer orders. Manually update some to "Shipped" and some to "Delivered" via admin tools. 
            ▪ Subtask 10.105.15.4: Initiate returns for a few products, specifying different return reasons. 
            ▪ Subtask 10.105.15.5: Select a date range covering your test activities. 
            ▪ Subtask 10.105.15.6: Verify average fulfillment times (order-to-shipped, order-to-delivered). 
            ▪ Subtask 10.105.15.7: Check the order processing stages report. 
            ▪ Subtask 10.105.15.8: Verify the overall return rate, common reasons, and top returned products. 
            ▪ Subtask 10.105.15.9: Export data and spot-check accuracy. 
            ▪ Subtask 10.105.15.10: Check report loading performance.
Epic 11: Internationalization & Localization
Epic Goal: To enable the e-commerce platform to operate effectively in multiple geographic regions by supporting different currencies, languages, tax rules, and shipping options, thereby expanding market reach and improving the experience for international customers.
Let's start with a fundamental requirement for selling internationally: Multi-Currency Support.
Story 11.101: Multi-Currency Support
Story: As an international customer, I want to be able to browse products and complete my purchase in my preferred currency, so that I have a clear understanding of pricing and avoid foreign exchange conversion issues.
Acceptance Criteria:
    1. Currency Selector UI: 
        ◦ A visible currency selector is available on the website (e.g., in the header or footer), allowing customers to choose their preferred display currency. 
        ◦ The selector clearly shows the currently selected currency. 
    2. Display Currency Conversion: 
        ◦ All prices displayed on the website (product pages, category listings, cart, checkout summary) are converted to the selected display currency using real-time or frequently updated exchange rates. 
        ◦ A clear indication that prices are estimates based on current exchange rates is shown if the base currency is different from the display currency, especially at checkout. 
    3. Checkout & Payment in Chosen Currency (Primary): 
        ◦ When a customer proceeds to checkout, the transaction (the actual charge) is processed in the selected display currency, if supported by the payment gateway. 
        ◦ If the payment gateway or merchant account only supports a subset of currencies, a fallback mechanism (e.g., convert to a supported base currency for charge) is implemented, with clear notification to the customer. 
    4. Admin Currency Management: 
        ◦ An admin interface allows configuration of: 
            ▪ Supported Currencies: Which currencies are available for display and transaction. 
            ▪ Base Currency: The primary currency the business operates in and against which all conversions are calculated. 
            ▪ Exchange Rate Providers: Configuration for fetching exchange rates (e.g., API endpoint, refresh frequency). 
            ▪ Manual Rate Overrides: Ability to manually set exchange rates if needed. 
    5. Database Storage of Prices: 
        ◦ Product prices are stored in the base currency in the database. 
        ◦ All order line items and totals are stored in the transacted currency, along with the exchange rate used at the time of purchase, and the equivalent amount in the base currency. 
    6. Order Confirmation & Invoices: 
        ◦ Order confirmations, receipts, and invoices clearly state the transacted currency and amount. 
    7. Historical Exchange Rate Accuracy: 
        ◦ Past orders display prices in the original transacted currency, or if converted for display, use the exact rate from the time of transaction. 
    8. Performance: 
        ◦ Currency conversion does not introduce noticeable delays in page load or checkout. 

Granular Tasks & Subtasks for Story 11.101:
    • Discovery & Setup Tasks:
        ◦ Task 11.101.1: Research Exchange Rate Providers & Payment Gateway Support 
            ▪ Subtask 11.101.1.1: Identify a reliable API for exchange rates (e.g., Open Exchange Rates, Fixer.io, currencylayer). Assess pricing, reliability, refresh frequency. 
            ▪ Subtask 11.101.1.2: Confirm chosen Payment Gateway (from Epic 6) supports charging in multiple currencies. Understand how it handles FX rates if conversion is done by the gateway. 
            ▪ Subtask 11.101.1.3: Define the platform's Base Currency. 
    • Backend Tasks (Currency Service, Product Service, Cart Service, Order Service, Admin Service):
        ◦ Task 11.101.2: Implement Currency Management & Exchange Rate Service 
            ▪ Subtask 11.101.2.1: Create a Currency entity/model: code (e.g., USD, EUR), symbol (£, $, €), name, isActive. 
            ▪ Subtask 11.101.2.2: Create an ExchangeRate entity/model: baseCurrencyCode, targetCurrencyCode, rate, lastUpdated. 
            ▪ Subtask 11.101.2.3: Develop a scheduled job to fetch exchange rates from the chosen provider(s) periodically (e.g., hourly, daily) and store them. 
            ▪ Subtask 11.101.2.4: Implement a CurrencyService with methods: 
                • getExchangeRate(baseCode, targetCode): Retrieves the latest rate. 
                • convert(amount, fromCurrency, toCurrency): Performs the conversion. 
                • getSupportedCurrencies(): Returns list of active currencies. 
                • getBaseCurrency(): Returns the configured base currency. 
        ◦ Task 11.101.3: Update Product & Pricing Storage 
            ▪ Subtask 11.101.3.1: Ensure all product prices (and associated fields like compareAtPrice) are stored in the Base Currency in the Product database schema. 
        ◦ Task 11.101.4: Implement Currency in Cart & Checkout Calculation 
            ▪ Subtask 11.101.4.1: When adding items to cart, store original product price in base currency. 
            ▪ Subtask 11.101.4.2: Modify cart calculations to convert all cartItem.price, subtotal, shippingCost, tax, discount values to the user's selectedDisplayCurrency on the fly for display. 
            ▪ Subtask 11.101.4.3: Crucially, at checkout, record the transactedCurrency, the exchangeRateUsed, and the amountInTransactedCurrency for the order total and each line item. Also record the equivalent amountInBaseCurrency. 
            ▪ Subtask 11.101.4.4: Update Order schema: currencyCode (of transaction), exchangeRateToPrimary, totalAmountInPrimaryCurrency. 
        ◦ Task 11.101.5: Integrate with Payment Gateway for Multi-Currency Charge 
            ▪ Subtask 11.101.5.1: During payment processing, pass the totalAmount and selectedDisplayCurrency to the payment gateway. 
            ▪ Subtask 11.101.5.2: Implement fallback logic: if the payment gateway does not support the selected display currency directly, convert the total to the closest supported currency (e.g., USD or the base currency) and notify the customer of the final charge currency. 
        ◦ Task 11.101.6: Develop Admin Currency Management APIs 
            ▪ Subtask 11.101.6.1: GET /api/admin/currencies: List supported currencies and their rates. 
            ▪ Subtask 11.101.6.2: POST /api/admin/currencies/config: Set base currency, exchange rate provider, refresh frequency. 
            ▪ Subtask 11.101.6.3: PUT /api/admin/currencies/rates/:targetCode: Manually override an exchange rate. 
            ▪ Subtask 11.101.6.4: Implement authentication and authorization for admin access. 
    • Frontend Tasks (Site-wide, Checkout, Admin Panel):
        ◦ Task 11.101.7: Implement Currency Selector UI 
            ▪ Subtask 11.101.7.1: Add a dropdown or toggle in the header/footer (or regional selector) to allow customers to choose their display currency. 
            ▪ Subtask 11.101.7.2: Populate options by calling GET /api/currency/supported-currencies. 
            ▪ Subtask 11.101.7.3: Store the selected currency in a cookie or local storage to persist user preference. 
            ▪ Subtask 11.101.7.4: Implement client-side logic to update all displayed prices when the currency selection changes. 
        ◦ Task 11.101.8: Display Converted Prices Across the Site 
            ▪ Subtask 11.101.8.1: Update ProductCard, ProductDetailPage, CartPage, CheckoutSummary components to display prices in the selectedDisplayCurrency. 
            ▪ Subtask 11.101.8.2: Ensure correct currency symbols are used (£, $, €). 
            ▪ Subtask 11.101.8.3: Add a small tooltip or disclaimer near prices if necessary (e.g., "Prices are approximate, final charge in [base currency]"). 
        ◦ Task 11.101.9: Update Checkout Summary for Final Charge Currency 
            ▪ Subtask 11.101.9.1: Clearly state the currency in which the customer will be charged (which might be different from display if fallback is used). 
            ▪ Subtask 11.101.9.2: On the final payment step, confirm the exact amount and currency of the transaction. 
        ◦ Task 11.101.10: Admin Panel for Currency Management 
            ▪ Subtask 11.101.10.1: Create a new "Currencies" section under "Settings" or "Internationalization" in the admin panel. 
            ▪ Subtask 11.101.10.2: Display a table of supported currencies and their current exchange rates against the base currency. 
            ▪ Subtask 11.101.10.3: Implement forms/inputs for configuring base currency, exchange rate provider API keys, and refresh intervals. 
            ▪ Subtask 11.101.10.4: Allow manual override of exchange rates with validation. 
            ▪ Subtask 11.101.10.5: Display "Last Updated" timestamp for exchange rates. 
        ◦ Task 11.101.11: Update Order Confirmation & Invoice Display 
            ▪ Subtask 11.101.11.1: Ensure order confirmation emails and downloadable invoices (from Story 8.101) clearly show the currency of the transaction and the exact amount charged. 
    • Testing Tasks:
        ◦ Task 11.101.12: Write Unit Tests (Backend) 
            ▪ Subtask 11.101.12.1: Unit tests for CurrencyService.convert with different rates and currencies. 
            ▪ Subtask 11.101.12.2: Unit tests for exchange rate fetching and storage. 
            ▪ Subtask 11.101.12.3: Unit tests for order total calculations with multi-currency. 
        ◦ Task 11.101.13: Write Integration Tests 
            ▪ Subtask 11.101.13.1: Set base currency to EUR and add USD, GBP as supported. 
            ▪ Subtask 11.101.13.2: Fetch products. Simulate changing display currency to USD. Verify prices update. 
            ▪ Subtask 11.101.13.3: Add product to cart. Verify cart total updates with display currency. 
            ▪ Subtask 11.101.13.4: Proceed to checkout with USD selected. Complete payment. 
            ▪ Subtask 11.101.13.5: Verify order in DB shows currencyCode: "USD", exchangeRateToPrimary, and totalAmountInPrimaryCurrency. 
            ▪ Subtask 11.101.13.6: Test manual exchange rate override in admin and verify it takes effect on frontend. 
            ▪ Subtask 11.101.13.7: Test fallback payment gateway behavior if direct currency not supported. 
        ◦ Task 11.101.14: Manual End-to-End Testing: 
            ▪ Subtask 11.101.14.1: Log in as admin. Configure base currency (e.g., GBP), add USD and EUR as supported currencies, and set initial rates. 
            ▪ Subtask 11.101.14.2: As a customer, navigate to the site. Use the currency selector to switch between GBP, USD, EUR. Verify all prices (product listings, detail pages, cart) update correctly with the symbol. 
            ▪ Subtask 11.101.14.3: Add items to cart. Go to checkout with USD selected. Review the total in USD. Complete the purchase. 
            ▪ Subtask 11.101.14.4: Check order confirmation (email/on-site). Verify the currency and amount are correct (in USD). 
            ▪ Subtask 11.101.14.5: Log in as admin. View the placed order. Verify currencyCode, exchangeRateToPrimary, and totalAmountInPrimaryCurrency are correctly stored. 
            ▪ Subtask 11.101.14.6: In the admin panel, manually override the GBP-to-USD exchange rate. Verify prices update on the storefront immediately (or after cache refresh). 
            ▪ Subtask 11.101.14.7: Test Browse performance after currency changes. 
            ▪ Subtask 11.101.14.8: If payment gateway fallback is implemented, test it. 

Epic 11: Internationalization & Localization
Story 11.102: Multi-Language & Content Localization
Story: As an international customer, I want to be able to view the website in my preferred language, including navigation, product information, and static content, so that I can easily understand and interact with the platform.
Acceptance Criteria:
    1. Language Selector UI: 
        ◦ A visible language selector (e.g., dropdown, flag icons) is available on the website (e.g., in the header or footer), allowing customers to switch between supported languages. 
        ◦ The selector clearly indicates the currently active language. 
    2. UI & Static Text Translation: 
        ◦ All fixed UI elements (buttons, navigation menus, labels, error messages, checkout steps, legal texts like Terms & Conditions) are displayed in the selected language. 
        ◦ Fallback to a default language (e.g., English) if a translation is missing for a specific string. 
    3. Dynamic Content Translation: 
        ◦ Key dynamic content can be translated and displayed in the selected language: 
            ▪ Product Names and Descriptions. 
            ▪ Category Names and Descriptions. 
            ▪ CMS Pages (e.g., About Us, FAQ, Blog Posts). 
            ▪ (Optional) Attribute/Option Names (e.g., "Color: Red" translated to "Couleur: Rouge"). 
    4. Admin Translation Management: 
        ◦ An admin interface allows content managers to: 
            ▪ Add/remove supported languages. 
            ▪ Edit translations for UI strings. 
            ▪ Edit translations for dynamic content (products, categories, CMS pages). 
            ▪ Mark a translation as "missing" or "incomplete." 
    5. URL Localization (Optional but Recommended for SEO): 
        ◦ URLs reflect the chosen language (e.g., www.example.com/en/product-name vs. www.example.com/fr/nom-du-produit). This aids SEO. 
    6. Persistent Language Preference: 
        ◦ The chosen language is stored (e.g., in a cookie or user profile) and persists across sessions. 
    7. Data Storage for Translations: 
        ◦ All translatable content is stored efficiently in the database, linked to its original content and language code. 
    8. Performance: 
        ◦ Language switching and content loading for different languages do not introduce noticeable delays. 

Granular Tasks & Subtasks for Story 11.102:
    • Discovery & Setup Tasks:
        ◦ Task 11.102.1: Choose Internationalization (i18n) Framework/Library 
            ▪ Subtask 11.102.1.1: Research suitable i18n libraries for the frontend (e.g., react-i18next, Vue I18n, angular-translate) and backend (e.g., i18n-node for Node.js, gettext for Python/PHP). 
            ▪ Subtask 11.102.1.2: Decide on a standard for language codes (e.g., en, fr, es). 
        ◦ Task 11.102.2: Define Default Language & Initial Translations 
            ▪ Subtask 11.102.2.1: Confirm the default language (e.g., English). 
            ▪ Subtask 11.102.2.2: Prepare initial translation files (e.g., JSON, PO files) for common UI strings in one additional language (e.g., French). 
    • Backend Tasks (Localization Service, Product Service, Category Service, CMS Service, Admin Service):
        ◦ Task 11.102.3: Implement Translation Data Storage 
            ▪ Subtask 11.102.3.1: For UI/Static Strings: Create a TranslationString schema/collection: key (e.g., common.add_to_cart), languageCode, value (translated string). 
            ▪ Subtask 11.102.3.2: For Dynamic Content: Modify Product, Category, CMSPage schemas to store translations directly or via a separate localized_content sub-document/table. 
              JSON
Epic 11: Internationalization & Localization
Story 11.103: Regional Shipping & Tax Rules
Story: As an international customer, I want to see accurate shipping costs and applicable taxes for my order based on my delivery address, so that I understand the total cost before completing my purchase and avoid unexpected charges.
Acceptance Criteria:
    1. Shipping Zones Configuration (Admin): 
        ◦ An admin interface allows defining Shipping Zones based on geographic criteria (e.g., countries, states/provinces, zip/postcode ranges). 
        ◦ Each zone can have multiple associated countries/regions. 
    2. Zone-Based Shipping Methods & Rates (Admin): 
        ◦ Within each Shipping Zone, administrators can configure: 
            ▪ Available Shipping Methods (e.g., Standard Shipping, Express, Next-Day). 
            ▪ Shipping Rates for each method, based on: 
                • Flat Rate. 
                • Weight-based. 
                • Price/Value-based. 
                • (Optional) Item Count-based. 
            ▪ Free Shipping Thresholds per zone/method. 
    3. Tax Configuration (Admin): 
        ◦ An admin interface allows configuring Tax Rules based on: 
            ▪ Origin Address (where the business is located). 
            ▪ Destination Address (customer's shipping address). 
            ▪ Product Tax Class (e.g., Standard, Reduced, Zero-rated, Digital Goods). 
            ▪ (Optional) Customer Tax Exempt Status (e.g., B2B customers with VAT ID). 
        ◦ Supports configuring: 
            ▪ VAT (Value Added Tax) for EU, UK, etc. 
            ▪ Sales Tax for US (state/county/city level). 
            ▪ Other relevant regional taxes. 
        ◦ Allows setting a Default Tax Class for products. 
    4. Dynamic Shipping & Tax Calculation at Checkout: 
        ◦ As the customer enters their shipping address in the cart or checkout, the system dynamically: 
            ▪ Identifies the applicable Shipping Zone. 
            ▪ Displays available Shipping Methods and their calculated costs. 
            ▪ Calculates and displays applicable Taxes (VAT, Sales Tax, etc.) on the subtotal and individual line items. 
        ◦ Updates instantly as the address, cart contents, or shipping method changes. 
    5. Product Tax Class Assignment: 
        ◦ Product creation/edit (from Epic 2/3) allows assignment of a Tax Class (e.g., "Standard VAT," "Food Items," "Digital Product"). 
    6. Order Summary & Invoice Accuracy: 
        ◦ The final order summary, confirmation, and invoice clearly break down product costs, shipping costs, and all applicable taxes. 
    7. Data Storage: 
        ◦ The Order record stores the applied shippingMethod, shippingCost, taxBreakdown (showing rates and amounts per tax type), and the specific shippingZone that was matched. 
    8. Performance: 
        ◦ Shipping and tax calculations do not introduce noticeable delays during cart or checkout. 

Granular Tasks & Subtasks for Story 11.103:
    • Discovery & Setup Tasks:
        ◦ Task 11.103.1: Research Shipping API Providers & Tax Calculation Services 
            ▪ Subtask 11.103.1.1: Evaluate third-party shipping rate calculators (e.g., FedEx, UPS, DPD APIs) if real-time carrier rates are desired (beyond simple zone-based rates). 
            ▪ Subtask 11.103.1.2: Research tax calculation services (e.g., Avalara, TaxJar, Stripe Tax) for automated, complex tax compliance (especially for US sales tax or complex VAT rules). Decide whether to integrate or implement simplified manual rules first. Assume simplified manual rules for this story for initial implementation. 
        ◦ Task 11.103.2: Define Initial Shipping Zones & Tax Classes 
            ▪ Subtask 11.103.2.1: Outline initial shipping zones (e.g., "UK Mainland," "EU Zone 1," "USA"). 
            ▪ Subtask 11.103.2.2: Define initial Product Tax Classes (e.g., "Standard Goods," "Zero-Rated"). 
    • Backend Tasks (Shipping Service, Tax Service, Checkout Service, Admin Service, Product Service):
        ◦ Task 11.103.3: Implement Shipping Zone & Method Configuration Storage 
            ▪ Subtask 11.103.3.1: Create ShippingZone schema: id, name, countries (array of country codes), states/provinces (optional array), zip/postcodeRanges (optional array). 
            ▪ Subtask 11.103.3.2: Create ShippingMethod schema: id, name, zoneId, type (flat, weight, price), rate, min/maxWeight/Price, freeShippingThreshold. 
        ◦ Task 11.103.4: Implement Tax Rule Configuration Storage 
            ▪ Subtask 11.103.4.1: Create TaxClass schema: id, name. 
            ▪ Subtask 11.103.4.2: Create TaxRule schema: id, name, countryCode, state/provinceCode (optional), productTaxClassId, rate, type (e.g., VAT, Sales Tax). 
            ▪ Subtask 11.103.4.3: Update Product schema to include taxClassId (e.g., as part of productDetails or pricing). 
        ◦ Task 11.103.5: Develop Shipping Calculation Logic 
            ▪ Subtask 11.103.5.1: identifyShippingZone(address): Given a shipping address, find the matching ShippingZone. Prioritize specific zones over broader ones (e.g., a state-specific zone over a country-wide zone). 
            ▪ Subtask 11.103.5.2: getAvailableShippingMethods(zoneId, cartContents): Returns shipping methods applicable to the zone, calculating dynamic rates based on cart total weight/price/item count. 
            ▪ calculateShippingCost(methodId, cartContents): Calculates the final cost for a chosen method. 
        ◦ Task 11.103.6: Develop Tax Calculation Logic 
            ▪ Subtask 11.103.6.1: calculateTaxes(cartItems, shippingAddress): 
                • Iterate through cartItems. For each item, get its product.taxClassId. 
                • Find applicable TaxRule based on shippingAddress (country, state) and product.taxClassId. 
                • Calculate tax for each item based on its price and the matched tax rate. 
                • Sum up taxes and return breakdown (e.g., "VAT: £X.XX", "Sales Tax: £Y.YY"). 
            ▪ Subtask 11.103.6.2: Ensure tax is applied correctly (e.g., inclusive or exclusive of displayed price). 
        ◦ Task 11.103.7: Integrate with Checkout Service 
            ▪ Subtask 11.103.7.1: Modify POST /api/checkout/calculate-totals or a similar endpoint to accept shippingAddress and selectedShippingMethod. 
            ▪ This endpoint will then call identifyShippingZone, getAvailableShippingMethods, calculateShippingCost, and calculateTaxes. 
            ▪ Return the updated cart totals including shipping and tax breakdown. 
            ▪ Subtask 11.103.7.2: When Order is finalized, store the shippingMethodId, calculatedShippingCost, and the full taxBreakdown on the Order record. 
        ◦ Task 11.103.8: Develop Admin APIs for Shipping & Tax Management 
            ▪ Subtask 11.103.8.1: APIs for CRUD operations on ShippingZone and ShippingMethod. 
            ▪ Subtask 11.103.8.2: APIs for CRUD operations on TaxClass and TaxRule. 
            ▪ Subtask 11.103.8.3: Endpoint to get a list of all defined TaxClasses for product assignment. 
            ▪ Subtask 11.103.8.4: Implement authentication and authorization. 
    • Frontend Tasks (Checkout, Product Admin, Admin Panel):
        ◦ Task 11.103.9: Update Checkout Shipping Address Input 
            ▪ Subtask 11.103.9.1: Ensure the shipping address form (especially country, state, zip/postcode) triggers recalculation of shipping and tax. 
        ◦ Task 11.103.10: Display Dynamic Shipping Options & Costs 
            ▪ Subtask 11.103.10.1: In the checkout "Shipping Method" step, display available shipping methods and their calculated costs by calling GET /api/checkout/calculate-totals (or a dedicated shipping options endpoint). 
            ▪ Subtask 11.103.10.2: Update dynamically as address changes. 
        ◦ Task 11.103.11: Display Dynamic Tax Breakdown in Checkout Summary 
            ▪ Subtask 11.103.11.1: Update the checkout summary to show Subtotal, Shipping Cost, and a detailed Tax breakdown (e.g., "VAT (20%): £X.XX", "Sales Tax: £Y.YY"). 
            ▪ Subtask 11.103.11.2: Update dynamically. 
        ◦ Task 11.103.12: Admin Panel for Shipping & Tax Configuration 
            ▪ Subtask 11.103.12.1: Create new sections in the admin panel (e.g., "Shipping" and "Taxes" under "Settings" or "Internationalization"). 
            ▪ Subtask 11.103.12.2: Shipping: UI for creating/editing ShippingZones (add countries, states, zip ranges). UI for configuring ShippingMethods within each zone (flat, weight/price rules, free shipping). 
            ▪ Subtask 11.103.12.3: Taxes: UI for creating/editing TaxClasses. UI for creating/editing TaxRules (country, state, tax class, rate). 
        ◦ Task 11.103.13: Update Product Admin for Tax Class Assignment 
            ▪ Subtask 11.103.13.1: In the "Add/Edit Product" form, add a dropdown or selector for Product Tax Class, populated from GET /api/admin/tax-classes. 
    • Testing Tasks:
        ◦ Task 11.103.14: Write Unit Tests (Backend) 
            ▪ Subtask 11.103.14.1: Unit tests for identifyShippingZone with various addresses and zone configurations. 
            ▪ Subtask 11.103.14.2: Unit tests for calculateShippingCost with different methods (flat, weight, price, free shipping). 
            ▪ Subtask 11.103.14.3: Unit tests for calculateTaxes with different addresses, product tax classes, and tax rules. 
        ◦ Task 11.103.15: Write Integration Tests 
            ▪ Subtask 11.103.15.1: Define several shipping zones and tax rules via admin APIs (e.g., UK, France, USA-NY, USA-CA). 
            ▪ Subtask 11.103.15.2: Create products with different tax classes. 
            ▪ Subtask 11.103.15.3: Simulate adding products to cart. 
            ▪ Subtask 11.103.15.4: Test checkout with different shipping addresses (UK, France, US-NY, US-CA, a country with no defined zone). Verify correct shipping methods, costs, and taxes are displayed. 
            ▪ Subtask 11.103.15.5: Test free shipping thresholds. 
            ▪ Subtask 11.103.15.6: Test orders with mixed tax class products. 
            ▪ Subtask 11.103.15.7: Verify the final order record accurately stores shipping and tax breakdown. 
        ◦ Task 11.103.16: Manual End-to-End Testing: 
            ▪ Subtask 11.103.16.1: Log in as admin. Configure: 
                • Shipping Zone "UK Standard": UK countries, Flat rate £5.00. 
                • Shipping Zone "EU Standard": France, Germany, Flat rate €10.00. 
                • Tax Class "Standard VAT": Rate 20% in UK, 20% in France. 
                • Tax Class "Reduced VAT": Rate 5% in UK, 5.5% in France. 
                • Assign a product to "Standard VAT" and another to "Reduced VAT". 
            ▪ Subtask 11.103.16.2: As a customer, add both products to cart. 
            ▪ Subtask 11.103.16.3: Go to checkout. Enter a UK address. Verify shipping is £5.00 and taxes are calculated correctly for both products (e.g., £X at 20%, £Y at 5%). 
            ▪ Subtask 11.103.16.4: Change address to France. Verify shipping is €10.00 and taxes are calculated correctly for France (e.g., €X at 20%, €Y at 5.5%). (Ensure currency switching from 11.101 also works). 
            ▪ Subtask 11.103.16.5: Change address to a country not in any zone. Verify appropriate messaging (e.g., "No shipping available to this region"). 
            ▪ Subtask 11.103.16.6: Complete an order. Verify the order confirmation and invoice correctly show the shipping cost and tax breakdown. 
            ▪ Subtask 11.103.16.7: Check performance during address changes at checkout. 

Epic 11: Internationalization & Localization
Story 11.104: Geo-IP Based Auto-Currency/Language Detection
Story: As an international customer, when I visit the website, I want the system to automatically detect my approximate location and suggest (or pre-select) the most relevant currency and language for me, so that I don't have to manually configure them and have a more personalized experience from the start.
Acceptance Criteria:
    1. Geo-IP Service Integration: 
        ◦ The platform integrates with a reliable Geo-IP lookup service (e.g., MaxMind GeoLite2, IPinfo.io) to determine a user's country based on their IP address. 
    2. Country-to-Configuration Mapping (Admin): 
        ◦ An admin interface allows mapping detected countries to specific preferred currencies and languages supported by the platform. 
        ◦ Example: IP from Germany -> Suggest EUR, German language. IP from Canada -> Suggest CAD, English or French. 
        ◦ A default fallback currency/language is defined for countries not explicitly mapped. 
    3. Auto-Detection Logic: 
        ◦ On a user's first visit (or if preferences are not saved), the system performs a Geo-IP lookup. 
        ◦ Based on the detected country and admin mappings, it determines the suggested currency and language. 
    4. User Experience (Suggestion vs. Auto-Apply): 
        ◦ Option A (Suggestion - Safer Default): A subtle, dismissible banner or pop-up appears suggesting the detected currency and language, with an option to "Change to [Suggested Currency/Language]" or "Keep [Current Currency/Language]". 
        ◦ Option B (Auto-Apply): The currency and language are automatically set without explicit confirmation, but the user can still easily change them using the manual selectors (from Stories 11.101 & 11.102). Let's go with Option A as the primary target for initial implementation for better user control. 
    5. User Override: 
        ◦ If a user manually selects a currency or language, this choice takes precedence over the Geo-IP detection and is persisted (e.g., in a cookie or user profile). 
    6. Admin Geo-IP Configuration: 
        ◦ An admin interface allows: 
            ▪ Configuring the Geo-IP service API key/settings. 
            ▪ Managing the country-to-currency/language mappings. 
            ▪ Enabling/disabling the auto-detection feature. 
    7. Performance & Caching: 
        ◦ Geo-IP lookups are performed efficiently and results are cached (e.g., per session or for a short period) to minimize performance impact. 
    8. Privacy Considerations: 
        ◦ Geo-IP lookups are performed without storing identifiable individual IP addresses unless necessary for security/logging, and in compliance with privacy regulations (e.g., GDPR). 

Granular Tasks & Subtasks for Story 11.104:
    • Discovery & Setup Tasks:
        ◦ Task 11.104.1: Select and Integrate Geo-IP Lookup Service 
            ▪ Subtask 11.104.1.1: Research and select a Geo-IP provider (e.g., MaxMind GeoLite2 database - requiring local setup, or a cloud API like IPinfo.io, Abstract API). 
            ▪ Subtask 11.104.1.2: Obtain necessary API keys or download Geo-IP database files. 
            ▪ Subtask 11.104.1.3: Understand their usage policies, rate limits, and privacy implications. 
        ◦ Task 11.104.2: Define Mapping Strategy 
            ▪ Subtask 11.104.2.1: Determine how to map detected countries to the supported currencies (from 11.101) and languages (from 11.102). A one-to-many relationship might be needed (e.g., Canada -> CAD, EN/FR). 
    • Backend Tasks (Geo-IP Service, User Session/Preference Service, Admin Service):
        ◦ Task 11.104.3: Implement Geo-IP Lookup Module 
            ▪ Subtask 11.104.3.1: Develop a GeoIPService module responsible for: 
                • Taking an IP address as input. 
                • Making an API call to the Geo-IP provider or querying a local database. 
                • Returning countryCode, countryName, region (optional), city (optional). 
            ▪ Subtask 11.104.3.2: Implement caching for Geo-IP lookup results (e.g., Redis, in-memory cache) to avoid repeated API calls for the same IP or session. 
        ◦ Task 11.104.4: Implement Geo-IP to Configuration Mapping Logic 
            ▪ Subtask 11.104.4.1: Create a GeoMapping schema/storage: countryCode, suggestedCurrencyCode, suggestedLanguageCode. 
            ▪ Subtask 11.104.4.2: Develop a PreferenceService method (e.g., getSuggestedPreferences(ipAddress)): 
                • Calls GeoIPService to get country. 
                • Looks up the GeoMapping for that country. 
                • If no mapping, returns default currency/language. 
                • If user has existing persisted preferences (from cookie/profile), those take precedence. 
        ◦ Task 11.104.5: Integrate Auto-Detection into Request Flow 
            ▪ Subtask 11.104.5.1: On initial site load (e.g., within a middleware or controller), check if the user has existing currency/language preferences. 
            ▪ Subtask 11.104.5.2: If not, call PreferenceService.getSuggestedPreferences(request.ip) to get suggestions. 
            ▪ Subtask 11.104.5.3: Pass these suggestions to the frontend to trigger the suggestion UI. 
        ◦ Task 11.104.6: Develop Admin Geo-IP Configuration APIs 
            ▪ Subtask 11.104.6.1: GET /api/admin/settings/geoip: Returns current Geo-IP service config and all country mappings. 
            ▪ Subtask 11.104.6.2: POST /api/admin/settings/geoip/config: Set Geo-IP API key, enable/disable feature. 
            ▪ Subtask 11.104.6.3: POST /api/admin/settings/geoip/mappings: Add/Update GeoMapping for a country. 
            ▪ Subtask 11.104.6.4: Implement authentication and authorization. 
    • Frontend Tasks (Site-wide, Admin Panel):
        ◦ Task 11.104.7: Implement Geo-IP Suggestion UI (Banner/Pop-up) 
            ▪ Subtask 11.104.7.1: Create a dismissible banner or pop-up component that appears if suggestedCurrency or suggestedLanguage is returned from the backend and the user hasn't made a manual selection. 
            ▪ Subtask 11.104.7.2: Display messages like "Looks like you're in [Country Name]. Would you like to shop in [Suggested Currency] and view in [Suggested Language]?" 
            ▪ Subtask 11.104.7.3: Provide "Yes, update" and "No, keep current" buttons. 
            ▪ Subtask 11.104.7.4: On "Yes, update," use existing currency/language selectors' logic to set the new preference and persist it. 
            ▪ Subtask 11.104.7.5: On "No, keep current" or dismiss, store a flag in a cookie to prevent showing the banner again for this session/user. 
        ◦ Task 11.104.8: Admin Panel for Geo-IP Configuration 
            ▪ Subtask 11.104.8.1: Create a new sub-section under "Internationalization" (or "Settings") in the admin panel called "Geo-IP Detection." 
            ▪ Subtask 11.104.8.2: Provide input fields for Geo-IP service API keys/settings. 
            ▪ Subtask 11.104.8.3: Add a toggle to "Enable/Disable Geo-IP Auto-Detection." 
            ▪ Subtask 11.104.8.4: Display a table or list for managing country-to-currency/language mappings. Include country dropdown, currency dropdown (from 11.101), language dropdown (from 11.102). 
            ▪ Subtask 11.104.8.5: Allow adding, editing, and deleting mappings. 
    • Testing Tasks:
        ◦ Task 11.104.9: Write Unit Tests (Backend) 
            ▪ Subtask 11.104.9.1: Unit tests for GeoIPService with mocked IP addresses returning different countries. 
            ▪ Subtask 11.104.9.2: Unit tests for getSuggestedPreferences with various GeoMapping configurations and existing user preferences. 
            ▪ Subtask 11.104.9.3: Test caching of Geo-IP lookups. 
        ◦ Task 11.104.10: Write Integration Tests 
            ▪ Subtask 11.104.10.1: Configure Geo-IP mappings in admin (e.g., US -> USD/EN, France -> EUR/FR, Japan -> JPY/EN). 
            ▪ Subtask 11.104.10.2: Simulate requests from different IP addresses (mocking request.ip). 
            ▪ Subtask 11.104.10.3: On first visit, verify the frontend receives the correct suggestions. 
            ▪ Subtask 11.104.10.4: Test accepting the suggestion (verify currency/language change and persistence). 
            ▪ Subtask 11.104.10.5: Test dismissing the suggestion (verify banner doesn't reappear in same session). 
            ▪ Subtask 11.104.10.6: Test user manually changing currency/language after auto-detection. Verify manual choice takes precedence. 
            ▪ Subtask 11.104.10.7: Test disabling Geo-IP detection in admin. Verify no suggestions appear. 
        ◦ Task 11.104.11: Manual End-to-End Testing: 
            ▪ Subtask 11.104.11.1: Log in as admin. Enable Geo-IP detection. Configure mappings for a few countries (e.g., UK -> GBP/EN, Germany -> EUR/DE, US -> USD/EN). 
            ▪ Subtask 11.104.11.2: Clear browser cookies/local storage. 
            ▪ Subtask 11.104.11.3: Use a VPN or proxy to simulate visiting from Germany. Load the website. 
            ▪ Subtask 11.104.11.4: Verify the suggestion banner appears with "EUR" and "German" language. 
            ▪ Subtask 11.104.11.5: Click "Yes, update". Verify currency and language switch. Browse the site. 
            ▪ Subtask 11.104.11.6: Clear cookies again. Simulate visiting from the US. Verify suggestion for USD/English. 
            ▪ Subtask 11.104.11.7: Click "No, keep current" (or dismiss). Verify the suggestion disappears and doesn't immediately reappear. 
            ▪ Subtask 11.104.11.8: Manually change currency/language after dismiss. Verify this choice persists. 
            ▪ Subtask 11.104.11.9: Test with a country not in your mappings. Verify the default fallback (e.g., USD/English) or a generic suggestion. 
            ▪ Subtask 11.104.11.10: Test disabling Geo-IP detection in admin and verify the banner no longer appears for new visits. 
            ▪ Subtask 11.104.11.11: Monitor performance during initial page load with Geo-IP lookup.
Epic 11: Internationalization & Localization
Story 11.107: International SEO Enhancements
Story: As an SEO specialist, I want the website to implement best practices for international search engine optimization, so that our localized content ranks correctly in relevant regional and language-specific search results and drives organic traffic from target markets.
Acceptance Criteria:
    1. Hreflang Implementation: 
        ◦ All relevant pages (product pages, category pages, CMS pages, homepage) include correct hreflang attributes in the <head> section, linking to all available language and region variations of that page. 
        ◦ The x-default hreflang attribute is correctly used for a generic or fallback version. 
        ◦ Hreflang tags are dynamically generated based on available translations and URL structure. 
    2. Localized Sitemaps: 
        ◦ Separate XML sitemaps are generated for each language/region combination (e.g., sitemap-en.xml, sitemap-fr.xml, sitemap-en-gb.xml). 
        ◦ Alternatively, a single sitemap index file references multiple language-specific sitemaps. 
        ◦ Each sitemap contains URLs relevant to its specified language/region. 
    3. Canonical URL Strategy: 
        ◦ Each page includes a rel="canonical" tag pointing to its preferred (or self-referencing) URL, especially important for content that might appear similar across different locales (e.g., example.com/en-us/product canonicalizing to itself). 
    4. Localized Metadata: 
        ◦ Page title tags and meta description tags are dynamically generated and populated with translated content specific to the selected language. 
        ◦ (Optional) og:locale and other Open Graph/Twitter Card tags are also localized. 
    5. Crawlability & Indexability: 
        ◦ All localized versions of pages are accessible to search engine crawlers (not blocked by robots.txt). 
        ◦ URLs (from Story 11.102, e.g., /en/product-name, /fr/nom-du-produit) are consistent and crawlable. 
    6. Performance for Crawlers: 
        ◦ Server response times for localized URLs are fast enough to avoid crawling issues. 
    7. Admin UI for SEO Metadata (Enhancement): 
        ◦ (Optional, but highly beneficial) The product, category, and CMS page admin forms allow explicit entry of localized title and meta description tags for each supported language. 

Granular Tasks & Subtasks for Story 11.107:
    • Discovery & Design Tasks:
        ◦ Task 11.107.1: Finalize URL Structure Strategy (from 11.102) 
            ▪ Subtask 11.107.1.1: Confirm if using subdirectories (/en/, /fr/), subdomains (en.example.com, fr.example.com), or ccTLDs (example.co.uk, example.fr). Assuming subdirectories for this breakdown. 
            ▪ Subtask 11.107.1.2: Define how currency preference (if separate from language) will be handled in URLs or session (e.g., example.com/en-gb/product for GBP, example.com/en-us/product for USD). 
        ◦ Task 11.107.2: Map Language/Region Combinations 
            ▪ Subtask 11.107.2.1: Create a definitive list of all supported language-region combinations (e.g., en-US, en-GB, fr-FR, de-DE, es-ES, x-default). 
    • Backend Tasks (Rendering Service, Sitemap Service, Admin Service, Product/Category/CMS Services):
        ◦ Task 11.107.3: Implement Hreflang Tag Generation 
            ▪ Subtask 11.107.3.1: Modify the server-side rendering logic (or API that serves page metadata) for all content types (products, categories, CMS pages, homepage). 
            ▪ Subtask 11.107.3.2: For each page, identify all available translated versions of that specific page. 
            ▪ Subtask 11.107.3.3: Construct the full, absolute URL for each localized version based on the defined URL structure. 
            ▪ Subtask 11.107.3.4: Generate <link rel="alternate" hreflang="[lang-region]" href="[url]" /> tags for each variation. 
            ▪ Subtask 11.107.3.5: Include rel="alternate" hreflang="x-default" pointing to the default or generic version (e.g., example.com/ or example.com/en/). 
        ◦ Task 11.107.4: Develop Localized Sitemap Generation 
            ▪ Subtask 11.107.4.1: Create a SitemapService responsible for generating XML sitemaps. 
            ▪ Subtask 11.107.4.2: Implement logic to generate a separate sitemap for each language-region combination (e.g., /sitemap-en-gb.xml, /sitemap-fr.xml). 
            ▪ Subtask 11.107.4.3: Ensure each sitemap only contains URLs relevant to its language-region and that corresponding translated content exists. 
            ▪ Subtask 11.107.4.4: Generate a sitemap.xml index file that links to all these individual language/region sitemaps. 
            ▪ Subtask 11.107.4.5: Implement a scheduled task to regenerate sitemaps periodically (e.g., daily) or upon content changes. 
        ◦ Task 11.107.5: Implement Canonical URL Generation 
            ▪ Subtask 11.107.5.1: Ensure each page consistently outputs a single <link rel="canonical" href="[self-referencing_url]" /> tag in the <head>. 
            ▪ Subtask 11.107.5.2: This URL should reflect the current language and region chosen by the user and be the preferred version of that content. 
        ◦ Task 11.107.6: Store Localized SEO Metadata 
            ▪ Subtask 11.107.6.1: Enhance Product, Category, CMSPage schemas (from 11.102) to include localized fields for seoTitle and metaDescription. 
              JSON
Epic 11: Internationalization & Localization
Story 11.108: Compliance & Legal Localizations
Story: As a legal or compliance officer, I want the platform to manage and display region-specific legal documents (like Terms & Conditions, Privacy Policy) and adhere to local data privacy regulations (e.g., GDPR, CCPA) and cookie consent requirements, so that the business operates legally and transparently in all target markets.
Acceptance Criteria:
    1. Region-Specific Legal Documents: 
        ◦ Ability to store and display multiple versions of core legal documents (e.g., Terms & Conditions, Privacy Policy, Shipping Policy, Return Policy) for different countries or regions. 
        ◦ The correct version of each document is automatically displayed based on the user's detected location (or selected region). 
        ◦ Version history for legal documents is maintained. 
    2. Localized Cookie Consent Management: 
        ◦ A configurable cookie consent mechanism that adapts to regional requirements (e.g., GDPR "opt-in" for EU, CCPA "opt-out" for California, implied consent for others). 
        ◦ Admins can configure which cookie categories are used and what consent is required per region. 
        ◦ User's cookie preferences are stored and respected. 
    3. Data Privacy Rights Support: 
        ◦ System supports requests for: 
            ▪ Right to Access/Data Portability: Customers can request a copy of their personal data held by the platform (from Epic 6, enhancement). 
            ▪ Right to Erasure/Right to be Forgotten: Customers can request deletion of their personal data (with necessary caveats for transactional data). 
        ◦ An audit trail for these requests is maintained. 
    4. Admin Legal Content Management: 
        ◦ An admin interface allows: 
            ▪ Uploading and managing multiple versions of legal documents, linked to specific countries/regions. 
            ▪ Setting start dates for new versions of legal documents. 
            ▪ Reviewing and approving changes to legal texts. 
            ▪ Configuring cookie consent settings for different regions/jurisdictions. 
    5. Privacy Policy & Terms Acceptance: 
        ◦ Checkout flow (from Epic 6) ensures customers explicitly accept the version of Terms & Conditions and Privacy Policy applicable to their region at the time of purchase. 
    6. Geolocation for Legal Content: 
        ◦ The system uses Geo-IP detection (from Story 11.104) to determine which legal documents and cookie consent rules apply. 
    7. Data Security & Logging: 
        ◦ All data privacy-related actions (data access requests, deletion requests) are securely logged for audit purposes. 

Granular Tasks & Subtasks for Story 11.108:
    • Discovery & Legal Consultation Tasks:
        ◦ Task 11.108.1: Consult with Legal Experts for Key Regions 
            ▪ Subtask 11.108.1.1: Identify the primary target regions/countries and their critical legal requirements (GDPR for EU, CCPA for California, country-specific consumer laws, tax disclaimers, etc.). 
            ▪ Subtask 11.108.1.2: Obtain or draft initial localized versions of core legal documents (T&C, Privacy Policy, etc.) for each target region. 
        ◦ Task 11.108.2: Research Cookie Consent Solutions 
            ▪ Subtask 11.108.2.1: Evaluate third-party Cookie Consent Management Platforms (CMPs) (e.g., OneTrust, Cookiebot, TrustArc) or decide to implement a custom, basic solution. Assume a custom, basic solution for initial implementation. 
    • Backend Tasks (CMS Service, Legal Service, User Service, Admin Service):
        ◦ Task 11.108.3: Implement Localized Legal Document Storage & Retrieval 
            ▪ Subtask 11.108.3.1: Enhance CMS (or create a dedicated LegalDocumentService) to store multiple versions of legal documents: documentType (e.g., TERMS, PRIVACY), countryCode (or regionId), languageCode, version, content (HTML/Markdown), effectiveDate. 
            ▪ Subtask 11.108.3.2: Develop an API endpoint: GET /api/legal-documents/:type?country=:countryCode&lang=:langCode. This endpoint should return the latest effective version for the given criteria, with a fallback to a default if a specific localized version isn't found. 
            ▪ Subtask 11.108.3.3: Store acceptance of specific legal document versions with orders/customer profiles (e.g., order.acceptedTermsVersion, customer.acceptedPrivacyPolicyVersion). 
        ◦ Task 11.108.4: Implement Cookie Consent Management Logic 
            ▪ Subtask 11.108.4.1: Define CookieCategory schema: name (e.g., essential, analytics, marketing), description. 
            ▪ Subtask 11.108.4.2: Create RegionConsentRule schema: countryCode, cookieCategory, requiredConsentType (e.g., OPT_IN, OPT_OUT, IMPLIED). 
            ▪ Subtask 11.108.4.3: Implement logic to determine the requiredConsentType based on user's Geo-IP detected country. 
            ▪ Subtask 11.108.4.4: Store user's cookiePreferences (which categories they've consented to) in a database and/or encrypted cookie. 
        ◦ Task 11.108.5: Enhance Data Privacy Rights Implementation 
            ▪ Subtask 11.108.5.1: Right to Access: Enhance customer data export (from Epic 6/10) to include all personal data held. Implement an API GET /api/customer/data-export for logged-in users. 
            ▪ Subtask 11.108.5.2: Right to Erasure: 
                • Develop a DELETE /api/customer/data-deletion-request endpoint for logged-in users. 
                • Implement a background process or manual workflow for data deletion: 
                    ◦ Anonymize or delete personal data from customer profile. 
                    ◦ Anonymize or delete personal data from marketing lists, analytics. 
                    ◦ Crucial: Retain legally required transactional data (orders, invoices) but anonymize personal identifiers associated with them. 
                • Log all deletion requests and their outcomes. 
            ▪ Subtask 11.108.5.3: Implement secure audit logging for all data access and deletion requests. 
        ◦ Task 11.108.6: Develop Admin APIs for Compliance Management 
            ▪ Subtask 11.108.6.1: APIs for CRUD operations on LegalDocuments (upload content, set version, country, effective date). 
            ▪ Subtask 11.108.6.2: APIs for CRUD operations on CookieCategories and RegionConsentRules. 
            ▪ Subtask 11.108.6.3: APIs for viewing and managing DataAccessRequests and DataDeletionRequests. 
            ▪ Subtask 11.108.6.4: Implement authentication and authorization. 
    • Frontend Tasks (Site-wide, Checkout, Admin Panel, Customer Account):
        ◦ Task 11.108.7: Display Region-Specific Legal Documents 
            ▪ Subtask 11.108.7.1: Create dedicated static pages (e.g., /privacy-policy, /terms) that dynamically load content from GET /api/legal-documents/:type based on user's detected country and language. 
            ▪ Subtask 11.108.7.2: Ensure links to these documents (footer, checkout) load the correct localized version. 
        ◦ Task 11.108.8: Implement Localized Cookie Consent Banner/Pop-up 
            ▪ Subtask 11.108.8.1: On initial visit, determine required consent type via backend endpoint (or client-side logic using Geo-IP data if safe). 
            ▪ Subtask 11.108.8.2: Display a cookie banner/pop-up: 
                • For OPT_IN regions: "This site uses cookies. Do you accept all cookies? [Accept All] [Manage Preferences]" 
                • For OPT_OUT regions: "This site uses cookies. [Opt-Out of Sales] [Learn More]" 
                • For IMPLIED regions: "This site uses cookies. By continuing to use the site, you agree to our use of cookies. [Dismiss] [Learn More]" 
            ▪ Subtask 11.108.8.3: Implement "Manage Preferences" UI allowing users to toggle specific cookie categories. 
            ▪ Subtask 11.108.8.4: Store user's choices (client-side and send to backend for persistent storage). 
            ▪ Subtask 11.108.8.5: Control cookie loading (e.g., Google Analytics, marketing pixels) based on user consent. 
        ◦ Task 11.108.9: Update Checkout for Legal Acceptance 
            ▪ Subtask 11.108.9.1: Ensure the "I agree to Terms & Conditions and Privacy Policy" checkbox in checkout explicitly links to the currently active, localized versions of these documents. 
        ◦ Task 11.108.10: Customer Account Data Privacy Features 
            ▪ Subtask 11.108.10.1: In the "My Account" section, add a "Privacy & Data" sub-section. 
            ▪ Subtask 11.108.10.2: Provide buttons/links for "Request My Data" (calling GET /api/customer/data-export) and "Delete My Account/Data" (calling DELETE /api/customer/data-deletion-request). 
            ▪ Subtask 11.108.10.3: Include clear warnings/confirmations for data deletion requests. 
        ◦ Task 11.108.11: Admin Panel for Legal & Compliance 
            ▪ Subtask 11.108.11.1: Create a "Compliance" or "Legal" section in the admin panel. 
            ▪ Subtask 11.108.11.2: Legal Documents: UI for managing legal document versions (upload, select type, set country/language, set effective date, view history). 
            ▪ Subtask 11.108.11.3: Cookie Consent: UI for defining CookieCategories. UI for configuring RegionConsentRules (country, category, required consent type). 
            ▪ Subtask 11.108.11.4: Data Requests: UI for viewing DataAccessRequests and DataDeletionRequests, with tools to manage or complete them. 
            ▪ Subtask 11.108.11.5: (Optional) Dashboard for compliance status and pending requests. 
    • Testing Tasks:
        ◦ Task 11.108.12: Write Unit Tests (Backend) 
            ▪ Subtask 11.108.12.1: Unit tests for LegalDocumentService to retrieve the correct version based on country/language/effective date. 
            ▪ Subtask 11.108.12.2: Unit tests for RegionConsentRule matching based on country. 
            ▪ Subtask 11.108.12.3: Unit tests for data anonymization logic. 
        ◦ Task 11.108.13: Write Integration Tests 
            ▪ Subtask 11.108.13.1: Upload different versions of T&C for UK and France with specific effective dates. 
            ▪ Subtask 11.108.13.2: Configure cookie rules: UK (Opt-in), US (Opt-out), Canada (Implied). 
            ▪ Subtask 11.108.13.3: Simulate visits from UK IP, US IP, Canadian IP. Verify correct cookie banners appear. 
            ▪ Subtask 11.108.13.4: Verify checkout links to the correct localized T&C based on the shipping address's country. 
            ▪ Subtask 11.108.13.5: Create a test customer. Request data export. Verify the output. 
            ▪ Subtask 11.108.13.6: Request data deletion for a test customer. Verify personal data is anonymized/deleted where appropriate, and transactional data remains. Check audit logs. 
        ◦ Task 11.108.14: Manual End-to-End Testing: 
            ▪ Subtask 11.108.14.1: Log in as admin. Upload an English T&C version for the UK and a French T&C version for France. Set effective dates. 
            ▪ Subtask 11.108.14.2: Configure cookie consent rules: EU (Opt-in), US (Opt-out). 
            ▪ Subtask 11.108.14.3: As a customer, clear cookies. Use a VPN to simulate being in France. Visit the site. 
            ▪ Subtask 11.108.14.4: Verify the cookie consent banner prompts for opt-in (GDPR-like). 
            ▪ Subtask 11.108.14.5: Navigate to the T&C page. Verify it shows the French version. 
            ▪ Subtask 11.108.14.6: Add items to cart, proceed to checkout. Verify the T&C link in checkout points to the French version. 
            ▪ Subtask 11.108.14.7: Simulate being in California (US). Verify cookie banner prompts for opt-out (CCPA-like). 
            ▪ Subtask 11.108.14.8: Log in as a customer. Go to "Privacy & Data". Request data export. Verify download. 
            ▪ Subtask 11.108.14.9: Request data deletion. Go through confirmation. Verify account behavior after deletion (e.g., personal info removed, but past orders still viewable with anonymized user). 
            ▪ Subtask 11.108.14.10: Admin: Check audit logs for data requests.
Epic 11: Internationalization & Localization
Story 11.110: International Shipping Carriers & Tracking
Story: As an operations manager, I want the platform to integrate with international shipping carriers, automatically generate necessary customs documentation, and provide detailed tracking for international orders, so that I can efficiently process cross-border shipments and customers have full visibility into their delivery status.
Acceptance Criteria:
    1. International Carrier Integration: 
        ◦ The platform integrates with APIs of at least one major international shipping carrier (e.g., DHL Express, FedEx International, UPS Worldwide). 
        ◦ Integration supports: 
            ▪ Real-time Rate Quoting: Obtain shipping costs from the carrier based on package dimensions, weight, origin, and destination. 
            ▪ Label Generation: Generate shipping labels with appropriate international shipping details. 
            ▪ Manifest Submission: Electronically submit shipment manifests to the carrier. 
    2. Automated Customs Documentation Generation: 
        ◦ For international shipments, the system automatically generates and prepares required customs documentation: 
            ▪ Commercial Invoice: Details of goods, value, shipper/consignee information. 
            ▪ Customs Declaration (CN22/CN23 or equivalent): Description of contents, quantity, weight, value, origin. 
        ◦ These documents can be printed or electronically transmitted to the carrier. 
    3. Duty & Tax Handling Options (DDU/DDP): 
        ◦ The system allows configuration per shipping method/zone for handling import duties and taxes: 
            ▪ DDU (Delivered Duty Unpaid): Customer is responsible for duties/taxes upon delivery. Clear messaging displayed to the customer at checkout. 
            ▪ DDP (Delivered Duty Paid): Merchant is responsible for duties/taxes (requires integration with a duty calculator and carrier's DDP service). Clear messaging displayed to the customer. Start with DDU as primary and make DDP an optional enhancement if too complex for initial scope. 
    4. International Tracking: 
        ◦ Once a shipment is created, a unique international tracking number is generated. 
        ◦ This tracking number is accessible to the customer via their order history page and order confirmation emails. 
        ◦ A direct link to the carrier's tracking page is provided. 
    5. Prohibited/Restricted Items & Countries (Basic): 
        ◦ A basic mechanism to flag products as "prohibited for international shipping" or "restricted for certain countries" and prevent checkout for such combinations. 
    6. Admin Shipment Management: 
        ◦ An admin interface for international orders allows: 
            ▪ Viewing generated labels and customs documents. 
            ▪ Manually obtaining international shipping rates if needed. 
            ▪ Viewing international tracking status updates. 
            ▪ Mark orders as "Shipped" and input the international tracking number. 
    7. Error Handling & Notifications: 
        ◦ System provides clear error messages for failed label generation, customs issues, or unserviceable routes. 
        ◦ Operations staff are notified of international shipping exceptions. 

Granular Tasks & Subtasks for Story 11.110:
    • Discovery & Partnership Tasks:
        ◦ Task 11.110.1: Select International Carrier(s) & Obtain API Access 
            ▪ Subtask 11.110.1.1: Choose 1-2 primary international carriers based on business needs (e.g., DHL, FedEx, UPS). 
            ▪ Subtask 11.110.1.2: Sign up for developer accounts and obtain API keys/credentials for rate quoting, label generation, and tracking. 
            ▪ Subtask 11.110.1.3: Review carrier API documentation for international services (label formats, customs data requirements, service types). 
        ◦ Task 11.110.2: Clarify DDU/DDP Strategy 
            ▪ Subtask 11.110.2.1: Determine the initial approach for duties/taxes (e.g., only DDU, or a basic DDP for specific regions). Focus on DDU for initial implementation simplicity. 
    • Backend Tasks (Shipping Service, Order Service, Product Service, Admin Service):
        ◦ Task 11.110.3: Implement International Carrier API Integration Module 
            ▪ Subtask 11.110.3.1: Create a CarrierIntegrationService (or extend existing Shipping Service) with methods: 
                • getInternationalRates(originAddress, destinationAddress, packageDetails, serviceType): Calls carrier API for rate quotes. 
                • createInternationalShipment(orderData, packageDetails, customsInfo, serviceType): Calls carrier API to generate label and tracking number. 
                • getTrackingStatus(trackingNumber): Calls carrier API for tracking updates. 
            ▪ Subtask 11.110.3.2: Handle different carrier API responses and error codes. 
        ◦ Task 11.110.4: Enhance Product Data for Customs 
            ▪ Subtask 11.110.4.1: Update Product schema (or add a related model) to include fields required for customs: HSCode (Harmonized System Code), countryOfOrigin, customsDescription (short text). 
            ▪ Subtask 11.110.4.2: Ensure Product data allows specifying weight and dimensions (from Epic 2, critical for shipping). 
        ◦ Task 11.110.5: Implement Customs Documentation Generation Logic 
            ▪ Subtask 11.110.5.1: Develop a CustomsDocumentService to assemble data for Commercial Invoices and Customs Declarations (CN22/CN23). 
            ▪ Subtask 11.110.5.2: Logic to pull orderItem details, product.HSCode, product.countryOfOrigin, product.customsDescription, customer details, merchant details. 
            ▪ Subtask 11.110.5.3: Generate PDF or other required formats for these documents. 
        ◦ Task 11.110.6: Integrate with Order Fulfillment Workflow 
            ▪ Subtask 11.110.6.1: When an order is marked as "Ready for International Shipping" (a new status or flag): 
                • Call CarrierIntegrationService.createInternationalShipment. 
                • If successful, store trackingNumber, carrierName, labelPDF, customsDocPDF on the Order record. 
                • Update orderStatus to "Shipped (International)". 
                • If failed, set appropriate error status. 
            ▪ Subtask 11.110.6.2: Update Order Confirmation Emails (from Epic 8) to include international tracking number and direct carrier link for international orders. 
        ◦ Task 11.110.7: Implement Duty/Tax Handling Logic 
            ▪ Subtask 11.110.7.1: Add a dutyPaymentType field to ShippingMethod schema (e.g., DDU, DDP). 
            ▪ Subtask 11.110.7.2: In the checkout (from 11.103), if dutyPaymentType is DDU, include a clear disclaimer message regarding potential import duties/taxes. 
            ▪ Subtask 11.110.7.3: (For future DDP): Integrate with a duty/tax calculator API to get estimated DDP costs during checkout. 
        ◦ Task 11.110.8: Implement Prohibited/Restricted Items Logic 
            ▪ Subtask 11.110.8.1: Add internationalRestrictions (array of countryCode or regionId) to Product schema. 
            ▪ Subtask 11.110.8.2: In cart/checkout validation, if a product with internationalRestrictions is present and the shipping address matches a restricted country, block checkout and display a clear message. 
        ◦ Task 11.110.9: Develop Admin APIs for International Shipping 
            ▪ Subtask 11.110.9.1: Endpoint POST /api/admin/orders/:orderId/generate-international-label: Triggers label/customs doc generation. 
            ▪ Subtask 11.110.9.2: Endpoint GET /api/admin/orders/:orderId/international-tracking: Get real-time tracking status. 
            ▪ Subtask 11.110.9.3: APIs for managing carrier credentials (API keys, account numbers). 
            ▪ Subtask 11.110.9.4: Implement authentication and authorization. 
    • Frontend Tasks (Checkout, Customer Account, Admin Panel, Product Admin):
        ◦ Task 11.110.10: Update Checkout for International Duty/Tax Disclaimers 
            ▪ Subtask 11.110.10.1: If a DDU shipping method is selected, display a prominent disclaimer in the checkout summary (e.g., "Note: Import duties and taxes may apply upon delivery. You are responsible for these charges."). 
        ◦ Task 11.110.11: Customer Order Tracking for International Shipments 
            ▪ Subtask 11.110.11.1: On the customer's "Order Details" page (from Epic 8), for international orders, display the trackingNumber and a clickable link to the carrier's international tracking page. 
        ◦ Task 11.110.12: Admin Panel for International Shipment Management 
            ▪ Subtask 11.110.12.1: Enhance the "Order Details" view in the admin panel (from Epic 8) for international orders. 
            ▪ Subtask 11.110.12.2: Add buttons/sections for "Generate International Label/Docs" (calls POST /api/admin/orders/:orderId/generate-international-label). 
            ▪ Subtask 11.110.12.3: Display generated label/customs docs (e.g., PDF links). 
            ▪ Subtask 11.110.12.4: Display the trackingNumber and current trackingStatus (from GET /api/admin/orders/:orderId/international-tracking). 
            ▪ Subtask 11.110.12.5: Add sections to configure international carrier credentials (API keys, account numbers). 
        ◦ Task 11.110.13: Update Product Admin for Customs Data & Restrictions 
            ▪ Subtask 11.110.13.1: In the "Add/Edit Product" form, add fields for HSCode, Country of Origin, and Customs Description. 
            ▪ Subtask 11.110.13.2: Add a section to manage internationalRestrictions (multi-select for countries). 
            ▪ Subtask 11.110.13.3: Implement relevant client-side validation. 
    • Testing Tasks:
        ◦ Task 11.110.14: Write Unit Tests (Backend) 
            ▪ Subtask 11.110.14.1: Unit tests for carrier API integration module (mocking carrier responses). 
            ▪ Subtask 11.110.14.2: Unit tests for customs document data assembly. 
            ▪ Subtask 11.110.14.3: Unit tests for prohibited item restriction logic. 
        ◦ Task 11.110.15: Write Integration Tests 
            ▪ Subtask 11.110.15.1: Create a product with HS code, country of origin, weight. 
            ▪ Subtask 11.110.15.2: Create an international order (e.g., from UK to US). 
            ▪ Subtask 11.110.15.3: Simulate calling POST /api/admin/orders/:orderId/generate-international-label. Verify response contains label/tracking info. 
            ▪ Subtask 11.110.15.4: Verify the order record is updated with tracking details. 
            ▪ Subtask 11.110.15.5: Programmatically check the customer's order history page to ensure the tracking number and link are visible. 
            ▪ Subtask 11.110.15.6: Test placing an order for a prohibited item to a restricted country. Verify checkout is blocked with a clear message. 
        ◦ Task 11.110.16: Manual End-to-End Testing: 
            ▪ Subtask 11.110.16.1: Log in as admin. Configure international carrier API keys. Update a product with customs details (HS code, origin, description). 
            ▪ Subtask 11.110.16.2: As a customer, place an international order (e.g., UK to US). Verify the DDU disclaimer appears at checkout. 
            ▪ Subtask 11.110.16.3: Log in as admin. Go to the international order details. 
            ▪ Subtask 11.110.16.4: Click "Generate International Label/Docs". Verify a shipping label and commercial invoice are generated and available for download. 
            ▪ Subtask 11.110.16.5: Verify the order status updates and a tracking number appears. Click the tracking link to confirm it works. 
            ▪ Subtask 11.110.16.6: As a customer, log in and view the order. Verify the tracking number and link are present. 
            ▪ Subtask 11.110.16.7: Configure a product as "prohibited for Germany." Attempt to place an order for it shipping to Germany. Verify checkout is blocked. 
            ▪ Subtask 11.110.16.8: Verify error handling for invalid shipping parameters (e.g., missing weight).
Epic 12: Customer Loyalty & Rewards Program
Epic Goal: To foster customer retention and increase customer lifetime value by implementing a structured loyalty program that rewards customers for their purchases and engagement, thereby encouraging repeat business and building stronger customer relationships.
Let's start with the cornerstone of any loyalty program: Loyalty Points Earning & Redemption.
Story 12.101: Loyalty Points Earning & Redemption
Story: As a customer, I want to earn loyalty points for my purchases and be able to redeem these points for discounts on future orders, so that I feel valued and incentivized to continue shopping with the brand.
Acceptance Criteria:
    1. Points Earning Rules (Admin Configurable): 
        ◦ An admin interface allows defining rules for earning points: 
            ▪ Base Earning Rate: X points per Y currency spent (e.g., 1 point per £1 spent). 
            ▪ (Optional) Multipliers: Different earning rates for specific product categories, brands, or during promotions (e.g., 2x points on "Electronics"). 
            ▪ (Optional) Non-purchase Earning: Earning points for actions like signing up, leaving a review (integrates with Epic 6 & 8). 
            ▪ Exclusions: Ability to exclude certain products/categories/discounts from earning points. 
        ◦ Points are calculated based on the subtotal after discounts and before shipping and taxes. 
    2. Points Redemption Rules (Admin Configurable): 
        ◦ An admin interface allows defining rules for redeeming points: 
            ▪ Redemption Value: X points equals Y currency discount (e.g., 100 points = £1 discount). 
            ▪ Minimum Redemption: Minimum points required to initiate a redemption. 
            ▪ (Optional) Maximum Redemption: Maximum points that can be redeemed per order or as a percentage of the order total. 
            ▪ Exclusions: Ability to exclude certain products/categories/discounts from redemption, or to prevent redemption on orders already using other promotions. 
    3. Customer Points Balance: 
        ◦ Each customer (from Epic 6) has a running loyalty points balance. 
        ◦ The balance is displayed prominently in the customer's account dashboard. 
        ◦ The balance updates immediately upon earning or redeeming points. 
    4. Points Earning/Spending Visibility: 
        ◦ Product Pages: Display "Earn X points on this purchase." 
        ◦ Cart/Checkout: Clearly show "Points to be earned" on the current order. 
        ◦ Checkout: Provide an option to "Apply points for discount" with the calculated discount amount based on available points. 
    5. Points History: 
        ◦ Customers can view a transaction history of their points (points earned, points redeemed, points expired). 
    6. Admin Points Management: 
        ◦ Admin users can view a customer's points balance and history. 
        ◦ (Optional) Admin can manually adjust (add/subtract) a customer's points for customer service purposes. 
    7. Expiration Rules (Admin Configurable): 
        ◦ (Optional) Points can be configured to expire after a certain period (e.g., 12 months from earning date). 
        ◦ Customers are notified before points expire. 
    8. Backend Logic & Database Integration: 
        ◦ Robust backend logic for calculating, storing, and updating points. 
        ◦ Integration with order processing to deduct/add points during order creation/completion. 
        ◦ Integration with payment gateway to handle point redemption as a discount. 

Granular Tasks & Subtasks for Story 12.101:
    • Discovery & Design Tasks:
        ◦ Task 12.101.1: Define Initial Loyalty Program Rules 
            ▪ Subtask 12.101.1.1: Establish the base earning rate (e.g., 1 point per £1 spent). 
            ▪ Subtask 12.101.1.2: Establish the redemption value (e.g., 100 points = £1 discount). 
            ▪ Subtask 12.101.1.3: Define initial minimum redemption threshold. 
            ▪ Subtask 12.101.1.4: Decide if points will expire and what the expiration period will be. 
        ◦ Task 12.101.2: Plan UI/UX for Points Display 
            ▪ Subtask 12.101.2.1: Sketch placements for points balance, earning estimates, and redemption options on the frontend. 
    • Backend Tasks (Loyalty Service, Order Service, Product Service, Admin Service, Customer Service):
        ◦ Task 12.101.3: Implement Loyalty Program Core Models 
            ▪ Subtask 12.101.3.1: Create LoyaltyProgramConfig schema: baseEarningRate, redemptionValue, minRedemptionPoints, pointsExpirationPeriodDays, etc. (singleton or versioned config). 
            ▪ Subtask 12.101.3.2: Create CustomerLoyalty schema: customerId, currentPointsBalance. 
            ▪ Subtask 12.101.3.3: Create LoyaltyTransaction schema: id, customerId, type (e.g., EARN, REDEEM, ADJUST, EXPIRE), pointsAmount, relatedOrderId (optional), timestamp, description (e.g., "Purchase #12345", "Redeemed for £5 discount"). 
        ◦ Task 12.101.4: Develop Loyalty Points Earning Logic 
            ▪ Subtask 12.101.4.1: Modify Order Processing Service (from Epic 8) to trigger pointsEarned calculation upon order completion/fulfillment. 
            ▪ Subtask 12.101.4.2: calculatePointsEarned(order) function: 
                • Get order subtotal (after discounts, before shipping/tax). 
                • Apply baseEarningRate. 
                • (Optional) Apply any category/brand multipliers. 
                • (Optional) Check for product exclusions from earning. 
            ▪ Subtask 12.101.4.3: Upon successful calculation, create a LoyaltyTransaction (type EARN) and update CustomerLoyalty.currentPointsBalance. 
        ◦ Task 12.101.5: Develop Loyalty Points Redemption Logic 
            ▪ Subtask 12.101.5.1: calculateRedemptionValue(pointsToRedeem) function: Converts points to currency discount based on redemptionValue. 
            ▪ Subtask 12.101.5.2: In the Checkout Service (from Epic 6), add a parameter for pointsToRedeem. 
            ▪ Subtask 12.101.5.3: During checkout calculation, apply the points discount to the order total. 
            ▪ Subtask 12.101.5.4: Implement validation: pointsToRedeem <= currentPointsBalance, meets minRedemptionPoints, doesn't exceed maxRedemption (if configured). 
            ▪ Subtask 12.101.5.5: Upon successful order completion with points redemption, create a LoyaltyTransaction (type REDEEM) and update CustomerLoyalty.currentPointsBalance. 
        ◦ Task 12.101.6: Implement Points Expiration Logic (Optional) 
            ▪ Subtask 12.101.6.1: Develop a scheduled job to identify expiring points (e.g., check LoyaltyTransaction of type EARN that are nearing expirationDate). 
            ▪ Subtask 12.101.6.2: Create LoyaltyTransaction (type EXPIRE) and update currentPointsBalance for expired points. 
            ▪ Subtask 12.101.6.3: Integrate with Email Service (from Epic 9) for "points expiring soon" notifications. 
        ◦ Task 12.101.7: Develop Loyalty-related APIs 
            ▪ Subtask 12.101.7.1: GET /api/customer/loyalty/balance: Returns current points balance. 
            ▪ Subtask 12.101.7.2: GET /api/customer/loyalty/history: Returns transaction history. 
            ▪ Subtask 12.101.7.3: GET /api/loyalty/earning-rules: Returns current earning rules for frontend display. 
            ▪ Subtask 12.101.7.4: GET /api/loyalty/redemption-rules: Returns current redemption rules for frontend display. 
            ▪ Subtask 12.101.7.5: POST /api/admin/customer/:customerId/loyalty/adjust: Manually adjust points. 
            ▪ Subtask 12.101.7.6: GET /api/admin/loyalty/config: Get program configuration. 
            ▪ Subtask 12.101.7.7: PUT /api/admin/loyalty/config: Update program configuration. 
            ▪ Subtask 12.101.7.8: Implement authentication and authorization for all endpoints. 
    • Frontend Tasks (Customer Account, Product Pages, Cart/Checkout, Admin Panel):
        ◦ Task 12.101.9: Display Customer Points Balance 
            ▪ Subtask 12.101.9.1: In the customer's account dashboard (from Epic 6), prominently display "Your Points Balance: X points" by calling GET /api/customer/loyalty/balance. 
            ▪ Subtask 12.101.9.2: Add a link to "Points History" page. 
        ◦ Task 12.101.10: Display Points Earning Estimates 
            ▪ Subtask 12.101.10.1: On product detail pages, display "Earn approx. X points on this purchase." (using GET /api/loyalty/earning-rules). 
            ▪ Subtask 12.101.10.2: In the cart and checkout summary, display "Points to be earned on this order: X points." 
        ◦ Task 12.101.11: Implement Points Redemption at Checkout 
            ▪ Subtask 12.101.11.1: In the checkout "Payment" or "Order Summary" step, display current points balance and potential discount. 
            ▪ Subtask 12.101.11.2: Add an input field or slider "Apply points: [input] / [max_available_points]" or a checkbox "Redeem [X points] for [£Y.YY] discount". 
            ▪ Subtask 12.101.11.3: Dynamically update order total when points are applied. 
            ▪ Subtask 12.101.11.4: Implement client-side validation for minimum/maximum redemption. 
        ◦ Task 12.101.12: Create Points History Page 
            ▪ Subtask 12.101.12.1: Create a new page under "My Account" for "Points History". 
            ▪ Subtask 12.101.12.2: Display LoyaltyTransaction data from GET /api/customer/loyalty/history in a table. 
        ◦ Task 12.101.13: Admin Panel for Loyalty Program Configuration 
            ▪ Subtask 12.101.13.1: Create a new section "Loyalty Program" under "Marketing" or "Settings" in the admin panel. 
            ▪ Subtask 12.101.13.2: UI for configuring baseEarningRate, redemptionValue, minRedemptionPoints, pointsExpirationPeriodDays. 
            ▪ Subtask 12.101.13.3: (Optional) UI for managing earning multipliers/exclusions. 
        ◦ Task 12.101.14: Admin Panel for Customer Points Management 
            ▪ Subtask 12.101.14.1: In the "Customer Details" view (from Epic 6), display the customer's current points balance and a link to their full points history. 
            ▪ Subtask 12.101.14.2: Add a button/form to "Adjust Points" (calling POST /api/admin/customer/:customerId/loyalty/adjust). 
    • Testing Tasks:
        ◦ Task 12.101.15: Write Unit Tests (Backend) 
            ▪ Subtask 12.101.15.1: Unit tests for calculatePointsEarned with different order totals and earning rates. 
            ▪ Subtask 12.101.15.2: Unit tests for calculateRedemptionValue and redemption validation. 
            ▪ Subtask 12.101.15.3: Unit tests for points expiration logic (if implemented). 
            ▪ Subtask 12.101.15.4: Unit tests for points balance updates from transactions. 
        ◦ Task 12.101.16: Write Integration Tests 
            ▪ Subtask 12.101.16.1: Create a new customer. 
            ▪ Subtask 12.101.16.2: Place an order. Verify points are correctly added to customer's balance after order completion. 
            ▪ Subtask 12.101.16.3: Attempt to redeem points. Verify discount is applied correctly at checkout. 
            ▪ Subtask 12.101.16.4: Test minimum redemption validation. 
            ▪ Subtask 12.101.16.5: Verify points history correctly reflects transactions. 
            ▪ Subtask 12.101.16.6: (If expiration) Simulate points expiration and verify balance deduction and notification. 
        ◦ Task 12.101.17: Manual End-to-End Testing: 
            ▪ Subtask 12.101.17.1: Log in as admin. Configure loyalty program: 1 point per £1, 100 points = £1, min redemption 100 points, points expire in 365 days. 
            ▪ Subtask 12.101.17.2: Create a new customer account. 
            ▪ Subtask 12.101.17.3: As a customer, place an order for £150.00. 
            ▪ Subtask 12.101.17.4: Verify that 150 points are earned and displayed in the customer's account dashboard. 
            ▪ Subtask 12.101.17.5: Place a second order. At checkout, apply 100 points for a £1.00 discount. Verify the order total reduces. 
            ▪ Subtask 12.101.17.6: Complete the order. Verify remaining points balance updates. 
            ▪ Subtask 12.101.17.7: Go to "Points History". Verify both earning and redemption transactions are listed. 
            ▪ Subtask 12.101.17.8: Admin: Find the customer. Verify their points balance. Manually add 50 points. Verify customer's balance updates. 
            ▪ Subtask 12.101.17.9: (If expiration) Advance system time to simulate points expiring. Verify points are deducted and notification is sent (if configured). 

Epic 12: Customer Loyalty & Rewards Program
Story 12.103: Referral Program Integration
Story: As a loyal customer, I want to be able to refer my friends to the platform using a unique link or code and earn rewards when they make their first purchase, while my friends also receive a special incentive, so that I am encouraged to share and my friends get a great welcome.
Acceptance Criteria:
    1. Unique Referral Code/Link Generation: 
        ◦ Each customer has a unique, persistent referral code and a corresponding shareable referral link. 
        ◦ The referral code/link can be easily accessed from the customer's account dashboard. 
    2. Referred Customer Incentive: 
        ◦ When a new user lands on the site via a referral link or applies a referral code at signup/checkout, they receive a defined incentive (e.g., a first-purchase discount, bonus loyalty points). 
        ◦ The incentive is applied automatically when the conditions are met. 
    3. Referrer Reward: 
        ◦ When a referred customer completes their first qualifying purchase, the referrer receives a defined reward (e.g., loyalty points, a discount voucher). 
        ◦ The reward is automatically issued to the referrer's account. 
    4. Referral Tracking & Attribution: 
        ◦ The system accurately tracks new sign-ups and purchases attributed to a specific referrer. 
        ◦ Referral link clicks and code applications are logged. 
        ◦ Mechanism to prevent self-referral and ensure referral integrity. 
    5. Referral Program Rules (Admin Configurable): 
        ◦ An admin interface allows defining: 
            ▪ Referred Incentive: Type (discount/points), value, and conditions (e.g., min purchase value for first order). 
            ▪ Referrer Reward: Type (points/voucher), value, and conditions (e.g., referred friend's first purchase must exceed X value). 
            ▪ (Optional) Expiry: Expiration for referral links/codes and/or rewards. 
            ▪ (Optional) Exclusions: Products/categories that do not qualify for referral rewards. 
    6. Customer Referral Dashboard: 
        ◦ Customers can view their referral code/link. 
        ◦ They can see a summary of their referrals (e.g., "Friends invited," "Friends who purchased," "Rewards earned"). 
    7. Admin Referral Management: 
        ◦ Admin users can view all referrals, their status, and associated rewards. 
        ◦ (Optional) Admin can manually approve/deny pending referrals or issue/revoke rewards. 
    8. Communication: 
        ◦ Automated notifications to the referrer when a friend signs up or makes a qualifying purchase. 
        ◦ Clear messaging to referred friends about their incentive. 

Granular Tasks & Subtasks for Story 12.103:
    • Discovery & Design Tasks:
        ◦ Task 12.103.1: Define Referral Program Tiers & Incentives 
            ▪ Subtask 12.103.1.1: Decide on the incentive for the referred friend (e.g., £10 off first order over £50). 
            ▪ Subtask 12.103.1.2: Decide on the reward for the referrer (e.g., 500 loyalty points, or a £5 voucher). 
            ▪ Subtask 12.103.1.3: Define conditions for qualifying purchases for both. 
        ◦ Task 12.103.2: Plan UI/UX for Referral Section 
            ▪ Subtask 12.103.2.1: Sketch a "Refer a Friend" section in the customer's account dashboard. 
            ▪ Subtask 12.103.2.2: Plan how the referred incentive will be presented to new users (e.g., landing page, pop-up, checkout field). 
    • Backend Tasks (Referral Service, Customer Service, Order Service, Loyalty Service, Admin Service):
        ◦ Task 12.103.3: Implement Referral Program Models 
            ▪ Subtask 12.103.3.1: Create ReferralProgramConfig schema: referredIncentiveType, referredIncentiveValue, referredMinPurchase, referrerRewardType, referrerRewardValue, referrerMinPurchase, etc. 
            ▪ Subtask 12.103.3.2: Create Referral schema: referrerCustomerId, referralCode, referralLink, status (e.g., ACTIVE, DISABLED). 
            ▪ Subtask 12.103.3.3: Create ReferredCustomer schema: referredCustomerId, referrerCustomerId, referralId, firstPurchaseOrderId (optional), signupDate, firstPurchaseDate (optional), status (e.g., PENDING_SIGNUP, SIGNED_UP, FIRST_PURCHASE_COMPLETE). 
        ◦ Task 12.103.4: Develop Referral Code/Link Generation & Management 
            ▪ Subtask 12.103.4.1: Modify Customer Service (from Epic 6) to automatically generate a unique referralCode upon customer registration. 
            ▪ Subtask 12.103.4.2: Construct referralLink using the code (e.g., www.example.com?ref=YOURCODE). 
            ▪ Subtask 12.103.4.3: Store referralCode and referralLink in the Referral model. 
        ◦ Task 12.103.5: Implement Referred Customer Tracking & Incentive Application 
            ▪ Subtask 12.103.5.1: Implement a middleware or service to capture referral information from URL parameters (?ref=CODE) and store it in a session/cookie for new visitors. 
            ▪ Subtask 12.103.5.2: During new customer registration (from Epic 6), if a referral session/cookie exists, link the new customer to the referrer and create a ReferredCustomer entry with PENDING_SIGNUP status. 
            ▪ Subtask 12.103.5.3: During checkout, if the current customer is a ReferredCustomer without a first purchase, check referredIncentiveType and apply the discount/points. 
            ▪ Subtask 12.103.5.4: If a referral code is entered manually at checkout, validate it against Referral.referralCode and apply the incentive. 
        ◦ Task 12.103.6: Implement Referrer Reward Fulfillment 
            ▪ Subtask 12.103.6.1: Modify Order Processing Service (from Epic 8) to check if the completed order belongs to a ReferredCustomer and if it's their first qualifying purchase. 
            ▪ Subtask 12.103.6.2: If conditions met: 
                • Update ReferredCustomer.status to FIRST_PURCHASE_COMPLETE. 
                • Call Loyalty Service (from 12.101) to add referrerRewardValue points to the referrer's balance. 
                • (Alternatively, if voucher) Generate a unique discount voucher (from Epic 9) and assign it to the referrer. 
                • Create a LoyaltyTransaction (type REFERRAL_REWARD) for the referrer. 
        ◦ Task 12.103.7: Develop Referral Program APIs 
            ▪ Subtask 12.103.7.1: GET /api/customer/referral-program/details: Returns referrer's code, link, and summary of their referrals. 
            ▪ Subtask 12.103.7.2: GET /api/admin/referral-program/config: Returns program rules. 
            ▪ Subtask 12.103.7.3: PUT /api/admin/referral-program/config: Updates program rules. 
            ▪ Subtask 12.103.7.4: GET /api/admin/referrals: Lists all ReferredCustomer entries. 
            ▪ Subtask 12.103.7.5: Implement authentication and authorization for admin endpoints. 
        ◦ Task 12.103.8: Implement Basic Fraud Prevention 
            ▪ Subtask 12.103.8.1: Prevent referrerCustomerId from being the same as referredCustomerId (self-referral). 
            ▪ Subtask 12.103.8.2: Implement checks for suspicious patterns (e.g., same IP address for multiple referrals, rapid sign-ups). (Log for manual review initially). 
    • Frontend Tasks (Customer Account, Signup/Checkout, Admin Panel, Marketing):
        ◦ Task 12.103.9: Create Customer "Refer a Friend" Dashboard Section 
            ▪ Subtask 12.103.9.1: In the customer's account dashboard, add a "Refer a Friend" section/tab. 
            ▪ Subtask 12.103.9.2: Display the customer's unique referralCode and referralLink (from GET /api/customer/referral-program/details). 
            ▪ Subtask 12.103.9.3: Add a copy-to-clipboard button for the link/code. 
            ▪ Subtask 12.103.9.4: Display a summary of referral status (e.g., "0 Friends Signed Up, 0 Friends Purchased, 0 Rewards Earned") using data from GET /api/customer/referral-program/details. 
            ▪ Subtask 12.103.9.5: Provide options to share via social media (basic share buttons). 
        ◦ Task 12.103.10: Implement Referred Customer Incentive Display 
            ▪ Subtask 12.103.10.1: If a user lands via a referral link, display a prominent banner/pop-up (e.g., "Welcome! Your friend [Referrer Name - if available] has given you £10 off your first order!"). 
            ▪ Subtask 12.103.10.2: On the signup form and/or checkout page, add an optional "Referral Code" input field. 
            ▪ Subtask 12.103.10.3: Dynamically update checkout summary to reflect referral discount (if applied). 
        ◦ Task 12.103.11: Implement Referral Notifications 
            ▪ Subtask 12.103.11.1: Integrate with email/notification service (from Epic 9) to send automated emails to referrers when: 
                • A friend signs up using their link/code. 
                • A friend makes a qualifying first purchase (and the reward is issued). 
        ◦ Task 12.103.12: Admin Panel for Referral Program Management 
            ▪ Subtask 12.103.12.1: Create a "Referral Program" section under "Marketing" in the admin panel. 
            ▪ Subtask 12.103.12.2: UI to configure all ReferralProgramConfig parameters (incentives, values, conditions). 
            ▪ Subtask 12.103.12.3: Display a list of all ReferredCustomer entries, with status, referrer, and links to relevant orders/customers. 
            ▪ Subtask 12.103.12.4: (Optional) UI for manual approval/denial of referrals or reward issuance. 
    • Testing Tasks:
        ◦ Task 12.103.13: Write Unit Tests (Backend) 
            ▪ Subtask 12.103.13.1: Unit tests for referral code/link generation. 
            ▪ Subtask 12.103.13.2: Unit tests for referrer/referred reward calculation based on config. 
            ▪ Subtask 12.103.13.3: Unit tests for fraud prevention (self-referral). 
        ◦ Task 12.103.14: Write Integration Tests 
            ▪ Subtask 12.103.14.1: Create referrer1. Get their referral link. 
            ▪ Subtask 12.103.14.2: Simulate a new user clicking referrer1's link. Sign up as referred1. 
            ▪ Subtask 12.103.14.3: Verify referred1 has pending referral status and sees the welcome incentive. 
            ▪ Subtask 12.103.14.4: As referred1, make a qualifying first purchase. 
            ▪ Subtask 12.103.14.5: Verify referrer1 receives their reward (points or voucher) and a notification. 
            ▪ Subtask 12.103.14.6: Verify referred1's status updates. 
            ▪ Subtask 12.103.14.7: Test self-referral attempt. Verify it's blocked. 
            ▪ Subtask 12.103.14.8: Test applying manual referral code at checkout. 
        ◦ Task 12.103.15: Manual End-to-End Testing: 
            ▪ Subtask 12.103.15.1: Admin: Configure referral program: £10 off first order for referred (min £50), 500 loyalty points for referrer. 
            ▪ Subtask 12.103.15.2: Customer A: Log in. Go to "Refer a Friend". Copy unique link. 
            ▪ Subtask 12.103.15.3: Incognito browser: Paste Customer A's link. Sign up as Customer B. Verify welcome message about £10 off. 
            ▪ Subtask 12.103.15.4: As Customer B, add items totaling £60 to cart. Proceed to checkout. Verify £10 discount is applied. Complete purchase. 
            ▪ Subtask 12.103.15.5: As Customer A, log in. Verify notification about new referral/reward. Check points balance and history. Verify 500 points added. 
            ▪ Subtask 12.103.15.6: Admin: Go to "Referral Program". Verify Customer A's referral details are correct, and Customer B's first purchase is logged. 
            ▪ Subtask 12.103.15.7: Attempt to create a new account using a referral code/link where the referrer is the same as the new account being created. Verify error. 
            ▪ Subtask 12.103.15.8: Attempt to manually enter an invalid referral code at checkout. Verify error.
Epic 12: Customer Loyalty & Rewards Program
Story 12.105: Loyalty Program Analytics & Reporting
Story: As a marketing manager, I want access to reports and dashboards that show the performance of the loyalty program, including points earned, redeemed, customer engagement, and referral success, so that I can evaluate its effectiveness, identify trends, and make data-driven decisions to optimize the program.
Acceptance Criteria:
    1. Key Performance Indicators (KPIs) Tracking: 
        ◦ The system tracks and makes available data for key loyalty program KPIs, including: 
            ▪ Total points earned/redeemed (overall and over time). 
            ▪ Average points balance per customer. 
            ▪ Number of active loyalty members (members with a non-zero balance or who have engaged in the program). 
            ▪ Redemption rate (points redeemed / points earned). 
            ▪ Customer Lifetime Value (CLV) of loyalty members vs. non-members. 
            ▪ Purchase frequency of loyalty members vs. non-members. 
            ▪ Average Order Value (AOV) of orders with points redemption vs. without. 
            ▪ (For Referral Program) Number of successful referrals, total rewards issued to referrers/referred. 
    2. Loyalty Dashboard (Admin): 
        ◦ A dedicated dashboard in the admin panel provides a high-level overview of the loyalty program's performance using charts and key metrics. 
        ◦ Allows filtering data by time period (e.g., last 30 days, quarter, year). 
    3. Detailed Loyalty Reports (Admin): 
        ◦ Ability to generate detailed reports on: 
            ▪ Points Activity Report: Breakdown of points earned, redeemed, expired per customer. 
            ▪ Customer Segment Report: Loyalty members by points balance, tiers (if implemented). 
            ▪ Referral Performance Report: Details of each successful referral, referrer, referred customer, and rewards. 
            ▪ (Optional) Redemption Impact Report: Analysis of orders using points vs. non-points orders. 
        ◦ Reports are exportable (e.g., CSV). 
    4. Integration with Existing Analytics (Epic 10): 
        ◦ Loyalty-specific data points are available for broader analysis within the existing Analytics & Business Intelligence infrastructure (from Epic 10). 
        ◦ Potentially extend existing dashboards or data exports to include loyalty metrics. 
    5. Data Accuracy & Timeliness: 
        ◦ Loyalty data displayed in reports and dashboards is accurate and updated in near real-time or through regular batch processing (e.g., daily). 
    6. Secure Access: 
        ◦ Only authorized admin roles can access loyalty program analytics and reports. 

Granular Tasks & Subtasks for Story 12.105:
    • Discovery & Design Tasks:
        ◦ Task 12.105.1: Define Specific KPIs & Metrics 
            ▪ Subtask 12.105.1.1: Collaborate with marketing and business stakeholders to finalize the exact KPIs they need (e.g., specific definitions for "active member," "redemption rate"). 
            ▪ Subtask 12.105.1.2: Identify how to calculate CLV, Purchase Frequency, and AOV in relation to loyalty status. 
        ◦ Task 12.105.2: Design Dashboard & Report Layouts 
            ▪ Subtask 12.105.2.1: Sketch dashboard wireframes for key metrics and charts (e.g., line charts for points earned/redeemed over time, bar charts for redemption rate vs. non-loyalty). 
            ▪ Subtask 12.105.2.2: Define columns and filters for detailed reports. 
    • Backend Tasks (Analytics Service, Loyalty Service, Order Service, Customer Service):
        ◦ Task 12.105.3: Data Point Identification & Logging 
            ▪ Subtask 12.105.3.1: Ensure all relevant loyalty-related events are captured and stored in the database (or analytics data store): 
                • Points Earned (LoyaltyTransaction type EARN). 
                • Points Redeemed (LoyaltyTransaction type REDEEM). 
                • Points Expired (LoyaltyTransaction type EXPIRE). 
                • Loyalty member status change (e.g., CustomerLoyalty creation). 
                • Referral events (from 12.103: click, signup, first purchase, reward issued). 
                • Order associated with loyalty (points earned, points redeemed). 
            ▪ Subtask 12.105.3.2: Ensure Order and Customer records are correctly linked to loyalty data for segmentation (e.g., order.pointsEarned, order.pointsRedeemed, customer.isLoyaltyMember). 
        ◦ Task 12.105.4: Develop Analytics Aggregation Logic 
            ▪ Subtask 12.105.4.1: Create database views or scheduled jobs (e.g., daily) to aggregate loyalty data for reporting. 
            ▪ Subtask 12.105.4.2: Implement calculations for KPIs (e.g., sum points, count unique customers, calculate rates). 
            ▪ Subtask 12.105.4.3: Develop logic to segment customers into "Loyalty Members" vs. "Non-Loyalty Members" for comparative analysis of CLV, AOV, Purchase Frequency. 
        ◦ Task 12.105.5: Implement Loyalty Analytics APIs 
            ▪ Subtask 12.105.5.1: GET /api/admin/analytics/loyalty/kpis: Returns aggregated KPI data for the dashboard (with startDate, endDate filters). 
            ▪ Subtask 12.105.5.2: GET /api/admin/analytics/loyalty/points-activity-report: Returns detailed points transactions (LoyaltyTransaction data) (with filters for customer, type, date range). 
            ▪ Subtask 12.105.5.3: GET /api/admin/analytics/loyalty/referral-performance-report: Returns ReferredCustomer data with referral status and rewards. 
            ▪ Subtask 12.105.5.4: GET /api/admin/analytics/loyalty/customer-segments: Returns customer loyalty status, current points, CLV, AOV, purchase freq (with filtering). 
            ▪ Subtask 12.105.5.5: Implement authentication and authorization for admin endpoints. 
        ◦ Task 12.105.6: Extend Existing Analytics (Epic 10 Integration) 
            ▪ Subtask 12.105.6.1: If applicable, update existing data models or ETL processes (from Epic 10) to include loyalty-specific fields (e.g., customer_is_loyalty_member, order_points_redeemed, order_points_earned). 
            ▪ Subtask 12.105.6.2: Ensure analytics queries can leverage these new fields for cross-functional reporting. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 12.105.7: Develop Loyalty Analytics Dashboard UI 
            ▪ Subtask 12.105.7.1: Create a new section "Loyalty Analytics" under "Analytics" or "Loyalty Program" in the admin panel. 
            ▪ Subtask 12.105.7.2: Display main KPIs (from GET /api/admin/analytics/loyalty/kpis) using clear numerical displays and charts. 
            ▪ Subtask 12.105.7.3: Implement date range filters (e.g., "Last 7 Days," "Last 30 Days," "Custom Range"). 
        ◦ Task 12.105.8: Create Detailed Loyalty Reports UI 
            ▪ Subtask 12.105.8.1: Implement separate tabs or sub-sections for "Points Activity Report," "Referral Performance Report," etc. 
            ▪ Subtask 12.105.8.2: Display tabular data for each report (from respective backend APIs). 
            ▪ Subtask 12.105.8.3: Add filtering options (e.g., by customer ID, referral status, points type). 
            ▪ Subtask 12.105.8.4: Implement "Export to CSV" functionality for each report. 
        ◦ Task 12.105.9: Enhance Customer Analytics View (from Epic 10) 
            ▪ Subtask 12.105.9.1: In the "Customer Details" view in admin, add a summary of loyalty activity (current balance, total earned/redeemed, last loyalty activity). 
    • Testing Tasks:
        ◦ Task 12.105.10: Write Unit Tests (Backend) 
            ▪ Subtask 12.105.10.1: Unit tests for KPI calculation functions. 
            ▪ Subtask 12.105.10.2: Unit tests for data aggregation queries. 
        ◦ Task 12.105.11: Write Integration Tests 
            ▪ Subtask 12.105.11.1: Populate test data with loyalty members, non-members, points earned/redeemed, and successful referrals. 
            ▪ Subtask 12.105.11.2: Call KPI and report APIs with different date ranges and filters. Assert the returned data matches expected calculations. 
            ▪ Subtask 12.105.11.3: Verify data consistency between raw LoyaltyTransaction data and aggregated reports. 
            ▪ Subtask 12.105.11.4: Test CSV export functionality. 
        ◦ Task 12.105.12: Manual End-to-End Testing: 
            ▪ Subtask 12.105.12.1: Perform various customer actions: new sign-ups, multiple purchases (some earning points, some redeeming), referrals. 
            ▪ Subtask 12.105.12.2: Admin: Log in and navigate to the "Loyalty Analytics" dashboard. 
            ▪ Subtask 12.105.12.3: Verify that the overall KPIs (points earned/redeemed, active members) reflect the test activities. 
            ▪ Subtask 12.105.12.4: Apply different date filters and verify data updates. 
            ▪ Subtask 12.105.12.5: Go to "Points Activity Report". Filter by a specific customer. Verify all points transactions are listed correctly. 
            ▪ Subtask 12.105.12.6: Go to "Referral Performance Report". Verify successful referrals and rewards issued are tracked. 
            ▪ Subtask 12.105.12.7: Export reports to CSV and verify data integrity. 
            ▪ Subtask 12.105.12.8: Compare loyalty metrics in the loyalty dashboard with broader customer analytics dashboards (if Epic 10 integration is complete).
Epic 13: Returns Management & RMA
Epic Goal: To streamline the process of managing customer returns, exchanges, and refunds, providing a clear and efficient experience for both customers and operations staff, thereby improving customer satisfaction, reducing operational overhead, and ensuring accurate inventory and financial reconciliation.
Let's begin with the starting point of most returns: Customer Initiated Return Request.
Story 13.101: Customer Initiated Return Request
Story: As a customer, I want to easily initiate a return request for eligible items from my order directly through my account, so that I can provide the necessary details and receive instructions for sending back the merchandise.
Acceptance Criteria:
    1. Online Return Request Form: 
        ◦ Customers can access a "Request a Return" option from their "Order Details" page within their account. 
        ◦ The form allows selecting eligible items from a specific order. 
        ◦ For each selected item, the customer can specify: 
            ▪ Quantity to return. 
            ▪ Return reason (e.g., "Too big," "Defective," "Changed mind," "Wrong item received") from a predefined list. 
            ▪ Return action requested (e.g., "Refund," "Exchange," "Store Credit"). 
            ▪ (Optional) Comments/details regarding the return reason. 
            ▪ (Optional) Upload photos for damaged/defective items. 
    2. Return Eligibility Logic: 
        ◦ Only items from orders that are within a configurable return window (e.g., 30 days from delivery) are eligible for return. 
        ◦ Only items that have not already been returned/refunded are eligible. 
        ◦ Configurable rules can mark certain products/categories as non-returnable (e.g., digital goods, final sale items). 
    3. Return Request Submission & Confirmation: 
        ◦ Upon submission, the return request is formally logged in the system with a unique RMA (Return Merchandise Authorization) number. 
        ◦ The customer receives an immediate on-screen confirmation of their request. 
        ◦ An automated email confirmation is sent to the customer, including the RMA number and next steps. 
    4. Admin Notification: 
        ◦ Operations staff are notified of new return requests (e.g., via email, a notification in the admin panel). 
    5. Return Status Tracking (Basic): 
        ◦ The customer can view the status of their return request in their account (e.g., "Pending Approval," "Approved," "Received," "Refunded"). 
    6. Order-Item Level Return Tracking: 
        ◦ The system associates the return request directly with the specific order and order items being returned. 
    7. International Returns (Basic Consideration): 
        ◦ Initial consideration for international returns (e.g., providing a note about customs documents needed for return, but not necessarily generating return labels yet). 

Granular Tasks & Subtasks for Story 13.101:
    • Discovery & Design Tasks:
        ◦ Task 13.101.1: Define Return Policy Parameters 
            ▪ Subtask 13.101.1.1: Establish the default return window (e.g., X days from delivery date). 
            ▪ Subtask 13.101.1.2: Identify product types/categories that are non-returnable. 
            ▪ Subtask 13.101.1.3: Define standard return reasons and requested actions. 
        ◦ Task 13.101.2: Design Customer Return Request UI 
            ▪ Subtask 13.101.2.1: Sketch the "Request a Return" page layout within the customer account. 
            ▪ Subtask 13.101.2.2: Design the form elements for selecting items, quantities, reasons, and actions. 
            ▪ Subtask 13.101.2.3: Design the confirmation message and email template. 
    • Backend Tasks (Order Service, Customer Service, Returns Service, Admin Service, Notification Service):
        ◦ Task 13.101.3: Implement Return Models 
            ▪ Subtask 13.101.3.1: Create ReturnRequest schema: id (RMA number), customerId, orderId, status (e.g., PENDING, APPROVED, REJECTED, RECEIVED, COMPLETED), requestDate, approvalDate, resolutionDate, notes (admin only). 
            ▪ Subtask 13.101.3.2: Create ReturnItem schema: returnRequestId, orderItemId, productId, sku, quantity, returnReason, requestedAction, photoUrls (array, optional). 
        ◦ Task 13.101.4: Develop Return Eligibility Logic 
            ▪ Subtask 13.101.4.1: Extend Order Service or create a ReturnsEligibilityService to determine if an orderItem is eligible for return: 
                • Check deliveryDate (or orderDate) against configured returnWindowDays. 
                • Check if orderItem is already part of a return. 
                • Check product.isReturnable flag (new field on Product schema). 
                • Check if product.category is excluded from returns. 
        ◦ Task 13.101.5: Implement Return Request Submission API 
            ▪ Subtask 13.101.5.1: POST /api/customer/returns/request: 
                • Accepts orderId and an array of items with orderItemId, quantity, reason, action. 
                • Validates eligibility for each item. 
                • Generates a unique RMA number. 
                • Saves ReturnRequest and ReturnItem records. 
                • Sets initial status to PENDING. 
                • Returns the RMA number and confirmation. 
        ◦ Task 13.101.6: Develop Return Request Status Management 
            ▪ Subtask 13.101.6.1: GET /api/customer/returns/:rmaId: Returns details and status of a specific ReturnRequest. 
            ▪ Subtask 13.101.6.2: GET /api/customer/returns: Returns a list of all ReturnRequest for the logged-in customer. 
        ◦ Task 13.101.7: Integrate with Notification Service 
            ▪ Subtask 13.101.7.1: Trigger SEND_RETURN_REQUEST_CONFIRMATION_EMAIL to customer upon successful submission. 
            ▪ Subtask 13.101.7.2: Trigger SEND_ADMIN_RETURN_REQUEST_NOTIFICATION to operations staff. 
        ◦ Task 13.101.8: Extend Product Schema for Returnability 
            ▪ Subtask 13.101.8.1: Add a boolean field isReturnable to Product schema, defaulting to true. 
            ▪ Subtask 13.101.8.2: (Optional) Add returnPolicy (text field) to Product for specific return instructions. 
    • Frontend Tasks (Customer Account, Admin Panel):
        ◦ Task 13.101.9: Update Customer Order Details Page 
            ▪ Subtask 13.101.9.1: On the "Order Details" page (from Epic 8), add a "Request a Return" button next to eligible orders. 
            ▪ Subtask 13.101.9.2: Implement conditional display based on returnWindowDays and product.isReturnable. 
        ◦ Task 13.101.10: Create Customer Return Request Form UI 
            ▪ Subtask 13.101.10.1: Build the form for selecting items, quantities, reasons (dropdown from predefined list), and requested actions (radio buttons/dropdown). 
            ▪ Subtask 13.101.10.2: Implement logic to dynamically show/hide items based on eligibility. 
            ▪ Subtask 13.101.10.3: Implement photo upload functionality (integrating with image storage service). 
            ▪ Subtask 13.101.10.4: Handle form submission and display immediate confirmation. 
        ◦ Task 13.101.11: Create Customer "My Returns" Page 
            ▪ Subtask 13.101.11.1: Create a new page "My Returns" under the customer's account dashboard. 
            ▪ Subtask 13.101.11.2: Display a list of all ReturnRequest (from GET /api/customer/returns), showing RMA number, order ID, request date, and current status. 
            ▪ Subtask 13.101.11.3: Allow clicking on an RMA number to view detailed status and ReturnItem breakdown (from GET /api/customer/returns/:rmaId). 
        ◦ Task 13.101.12: Update Product Admin for Returnability 
            ▪ Subtask 13.101.12.1: In the "Add/Edit Product" form, add a checkbox for Is Returnable. 
            ▪ Subtask 13.101.12.2: (Optional) Add a text area for Return Policy specific to the product. 
        ◦ Task 13.101.13: Basic Admin View for New Return Requests 
            ▪ Subtask 13.101.13.1: Create a basic list view in the admin panel (e.g., under "Orders" or a new "Returns" section) showing PENDING return requests. 
    • Testing Tasks:
        ◦ Task 13.101.14: Write Unit Tests (Backend) 
            ▪ Subtask 13.101.14.1: Unit tests for ReturnsEligibilityService (e.g., within/outside window, non-returnable product). 
            ▪ Subtask 13.101.14.2: Unit tests for RMA number generation. 
            ▪ Subtask 13.101.14.3: Unit tests for POST /api/customer/returns/request with valid/invalid data. 
        ◦ Task 13.101.15: Write Integration Tests 
            ▪ Subtask 13.101.15.1: Create a test order with multiple items. 
            ▪ Subtask 13.101.15.2: Simulate a customer initiating a return for some items. Verify ReturnRequest and ReturnItem records are created correctly. 
            ▪ Subtask 13.101.15.3: Verify email notifications are triggered. 
            ▪ Subtask 13.101.15.4: Attempt to return an item outside the return window. Verify it's blocked. 
            ▪ Subtask 13.101.15.5: Mark a product as non-returnable. Attempt to return it. Verify it's blocked. 
        ◦ Task 13.101.16: Manual End-to-End Testing: 
            ▪ Subtask 13.101.16.1: Customer: Log in. Place an order. Mark it as "delivered" (or simulate delivery date). 
            ▪ Subtask 13.101.16.2: Go to "My Orders". Select the recent order. Click "Request a Return". 
            ▪ Subtask 13.101.16.3: Select 1 item, reason "Damaged", action "Refund". Submit. Verify on-screen confirmation with RMA. 
            ▪ Subtask 13.101.16.4: Check email for confirmation. 
            ▪ Subtask 13.101.16.5: Go to "My Returns" page. Verify the request is listed with "Pending Approval" status. 
            ▪ Subtask 13.101.16.6: Admin: Log in. Check for new return request notifications. Go to the admin "Returns" list. Verify the new request is there. 
            ▪ Subtask 13.101.16.7: Try to initiate a return for an order that's too old or for a non-returnable product. Verify appropriate error messages. 
            ▪ Subtask 13.101.16.8: (If photo upload) Upload a test photo during request and verify it's associated.
Epic 13: Returns Management & RMA
Story 13.102: Admin Return Request Approval & Processing
Story: As an operations staff member, I want to review, approve, or reject customer return requests, provide specific return instructions, and manage their status, so that I can efficiently process returns and ensure customers receive clear guidance.
Acceptance Criteria:
    1. Admin Return Request List: 
        ◦ A dedicated section in the admin panel lists all return requests, with filtering capabilities by status (e.g., "Pending Approval," "Approved," "Rejected"), customer, and RMA number. 
        ◦ Key information visible at a glance: RMA number, customer, order ID, request date, current status. 
    2. Admin Return Request Detail View: 
        ◦ Clicking on a return request in the list opens a detailed view showing: 
            ▪ All ReturnRequest and ReturnItem details (from 13.101). 
            ▪ Customer information and linked order details. 
            ▪ (If photos uploaded) Ability to view uploaded photos. 
            ▪ An audit log of status changes and actions taken on the return request. 
    3. Approve/Reject Workflow: 
        ◦ Approve: 
            ▪ Option to "Approve" the entire return request or individual ReturnItems within the request. 
            ▪ When approving, ability to: 
                • Add internal notes (not visible to customer). 
                • Add customer-facing instructions (e.g., "Package securely," "Ship to address X," "Include original packaging"). 
                • Select return shipping method (e.g., customer responsible for shipping, pre-paid label - actual label generation is 13.104). 
            ▪ Changes ReturnRequest status to "Approved". 
        ◦ Reject: 
            ▪ Option to "Reject" the entire return request or individual ReturnItems. 
            ▪ When rejecting, ability to: 
                • Provide a mandatory reason for rejection (visible to customer). 
                • Add internal notes. 
            ▪ Changes ReturnRequest status to "Rejected". 
    4. Automated Status Updates: 
        ◦ The system automatically updates the ReturnRequest status based on admin actions. 
    5. Customer Communication: 
        ◦ Automated email notifications are sent to the customer upon: 
            ▪ Approval: Including RMA number, approved items, return instructions, and a link to their "My Returns" page. 
            ▪ Rejection: Including RMA number, rejected items, and the reason for rejection. 
    6. Search & Filtering: 
        ◦ Admin can search for returns by RMA number, order ID, or customer name/email. 
    7. Bulk Actions (Optional): 
        ◦ Ability to approve/reject multiple pending requests (e.g., all valid, low-risk requests). 

Granular Tasks & Subtasks for Story 13.102:
    • Backend Tasks (Returns Service, Admin Service, Notification Service):
        ◦ Task 13.102.1: Enhance Return Request Status Management API 
            ▪ Subtask 13.102.1.1: PUT /api/admin/returns/:rmaId/status: 
                • Accepts newStatus (e.g., APPROVED, REJECTED). 
                • Accepts internalNotes, customerInstructions (for APPROVED), rejectionReason (for REJECTED). 
                • Validates status transitions (e.g., can't go from REJECTED to APPROVED directly). 
                • Updates ReturnRequest record. 
                • (Optional) Accepts specific returnItemIds for partial approval/rejection. 
                • Returns updated ReturnRequest details. 
            ▪ Subtask 13.102.1.2: Implement GET /api/admin/returns (list all returns) and GET /api/admin/returns/:rmaId (single return detail) APIs with necessary filters and sorting. 
        ◦ Task 13.102.2: Implement Audit Logging for Returns 
            ▪ Subtask 13.102.2.1: Enhance ReturnRequest schema or create a ReturnAuditLog schema to record: rmaId, action (e.g., STATUS_CHANGE), oldStatus, newStatus, actorId (admin user), timestamp, notes (internal). 
            ▪ Subtask 13.102.2.2: Ensure PUT /api/admin/returns/:rmaId/status creates audit log entries. 
        ◦ Task 13.102.3: Integrate with Notification Service for Admin Actions 
            ▪ Subtask 13.102.3.1: Trigger SEND_RETURN_APPROVAL_EMAIL or SEND_RETURN_REJECTION_EMAIL based on status update, passing relevant ReturnRequest data (RMA, items, instructions/rejection reason). 
        ◦ Task 13.102.4: Define Admin Return Instructions/Rejection Reasons 
            ▪ Subtask 13.102.4.1: Create a simple schema for ReturnReason and ReturnInstructionTemplate (e.g., IDs, localized text). 
            ▪ Subtask 13.102.4.2: APIs to manage these templates in admin. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 13.102.5: Develop Admin "Returns" List View 
            ▪ Subtask 13.102.5.1: Create a new top-level menu item "Returns" in the admin dashboard. 
            ▪ Subtask 13.102.5.2: Display a table of ReturnRequest (from GET /api/admin/returns). 
            ▪ Subtask 13.102.5.3: Implement filtering by status, customer, order ID, and RMA number. 
            ▪ Subtask 13.102.5.4: Add sorting capabilities. 
            ▪ Subtask 13.102.5.5: Link each RMA number to the detailed view. 
        ◦ Task 13.102.6: Develop Admin Return Request Detail View UI 
            ▪ Subtask 13.102.6.1: Build the UI for GET /api/admin/returns/:rmaId. 
            ▪ Subtask 13.102.6.2: Display ReturnRequest header information (RMA, status, dates). 
            ▪ Subtask 13.102.6.3: Display ReturnItem details in a table, including quantity, reason, requested action, and links to product/order item. 
            ▪ Subtask 13.102.6.4: Integrate photo display component for uploaded images. 
            ▪ Subtask 13.102.6.5: Display customer and order summary. 
            ▪ Subtask 13.102.6.6: Display the audit log of status changes. 
        ◦ Task 13.102.7: Implement Approve/Reject Action Forms 
            ▪ Subtask 13.102.7.1: Add "Approve" and "Reject" buttons to the detailed view. 
            ▪ Subtask 13.102.7.2: For "Approve": 
                • A modal/form for internalNotes and customerInstructions (with template selection). 
                • Confirmation of selected items/quantities. 
                • Button to call PUT /api/admin/returns/:rmaId/status with newStatus: 'APPROVED'. 
            ▪ Subtask 13.102.7.3: For "Reject": 
                • A modal/form for rejectionReason (mandatory, with predefined options) and internalNotes. 
                • Confirmation. 
                • Button to call PUT /api/admin/returns/:rmaId/status with newStatus: 'REJECTED'. 
        ◦ Task 13.102.8: Update Customer "My Returns" Page (from 13.101) 
            ▪ Subtask 13.102.8.1: Ensure the customer's return list and detail view correctly reflect the APPROVED or REJECTED status. 
            ▪ Subtask 13.102.8.2: Display customerInstructions if approved, or rejectionReason if rejected. 
    • Testing Tasks:
        ◦ Task 13.102.9: Write Unit Tests (Backend) 
            ▪ Subtask 13.102.9.1: Unit tests for PUT /api/admin/returns/:rmaId/status for valid and invalid status transitions. 
            ▪ Subtask 13.102.9.2: Unit tests for audit log creation. 
        ◦ Task 13.102.10: Write Integration Tests 
            ▪ Subtask 13.102.10.1: Customer initiates a return (from 13.101). 
            ▪ Subtask 13.102.10.2: Admin user approves the request. Verify status change, audit log, and email sent to customer. 
            ▪ Subtask 13.102.10.3: Admin user rejects a different request. Verify status change, audit log, and email sent with rejection reason. 
            ▪ Subtask 13.102.10.4: Verify admin can view all return requests with correct filters. 
            ▪ Subtask 13.102.10.5: Verify customer can see the updated status and instructions/reason on their "My Returns" page. 
        ◦ Task 13.102.11: Manual End-to-End Testing: 
            ▪ Subtask 13.102.11.1: Customer A: Initiate a return for Order 1, Item X, reason "Damaged", action "Refund". 
            ▪ Subtask 13.102.11.2: Customer B: Initiate a return for Order 2, Item Y, reason "Changed mind", action "Store Credit". 
            ▪ Subtask 13.102.11.3: Admin: Go to "Returns" list. Verify both requests are PENDING. Filter by status, customer, order ID. 
            ▪ Subtask 13.102.11.4: Admin: Open Customer A's request. Review details. Click "Approve". Add internal note "Customer reported damage", customer instruction "Please send back in original packaging". Confirm. 
            ▪ Subtask 13.102.11.5: Customer A: Check email for approval notification. Go to "My Returns" page. Verify status is APPROVED and instructions are visible. 
            ▪ Subtask 13.102.11.6: Admin: Open Customer B's request. Click "Reject". Select reason "Outside return window". Add internal note. Confirm. 
            ▪ Subtask 13.102.11.7: Customer B: Check email for rejection notification. Go to "My Returns" page. Verify status is REJECTED and rejection reason is visible. 
            ▪ Subtask 13.102.11.8: Admin: Check the audit log for both requests.
Epic 13: Returns Management & RMA
Story 13.103: Inventory & Financial Reconciliation for Returns
Story: As an operations staff member, I want to confirm the receipt and condition of returned items, then process refunds or issue store credit accordingly, and ensure inventory levels are accurately adjusted, so that financial records are correct and stock is updated for resale.
Acceptance Criteria:
    1. Return Item Receipt & Inspection (Admin): 
        ◦ In the admin panel, for an APPROVED return request, operations staff can mark individual ReturnItems as "Received". 
        ◦ When marking as "Received", ability to specify the condition of the returned item (e.g., "Resalable," "Damaged," "Defective"). 
        ◦ (Optional) Ability to upload photos of the received condition. 
    2. Inventory Adjustment: 
        ◦ When a ReturnItem is marked as "Received" and its condition is "Resalable", the system automatically adds the item back to available inventory. 
        ◦ If the condition is "Damaged" or "Defective", the item is returned to a separate "Quarantine" or "Non-Resalable" inventory location, or marked for scrap/disposal, without increasing available stock. 
        ◦ Inventory adjustments are logged with the RMA number. 
    3. Financial Reconciliation Options: 
        ◦ Based on the customer's requestedAction (Refund, Exchange, Store Credit) and the item's condition, the system facilitates the appropriate financial action: 
            ▪ Refund: Process a partial or full refund to the original payment method (minus shipping/restocking fees if applicable). 
            ▪ Store Credit: Issue store credit to the customer's account (from Epic 6, if implemented). 
            ▪ Exchange: Marks for exchange processing (handled further in 13.106). 
    4. Integration with Payment Gateway/Accounting: 
        ◦ Refunds: The system integrates with the payment gateway (from Epic 5) to initiate the refund transaction. 
        ◦ Store Credit: The system integrates with the customer account/wallet (from Epic 6) to add store credit. 
        ◦ All financial transactions (refunds, store credit) are logged and available for export to accounting systems. 
    5. Shipping & Restocking Fee Handling: 
        ◦ Admin can optionally deduct return shipping costs or restocking fees from the refund/store credit amount based on configurable rules (e.g., only if "Changed mind"). 
    6. Return Status Progression: 
        ◦ ReturnRequest status changes to "Received" when any item from the request is marked as received. 
        ◦ ReturnRequest status changes to "Completed" when all items are received and financial/inventory actions are finalized for the entire request. 
        ◦ Individual ReturnItem status can also track progress (e.g., "Received - Resalable", "Refunded"). 
    7. Customer Notification (upon completion): 
        ◦ Automated email notification to the customer when their refund or store credit is processed. 
    8. Audit Trail: 
        ◦ Comprehensive logging of all receipt, inspection, inventory, and financial actions taken on a return request. 

Granular Tasks & Subtasks for Story 13.103:
    • Discovery & Design Tasks:
        ◦ Task 13.103.1: Define Return Disposition & Inventory Locations 
            ▪ Subtask 13.103.1.1: Determine possible conditions for returned items (e.g., New, Used-Good, Damaged, Defective). 
            ▪ Subtask 13.103.1.2: Map conditions to inventory actions (e.g., "New" -> available_stock, "Damaged" -> quarantine_stock). 
        ◦ Task 13.103.2: Clarify Refund/Credit Rules 
            ▪ Subtask 13.103.2.1: Define if return shipping costs or restocking fees will be deducted. 
            ▪ Subtask 13.103.2.2: Specify how these deductions are calculated. 
        ◦ Task 13.103.3: Plan Admin UI for Return Processing 
            ▪ Subtask 13.103.3.1: Sketch the interface for marking items as received, selecting condition, and initiating financial actions within the ReturnRequest detail view. 
    • Backend Tasks (Returns Service, Inventory Service, Payment Gateway Service, Customer Service, Accounting Service):
        ◦ Task 13.103.4: Enhance ReturnItem Schema & Statuses 
            ▪ Subtask 13.103.4.1: Add receivedCondition (e.g., RESALABLE, DAMAGED, DEFECTIVE) to ReturnItem. 
            ▪ Subtask 13.103.4.2: Add isReceived (boolean) and isProcessed (boolean) to ReturnItem. 
            ▪ Subtask 13.103.4.3: Add refundAmount or storeCreditAmount to ReturnItem and ReturnRequest. 
        ◦ Task 13.103.5: Implement Item Receipt & Condition Recording API 
            ▪ Subtask 13.103.5.1: PUT /api/admin/returns/:rmaId/receive-item: 
                • Accepts returnItemId, receivedCondition. 
                • Updates ReturnItem status to isReceived: true. 
                • Triggers Inventory Service call (see next task). 
                • Updates ReturnRequest status if all items are received. 
                • Adds audit log entry. 
        ◦ Task 13.103.6: Integrate with Inventory Service for Returns 
            ▪ Subtask 13.103.6.1: Modify Inventory Service (from Epic 2) to expose an addReturnedStock(productId, quantity, locationType) method. 
            ▪ Subtask 13.103.6.2: From PUT /api/admin/returns/:rmaId/receive-item, call addReturnedStock: 
                • If receivedCondition is RESALABLE, add to available_stock. 
                • If receivedCondition is DAMAGED or DEFECTIVE, add to quarantine_stock. 
            ▪ Subtask 13.103.6.3: Log inventory adjustment with rmaId reference. 
        ◦ Task 13.103.7: Implement Financial Reconciliation API 
            ▪ Subtask 13.103.7.1: POST /api/admin/returns/:rmaId/process-financial: 
                • Validates all items are received. 
                • Calculates total refund/store credit amount, applying any deductions (shipping, restocking fees). 
                • Based on requestedAction for each item: 
                    ◦ If REFUND: Calls Payment Gateway Service.processRefund(originalTransactionId, amount). 
                    ◦ If STORE_CREDIT: Calls Customer Service.addStoreCredit(customerId, amount) (from Epic 6). 
                    ◦ If EXCHANGE: Marks ReturnRequest as PENDING_EXCHANGE (details in 13.106). 
                • Updates ReturnRequest status to COMPLETED (or PENDING_EXCHANGE). 
                • Creates financial log entries. 
                • Adds audit log entry. 
        ◦ Task 13.103.8: Develop Accounting Integration Hooks 
            ▪ Subtask 13.103.8.1: Create event listeners or data exports for successful refunds and store credit issuances, to be consumed by an external accounting system (from Epic 10, if applicable). 
        ◦ Task 13.103.9: Integrate with Notification Service for Completion 
            ▪ Subtask 13.103.9.1: Trigger SEND_RETURN_COMPLETED_EMAIL to customer upon successful financial processing, including details of refund/credit amount. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 13.103.10: Enhance Admin Return Request Detail View UI (from 13.102) 
            ▪ Subtask 13.103.10.1: For each ReturnItem in the detail view: 
                • Add a checkbox/button "Mark as Received". 
                • Add a dropdown for "Condition" (Resalable, Damaged, Defective) that appears upon marking as received. 
                • (Optional) File upload for condition photos. 
                • Display isReceived status and receivedCondition. 
            ▪ Subtask 13.103.10.2: Add a section for "Financial Processing": 
                • Display calculated refundAmount or storeCreditAmount based on received items and rules. 
                • Input fields for optional deductions (e.g., restocking fee). 
                • A button "Process Refund / Issue Store Credit" (calls POST /api/admin/returns/:rmaId/process-financial). 
            ▪ Subtask 13.103.10.3: Update overall ReturnRequest status display. 
            ▪ Subtask 13.103.10.4: Ensure audit log updates are visible. 
    • Testing Tasks:
        ◦ Task 13.103.11: Write Unit Tests (Backend) 
            ▪ Subtask 13.103.11.1: Unit tests for addReturnedStock with different conditions. 
            ▪ Subtask 13.103.11.2: Unit tests for refund/store credit calculation, including deductions. 
            ▪ Subtask 13.103.11.3: Unit tests for calling payment gateway refund API (mocking external call). 
        ◦ Task 13.103.12: Write Integration Tests 
            ▪ Subtask 13.103.12.1: Customer initiates a return (13.101). Admin approves (13.102). 
            ▪ Subtask 13.103.12.2: Admin marks items as received: 
                • One item as "Resalable". Verify inventory increases for that SKU. 
                • Another item as "Damaged". Verify inventory does not increase for available stock, but is logged as quarantine. 
            ▪ Subtask 13.103.12.3: Admin processes refund. Verify ReturnRequest status changes to COMPLETED. Verify refund transaction is logged. 
            ▪ Subtask 13.103.12.4: Admin processes store credit. Verify customer's store credit balance increases. 
            ▪ Subtask 13.103.12.5: Verify customer receives notification of completion. 
            ▪ Subtask 13.103.12.6: Test partial returns where only some items are processed. 
        ◦ Task 13.103.13: Manual End-to-End Testing: 
            ▪ Subtask 13.103.13.1: Create an order for a customer. Make sure it's paid. 
            ▪ Subtask 13.103.13.2: Customer initiates a return for 2 items from that order, requesting "Refund". 
            ▪ Subtask 13.103.13.3: Admin: Approve the return request. 
            ▪ Subtask 13.103.13.4: Admin: In the ReturnRequest detail view, mark Item 1 as "Received", condition "Resalable". Verify inventory for Item 1 increases. 
            ▪ Subtask 13.103.13.5: Admin: Mark Item 2 as "Received", condition "Damaged". Verify inventory for Item 2 does not increase in available stock. 
            ▪ Subtask 13.103.13.6: Admin: Click "Process Refund". Verify the calculated refund amount. Add a restocking fee. Process. 
            ▪ Subtask 13.103.13.7: Verify the ReturnRequest status is COMPLETED. 
            ▪ Subtask 13.103.13.8: Customer: Verify they received a "Return Completed" email with refund details. Check bank statement (if possible with mock payment gateway). 
            ▪ Subtask 13.103.13.9: Repeat for a "Store Credit" request, verifying customer's store credit balance. 
            ▪ Subtask 13.103.13.10: Admin: Check audit logs for all steps.
Epic 13: Returns Management & RMA
Story 13.104: Return Shipping Label Generation
Story: As an operations staff member, I want to be able to generate return shipping labels for approved return requests, and as a customer, I want to easily access and print these labels, so that the return process is smoother and customers can send back items conveniently.
Acceptance Criteria:
    1. Automated Return Label Generation (Admin Triggered): 
        ◦ For an APPROVED ReturnRequest, operations staff can trigger the generation of a return shipping label from the admin panel. 
        ◦ The system integrates with a chosen shipping carrier's API (e.g., USPS, Royal Mail, DPD, carrier previously used for outbound from Epic 8/11) to generate the label. 
        ◦ The label includes necessary sender/recipient addresses, return RMA number, and package details (weight, dimensions from original order or estimated). 
        ◦ The generated label is stored and linked to the ReturnRequest. 
    2. Return Shipping Cost Handling: 
        ◦ The system can: 
            ▪ Generate pre-paid labels: Cost is borne by the merchant. 
            ▪ Generate customer-paid labels: The customer is responsible for purchasing/arranging shipping, or the system can provide an estimated cost for customer to pay at a drop-off point. Focus on merchant-paid/pre-paid labels for initial implementation. 
        ◦ The cost of the generated return label is recorded for accounting purposes. 
    3. Customer Access to Return Label: 
        ◦ Once generated, the customer receives an automated email notification with the return label (e.g., PDF attachment) and instructions. 
        ◦ The customer can also download the return label directly from their "My Returns" section in their account. 
    4. Return Tracking Number: 
        ◦ A unique tracking number is generated for the return shipment. 
        ◦ This tracking number is available to the customer in their account and in the notification email. 
        ◦ Operations staff can view the return tracking status in the admin panel. 
    5. Admin Label Management: 
        ◦ Admin users can view, re-download, or (optionally) regenerate a return label for an APPROVED request. 
        ◦ Admin dashboard should clearly indicate if a return label has been generated for a request. 
    6. Configurable Carrier & Service: 
        ◦ Admin can configure which carrier and service type to use for return labels (e.g., standard ground, specific pickup points). 
    7. Error Handling: 
        ◦ System provides clear error messages if label generation fails (e.g., invalid address, carrier API issues). 

Granular Tasks & Subtasks for Story 13.104:
    • Discovery & Design Tasks:
        ◦ Task 13.104.1: Select Return Shipping Carrier(s) 
            ▪ Subtask 13.104.1.1: Determine which carriers will be used for return labels. Prioritize carriers already integrated for outbound shipping (from Epic 8/11) that offer return label services. 
            ▪ Subtask 13.104.1.2: Obtain necessary API credentials for return label generation. 
            ▪ Subtask 13.104.1.3: Review carrier API documentation for return label creation, package validation, and tracking. 
        ◦ Task 13.104.2: Define Return Label Policy 
            ▪ Subtask 13.104.2.1: Decide whether return labels will always be pre-paid by merchant, or if customer-paid options will be available. (Start with merchant-paid). 
            ▪ Subtask 13.104.2.2: Identify default return addresses (warehouses/RMA centers). 
    • Backend Tasks (Returns Service, Shipping Service, Notification Service, Admin Service):
        ◦ Task 13.104.3: Enhance ReturnRequest Model 
            ▪ Subtask 13.104.3.1: Add fields to ReturnRequest: returnLabelUrl (link to stored PDF), returnTrackingNumber, returnCarrier, labelCost (if applicable). 
        ◦ Task 13.104.4: Develop Return Label Generation API 
            ▪ Subtask 13.104.4.1: POST /api/admin/returns/:rmaId/generate-label: 
                • Accepts rmaId. 
                • Retrieves ReturnRequest and associated ReturnItem details (products, original weight, dimensions). 
                • Constructs package details for carrier API call. 
                • Calls Shipping Service (see next task) to generate label. 
                • If successful: Stores returnLabelUrl, returnTrackingNumber, returnCarrier, labelCost on ReturnRequest. 
                • Updates ReturnRequest status (e.g., LABEL_GENERATED). 
                • Triggers SEND_RETURN_LABEL_EMAIL notification. 
                • Returns confirmation and label details. 
        ◦ Task 13.104.5: Integrate with Shipping Carrier APIs for Returns 
            ▪ Subtask 13.104.5.1: Extend Shipping Service (from Epic 8/11) to include a generateReturnLabel method: 
                • Inputs: originAddress, destinationAddress (return warehouse), packageDetails, carrierServiceType. 
                • Outputs: labelPDF (binary/URL), trackingNumber, cost. 
            ▪ Subtask 13.104.5.2: Implement logic to handle different carrier API responses for return labels. 
            ▪ Subtask 13.104.5.3: Implement secure storage for generated label PDFs (e.g., cloud storage like S3). 
        ◦ Task 13.104.6: Implement Return Tracking Updates 
            ▪ Subtask 13.104.6.1: Develop a mechanism (e.g., webhook listener from carrier, scheduled job polling) to receive/fetch tracking updates for returnTrackingNumber. 
            ▪ Subtask 13.104.6.2: Update ReturnRequest status (e.g., from LABEL_GENERATED to IN_TRANSIT to DELIVERED_TO_WAREHOUSE) based on tracking events. 
            ▪ Subtask 13.104.6.3: Add returnTrackingHistory to ReturnRequest for detailed tracking events. 
        ◦ Task 13.104.7: Integrate with Notification Service for Label 
            ▪ Subtask 13.104.7.1: Create an email template for "Your Return Label Has Been Generated". 
            ▪ Subtask 13.104.7.2: Ensure SEND_RETURN_LABEL_EMAIL (triggered by 13.104.4) sends the email with the returnLabelUrl and returnTrackingNumber. 
    • Frontend Tasks (Admin Panel, Customer Account):
        ◦ Task 13.104.8: Enhance Admin Return Request Detail View UI (from 13.102/13.103) 
            ▪ Subtask 13.104.8.1: In the APPROVED return request detail view, add a "Generate Return Label" button. 
            ▪ Subtask 13.104.8.2: Once generated, display returnLabelUrl (as a download link) and returnTrackingNumber. 
            ▪ Subtask 13.104.8.3: Display the current returnTrackingHistory in a simple feed. 
            ▪ Subtask 13.104.8.4: (Optional) Add a "Regenerate Label" button. 
        ◦ Task 13.104.9: Update Customer "My Returns" Page (from 13.101/13.102) 
            ▪ Subtask 13.104.9.1: For APPROVED returns, once a label is generated, display a prominent "Download Return Label" button. 
            ▪ Subtask 13.104.9.2: Display the returnTrackingNumber and a direct link to the carrier's tracking page. 
            ▪ Subtask 13.104.9.3: Update the overall return status (e.g., LABEL_GENERATED, IN_TRANSIT). 
    • Testing Tasks:
        ◦ Task 13.104.10: Write Unit Tests (Backend) 
            ▪ Subtask 13.104.10.1: Unit tests for generateReturnLabel method in Shipping Service (mocking carrier API response). 
            ▪ Subtask 13.104.10.2: Unit tests for label data storage and retrieval. 
        ◦ Task 13.104.11: Write Integration Tests 
            ▪ Subtask 13.104.11.1: Customer initiates a return (13.101). Admin approves (13.102). 
            ▪ Subtask 13.104.11.2: Admin triggers label generation for the approved request. Verify label data (URL, tracking number) is stored on ReturnRequest. 
            ▪ Subtask 13.104.11.3: Verify email with label is sent to customer. 
            ▪ Subtask 13.104.11.4: Verify customer can download the label from their account. 
            ▪ Subtask 13.104.11.5: Simulate tracking updates. Verify ReturnRequest status progresses. 
        ◦ Task 13.104.12: Manual End-to-End Testing: 
            ▪ Subtask 13.104.12.1: Customer A: Initiate a return request for an item. 
            ▪ Subtask 13.104.12.2: Admin: Approve the return request. 
            ▪ Subtask 13.104.12.3: Admin: On the return detail page, click "Generate Return Label". 
            ▪ Subtask 13.104.12.4: Verify a label URL appears. Download the label (PDF). Verify it's correctly formatted. 
            ▪ Subtask 13.104.12.5: Verify a return tracking number is displayed in admin. 
            ▪ Subtask 13.104.12.6: Customer A: Check email. Verify "Your Return Label" email is received with the label attached/linked. 
            ▪ Subtask 13.104.12.7: Customer A: Go to "My Returns" page. Verify "Download Label" button and tracking number/link are present. Click tracking link to verify it opens carrier's tracking page. 
            ▪ Subtask 13.104.12.8: Admin: In the background, manually update the return's tracking status in the database to simulate "in transit" and "delivered". 
            ▪ Subtask 13.104.12.9: Customer A: Refresh "My Returns" page. Verify the status updates accordingly.
Epic 13: Returns Management & RMA
Story 13.105: Automated Return Status Updates & Notifications
Story: As a customer, I want to receive automated updates and notifications regarding the status of my return request, and be able to see the latest status in my account, so that I am always informed about where my return is in the process without needing to contact customer service.
Acceptance Criteria:
    1. Defined Return Status Flow: 
        ◦ A clear and logical progression of ReturnRequest statuses is established and used throughout the system (e.g., PENDING_APPROVAL -> APPROVED -> LABEL_GENERATED -> IN_TRANSIT -> DELIVERED_TO_WAREHOUSE -> RECEIVED_AT_WAREHOUSE -> PROCESSING_REFUND/CREDIT/EXCHANGE -> COMPLETED/REFUNDED/CREDITED/EXCHANGED -> REJECTED). 
    2. Automated Email Notifications for Key Status Changes: 
        ◦ Customers receive an automated email notification for each significant status change of their return request: 
            ▪ Request Submitted: (Already covered in 13.101) 
            ▪ Approved: (Already covered in 13.102) 
            ▪ Rejected: (Already covered in 13.102) 
            ▪ Label Generated: (Already covered in 13.104) 
            ▪ Received at Warehouse: Sent when ReturnRequest status changes to DELIVERED_TO_WAREHOUSE or RECEIVED_AT_WAREHOUSE. 
            ▪ Refund/Store Credit Processed: (Already covered in 13.103 - for COMPLETED/REFUNDED/CREDITED). 
            ▪ (Optional) Exchange Initiated/Shipped: (To be covered in 13.106). 
        ◦ Each email clearly states the new status, the RMA number, and a link to the customer's "My Returns" page for more details. 
    3. Real-time Customer-Facing Status Display: 
        ◦ The customer's "My Returns" page (from 13.101) and the individual ReturnRequest detail page within their account prominently display the current status. 
        ◦ The display should be dynamic, updating as the ReturnRequest status changes in the backend. 
        ◦ (Optional) A simple timeline or progress bar visualizing the return journey. 
    4. Integration with Return Tracking (from 13.104): 
        ◦ When ReturnRequest status becomes IN_TRANSIT (via carrier tracking updates from 13.104), the customer's view updates accordingly. 
        ◦ The direct link to the carrier's tracking page remains visible. 
    5. Admin View of Notification History: 
        ◦ Operations staff can see a log of all notifications sent for a specific ReturnRequest in the admin detail view. 
    6. Configurable Notification Settings: 
        ◦ Admin can enable/disable specific types of return notifications. 

Granular Tasks & Subtasks for Story 13.105:
    • Discovery & Design Tasks:
        ◦ Task 13.105.1: Finalize Return Status Definitions & Flow 
            ▪ Subtask 13.105.1.1: Map out all possible ReturnRequest statuses and their allowed transitions. 
            ▪ Subtask 13.105.1.2: Define which specific events trigger which status changes. 
        ◦ Task 13.105.2: Design Email Templates for Each Status 
            ▪ Subtask 13.105.2.1: Create clear and concise email content for "Return Received," "Exchange Initiated," etc. 
            ▪ Subtask 13.105.2.2: Ensure all templates include RMA, linked items, and a clear call to action to check "My Returns" page. 
        ◦ Task 13.105.3: Design Customer UI Progress Indicator (Optional but Recommended) 
            ▪ Subtask 13.105.3.1: Sketch a visual representation of the return journey (e.g., a multi-step progress bar on the "My Returns" detail page). 
    • Backend Tasks (Returns Service, Notification Service):
        ◦ Task 13.105.4: Implement Centralized Status Update Logic 
            ▪ Subtask 13.105.4.1: Refactor ReturnRequest status updates (from 13.102, 13.103, 13.104) to go through a single ReturnsService.updateReturnStatus(rmaId, newStatus, details) method. 
            ▪ Subtask 13.105.4.2: Within this method, implement logic to: 
                • Validate newStatus against current status and allowed transitions. 
                • Update ReturnRequest.status. 
                • Create an audit log entry (from 13.102). 
                • Trigger the appropriate notification event. 
        ◦ Task 13.105.5: Integrate with Notification Service for New Statuses 
            ▪ Subtask 13.105.5.1: Create new notification event types for each new return status (e.g., RETURN_RECEIVED_AT_WAREHOUSE_EVENT). 
            ▪ Subtask 13.105.5.2: Configure Notification Service (from Epic 9) to send the corresponding email template for these events. 
            ▪ Subtask 13.105.5.3: Ensure email content is dynamic and includes all necessary ReturnRequest data. 
        ◦ Task 13.105.6: Enhance Return Tracking Update Listener (from 13.104) 
            ▪ Subtask 13.105.6.1: Ensure the webhook/polling listener for return tracking numbers correctly maps carrier tracking events (e.g., "Out for Delivery," "Delivered") to internal ReturnRequest statuses (e.g., IN_TRANSIT, DELIVERED_TO_WAREHOUSE). 
            ▪ Subtask 13.105.6.2: Ensure these status changes go through the centralized updateReturnStatus method (Task 13.105.4). 
        ◦ Task 13.105.7: Develop Admin API for Notification Configuration 
            ▪ Subtask 13.105.7.1: PUT /api/admin/returns/notifications/config: Allows enabling/disabling specific return notification types. 
    • Frontend Tasks (Customer Account, Admin Panel):
        ◦ Task 13.105.8: Update Customer "My Returns" Status Display 
            ▪ Subtask 13.105.8.1: On the customer's "My Returns" list page, ensure the status column always reflects the current ReturnRequest.status. 
            ▪ Subtask 13.105.8.2: On the individual ReturnRequest detail page, prominently display the currentStatus. 
            ▪ Subtask 13.105.8.3: (Optional) Implement the visual progress bar/timeline based on ReturnRequest.status and ReturnAuditLog data. 
            ▪ Subtask 13.105.8.4: Ensure tracking information from 13.104 (returnTrackingNumber, carrier link) is always visible when applicable. 
        ◦ Task 13.105.9: Develop Admin Notification Settings UI 
            ▪ Subtask 13.105.9.1: In the admin panel, under "Settings" or "Returns," create a "Notification Settings" page for returns. 
            ▪ Subtask 13.105.9.2: Provide checkboxes/toggles for each return notification type (e.g., "Send 'Return Approved' email," "Send 'Return Received' email"). 
            ▪ Subtask 13.105.9.3: Link this UI to PUT /api/admin/returns/notifications/config. 
        ◦ Task 13.105.10: Enhance Admin Return Detail View with Notification History 
            ▪ Subtask 13.105.10.1: In the admin ReturnRequest detail view, add a section displaying a log of all emails/notifications sent for that specific return. 
    • Testing Tasks:
        ◦ Task 13.105.11: Write Unit Tests (Backend) 
            ▪ Subtask 13.105.11.1: Unit tests for updateReturnStatus to ensure correct status transitions and audit logging. 
            ▪ Subtask 13.105.11.2: Unit tests for notification triggering logic based on status changes. 
        ◦ Task 13.105.12: Write Integration Tests 
            ▪ Subtask 13.105.12.1: Run through the full return lifecycle for a test customer: 
                • Initiate return (13.101). Verify "Submitted" email and status. 
                • Admin approve (13.102). Verify "Approved" email and status. 
                • Admin generate label (13.104). Verify "Label Generated" email and status. 
                • Simulate carrier "In Transit" status update. Verify customer view reflects IN_TRANSIT. 
                • Simulate carrier "Delivered" status update. Verify "Received at Warehouse" email and DELIVERED_TO_WAREHOUSE status. 
                • Admin mark item received, process refund (13.103). Verify "Refund Processed" email and COMPLETED status. 
            ▪ Subtask 13.105.12.2: Verify that email content for each status is accurate and dynamic. 
            ▪ Subtask 13.105.12.3: Test disabling a notification type via admin, then perform the action, and verify no email is sent. 
        ◦ Task 13.105.13: Manual End-to-End Testing: 
            ▪ Subtask 13.105.13.1: Perform a return request with a new customer. 
            ▪ Subtask 13.105.13.2: Verify status updates in the customer's "My Returns" page at each stage (from approval, label generation, to receipt at warehouse, to refund). 
            ▪ Subtask 13.105.13.3: Verify all associated emails are received by the customer with correct information. 
            ▪ Subtask 13.105.13.4: Admin: Observe the return request in the admin panel, verifying the status changes and the notification log. 
            ▪ Subtask 13.105.13.5: Admin: Toggle off one notification type (e.g., "Received at Warehouse"). Initiate a new return and process it to the "received" stage. Verify that only the disabled notification is not sent, while others are. Re-enable it.
Epic 13: Returns Management & RMA
Story 13.106: Exchange Order Creation
Story: As an operations staff member, I want to be able to easily create a new order for the exchange item(s) directly from the return request, and as a customer, I want a seamless experience where the exchange is handled efficiently, so that I receive the replacement item quickly.
Acceptance Criteria:
    1. Exchange Option in Return Request: 
        ◦ When a customer requests a return (13.101), they can select "Exchange" as the requestedAction for eligible items. 
        ◦ If "Exchange" is chosen, the customer can select the desired replacement item (e.g., different size/color of the same product, or a completely different product). 
    2. Admin Exchange Order Creation: 
        ◦ In the admin panel, for a return request with "Exchange" as the requested action, operations staff can initiate the creation of a new "Exchange Order" directly from the return request detail view. 
        ◦ The system pre-populates the new order with the customer's shipping address, original order details, and the selected replacement item(s). 
        ◦ Admin can adjust quantities, add/remove items, and apply any price differences (if the exchange is for a different product). 
    3. Inventory Reservation for Exchange: 
        ◦ When an exchange order is created, the system automatically reserves the replacement item(s) from available inventory. 
        ◦ This prevents the replacement item from being sold to another customer while the return is in progress. 
    4. Payment Handling for Exchanges: 
        ◦ The system handles payment differences for exchanges: 
            ▪ If the replacement item is cheaper: The customer receives a refund for the price difference. 
            ▪ If the replacement item is more expensive: The customer needs to pay the price difference. The system should offer payment options (using payment gateway from Epic 5, or store credit from Epic 6 if available). 
        ◦ If the exchange is for the same item (different size/color) and the price is the same, no additional payment is required. 
    5. Automated Exchange Order Confirmation: 
        ◦ Once the exchange order is created and any payment differences are handled, the customer receives an automated email confirmation with the new order details, tracking information (if shipped), and instructions. 
    6. Return & Exchange Linking: 
        ◦ The original ReturnRequest and the newly created "Exchange Order" are clearly linked in the system for tracking purposes. 
        ◦ Admin users can easily view both the return request and the exchange order from either the return detail view or the order detail view. 
    7. Exchange Order Status Tracking: 
        ◦ The customer can track the status of their exchange order in their account, just like a regular order (using order tracking from Epic 8). 
    8. Exchange Completion & Return Closure: 
        ◦ When the exchange order is fulfilled (shipped), the original ReturnRequest is automatically closed (status EXCHANGED). 
        ◦ The system ensures that the returned item is correctly received and processed (as in 13.103) before closing the return request. 

Granular Tasks & Subtasks for Story 13.106:
    • Discovery & Design Tasks:
        ◦ Task 13.106.1: Design Exchange Workflow & UI in Admin 
            ▪ Subtask 13.106.1.1: Sketch the UI for creating an exchange order from the ReturnRequest detail view. 
            ▪ Subtask 13.106.1.2: Decide how to handle price differences (refunds, additional payments). 
            ▪ Subtask 13.106.1.3: Determine how to display the link between the original return and the new exchange order in both admin and customer views. 
    • Backend Tasks (Returns Service, Order Service, Inventory Service, Payment Gateway Service, Notification Service):
        ◦ Task 13.106.2: Enhance ReturnRequest & OrderItem Models 
            ▪ Subtask 13.106.2.1: Add exchangeOrderId (nullable) to ReturnRequest. 
            ▪ Subtask 13.106.2.2: If requestedAction is "Exchange", ReturnItem should include a field for exchangeProductId (the ID of the replacement product). 
        ◦ Task 13.106.3: Implement Admin API for Exchange Order Creation 
            ▪ Subtask 13.106.3.1: POST /api/admin/returns/:rmaId/create-exchange-order: 
                • Accepts rmaId. 
                • Validates that ReturnRequest has requestedAction = "Exchange". 
                • Creates a new order in Order Service (similar to regular order creation, but flagged as an "Exchange Order"). 
                • Populates the order with: 
                    ◦ Customer shipping address from original order. 
                    ◦ exchangeProductId and quantity from ReturnItem. 
                    ◦ Original order ID as a reference. 
                • Reserves the replacement item(s) in Inventory Service (using a new reserveStockForExchange method). 
                • Handles price differences (see next task). 
                • Links the new order to the ReturnRequest by setting ReturnRequest.exchangeOrderId. 
                • Returns the new orderId. 
        ◦ Task 13.106.4: Handle Payment Differences for Exchanges 
            ▪ Subtask 13.106.4.1: Within POST /api/admin/returns/:rmaId/create-exchange-order: 
                • Compare the price of the returned item(s) with the price of the replacement item(s). 
                • If replacement is cheaper: Calculate the refund amount and initiate a refund via Payment Gateway Service.processRefund(). 
                • If replacement is more expensive: Calculate the amount due. 
                    ◦ Offer payment options to the customer (using existing payment methods from Epic 5). 
                    ◦ If customer chooses store credit (from Epic 6), deduct from their balance. 
                    ◦ If customer pays successfully, proceed with order creation. 
        ◦ Task 13.106.5: Implement Inventory Reservation for Exchanges 
            ▪ Subtask 13.106.5.1: In Inventory Service, add a reserveStockForExchange(productId, quantity) method. 
            ▪ Subtask 13.106.5.2: This method should: 
                • Reduce available_stock by the specified quantity. 
                • Increase a new field, reserved_for_exchange_stock. 
                • Prevent other orders from using this reserved stock. 
            ▪ Subtask 13.106.5.3: When the exchange order is shipped, reserved_for_exchange_stock is transferred to fulfilled_stock. 
            ▪ Subtask 13.106.5.4: If the exchange order is canceled, reserved_for_exchange_stock is returned to available_stock. 
        ◦ Task 13.106.6: Link Return & Exchange Orders 
            ▪ Subtask 13.106.6.1: Ensure Order schema has a field originalReturnId (nullable) to link it to the originating ReturnRequest. 
        ◦ Task 13.106.7: Update Return Status upon Exchange Order Creation/Fulfillment 
            ▪ Subtask 13.106.7.1: When POST /api/admin/returns/:rmaId/create-exchange-order is successful, update ReturnRequest.status to PENDING_EXCHANGE. 
            ▪ Subtask 13.106.7.2: When the exchange order is shipped (using existing order fulfillment logic from Epic 8), automatically update the original ReturnRequest.status to EXCHANGED. 
        ◦ Task 13.106.8: Integrate with Notification Service for Exchange Orders 
            ▪ Subtask 13.106.8.1: Create an email template for "Your Exchange Order Has Been Created". 
            ▪ Subtask 13.106.8.2: Trigger this email upon successful creation of the exchange order, including new order details and tracking information (if available). 
        ◦ Task 13.106.9: Modify Existing Order APIs to Handle Exchange Orders 
            ▪ Subtask 13.106.9.1: Ensure existing GET /api/customer/orders/:orderId and GET /api/admin/orders/:orderId correctly display exchange orders and their link to the original return. 
    • Frontend Tasks (Admin Panel, Customer Account):
        ◦ Task 13.106.10: Enhance Admin Return Request Detail View UI (from 13.102/13.103/13.104/13.105) 
            ▪ Subtask 13.106.10.1: For ReturnRequest with requestedAction = "Exchange", add a "Create Exchange Order" button. 
            ▪ Subtask 13.106.10.2: When clicked, display a form to select the replacement item (from the product catalog). 
            ▪ Subtask 13.106.10.3: Pre-populate shipping address and other relevant details. 
            ▪ Subtask 13.106.10.4: Display any price difference and payment options (if applicable). 
            ▪ Subtask 13.106.10.5: Display a link to the created exchange order (once it exists). 
        ◦ Task 13.106.11: Update Customer "My Returns" Page (from 13.101/13.102/13.105) 
            ▪ Subtask 13.106.11.1: For ReturnRequest with requestedAction = "Exchange", display a link to the created exchange order. 
            ▪ Subtask 13.106.11.2: Clearly indicate the status of the exchange (e.g., "Exchange Order Created," "Exchange Order Shipped"). 
        ◦ Task 13.106.12: Update Customer Order Details Page (from Epic 8) 
            ▪ Subtask 13.106.12.1: For exchange orders, clearly indicate that it's an exchange order and link it back to the original ReturnRequest. 
    • Testing Tasks:
        ◦ Task 13.106.13: Write Unit Tests (Backend) 
            ▪ Subtask 13.106.13.1: Unit tests for reserveStockForExchange method in Inventory Service. 
            ▪ Subtask 13.106.13.2: Unit tests for calculating price differences and handling refunds/payments for exchanges. 
        ◦ Task 13.106.14: Write Integration Tests 
            ▪ Subtask 13.106.14.1: Customer initiates a return with "Exchange" as the requestedAction. 
            ▪ Subtask 13.106.14.2: Admin creates an exchange order. Verify: 
                • New order is created correctly. 
                • Stock is reserved. 
                • Price difference is handled correctly (refund or payment). 
                • Links between return and exchange order are established. 
                • Customer receives confirmation email. 
            ▪ Subtask 13.106.14.3: Simulate shipping the exchange order. Verify: 
                • Stock is correctly adjusted. 
                • Original ReturnRequest status is updated to EXCHANGED. 
        ◦ Task 13.106.15: Manual End-to-End Testing: 
            ▪ Subtask 13.106.15.1: Customer A: Orders a product. Then requests a return with "Exchange" for a different size. 
            ▪ Subtask 13.106.15.2: Admin: Approves the return. Creates the exchange order, selecting the replacement size. 
            ▪ Subtask 13.106.15.3: Verify that the new order is created, the replacement item is reserved from stock, and the customer receives an exchange order confirmation email. 
            ▪ Subtask 13.106.15.4: Customer A: Checks their account. Verifies they can see the new exchange order linked to the return. 
            ▪ Subtask 13.106.15.5: Admin: Ships the exchange order. 
            ▪ Subtask 13.106.15.6: Verify that the original return is automatically closed and the customer can track the exchange order like a regular order. 
            ▪ Subtask 13.106.15.7: Repeat the scenario, but exchange for a completely different product, testing both scenarios where the replacement is cheaper and more expensive.
Epic 13: Returns Management & RMA
Story 13.107: International Returns & Customs Declarations
Story: As a customer returning an item from an international location, I want the system to provide me with the necessary customs declarations and country-specific instructions, and as an operations staff member, I want to manage international return logistics efficiently, so that items can clear customs smoothly and avoid unnecessary delays or duties.
Acceptance Criteria:
    1. Country-Specific Return Rules & Addresses: 
        ◦ The system can define and apply return rules and destination addresses specific to the customer's country of origin (e.g., different return window for international, specific regional return centers). 
        ◦ (From Epic 11) The system accurately identifies the customer's country and currency. 
    2. Automated Customs Documentation Generation: 
        ◦ For international return requests, the system automatically generates required customs documentation (e.g., Commercial Invoice, CN22/CN23 forms for postal services). 
        ◦ This documentation includes: 
            ▪ Sender/Recipient details (customer, return warehouse). 
            ▪ Item descriptions, quantities, and declared values (from original order). 
            ▪ Harmonized System (HS) codes for returned items (if stored, from Epic 2 or PIM). 
            ▪ Reason for export (e.g., "Returned Goods," "Return for Repair"). 
            ▪ Indication of "No Commercial Value" or "Returned Merchandise" to avoid re-import duties where applicable. 
    3. Customer Access to Customs Documents: 
        ◦ The customer receives an email notification containing the generated customs documents (PDF attachment), alongside the return label (from 13.104). 
        ◦ Customers can download these documents from their "My Returns" page. 
        ◦ Clear instructions are provided on how to use these documents for customs declarations. 
    4. Duty and Tax Handling for Returns: 
        ◦ The system provides a mechanism to track and manage duties and taxes incurred on international returns (e.g., whether these are paid by the customer, absorbed by the merchant, or reclaimable). 
        ◦ (Initial scope) The primary focus is on generating documentation to minimize or avoid re-import duties for returned goods. 
    5. Integrated International Return Shipping (Leverage 13.104): 
        ◦ The return label generation (from 13.104) is extended to support international return labels via integrated international carriers (e.g., DHL Express, FedEx, UPS). 
        ◦ The label generation takes into account international shipping zones and costs. 
    6. Country-Specific Return Instructions: 
        ◦ The automated notifications and "My Returns" page provide localized and country-specific instructions (e.g., "Please mark package as 'Returned Goods' on customs form," "Use only postal service," "Attach 3 copies of commercial invoice"). 
    7. Admin Oversight & Management: 
        ◦ Operations staff can view all generated customs documents from the admin return detail view. 
        ◦ Admin can manually adjust declared values or HS codes for returns if necessary. 
        ◦ Admin can see any specific warnings related to international return processing (e.g., "Potential duty risk"). 

Granular Tasks & Subtasks for Story 13.107:
    • Discovery & Design Tasks:
        ◦ Task 13.107.1: Research International Customs Requirements 
            ▪ Subtask 13.107.1.1: Identify common customs forms (CN22, CN23, Commercial Invoice for express carriers) and their data requirements. 
            ▪ Subtask 13.107.1.2: Research "returned goods" customs procedures for key international markets (e.g., EU to UK, US to EU). 
            ▪ Subtask 13.107.1.3: Confirm the availability of HS codes for all products in the PIM (from Epic 2). If not, implement. 
        ◦ Task 13.107.2: Define International Return Flow & Rules 
            ▪ Subtask 13.107.2.1: Determine country-specific return windows or eligibility rules. 
            ▪ Subtask 13.107.2.2: Identify return addresses for different international regions. 
            ▪ Subtask 13.107.2.3: Define which carriers will be used for international returns. 
        ◦ Task 13.107.3: Design Customs Document Templates & UI 
            ▪ Subtask 13.107.3.1: Design PDF templates for Commercial Invoice and CN22/CN23 that can be populated dynamically. 
            ▪ Subtask 13.107.3.2: Plan how custom-specific instructions will be displayed in the customer's account. 
    • Backend Tasks (Returns Service, Shipping Service, Product Service, Notification Service, Admin Service):
        ◦ Task 13.107.4: Enhance ReturnRequest Model for International Data 
            ▪ Subtask 13.107.4.1: Add originCountry, destinationCountry fields. 
            ▪ Subtask 13.107.4.2: Add customsDocuments (array of objects with type, url, generatedDate). 
            ▪ Subtask 13.107.4.3: Add customsInstructions (text field, potentially localized). 
        ◦ Task 13.107.5: Develop Customs Documentation Generation Logic 
            ▪ Subtask 13.107.5.1: Create a CustomsService (or extend ShippingService) with a generateCustomsDocuments(returnRequest) method. 
            ▪ Subtask 13.107.5.2: This method will: 
                • Retrieve relevant ReturnItem data, including product.hsCode, product.value. 
                • Populate Commercial Invoice or CN22/CN23 data structure. 
                • Integrate with a PDF generation library or service to create the documents. 
                • Mark as "Returned Goods" or similar on the forms. 
                • Store the generated PDF URLs in ReturnRequest.customsDocuments. 
            ▪ Subtask 13.107.5.3: Integrate this generation logic into POST /api/admin/returns/:rmaId/generate-label (from 13.104), so customs documents are generated concurrently with the label. 
        ◦ Task 13.107.6: Enhance Shipping Service for International Returns 
            ▪ Subtask 13.107.6.1: Update generateReturnLabel method (from 13.104) to handle international origin/destination. 
            ▪ Subtask 13.107.6.2: Configure carrier integrations (e.g., DHL, FedEx) for international return service types. 
            ▪ Subtask 13.107.6.3: Ensure correct return address based on origin country. 
        ◦ Task 13.107.7: Manage HS Codes & Product Data (from Epic 2) 
            ▪ Subtask 13.107.7.1: Verify Product schema includes hsCode (Harmonized System code). If not, add and ensure data population. 
            ▪ Subtask 13.107.7.2: Ensure product declared value is available. 
        ◦ Task 13.107.8: Integrate with Notification Service for Customs Documents 
            ▪ Subtask 13.107.8.1: Update "Return Label Generated" email template (from 13.104) to include links/attachments for customs documents and customsInstructions. 
            ▪ Subtask 13.107.8.2: Ensure customsInstructions are localized (from Epic 11) based on customer's country. 
    • Frontend Tasks (Customer Account, Admin Panel):
        ◦ Task 13.107.9: Update Customer "My Returns" Page for International Specifics 
            ▪ Subtask 13.107.9.1: On the ReturnRequest detail page, prominently display links to download customs documents alongside the return label. 
            ▪ Subtask 13.107.9.2: Display country-specific customsInstructions clearly. 
        ◦ Task 13.107.10: Enhance Admin Return Request Detail View UI (from 13.102/13.103/13.104/13.105/13.106) 
            ▪ Subtask 13.107.10.1: For international returns, display links to all generated customs documents. 
            ▪ Subtask 13.107.10.2: (Optional) Allow admin to manually edit declared values or HS codes for individual items within the return for customs purposes. 
            ▪ Subtask 13.107.10.3: Display the configured return address for that international region. 
            ▪ Subtask 13.107.10.4: (Optional) Add warnings/flags for potential customs issues. 
    • Testing Tasks:
        ◦ Task 13.107.11: Write Unit Tests (Backend) 
            ▪ Subtask 13.107.11.1: Unit tests for generateCustomsDocuments with various product data and return reasons. 
            ▪ Subtask 13.107.11.2: Unit tests to ensure HS codes and declared values are correctly used. 
        ◦ Task 13.107.12: Write Integration Tests 
            ▪ Subtask 13.107.12.1: Create a test customer with an international address (e.g., US customer ordering from UK site). 
            ▪ Subtask 13.107.12.2: Customer initiates a return. Admin approves. 
            ▪ Subtask 13.107.12.3: Admin generates return label. Verify that customs documents (e.g., Commercial Invoice PDF) are also generated and stored. 
            ▪ Subtask 13.107.12.4: Verify email to customer includes both return label and customs documents. 
            ▪ Subtask 13.107.12.5: Verify customer can download both from their account. 
            ▪ Subtask 13.107.12.6: Test with a product that has an HS code defined vs. one that doesn't. 
        ◦ Task 13.107.13: Manual End-to-End Testing: 
            ▪ Subtask 13.107.13.1: Log in as a customer from a different country (e.g., US customer on UK site). Place an order for a product with a known HS code. 
            ▪ Subtask 13.107.13.2: Initiate a return request for that order. 
            ▪ Subtask 13.107.13.3: Admin: Approve the return. 
            ▪ Subtask 13.107.13.4: Admin: Generate return label. Verify that both the label and customs documents (Commercial Invoice, CN22/CN23) are generated and downloadable from the admin panel. 
            ▪ Subtask 13.107.13.5: Verify the customs documents contain correct item details, declared values, and HS codes, and mark the reason for export as "Returned Goods". 
            ▪ Subtask 13.107.13.6: Customer: Check email for the return notification. Verify it includes attachments/links for both the label and customs documents. 
            ▪ Subtask 13.107.13.7: Customer: Go to "My Returns" page. Verify download links for all documents are present and country-specific instructions are displayed.
Epic 13: Returns Management & RMA
Story 13.108: Reporting & Analytics for Returns
Story: As a business analyst, I want to access comprehensive reports and dashboards on return trends, reasons, and costs, so that I can identify problem areas (e.g., specific products with high return rates), evaluate the financial impact of returns, and optimize our product offerings and return policies.
Acceptance Criteria:
    1. Key Returns Performance Indicators (KPIs) Tracking: 
        ◦ The system tracks and makes available data for key returns KPIs, including: 
            ▪ Overall Return Rate: (Total returned items / Total items sold) or (Total refunded value / Total sales value). 
            ▪ Return Rate by Product/SKU: Identify products with unusually high return rates. 
            ▪ Return Rate by Category/Brand: Identify categories/brands with high return rates. 
            ▪ Return Rate by Reason: Breakdown of returns by specified return reasons (e.g., "Too big," "Defective"). 
            ▪ Return Rate by Customer Segment/Country: Analyze return trends across different customer groups or regions. 
            ▪ Cost of Returns: Total value of refunds/credits issued, total shipping label costs, total restocking fees. 
            ▪ Average Return Processing Time: From request initiation to completion. 
            ▪ Return Destination Trends: Where items are returned to (for international, which return centers). 
    2. Returns Dashboard (Admin): 
        ◦ A dedicated dashboard in the admin panel provides a high-level visual overview of return performance using charts and key metrics. 
        ◦ Allows filtering by time period, product, category, customer segment, and country. 
    3. Detailed Returns Reports (Admin): 
        ◦ Ability to generate detailed, exportable reports on: 
            ▪ Itemized Returns Report: List of all ReturnItems with full details (reason, condition, associated order, refund/credit amount). 
            ▪ Return Reason Breakdown: Aggregated counts and percentages for each return reason. 
            ▪ Product Return Performance: List of products sorted by return rate (high to low). 
            ▪ Return Costs Summary: Breakdown of refund values, shipping costs, and deducted fees. 
            ▪ (Optional) Customer Return History: Aggregated return data per customer. 
        ◦ Reports are exportable (e.g., CSV, Excel). 
    4. Integration with Existing Analytics (Epic 10, 12.105): 
        ◦ Returns-specific data points are integrated into the broader Analytics & Business Intelligence infrastructure. 
        ◦ Extend existing data warehouses/reporting tools (if applicable) with return-specific dimensions and metrics. 
    5. Data Accuracy & Timeliness: 
        ◦ Returns data displayed in reports and dashboards is accurate and updated regularly (e.g., daily batch processing or near real-time for critical metrics). 
    6. Secure Access: 
        ◦ Only authorized admin roles (e.g., Business Analyst, Marketing Manager, Operations Manager) can access returns analytics and reports. 

Granular Tasks & Subtasks for Story 13.108:
    • Discovery & Design Tasks:
        ◦ Task 13.108.1: Finalize Returns KPIs & Report Needs 
            ▪ Subtask 13.108.1.1: Work with business stakeholders (e.g., product managers, finance, marketing) to confirm the exact KPIs and reporting requirements. 
            ▪ Subtask 13.108.1.2: Define calculations for each KPI (e.g., how "Overall Return Rate" is measured: by value or volume, gross or net sales). 
        ◦ Task 13.108.2: Design Dashboard & Report Layouts 
            ▪ Subtask 13.108.2.1: Sketch dashboard wireframes for return trends (line charts), reason distribution (pie/bar charts), top returned products (bar charts). 
            ▪ Subtask 13.108.2.2: Define columns, filters, and grouping options for detailed tabular reports. 
    • Backend Tasks (Analytics Service, Returns Service, Order Service, Product Service):
        ◦ Task 13.108.3: Data Point Aggregation & Storage for Returns 
            ▪ Subtask 13.108.3.1: Enhance or create an Analytics Data Mart specifically for returns. 
            ▪ Subtask 13.108.3.2: Develop ETL (Extract, Transform, Load) processes or database views to: 
                • Aggregate ReturnRequest data (status, dates, RMA). 
                • Aggregate ReturnItem data (product, quantity, return reason, condition, requested action, refund/credit amount). 
                • Join with Order data (original sales, customer, country, purchase date). 
                • Join with Product data (category, brand, original price, HS code). 
                • Join with Shipping data for return label costs (from 13.104). 
                • Join with LoyaltyTransaction data for store credit refunds (from 12.101). 
            ▪ Subtask 13.108.3.3: Schedule these aggregations to run at a defined frequency (e.g., daily, hourly). 
        ◦ Task 13.108.4: Develop Returns Analytics APIs 
            ▪ Subtask 13.108.4.1: GET /api/admin/analytics/returns/kpis: Returns aggregated KPI data for the dashboard (with startDate, endDate, and filter parameters for product, category, country). 
            ▪ Subtask 13.108.4.2: GET /api/admin/analytics/returns/itemized-report: Returns detailed list of ReturnItem (with filters). 
            ▪ Subtask 13.108.4.3: GET /api/admin/analytics/returns/reasons-breakdown: Returns aggregated counts for return reasons. 
            ▪ Subtask 13.108.4.4: GET /api/admin/analytics/returns/product-performance: Returns product-specific return rates. 
            ▪ Subtask 13.108.4.5: Implement authentication and authorization for admin endpoints. 
        ◦ Task 13.108.5: Integrate with Core Analytics (Epic 10 & 12.105) 
            ▪ Subtask 13.108.5.1: Extend the common analytics data model (if used) to include return-specific attributes at the order and item level (e.g., order_return_rate_value, item_is_returned, item_return_reason). 
            ▪ Subtask 13.108.5.2: Ensure that loyalty-related return data (e.g., loyalty points redeemed from store credit for returns) is correctly tracked. 
    • Frontend Tasks (Admin Panel):
        ◦ Task 13.108.6: Create "Returns Analytics" Dashboard UI 
            ▪ Subtask 13.108.6.1: Create a new sub-section "Returns" under the "Analytics" top-level menu item. 
            ▪ Subtask 13.108.6.2: Display main KPIs (from GET /api/admin/analytics/returns/kpis) using dynamic charts (e.g., D3.js, Chart.js) and numerical displays. 
            ▪ Subtask 13.108.6.3: Implement interactive filters for date range, product, category, customer country. 
        ◦ Task 13.108.7: Develop Detailed Returns Reports UI 
            ▪ Subtask 13.108.7.1: Implement separate tabs or sections for "Itemized Report," "Reason Breakdown," "Product Performance," etc. 
            ▪ Subtask 13.108.7.2: Display tabular data for each report (from respective backend APIs). 
            ▪ Subtask 13.108.7.3: Add comprehensive filtering, sorting, and pagination options. 
            ▪ Subtask 13.108.7.4: Implement "Export to CSV/Excel" functionality for all reports. 
        ◦ Task 13.108.8: Enhance Product and Customer Admin Views (Optional) 
            ▪ Subtask 13.108.8.1: In the "Product Details" admin view, display a quick summary of that product's return rate and top return reasons. 
            ▪ Subtask 13.108.8.2: In the "Customer Details" admin view, display a summary of the customer's return history. 
    • Testing Tasks:
        ◦ Task 13.108.9: Write Unit Tests (Backend) 
            ▪ Subtask 13.108.9.1: Unit tests for KPI calculation functions (e.g., overall return rate calculation, cost aggregation). 
            ▪ Subtask 13.108.9.2: Unit tests for data aggregation queries and ETL processes. 
        ◦ Task 13.108.10: Write Integration Tests 
            ▪ Subtask 13.108.10.1: Populate test data with a variety of orders and returns (different products, reasons, outcomes, international vs. domestic). 
            ▪ Subtask 13.108.10.2: Run the data aggregation jobs. 
            ▪ Subtask 13.108.10.3: Call KPI and report APIs with various filters (date ranges, products, reasons). Assert that the returned data matches expected calculations based on the test data. 
            ▪ Subtask 13.108.10.4: Verify that the overall return rate, return rates by product/reason, and return costs are accurately reflected. 
            ▪ Subtask 13.108.10.5: Test CSV/Excel export functionality. 
        ◦ Task 13.108.11: Manual End-to-End Testing: 
            ▪ Subtask 13.108.11.1: Execute a series of diverse return scenarios (e.g., 2 successful refunds, 1 exchange, 1 rejected return, 1 international return, involving different products). 
            ▪ Subtask 13.108.11.2: Admin: Log in and navigate to the "Returns Analytics" dashboard. 
            ▪ Subtask 13.108.11.3: Verify that the overall KPIs (return rate, total refunded value) reflect the test activities. 
            ▪ Subtask 13.108.11.4: Apply different date, product, and category filters and verify data updates correctly. 
            ▪ Subtask 13.108.11.5: Navigate to the "Return Reason Breakdown" report. Verify the breakdown of reasons for the test returns. 
            ▪ Subtask 13.108.11.6: Go to the "Product Return Performance" report. Verify the return rates for the specific test products. 
            ▪ Subtask 13.108.11.7: Export all reports to CSV/Excel and verify data integrity and formatting.
