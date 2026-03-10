module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[6-9]\d{9}$/ 
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true 
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true
  });

  Customer.associate = (models) => {
    Customer.hasMany(models.Order, {
      foreignKey: 'customer_id',
      as: 'orders'
    });
  };

  return Customer;
};