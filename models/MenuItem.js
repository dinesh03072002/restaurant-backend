module.exports = (sequelize, DataTypes) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    image: {
      type: DataTypes.STRING(255)
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_vegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: 'Preparation time in minutes'
    }
    // spicy_level is REMOVED
  }, {
    tableName: 'menu_items',
    timestamps: true,
    underscored: true
  });

  MenuItem.associate = (models) => {
    MenuItem.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    
    MenuItem.hasMany(models.OrderItem, {
      foreignKey: 'menu_item_id',
      as: 'order_items'
    });
  };

  return MenuItem;
};