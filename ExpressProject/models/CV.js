const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../config/sequelize.config');
const User = require('./User.js');

const CV = sequelize.define('cv', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  score: {
    type: DataTypes.FLOAT,
  },

  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    }
  }
});

const Skills = sequelize.define('skill', {
  cvId: {
    type: DataTypes.INTEGER,
    references: {
      model: CV,
      key: 'id',
    }
  },

  skill: {
    type: DataTypes.STRING,
  }
});

const WorkExp = sequelize.define('work_exp', {
  cvId: {
    type: DataTypes.INTEGER,
    references: {
      model: CV,
      key: 'id',
    }
  },

  companyName: {
    type: DataTypes.STRING,
  },

  startDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  endDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  position: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

const Certs = sequelize.define('cert', {
  cvId: {
    type: DataTypes.INTEGER,
    references: {
      model: CV,
      key: 'id'
    }
  },

  certification: {
    type: DataTypes.STRING
  }
});



CV.prototype.purge = function (){
  Skills.destroy({
    where: {
      cvId: this.id
    },
  });

  WorkExp.destroy({
    where: {
      cvId: this.id,
    },
  });

  Certs.destroy({
    where: {
      cvId: this.id,
    },
  });
};


CV.hasMany(Skills, {
  as: 'skill',
  foreignKey: 'cvId',
});
CV.hasMany(WorkExp, {
  as: 'workExp',
  foreignKey: 'cvId',
});
CV.hasMany(Certs, {
  as: 'cert',
  foreignKey: 'cvId',
})


CV.prototype.response = async function (){
  const skills = await this.getSkill();
  const certs = await this.getCert();
  const workExps = await this.getWorkExp();

  const arrSkill = []
  skills.forEach(element => {
    arrSkill.push(element.skill);
  });
  const arrCerts = []
  certs.forEach(element => {
    arrCerts.push(element.certification);
  });

  return {
    score: this.score,
    skills: arrSkill,
    workExperiences: workExps,
    certifications: arrCerts,
  };
}

module.exports = { CV, Skills, WorkExp, Certs };
