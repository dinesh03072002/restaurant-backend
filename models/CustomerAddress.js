module.exports = (sequelize, DataTypes) => {
    const CustomerAddress = sequelize.define('CustomerAddress', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        address_type: {
            type: DataTypes.ENUM('home', 'work', 'other'),
            defaultValue: 'home'
        },
        address_line1: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        address_line2: {
            type: DataTypes.TEXT
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        pincode: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'customer_addresses',
        timestamps: true,
        underscored: true
    });

    CustomerAddress.associate = (models) => {
        CustomerAddress.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer'
        });
    };

    return CustomerAddress;
};