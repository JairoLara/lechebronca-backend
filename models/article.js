'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      
    }
  }

  Article.init({
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    texto: {
      type: DataTypes.TEXT,
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
    }
  }, {
    sequelize,
    modelName: 'Article',
    tableName: 'Articles'
  });

  return Article;
};
