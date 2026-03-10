module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_number: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    customer_phone: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    customer_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 40
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('cod', 'upi'),
      defaultValue: 'cod'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    order_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    special_instructions: {
      type: DataTypes.TEXT
    },
    delivery_date: {
      type: DataTypes.DATEONLY
    },
    delivery_time: {
      type: DataTypes.TIME
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (order) => {
        // Generate order number if not provided
        if (!order.order_number) {
          const date = new Date();
          const year = date.getFullYear().toString().slice(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          order.order_number = `ORD${year}${month}${day}${random}`;
        }
      }
    }
  });

  Order.associate = (models) => {
  Order.hasMany(models.OrderItem, {
    foreignKey: 'order_id',
    as: 'items'
  });
  
  
  Order.belongsTo(models.Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
  });
};



  return Order;
};