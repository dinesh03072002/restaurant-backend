const db = require('../models');
const bcrypt = require('bcryptjs');

const syncDatabase = async () => {
  try {
    // Sync all models with database
    await db.sequelize.sync({ force: true }); // Use force: true only in development
    console.log('✅ Database synced successfully');

    // Create default categories
    const categories = await db.Category.bulkCreate([
      {
        name: 'Cakes',
        description: 'Delicious celebration cakes',
        display_order: 1
      },
      {
        name: 'Cupcakes',
        description: 'Perfect for parties',
        display_order: 2
      },
      {
        name: 'Pastries',
        description: 'Individual treats',
        display_order: 3
      }
    ]);
    console.log('✅ Default categories created');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.User.create({
      name: 'Admin',
      email: 'admin@sweettreats.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('✅ Default admin user created');

    // Create sample menu items
    await db.MenuItem.bulkCreate([
      {
        category_id: 1,
        name: 'Classic Chocolate Cake',
        description: 'Rich, moist chocolate cake with silky chocolate ganache',
        price: 599,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
        is_vegetarian: true,
        preparation_time: 30
      },
      {
        category_id: 1,
        name: 'Pineapple Garden Cake',
        description: 'Light vanilla cake with fresh pineapple filling',
        price: 549,
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3',
        is_vegetarian: true,
        preparation_time: 25
      },
      {
        category_id: 1,
        name: 'Red Velvet Cake',
        description: 'Velvety red cake with cream cheese frosting',
        price: 699,
        image: 'https://images.unsplash.com/photo-1586788224331-947f68671cf1',
        is_vegetarian: true,
        preparation_time: 35
      }
    ]);
    console.log('✅ Sample menu items created');

    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  syncDatabase();
}

module.exports = syncDatabase;