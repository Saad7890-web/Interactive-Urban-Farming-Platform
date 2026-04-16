import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const DEFAULT_PASSWORD = "Password123!";

function daysFromNow(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function pick(list, index) {
  return list[index % list.length];
}

async function insertUser(client, { name, email, passwordHash, role, status }) {
  const result = await client.query(
    `
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, status, created_at
    `,
    [name, email, passwordHash, role, status]
  );

  return result.rows[0];
}

async function insertVendorProfile(
  client,
  {
    userId,
    farmName,
    farmLocation,
    latitude,
    longitude,
    bio,
    certificationStatus,
    approvedBy,
    approvedAt,
  }
) {
  const result = await client.query(
    `
    INSERT INTO vendor_profiles
      (user_id, farm_name, certification_status, farm_location, latitude, longitude, bio, approved_by, approved_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      userId,
      farmName,
      certificationStatus,
      farmLocation,
      latitude,
      longitude,
      bio,
      approvedBy,
      approvedAt,
    ]
  );

  return result.rows[0];
}

async function insertCertification(
  client,
  {
    vendorId,
    certifyingAgency,
    certificationDate,
    expiryDate,
    documentUrl,
    status,
    reviewedBy,
    reviewNotes,
  }
) {
  const result = await client.query(
    `
    INSERT INTO sustainability_certs
      (vendor_id, certifying_agency, certification_date, expiry_date, document_url, status, reviewed_by, review_notes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      vendorId,
      certifyingAgency,
      certificationDate,
      expiryDate,
      documentUrl,
      status,
      reviewedBy,
      reviewNotes,
    ]
  );

  return result.rows[0];
}

async function insertProduce(
  client,
  {
    vendorId,
    name,
    description,
    price,
    category,
    certificationStatus,
    availableQuantity,
  }
) {
  const result = await client.query(
    `
    INSERT INTO produce
      (vendor_id, name, description, price, category, certification_status, available_quantity, is_active)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING *
    `,
    [
      vendorId,
      name,
      description,
      price,
      category,
      certificationStatus,
      availableQuantity,
    ]
  );

  return result.rows[0];
}

async function insertRentalSpace(client, { vendorId, location, latitude, longitude, size, price }) {
  const result = await client.query(
    `
    INSERT INTO rental_spaces
      (vendor_id, location, latitude, longitude, size, price, availability)
    VALUES
      ($1, $2, $3, $4, $5, $6, TRUE)
    RETURNING *
    `,
    [vendorId, location, latitude, longitude, size, price]
  );

  return result.rows[0];
}

async function insertBooking(
  client,
  {
    rentalSpaceId,
    customerId,
    vendorId,
    startDate,
    endDate,
    totalPrice,
    status,
  }
) {
  const result = await client.query(
    `
    INSERT INTO rental_bookings
      (rental_space_id, customer_id, vendor_id, start_date, end_date, total_price, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [rentalSpaceId, customerId, vendorId, startDate, endDate, totalPrice, status]
  );

  return result.rows[0];
}

async function insertCommunityPost(client, { userId, postContent }) {
  const result = await client.query(
    `
    INSERT INTO community_posts (user_id, post_content)
    VALUES ($1, $2)
    RETURNING *
    `,
    [userId, postContent]
  );

  return result.rows[0];
}

async function insertPlantTrack(
  client,
  {
    userId,
    vendorId,
    rentalBookingId,
    plantName,
    species,
    plantedAt,
    expectedHarvestDate,
    healthStatus,
    growthStage,
    currentNotes,
  }
) {
  const result = await client.query(
    `
    INSERT INTO plant_tracks
      (user_id, vendor_id, rental_booking_id, plant_name, species, planted_at, expected_harvest_date, health_status, growth_stage, current_notes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
    [
      userId,
      vendorId,
      rentalBookingId,
      plantName,
      species,
      plantedAt,
      expectedHarvestDate,
      healthStatus,
      growthStage,
      currentNotes,
    ]
  );

  return result.rows[0];
}

async function insertTrackingEvent(client, { plantTrackId, eventType, eventPayload }) {
  const result = await client.query(
    `
    INSERT INTO plant_tracking_events (plant_track_id, event_type, event_payload)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [plantTrackId, eventType, eventPayload]
  );

  return result.rows[0];
}

async function insertOrder(
  client,
  {
    userId,
    produceId,
    vendorId,
    quantity,
    unitPrice,
    status,
  }
) {
  const totalPrice = Number((quantity * unitPrice).toFixed(2));

  const result = await client.query(
    `
    INSERT INTO orders
      (user_id, produce_id, vendor_id, quantity, unit_price, total_price, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [userId, produceId, vendorId, quantity, unitPrice, totalPrice, status]
  );

  return result.rows[0];
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        plant_tracking_events,
        plant_tracks,
        orders,
        community_posts,
        rental_bookings,
        rental_spaces,
        produce,
        sustainability_certs,
        vendor_profiles,
        users
      RESTART IDENTITY CASCADE;
    `);

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    const admin = await insertUser(client, {
      name: "Platform Admin",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
      status: "active",
    });

    const vendorTemplates = [
      {
        name: "Green Skyline Farm",
        email: "vendor1@example.com",
        farmName: "Green Skyline Rooftop",
        farmLocation: "Dhanmondi, Dhaka",
        latitude: 23.7465,
        longitude: 90.3742,
      },
      {
        name: "Urban Leaf Growers",
        email: "vendor2@example.com",
        farmName: "Urban Leaf Garden",
        farmLocation: "Gulshan, Dhaka",
        latitude: 23.7925,
        longitude: 90.4078,
      },
      {
        name: "Fresh Harbor Farm",
        email: "vendor3@example.com",
        farmName: "Fresh Harbor Plot",
        farmLocation: "Banani, Dhaka",
        latitude: 23.7941,
        longitude: 90.4043,
      },
      {
        name: "Metro Roots Farm",
        email: "vendor4@example.com",
        farmName: "Metro Roots Terrace",
        farmLocation: "Mirpur, Dhaka",
        latitude: 23.8067,
        longitude: 90.3686,
      },
      {
        name: "Solar Sprout Farm",
        email: "vendor5@example.com",
        farmName: "Solar Sprout Garden",
        farmLocation: "Uttara, Dhaka",
        latitude: 23.8759,
        longitude: 90.3795,
      },
      {
        name: "City Harvest Farm",
        email: "vendor6@example.com",
        farmName: "City Harvest Rooftop",
        farmLocation: "Bashundhara, Dhaka",
        latitude: 23.8196,
        longitude: 90.4930,
      },
      {
        name: "EcoBloom Farm",
        email: "vendor7@example.com",
        farmName: "EcoBloom Greens",
        farmLocation: "Mohammadpur, Dhaka",
        latitude: 23.7645,
        longitude: 90.3562,
      },
      {
        name: "RootRise Farm",
        email: "vendor8@example.com",
        farmName: "RootRise Urban Plot",
        farmLocation: "Jatrabari, Dhaka",
        latitude: 23.7098,
        longitude: 90.4351,
      },
      {
        name: "Harvest Circle Farm",
        email: "vendor9@example.com",
        farmName: "Harvest Circle Terrace",
        farmLocation: "Tejgaon, Dhaka",
        latitude: 23.7605,
        longitude: 90.4041,
      },
      {
        name: "PurePatch Farm",
        email: "vendor10@example.com",
        farmName: "PurePatch Rooftop",
        farmLocation: "Wari, Dhaka",
        latitude: 23.7104,
        longitude: 90.4178,
      },
    ];

    const approvedVendors = [];
    const approvedVendorProfiles = [];

    for (const vendor of vendorTemplates) {
      const user = await insertUser(client, {
        name: vendor.name,
        email: vendor.email,
        passwordHash,
        role: "vendor",
        status: "active",
      });

      const profile = await insertVendorProfile(client, {
        userId: user.id,
        farmName: vendor.farmName,
        farmLocation: vendor.farmLocation,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        bio: `Sustainable urban farming focused on fresh produce and eco-friendly cultivation.`,
        certificationStatus: "approved",
        approvedBy: admin.id,
        approvedAt: new Date(),
      });

      await insertCertification(client, {
        vendorId: profile.id,
        certifyingAgency: "Bangladesh Organic Council",
        certificationDate: daysFromNow(-90),
        expiryDate: daysFromNow(275),
        documentUrl: `https://example.com/certificates/${profile.id}.pdf`,
        status: "approved",
        reviewedBy: admin.id,
        reviewNotes: "Verified during initial seeding.",
      });

      approvedVendors.push(user);
      approvedVendorProfiles.push(profile);
    }

    const pendingVendorUser = await insertUser(client, {
      name: "Pending Vendor",
      email: "pending-vendor@example.com",
      passwordHash,
      role: "vendor",
      status: "pending",
    });

    const pendingVendorProfile = await insertVendorProfile(client, {
      userId: pendingVendorUser.id,
      farmName: "Pending Approval Farm",
      farmLocation: "Badda, Dhaka",
      latitude: 23.7840,
      longitude: 90.4250,
      bio: "Vendor waiting for admin review.",
      certificationStatus: "pending",
      approvedBy: null,
      approvedAt: null,
    });

    const pendingCertification = await insertCertification(client, {
      vendorId: pendingVendorProfile.id,
      certifyingAgency: "Green Earth Authority",
      certificationDate: daysFromNow(-10),
      expiryDate: daysFromNow(355),
      documentUrl: `https://example.com/certificates/pending-${pendingVendorProfile.id}.pdf`,
      status: "pending",
      reviewedBy: null,
      reviewNotes: null,
    });

    const customers = [];
    const customerNames = [
      "Arafat Hossain",
      "Nusrat Jahan",
      "Tanvir Ahmed",
      "Sadia Karim",
      "Rakib Hasan",
      "Mim Rahman",
      "Shawon Islam",
      "Farzana Chowdhury",
      "Jannatul Ferdous",
      "Imran Hossain",
      "Raisa Akter",
      "Sabbir Hossain",
      "Mehedi Hasan",
      "Tasnim Ahmed",
      "Kawsar Rahman",
      "Nabila Sultana",
      "Rafiq Uddin",
      "Shila Akter",
      "Arif Mahmud",
      "Tania Islam",
    ];

    for (let i = 0; i < 20; i++) {
      const customer = await insertUser(client, {
        name: customerNames[i],
        email: `customer${i + 1}@example.com`,
        passwordHash,
        role: "customer",
        status: "active",
      });

      customers.push(customer);
    }

    const produceTemplates = [
      { category: "fresh_produce", base: "Organic Lettuce", price: 120 },
      { category: "fresh_produce", base: "Cherry Tomatoes", price: 180 },
      { category: "fresh_produce", base: "Spinach Bundle", price: 90 },
      { category: "fresh_produce", base: "Baby Carrots", price: 140 },
      { category: "fresh_produce", base: "Coriander Leaves", price: 70 },
      { category: "organic_products", base: "Organic Compost", price: 250 },
      { category: "organic_products", base: "Neem Pesticide", price: 180 },
      { category: "organic_products", base: "Vermicompost Pack", price: 300 },
      { category: "organic_products", base: "Coco Peat Mix", price: 220 },
      { category: "organic_products", base: "Bio Fertilizer", price: 280 },
      { category: "seeds", base: "Basil Seeds", price: 80 },
      { category: "seeds", base: "Tomato Seeds", price: 75 },
      { category: "seeds", base: "Spinach Seeds", price: 60 },
      { category: "seeds", base: "Cucumber Seeds", price: 85 },
      { category: "seeds", base: "Chili Seeds", price: 70 },
      { category: "tools", base: "Hand Trowel", price: 150 },
      { category: "tools", base: "Pruning Shears", price: 320 },
      { category: "tools", base: "Watering Can", price: 210 },
      { category: "tools", base: "Seed Tray", price: 95 },
      { category: "tools", base: "Garden Gloves", price: 130 },
      { category: "other", base: "Plant Support Net", price: 160 },
      { category: "other", base: "Grow Bag Set", price: 240 },
      { category: "other", base: "Moisture Meter", price: 450 },
      { category: "other", base: "Plant Marker Kit", price: 110 },
      { category: "other", base: "Harvest Basket", price: 200 },
    ];

    const produceRows = [];
    for (let vendorIndex = 0; vendorIndex < approvedVendorProfiles.length; vendorIndex++) {
      const vendorProfile = approvedVendorProfiles[vendorIndex];

      for (let itemIndex = 0; itemIndex < 10; itemIndex++) {
        const template = pick(produceTemplates, vendorIndex * 10 + itemIndex);
        const price = Number((template.price + vendorIndex * 12 + itemIndex * 5).toFixed(2));
        const quantity = 20 + itemIndex * 3;

        const product = await insertProduce(client, {
          vendorId: vendorProfile.id,
          name: `${template.base} ${vendorIndex + 1}-${itemIndex + 1}`,
          description: `High-quality ${template.base.toLowerCase()} supplied by ${vendorProfile.farm_name}.`,
          price,
          category: template.category,
          certificationStatus: "approved",
          availableQuantity: quantity,
        });

        produceRows.push(product);
      }
    }

    const rentalSpaces = [];
    for (let i = 0; i < approvedVendorProfiles.length; i++) {
      const vendorProfile = approvedVendorProfiles[i];

      for (let j = 0; j < 2; j++) {
        const space = await insertRentalSpace(client, {
          vendorId: vendorProfile.id,
          location: `${vendorProfile.farm_location} - Plot ${j + 1}`,
          latitude: Number((Number(vendorProfile.latitude) + j * 0.001).toFixed(6)),
          longitude: Number((Number(vendorProfile.longitude) + j * 0.001).toFixed(6)),
          size: 100 + i * 15 + j * 25,
          price: 4000 + i * 300 + j * 500,
        });

        rentalSpaces.push(space);
      }
    }

    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const space = rentalSpaces[i];
      const customer = customers[i];
      const vendorProfile = approvedVendorProfiles[i];

      const booking = await insertBooking(client, {
        rentalSpaceId: space.id,
        customerId: customer.id,
        vendorId: vendorProfile.id,
        startDate: daysFromNow(7 + i * 3),
        endDate: daysFromNow(37 + i * 3),
        totalPrice: Number(space.price),
        status: i % 2 === 0 ? "approved" : "active",
      });

      bookings.push(booking);
    }

    const postTemplates = [
      "Best compost mix for rooftop gardens",
      "How to reduce water usage in balcony farming",
      "Tips for pest control without chemicals",
      "When to harvest leafy greens for the best taste",
      "Using vertical planters in small spaces",
      "How to start seedlings indoors",
      "Natural ways to improve soil fertility",
      "Best crops for hot weather in urban areas",
      "Balcony gardening mistakes to avoid",
      "Simple organic fertilizer recipe",
    ];

    const allPostUsers = [
      admin,
      ...approvedVendors,
      pendingVendorUser,
      ...customers,
    ];

    for (let i = 0; i < 30; i++) {
      const author = allPostUsers[i % allPostUsers.length];
      await insertCommunityPost(client, {
        userId: author.id,
        postContent: `${pick(postTemplates, i)} — demo post ${i + 1}.`,
      });
    }

    const tracks = [];
    for (let i = 0; i < 20; i++) {
      const customer = customers[i];
      const vendorProfile = approvedVendorProfiles[i % approvedVendorProfiles.length];
      const booking = i < bookings.length ? bookings[i] : null;

      const track = await insertPlantTrack(client, {
        userId: customer.id,
        vendorId: vendorProfile.id,
        rentalBookingId: booking ? booking.id : null,
        plantName: `Plant ${i + 1}`,
        species: pick(["Basil", "Tomato", "Lettuce", "Spinach", "Coriander"], i),
        plantedAt: daysFromNow(-10 - i),
        expectedHarvestDate: daysFromNow(20 + i * 2),
        healthStatus: pick(["healthy", "needs_attention", "critical", "harvest_ready"], i),
        growthStage: pick(["seedling", "vegetative", "flowering", "fruiting"], i),
        currentNotes: `Seeded demo plant track ${i + 1}.`,
      });

      tracks.push(track);
    }

    for (let i = 0; i < tracks.length; i++) {
      await insertTrackingEvent(client, {
        plantTrackId: tracks[i].id,
        eventType: "status_update",
        eventPayload: {
          note: `Tracking update for plant ${i + 1}`,
          health: tracks[i].health_status,
          growthStage: tracks[i].growth_stage,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const orderStatuses = ["pending", "confirmed", "paid", "shipped", "completed"];

    for (let i = 0; i < 20; i++) {
      const customer = customers[i];
      const product = produceRows[i * 2];
      const vendorProfile = approvedVendorProfiles[i % approvedVendorProfiles.length];
      const quantity = 1 + (i % 3);

      await insertOrder(client, {
        userId: customer.id,
        produceId: product.id,
        vendorId: vendorProfile.id,
        quantity,
        unitPrice: Number(product.price),
        status: orderStatuses[i % orderStatuses.length],
      });
    }

    await client.query("COMMIT");

    console.log("Seed completed successfully.");
    console.log("");
    console.log("Demo login credentials:");
    console.log(`Admin:    admin@example.com / ${DEFAULT_PASSWORD}`);
    console.log(`Vendor 1: vendor1@example.com / ${DEFAULT_PASSWORD}`);
    console.log(`Vendor 2: vendor2@example.com / ${DEFAULT_PASSWORD}`);
    console.log(`Customer: customer1@example.com / ${DEFAULT_PASSWORD}`);
    console.log("");
    console.log("Pending review items for admin testing:");
    console.log(`Pending Vendor Profile ID: ${pendingVendorProfile.id}`);
    console.log(`Pending Certification ID:   ${pendingCertification.id}`);
    console.log("");
    console.log("Seed counts:");
    console.log(`Approved vendors: ${approvedVendors.length}`);
    console.log(`Customers:        ${customers.length}`);
    console.log(`Products:         ${produceRows.length}`);
    console.log(`Rental spaces:    ${rentalSpaces.length}`);
    console.log(`Bookings:         ${bookings.length}`);
    console.log(`Posts:            30`);
    console.log(`Plant tracks:     ${tracks.length}`);
    console.log(`Tracking events:  ${tracks.length}`);
    console.log(`Orders:           20`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(" Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();