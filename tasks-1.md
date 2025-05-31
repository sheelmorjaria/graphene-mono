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