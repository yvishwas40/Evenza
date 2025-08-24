# Project Title

## Description
This project is a Node.js application that utilizes MongoDB as its database. It includes an `Admin` model defined using Mongoose, which manages admin user data and authentication.

## Files Overview

- **server/models/Admin.js**: Defines the `Admin` model with fields such as `name`, `email`, `password`, `role`, `organization`, `phone`, and `isActive`. It includes middleware for password hashing and a method for password comparison.

- **server/database.js**: Configures the MongoDB connection for the application using Mongoose.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   ```

2. **Navigate to the project directory**:
   ```
   cd project
   ```

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Configure the database connection**:
   - Open `server/database.js` and replace `'mongodb://localhost:27017/yourdbname'` with your actual MongoDB connection string.

5. **Run the application**:
   ```
   npm start
   ```

## Usage
After setting up the project and running the application, you can interact with the Admin model through the defined API endpoints (to be documented separately).

## License
This project is licensed under the MIT License.