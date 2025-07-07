'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    static associate(models) {
      // agreagar asos.
      Image.hasMany(models.Comment, { foreignKey: 'imageId',onDelete: 'CASCADE',hooks: true});
    }
  }
  Image.init({
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filepath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fechaPublicacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1900,
        max: new Date().getFullYear() + 1
      }
    },
    mesPublicacion: {
      type: DataTypes.STRING,
      allowNull: false
    }, 
  }, {
    sequelize,
    modelName: 'Image',
    tableName: 'Images'
  });
  return Image;
};
