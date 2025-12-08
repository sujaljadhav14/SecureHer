const mongoose = require('mongoose');
const Post = require('./models/Post');

// Sample dummy data for community posts
const samplePosts = [
    {
        username: 'SafetyFirst',
        content: 'Just wanted to share my experience using the safety features in this app. The fake call feature saved me from an uncomfortable situation yesterday! 💪',
        images: [],
        location: 'Mumbai, Maharashtra',
        tags: ['safety', 'experience', 'grateful'],
        likes: [],
        comments: [
            {
                username: 'Empowered23',
                text: 'So glad it helped you! Stay safe! ❤️',
                createdAt: new Date(Date.now() - 3600000)
            }
        ],
        sentiment: 'positive',
        createdAt: new Date(Date.now() - 86400000 * 2)
    },
    {
        username: 'WomenUnited',
        content: 'Looking for self-defense classes in Delhi. Anyone knows good instructors?',
        images: [],
        location: 'Delhi NCR',
        tags: ['self-defense', 'training', 'Delhi'],
        likes: [],
        comments: [],
        sentiment: 'neutral',
        createdAt: new Date(Date.now() - 86400000)
    },
    {
        username: 'BraveHeart',
        content: 'Thanks to this community for the support. The journey tracking feature gives me peace of mind when traveling alone at night. 🌙',
        images: [],
        location: 'Bangalore, Karnataka',
        tags: ['journey-tracker', 'night-safety'],
        likes: [],
        comments: [
            {
                username: 'SafetyFirst',
                text: 'Absolutely! The real-time sharing feature is amazing.',
                createdAt: new Date(Date.now() - 7200000)
            }
        ],
        sentiment: 'positive',
        createdAt: new Date(Date.now() - 43200000)
    },
    {
        username: 'Empowered23',
        content: 'Has anyone tried the legal assistance feature? I need some guidance on workplace harassment.',
        images: [],
        location: 'Pune, Maharashtra',
        tags: ['legal-help', 'workplace'],
        likes: [],
        comments: [],
        sentiment: 'needs_support',
        supportOffered: true,
        createdAt: new Date(Date.now() - 21600000)
    },
    {
        username: 'StrengthInNumbers',
        content: 'Organizing a meetup for women in tech this weekend! DM if interested. Let\'s build our network! 🚀',
        images: [],
        location: 'Hyderabad, Telangana',
        tags: ['networking', 'women-in-tech', 'meetup'],
        likes: [],
        comments: [
            {
                username: 'WomenUnited',
                text: 'Count me in!',
                createdAt: new Date(Date.now() - 1800000)
            }
        ],
        sentiment: 'positive',
        createdAt: new Date(Date.now() - 10800000)
    }
];

// Function to seed the database
async function seedPosts() {
    try {
        console.log('🌱 Seeding community posts...');

        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/secureher');
        console.log('✅ Connected to MongoDB');

        // Clear existing posts (optional - remove if you want to keep existing)
        await Post.deleteMany({});
        console.log('🗑️  Cleared existing posts');

        // Create posts with dummy user IDs (you may need to adjust based on your User model)
        const postsToInsert = samplePosts.map(post => ({
            ...post,
            userId: new mongoose.Types.ObjectId() // Temporary user ID
        }));

        await Post.insertMany(postsToInsert);
        console.log(`✅ Inserted ${postsToInsert.length} sample posts`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding posts:', error);
        process.exit(1);
    }
}

// Run seeder
seedPosts();
