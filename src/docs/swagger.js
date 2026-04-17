const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Interactive Urban Farming Platform API",
    version: "1.0.0",
    description:
      "Backend API for rental spaces, marketplace, plant tracking, community forum, and sustainability verification.",
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Service health check" },
    { name: "Auth", description: "Authentication and profile endpoints" },
    { name: "Admin", description: "Admin management endpoints" },
    { name: "Marketplace", description: "Product and order endpoints" },
    { name: "Tracking", description: "Plant tracking and live updates" },
    { name: "Forum", description: "Community posts" },
    { name: "Rentals", description: "Farm space rental system" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Success" },
          data: {},
          meta: {
            type: "object",
            nullable: true,
            example: null,
          },
          error: {
            type: "object",
            nullable: true,
            example: null,
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-17T10:00:00.000Z",
          },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          data: { type: "null", nullable: true },
          meta: { type: "null", nullable: true },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              details: {
                type: "array",
                items: {},
                example: [],
              },
            },
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-17T10:00:00.000Z",
          },
        },
      },
      AuthRegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "Arafat" },
          email: { type: "string", example: "arafat@example.com" },
          password: { type: "string", example: "Password123!" },
          role: {
            type: "string",
            enum: ["vendor", "customer"],
            example: "customer",
          },
          farmName: { type: "string", example: "Green Roof Farm" },
          farmLocation: { type: "string", example: "Banani, Dhaka" },
          latitude: { type: "number", example: 23.7925 },
          longitude: { type: "number", example: 90.4078 },
          bio: { type: "string", example: "Urban farmer focused on organic produce." },
        },
      },
      AuthLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@example.com" },
          password: { type: "string", example: "Password123!" },
        },
      },
      ProductCreateRequest: {
        type: "object",
        required: ["name", "price", "category"],
        properties: {
          vendorId: { type: "string", format: "uuid", example: "vendor-profile-uuid" },
          name: { type: "string", example: "Organic Basil Seeds" },
          description: { type: "string", example: "Certified seeds for balcony gardens." },
          price: { type: "number", example: 80 },
          category: {
            type: "string",
            enum: ["seeds", "tools", "organic_products", "fresh_produce", "other"],
            example: "seeds",
          },
          availableQuantity: { type: "integer", example: 100 },
          certificationStatus: {
            type: "string",
            enum: ["pending", "approved", "rejected", "expired"],
            example: "approved",
          },
        },
      },
      OrderCreateRequest: {
        type: "object",
        required: ["produceId", "quantity"],
        properties: {
          produceId: { type: "string", format: "uuid", example: "product-uuid" },
          quantity: { type: "integer", example: 2 },
        },
      },
      RentalSpaceCreateRequest: {
        type: "object",
        required: ["location", "size", "price"],
        properties: {
          location: { type: "string", example: "Banani, Dhaka - Rooftop Plot 1" },
          latitude: { type: "number", example: 23.7941 },
          longitude: { type: "number", example: 90.4043 },
          size: { type: "number", example: 120 },
          price: { type: "number", example: 5000 },
          availability: { type: "boolean", example: true },
        },
      },
      BookingCreateRequest: {
        type: "object",
        required: ["rentalSpaceId", "startDate", "endDate"],
        properties: {
          rentalSpaceId: { type: "string", format: "uuid", example: "space-uuid" },
          startDate: { type: "string", format: "date", example: "2026-05-01" },
          endDate: { type: "string", format: "date", example: "2026-05-31" },
        },
      },
      ForumPostCreateRequest: {
        type: "object",
        required: ["postContent"],
        properties: {
          postContent: {
            type: "string",
            example: "What is the best organic way to improve balcony soil in humid weather?",
          },
        },
      },
      TrackingCreateRequest: {
        type: "object",
        required: ["plantName"],
        properties: {
          userId: { type: "string", format: "uuid", example: "user-uuid" },
          vendorId: { type: "string", format: "uuid", example: "vendor-uuid" },
          rentalBookingId: { type: "string", format: "uuid", example: "booking-uuid" },
          plantName: { type: "string", example: "Balcony Tomato Plant" },
          species: { type: "string", example: "Tomato" },
          plantedAt: { type: "string", format: "date", example: "2026-04-01" },
          expectedHarvestDate: { type: "string", format: "date", example: "2026-05-20" },
          healthStatus: {
            type: "string",
            enum: ["healthy", "needs_attention", "critical", "harvest_ready"],
            example: "healthy",
          },
          growthStage: {
            type: "string",
            enum: ["seedling", "vegetative", "flowering", "fruiting", "harvested"],
            example: "seedling",
          },
          currentNotes: { type: "string", example: "Started in a small container on the balcony." },
        },
      },
      TrackingEventCreateRequest: {
        type: "object",
        required: ["eventType"],
        properties: {
          eventType: { type: "string", example: "watering_update" },
          eventPayload: {
            type: "object",
            example: {
              waterAmount: "500ml",
              method: "drip",
              note: "Watered in the morning.",
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccess" },
              },
            },
          },
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register customer or vendor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
            },
          },
        },
        responses: {
          201: { description: "Registered successfully" },
          400: { description: "Validation error" },
          409: { description: "Email already exists" },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthLoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
        },
      },
    },

    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        responses: {
          200: { description: "Profile fetched" },
          401: { description: "Unauthorized" },
        },
      },
    },

    "/admin/vendors": {
      get: {
        tags: ["Admin"],
        summary: "List vendors",
        responses: {
          200: { description: "Vendors fetched" },
        },
      },
    },

    "/admin/vendors/{vendorId}/approve": {
      patch: {
        tags: ["Admin"],
        summary: "Approve vendor",
        parameters: [
          {
            name: "vendorId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "Vendor approved" },
        },
      },
    },

    "/admin/certifications": {
      get: {
        tags: ["Admin"],
        summary: "List certifications",
        responses: {
          200: { description: "Certifications fetched" },
        },
      },
    },

    "/marketplace/products": {
      get: {
        tags: ["Marketplace"],
        summary: "Browse products",
        responses: {
          200: { description: "Products fetched" },
        },
      },
      post: {
        tags: ["Marketplace"],
        summary: "Create product",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Product created" },
        },
      },
    },

    "/marketplace/orders": {
      get: {
        tags: ["Marketplace"],
        summary: "List orders",
        responses: {
          200: { description: "Orders fetched" },
        },
      },
      post: {
        tags: ["Marketplace"],
        summary: "Place order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Order placed" },
        },
      },
    },

    "/rentals/spaces": {
      get: {
        tags: ["Rentals"],
        summary: "Browse rental spaces",
        responses: {
          200: { description: "Spaces fetched" },
        },
      },
      post: {
        tags: ["Rentals"],
        summary: "Create rental space",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RentalSpaceCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Space created" },
        },
      },
    },

    "/rentals/bookings": {
      get: {
        tags: ["Rentals"],
        summary: "List bookings",
        responses: {
          200: { description: "Bookings fetched" },
        },
      },
      post: {
        tags: ["Rentals"],
        summary: "Book a rental space",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookingCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Booking created" },
        },
      },
    },

    "/forum/posts": {
      get: {
        tags: ["Forum"],
        summary: "Browse forum posts",
        responses: {
          200: { description: "Posts fetched" },
        },
      },
      post: {
        tags: ["Forum"],
        summary: "Create forum post",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForumPostCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Post created" },
        },
      },
    },

    "/tracking/plants": {
      get: {
        tags: ["Tracking"],
        summary: "List plant tracks",
        responses: {
          200: { description: "Plant tracks fetched" },
        },
      },
      post: {
        tags: ["Tracking"],
        summary: "Create plant track",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TrackingCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Plant track created" },
        },
      },
    },

    "/tracking/plants/{plantId}/events": {
      get: {
        tags: ["Tracking"],
        summary: "List plant events",
        parameters: [
          {
            name: "plantId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "Plant events fetched" },
        },
      },
      post: {
        tags: ["Tracking"],
        summary: "Create plant event",
        parameters: [
          {
            name: "plantId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TrackingEventCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Plant event created" },
        },
      },
    },
  },
};

export default swaggerSpec;