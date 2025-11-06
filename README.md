Postman Collection Link(for testing the apis) =>https://www.postman.com/yoursalon/workspace/test/collection/37142646-9572c1e8-0b08-494d-962e-021f450e18f1?action=share&creator=37142646

Login Details->

   For User
    email=>arpit4672@gmail.com
    password=>Arpit@2002
   For Admin
   email=>arpit1234@gmail.com
    password=>Arpit@2002




 E-commerce Backend API->

This is the backend server for a robust and scalable e-commerce application, built with Node.js, Express, and MongoDB. It provides a complete set of RESTful APIs to manage users, products, shopping carts, and orders.

  Features->

- User Authentication: Secure user registration and login functionality.
- Product Management: API endpoints for creating, reading, updating, and deleting products.
- Shopping Cart: Full cart management, allowing users to add, update, and remove items.
- Order Processing: System for creating and managing user orders.
- Automated Tasks: A scheduled job runs every minute to find and cancel orders that meet certain criteria (e.g., pending payment from last 15 minutes).



 API Endpoints->

The API provides the following endpoints.

 Health Check->

| Method | Endpoint | Description                   |
| `GET`  | `/`      | Checks if the server is live. |

 Authentication (`/api/auth`)

| Method | Endpoint    | Description                                            
| `POST` | `/register` | Creates a new user account.                            
| `POST` | `/login`    | Authenticates a user and returns a JWT.                

 Products (`/api/products`)

| Method   | Endpoint  | Description
| `GET`    | `/allproducts`       | Fetches a list of all products. Can support filtering and pagination.         |
| `POST`   | `/add`    | Creates a new product. (Typically restricted to admin users).                 |
| `PUT`    | `/updateproduct/:id`  | Updates an existing product by its ID. (Typically restricted to admin users). |
| `DELETE` | `/deleteproduct/:id`  | Deletes a product by its ID. (Typically restricted to admin users).           |

 Shopping Cart (`/api/cart`)

| Method   | Endpoint      | Description                                     
| `GET`    | `/getcart`         | Retrieves the current user's shopping cart.     
| `POST`   | `/add`         | Adds a product to the cart.                     
| `DELETE` | `/items/:productId` | Removes a specific item from the cart.          

 Orders (`/api/order`)

| Method | Endpoint         | Description                                     
| `POST` | `/checkout`            | Creates a new order from the items in the cart. 
| `GET`  | `/`            | Retrieves a list of the current user's orders(order history).  |
| `GET`  | `/:id`        | Fetches details for a specific order by its ID. 
| `POST`  | `/:id/pay`  | Pay the payment of a specific order                       


 Admin (`/api/admin`)

| Method | Endpoint    | Description                                            
| `GET` | `/orders` | Get all the orders.                            
| `PATCH` | `/orders/:id/status`    | Change the status of the order to dispatched or delivered and more.                
