require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ServerDescription, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
};

const run = async () => {
    try {
        // Connect the client to the server
        // await client.connect();

        const db = client.db('Nur-PH13-A10-DreamPlot');
        const propertiesCollection = db.collection('properties');
        const bookingsCollection = db.collection('bookings');
        const transactionsCollection = db.collection('transactions');
        const reviewsCollection = db.collection('reviews');
        const favoritesCollection = db.collection('favorites');
        const usersCollection = db.collection('user'); // Point to the collection used by Better Auth

        // Middlewares to verify roles (must query database to get the latest role)
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded?.email;
            if (!email) return res.status(403).send({ message: 'forbidden access' });
            const user = await usersCollection.findOne({ email });
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        };

        const verifyOwner = async (req, res, next) => {
            const email = req.decoded?.email;
            if (!email) return res.status(403).send({ message: 'forbidden access' });
            const user = await usersCollection.findOne({ email });
            if (user?.role !== 'Owner' && user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        };

        const verifyTenant = async (req, res, next) => {
            const email = req.decoded?.email;
            if (!email) return res.status(403).send({ message: 'forbidden access' });
            const user = await usersCollection.findOne({ email });
            if (user?.role !== 'Tenant' && user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        };

        // ========================= JWT token api ===========================
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            if (!user || !user.email) {
                return res.status(400).send({ error: 'Email is required' });
            }
            // Add role verification if needed, or get it from database
            const dbUser = await usersCollection.findOne({ email: user.email });
            const payload = {
                email: user.email,
                role: dbUser?.role || 'Tenant'
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.send({ token });
        });

        // ========================= properties api here ===========================
        app.get('/properties/seed', async (req, res) => {
            try {
                // Clear any existing seeded properties to reset cleanly if requested
                // For safety in production-like database, we will check count first.
                const count = await propertiesCollection.countDocuments();
                if (count > 0) {
                    return res.send({ message: 'Database already has properties seeded. Feel free to use the site.' });
                }
                
                const sampleProperties = [
                    {
                        title: "Modern Minimalist Villa",
                        description: "Experience absolute luxury and modern architectural precision in Gulshan. Featuring private pool, high ceilings, automated smart home systems, and premium quality construction.",
                        location: "Gulshan, Dhaka",
                        propertyType: "Villa",
                        rent: 4500,
                        rentType: "monthly",
                        bedrooms: 4,
                        bathrooms: 4,
                        propertySize: "3500 sqft",
                        amenities: ["Swimming Pool", "Smart Home", "24/7 Security", "Garage", "Gym"],
                        images: [
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
                            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                        extraFeatures: "Includes backup generator, servant quarters, and luxury Italian marble flooring.",
                        status: "approved",
                        ownerEmail: "owner@dreamplot.com",
                        ownerName: "Sarah Rahman",
                        ownerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
                        isFeatured: true,
                        createdAt: new Date()
                    },
                    {
                        title: "Luxury Skyline Penthouse",
                        description: "Overlooking the vibrant city, this Banani penthouse defines premium modern living. Floor-to-ceiling glass windows, chef's kitchen, and a private terrace.",
                        location: "Banani, Dhaka",
                        propertyType: "Studio",
                        rent: 6200,
                        rentType: "monthly",
                        bedrooms: 3,
                        bathrooms: 3,
                        propertySize: "2800 sqft",
                        amenities: ["Private Terrace", "Concierge", "High-speed Elevators", "Chef Kitchen", "24/7 Security"],
                        images: [
                            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                        extraFeatures: "Fully furnished by designer furniture and includes 2 secure parking bays.",
                        status: "approved",
                        ownerEmail: "owner@dreamplot.com",
                        ownerName: "Sarah Rahman",
                        ownerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
                        isFeatured: true,
                        createdAt: new Date()
                    },
                    {
                        title: "Cozy Coastal Cottage",
                        description: "Charming oceanfront cottage in Cox's Bazar. Perfect for short getaways. Watch the sunset directly from your bedroom or private balcony.",
                        location: "Cox's Bazar",
                        propertyType: "Villa",
                        rent: 350,
                        rentType: "daily",
                        bedrooms: 2,
                        bathrooms: 2,
                        propertySize: "1200 sqft",
                        amenities: ["Ocean View", "Private Balcony", "Beach Access", "Fully Furnished", "Air Conditioning"],
                        images: [
                            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
                            "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
                        extraFeatures: "Complimentary breakfast and beach gear included.",
                        status: "approved",
                        ownerEmail: "owner2@dreamplot.com",
                        ownerName: "Zafar Iqbal",
                        ownerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                        isFeatured: true,
                        createdAt: new Date()
                    },
                    {
                        title: "Premium Waterfront Office",
                        description: "State of the art corporate office spaces located in the Agrabad financial hub. High capability infrastructure, meeting rooms, and high bandwidth fiber optic connections.",
                        location: "Agrabad, Chittagong",
                        propertyType: "Office",
                        rent: 2500,
                        rentType: "monthly",
                        bedrooms: 5,
                        bathrooms: 3,
                        propertySize: "4000 sqft",
                        amenities: ["Fiber Optic Internet", "Meeting Rooms", "Central AC", "Backup Generator", "Receptionist Area"],
                        images: [
                            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
                            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
                        extraFeatures: "Configurable layout partition walls and secure access control gates.",
                        status: "approved",
                        ownerEmail: "owner2@dreamplot.com",
                        ownerName: "Zafar Iqbal",
                        ownerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                        isFeatured: false,
                        createdAt: new Date()
                    },
                    {
                        title: "Urban Studio Apartment",
                        description: "Compact and extremely modern studio apartment close to Dhanmondi Lake. Specially optimized layouts for young professionals or scholars.",
                        location: "Dhanmondi, Dhaka",
                        propertyType: "Studio",
                        rent: 1200,
                        rentType: "monthly",
                        bedrooms: 1,
                        bathrooms: 1,
                        propertySize: "750 sqft",
                        amenities: ["Lake Access", "Rooftop Garden", "Security Guard", "Laundry Room", "Elevator"],
                        images: [
                            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
                        extraFeatures: "Low utility charges and includes modular smart furniture.",
                        status: "approved",
                        ownerEmail: "owner@dreamplot.com",
                        ownerName: "Sarah Rahman",
                        ownerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
                        isFeatured: false,
                        createdAt: new Date()
                    },
                    {
                        title: "Suburban Commercial Land",
                        description: "Prime commercial land plot facing the main highway in Savar. Perfect for storage facility, dealership, or custom building developments.",
                        location: "Savar, Dhaka",
                        propertyType: "Land",
                        rent: 1500,
                        rentType: "monthly",
                        bedrooms: 0,
                        bathrooms: 0,
                        propertySize: "8000 sqft",
                        amenities: ["Boundary Wall", "Highway Access", "Water Connection", "Heavy Vehicle Access"],
                        images: [
                            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
                        ],
                        imageURL: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
                        extraFeatures: "Long-term leasing options available.",
                        status: "approved",
                        ownerEmail: "owner2@dreamplot.com",
                        ownerName: "Zafar Iqbal",
                        ownerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                        isFeatured: false,
                        createdAt: new Date()
                    }
                ];
                
                await propertiesCollection.insertMany(sampleProperties);
                
                // Reviews seed data
                const reviewsCount = await reviewsCollection.countDocuments();
                if (reviewsCount === 0) {
                    const sampleReviews = [
                        {
                            tenantName: "Kabir Hossain",
                            tenantEmail: "kabir@gmail.com",
                            tenantImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
                            rating: 5,
                            comment: "Staying at the Modern Minimalist Villa was an incredible experience. The service was top-notch and the design is truly institutional grade!",
                            date: new Date()
                        },
                        {
                            tenantName: "Nusrat Jahan",
                            tenantEmail: "nusrat@gmail.com",
                            tenantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
                            rating: 5,
                            comment: "The Coastal Cottage in Cox's Bazar was beautiful. Waking up to the ocean sound was magical. Process was extremely simple and quick.",
                            date: new Date()
                        },
                        {
                            tenantName: "Arifur Rahman",
                            tenantEmail: "arif@gmail.com",
                            tenantImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
                            rating: 5,
                            comment: "Rented the Waterfront Office for our startup team. High capacity internet and perfect reception areas. Highly recommended!",
                            date: new Date()
                        },
                        {
                            tenantName: "Tasnim Sultana",
                            tenantEmail: "tasnim@gmail.com",
                            tenantImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
                            rating: 4,
                            comment: "The studio in Dhanmondi is very cozy and matches the photos exactly. Perfect location, safe neighborhood, and excellent landlord communication.",
                            date: new Date()
                        }
                    ];
                    await reviewsCollection.insertMany(sampleReviews);
                }
                
                res.send({ success: true, message: 'Properties and reviews seeded successfully!' });
            } catch (err) {
                console.error("Seeding error:", err);
                res.status(500).send({ error: 'Failed to seed database' });
            }
        });

        // ========================= properties api here ===========================

        app.get('/properties', async (req, res) => {
            try {
                const { search, type, minPrice, maxPrice, sort, page, limit } = req.query;
                let query = { status: "approved" };

                if (search) {
                    query.$or = [
                        { location: { $regex: search, $options: 'i' } },
                        { title: { $regex: search, $options: 'i' } }
                    ];
                }

                if (type && type !== 'All Types') {
                    query.propertyType = { $regex: `^${type}$`, $options: 'i' };
                }

                if (minPrice || maxPrice) {
                    query.rent = {};
                    if (minPrice) query.rent.$gte = Number(minPrice);
                    if (maxPrice) query.rent.$lte = Number(maxPrice);
                }

                // Sorting
                let sortQuery = {};
                if (sort === 'low-high') {
                    sortQuery.rent = 1;
                } else if (sort === 'high-low') {
                    sortQuery.rent = -1;
                } else {
                    sortQuery.createdAt = -1; // Default: latest
                }

                // Pagination
                const pageNumber = Number(page) || 1;
                const limitNumber = Number(limit) || 6;
                const skip = (pageNumber - 1) * limitNumber;

                const total = await propertiesCollection.countDocuments(query);
                const result = await propertiesCollection.find(query)
                    .sort(sortQuery)
                    .skip(skip)
                    .limit(limitNumber)
                    .toArray();

                res.send({
                    properties: result,
                    totalPages: Math.ceil(total / limitNumber) || 1,
                    currentPage: pageNumber,
                    totalItems: total
                });
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to fetch properties" });
            }
        });

        // GET /properties/admin (Admin only)
        app.get('/properties/admin', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const result = await propertiesCollection.find({}).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching admin properties:", error);
                res.status(500).send({ error: "Failed to fetch properties" });
            }
        });

        // GET /properties/owner/:email (Owner only)
        app.get('/properties/owner/:email', verifyToken, verifyOwner, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                const result = await propertiesCollection.find({ ownerEmail: email }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching owner properties:", error);
                res.status(500).send({ error: "Failed to fetch properties" });
            }
        });

        app.get('/properties/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: "Invalid properties ID format" });
            }
            try {
                const query = { _id: new ObjectId(id) };
                const properties = await propertiesCollection.findOne(query);
                if (!properties) {
                    return res.status(404).send({ error: "properties not found" });
                }
                res.send(properties);
            } catch (error) {
                console.error("Error in GET /properties/:id:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // POST /properties (Owner only)
        app.post('/properties', verifyToken, verifyOwner, async (req, res) => {
            try {
                const property = req.body;
                property.status = 'pending';
                property.createdAt = new Date();
                if (property.rent) {
                    property.rent = Number(property.rent);
                }
                if (property.bedrooms) property.bedrooms = Number(property.bedrooms);
                if (property.bathrooms) property.bathrooms = Number(property.bathrooms);
                
                const result = await propertiesCollection.insertOne(property);
                res.send(result);
            } catch (error) {
                console.error("Error posting property:", error);
                res.status(500).send({ error: "Failed to add property" });
            }
        });

        // PATCH /properties/:id (Update or Moderate status)
        app.patch('/properties/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: "Invalid property ID format" });
                }
                const updates = req.body;
                if (updates.rent) updates.rent = Number(updates.rent);
                if (updates.bedrooms) updates.bedrooms = Number(updates.bedrooms);
                if (updates.bathrooms) updates.bathrooms = Number(updates.bathrooms);

                delete updates._id;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: updates
                };
                const result = await propertiesCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                console.error("Error updating property:", error);
                res.status(500).send({ error: "Failed to update property" });
            }
        });

        // DELETE /properties/:id (Owner/Admin)
        app.delete('/properties/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: "Invalid property ID format" });
                }
                const filter = { _id: new ObjectId(id) };
                
                const property = await propertiesCollection.findOne(filter);
                if (!property) {
                    return res.status(404).send({ error: "Property not found" });
                }
                
                const dbUser = await usersCollection.findOne({ email: req.decoded.email });
                if (dbUser.role !== 'Admin' && property.ownerEmail !== req.decoded.email) {
                    return res.status(403).send({ message: 'unauthorized to delete this property' });
                }
                
                const result = await propertiesCollection.deleteOne(filter);
                res.send(result);
            } catch (error) {
                console.error("Error deleting property:", error);
                res.status(500).send({ error: "Failed to delete property" });
            }
        });
        
        // featured properties api here using mongoDB limits to show 6 records
        app.get('/featuredProperties', async (req, res) => {
            try {
                const cursor = propertiesCollection.find({ isFeatured: true, status: "approved" }).limit(6);
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch featured properties" });
            }
        });

        // ========================= bookings api here ===========================
        // POST /bookings (Tenant only - creates a booking request)
        app.post('/bookings', verifyToken, verifyTenant, async (req, res) => {
            try {
                const booking = req.body;
                booking.bookingDate = new Date();
                booking.bookingStatus = 'pending';
                booking.paymentStatus = 'pending';
                booking.amountPaid = 0;
                
                if (booking.rent) booking.rent = Number(booking.rent);

                const result = await bookingsCollection.insertOne(booking);
                res.send(result);
            } catch (error) {
                console.error("Error creating booking:", error);
                res.status(500).send({ error: "Failed to create booking" });
            }
        });

        // POST /create-payment-intent (Tenant only)
        app.post('/create-payment-intent', verifyToken, verifyTenant, async (req, res) => {
            try {
                const { amount } = req.body;
                if (!amount || amount <= 0) {
                    return res.status(400).send({ error: "Invalid booking amount" });
                }
                
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100),
                    currency: 'usd',
                    payment_method_types: ['card'],
                });

                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                console.error("Error creating payment intent:", error);
                res.status(500).send({ error: "Payment gateway setup failed" });
            }
        });

        // POST /bookings/confirm-payment (Tenant only)
        app.post('/bookings/confirm-payment', verifyToken, verifyTenant, async (req, res) => {
            try {
                const { bookingId, transactionId, amountPaid } = req.body;
                if (!ObjectId.isValid(bookingId)) {
                    return res.status(400).send({ error: "Invalid booking ID format" });
                }
                
                const filter = { _id: new ObjectId(bookingId) };
                const booking = await bookingsCollection.findOne(filter);
                if (!booking) {
                    return res.status(404).send({ error: "Booking not found" });
                }
                
                const updateDoc = {
                    $set: {
                        paymentStatus: 'paid',
                        transactionId: transactionId,
                        amountPaid: Number(amountPaid)
                    }
                };
                await bookingsCollection.updateOne(filter, updateDoc);
                
                const property = await propertiesCollection.findOne({ _id: new ObjectId(booking.propertyId) });
                
                const transactionRecord = {
                    transactionId: transactionId,
                    propertyId: new ObjectId(booking.propertyId),
                    propertyName: booking.propertyTitle,
                    tenantName: booking.tenantName,
                    tenantEmail: booking.tenantEmail,
                    ownerName: property?.ownerName || "Property Owner",
                    ownerEmail: booking.ownerEmail,
                    amount: Number(amountPaid),
                    date: new Date()
                };
                await transactionsCollection.insertOne(transactionRecord);
                
                res.send({ success: true, message: "Payment confirmed successfully" });
            } catch (error) {
                console.error("Error confirming payment:", error);
                res.status(500).send({ error: "Payment confirmation failed" });
            }
        });

        // GET /bookings/tenant/:email (Tenant only)
        app.get('/bookings/tenant/:email', verifyToken, verifyTenant, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                const result = await bookingsCollection.find({ tenantEmail: email }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching tenant bookings:", error);
                res.status(500).send({ error: "Failed to fetch bookings" });
            }
        });

        // GET /bookings/owner/:email (Owner only)
        app.get('/bookings/owner/:email', verifyToken, verifyOwner, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                const result = await bookingsCollection.find({ ownerEmail: email }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching owner bookings:", error);
                res.status(500).send({ error: "Failed to fetch bookings" });
            }
        });

        // GET /bookings (Admin only)
        app.get('/bookings', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const result = await bookingsCollection.find({}).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching all bookings:", error);
                res.status(500).send({ error: "Failed to fetch bookings" });
            }
        });

        // PATCH /bookings/:id (Approve/Reject booking request)
        app.patch('/bookings/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: "Invalid booking ID format" });
                }
                const { bookingStatus } = req.body;
                const filter = { _id: new ObjectId(id) };
                
                const booking = await bookingsCollection.findOne(filter);
                if (!booking) {
                    return res.status(404).send({ error: "Booking not found" });
                }
                
                const dbUser = await usersCollection.findOne({ email: req.decoded.email });
                if (dbUser.role !== 'Admin' && booking.ownerEmail !== req.decoded.email) {
                    return res.status(403).send({ message: 'unauthorized to update this booking' });
                }
                
                const updateDoc = {
                    $set: { bookingStatus }
                };
                const result = await bookingsCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                console.error("Error updating booking status:", error);
                res.status(500).send({ error: "Failed to update booking" });
            }
        });

        // GET /bookings/:id (Protected)
        app.get('/bookings/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: "Invalid booking ID format" });
                }
                const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
                if (!booking) {
                    return res.status(404).send({ error: "Booking not found" });
                }
                
                const dbUser = await usersCollection.findOne({ email: req.decoded.email });
                if (dbUser.role !== 'Admin' && booking.tenantEmail !== req.decoded.email && booking.ownerEmail !== req.decoded.email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                res.send(booking);
            } catch (error) {
                console.error("Error fetching booking details:", error);
                res.status(500).send({ error: "Failed to fetch booking details" });
            }
        });

        // ========================= transactions api here ===========================
        // GET /transactions (Admin only)
        app.get('/transactions', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const result = await transactionsCollection.find({}).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                res.status(500).send({ error: "Failed to fetch transactions" });
            }
        });

        // ========================= review api here ===========================

        app.get('/reviews', async (req, res) => {
            try {
                const cursor = reviewsCollection.find({});
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: "Failed to fetch reviews" });
            }
        });

        // POST /reviews (Tenant only)
        app.post('/reviews', verifyToken, verifyTenant, async (req, res) => {
            try {
                const review = req.body;
                review.date = new Date();
                review.rating = Number(review.rating);
                
                const result = await reviewsCollection.insertOne(review);
                res.send(result);
            } catch (error) {
                console.error("Error posting review:", error);
                res.status(500).send({ error: "Failed to submit review" });
            }
        });

        // DELETE /reviews/:id (Tenant/Admin)
        app.delete('/reviews/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ error: "Invalid review ID format" });
                }
                const filter = { _id: new ObjectId(id) };
                const review = await reviewsCollection.findOne(filter);
                if (!review) {
                    return res.status(404).send({ error: "Review not found" });
                }
                
                const dbUser = await usersCollection.findOne({ email: req.decoded.email });
                if (dbUser.role !== 'Admin' && review.tenantEmail !== req.decoded.email) {
                    return res.status(403).send({ message: 'unauthorized to delete this review' });
                }
                
                const result = await reviewsCollection.deleteOne(filter);
                res.send(result);
            } catch (error) {
                console.error("Error deleting review:", error);
                res.status(500).send({ error: "Failed to delete review" });
            }
        });

        // ========================= favorites api here ===========================
        // GET /favorites/:email (Tenant only)
        app.get('/favorites/:email', verifyToken, verifyTenant, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                
                const favs = await favoritesCollection.find({ tenantEmail: email }).toArray();
                const propertyIds = favs.map(f => new ObjectId(f.propertyId));
                
                const properties = await propertiesCollection.find({ _id: { $in: propertyIds } }).toArray();
                res.send(properties);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                res.status(500).send({ error: "Failed to fetch favorites" });
            }
        });

        // POST /favorites (Tenant only)
        app.post('/favorites', verifyToken, verifyTenant, async (req, res) => {
            try {
                const { propertyId, tenantEmail } = req.body;
                if (req.decoded.email !== tenantEmail) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                
                const existing = await favoritesCollection.findOne({ propertyId, tenantEmail });
                if (existing) {
                    return res.send({ message: "Already in favorites", alreadyExists: true });
                }
                
                const result = await favoritesCollection.insertOne({ propertyId, tenantEmail });
                res.send(result);
            } catch (error) {
                console.error("Error adding favorite:", error);
                res.status(500).send({ error: "Failed to add favorite" });
            }
        });

        // DELETE /favorites/:email/:propertyId (Tenant only)
        app.delete('/favorites/:email/:propertyId', verifyToken, verifyTenant, async (req, res) => {
            try {
                const { email, propertyId } = req.params;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                
                const result = await favoritesCollection.deleteOne({ propertyId, tenantEmail: email });
                res.send(result);
            } catch (error) {
                console.error("Error removing favorite:", error);
                res.status(500).send({ error: "Failed to remove favorite" });
            }
        });

        // ========================= user api here ===========================
        // GET /users (Admin only)
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const cursor = usersCollection.find({});
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).send({ error: "Failed to fetch users" });
            }
        });

        // PATCH /users/:id/role (Admin only)
        app.patch('/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: "Invalid user ID format" });
            }
            const { role } = req.body;
            try {
                const query = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: { role }
                };
                const result = await usersCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error("Error patching user role:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // GET /users/profile/:email (Self / Admin check)
        app.get('/users/profile/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                const requester = await usersCollection.findOne({ email: req.decoded.email });
                if (requester?.role !== 'Admin') {
                    return res.status(403).send({ message: 'forbidden access' });
                }
            }
            try {
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(404).send({ error: "User not found" });
                }
                res.send(user);
            } catch (error) {
                console.error("Error in GET /users/profile/:email:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // PATCH /users/profile/:email (Self only)
        app.patch('/users/profile/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            try {
                const query = { email };
                const updateDoc = {
                    $set: req.body
                };
                delete updateDoc.$set._id;
                delete updateDoc.$set.email;

                const result = await usersCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error("Error in PATCH /users/profile/:email:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // GET /owner/analytics/:email (Owner only)
        app.get('/owner/analytics/:email', verifyToken, verifyOwner, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }

                const properties = await propertiesCollection.find({ ownerEmail: email }).toArray();
                
                const transactions = await transactionsCollection.find({ ownerEmail: email }).toArray();
                const totalEarnings = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

                const totalProperties = properties.length;
                const bookings = await bookingsCollection.find({ ownerEmail: email }).toArray();
                const confirmedBookings = bookings.filter(b => b.bookingStatus === 'approved').length;

                const monthlyData = {};
                const now = new Date();
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    monthlyData[key] = 0;
                }

                transactions.forEach(tx => {
                    const txDate = new Date(tx.date || tx.createdAt || new Date());
                    const key = txDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                    if (monthlyData[key] !== undefined) {
                        monthlyData[key] += tx.amount || 0;
                    }
                });

                const chartData = Object.keys(monthlyData).map(month => ({
                    month,
                    earnings: monthlyData[month]
                }));

                res.send({
                    totalEarnings,
                    totalProperties,
                    totalBookings: bookings.length,
                    confirmedBookings,
                    chartData
                });
            } catch (error) {
                console.error("Error in owner analytics:", error);
                res.status(500).send({ error: "Failed to load owner analytics data" });
            }
        });

        // GET /admin/analytics (Admin only)
        app.get('/admin/analytics', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const totalUsers = await usersCollection.countDocuments();
                const tenantCount = await usersCollection.countDocuments({ role: 'Tenant' });
                const ownerCount = await usersCollection.countDocuments({ role: 'Owner' });
                const adminCount = await usersCollection.countDocuments({ role: 'Admin' });

                const totalProperties = await propertiesCollection.countDocuments();
                const approvedProperties = await propertiesCollection.countDocuments({ status: 'approved' });
                const pendingProperties = await propertiesCollection.countDocuments({ status: 'pending' });
                const rejectedProperties = await propertiesCollection.countDocuments({ status: 'rejected' });

                const bookings = await bookingsCollection.find({}).toArray();
                const transactions = await transactionsCollection.find({}).toArray();
                const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

                const monthlyData = {};
                const now = new Date();
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    monthlyData[key] = 0;
                }

                transactions.forEach(tx => {
                    const txDate = new Date(tx.date || tx.createdAt || new Date());
                    const key = txDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                    if (monthlyData[key] !== undefined) {
                        monthlyData[key] += tx.amount || 0;
                    }
                });

                const chartData = Object.keys(monthlyData).map(month => ({
                    month,
                    revenue: monthlyData[month]
                }));

                res.send({
                    totalUsers,
                    tenantCount,
                    ownerCount,
                    adminCount,
                    totalProperties,
                    approvedProperties,
                    pendingProperties,
                    rejectedProperties,
                    totalBookings: bookings.length,
                    totalTransactions: transactions.length,
                    totalRevenue,
                    chartData
                });
            } catch (error) {
                console.error("Error in admin analytics:", error);
                res.status(500).send({ error: "Failed to load admin analytics data" });
            }
        });

        // GET /tenant/analytics/:email (Tenant only)
        app.get('/tenant/analytics/:email', verifyToken, verifyTenant, async (req, res) => {
            try {
                const email = req.params.email;
                if (req.decoded.email !== email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }

                const bookings = await bookingsCollection.find({ tenantEmail: email }).toArray();
                const favoritesCount = await favoritesCollection.countDocuments({ tenantEmail: email });

                const totalPaidBookings = bookings.filter(b => b.paymentStatus === 'paid').length;
                const totalPendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;
                
                const totalSpent = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);

                const monthlyData = {};
                const now = new Date();
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    monthlyData[key] = 0;
                }

                bookings.forEach(b => {
                    if (b.paymentStatus === 'paid') {
                        const bDate = new Date(b.bookingDate || new Date());
                        const key = bDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                        if (monthlyData[key] !== undefined) {
                            monthlyData[key] += b.amountPaid || 0;
                        }
                    }
                });

                const chartData = Object.keys(monthlyData).map(month => ({
                    month,
                    expenses: monthlyData[month]
                }));

                res.send({
                    totalBookings: bookings.length,
                    totalPaidBookings,
                    totalPendingBookings,
                    totalFavorites: favoritesCount,
                    totalSpent,
                    chartData
                });
            } catch (error) {
                console.error("Error in tenant analytics:", error);
                res.status(500).send({ error: "Failed to load tenant analytics data" });
            }
        });
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;

