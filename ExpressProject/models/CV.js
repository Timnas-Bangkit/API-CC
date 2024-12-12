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

  jobRole: {
    type: DataTypes.STRING,
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
  const skills = Skills.findAll({
    where: {cvId: this.id},
    attributes: ['skill'],
  });
  const certs = Certs.findAll({
    where: {cvId: this.id},
    attributes: ['certification'],
  });
  const workExps = WorkExp.findAll({
    where: {cvId: this.id},
    attributes: {exclude: ['id', 'cvId']},
  });

  const ret = await Promise.all([skills, certs, workExps]).catch((err) => {
    logger.error('[CV] failed to retrieve data');
    return null;
  });

  if(!ret){
    return null
  }

  const arr1 = []
  ret[0].forEach((e) => {
    arr1.push(e.skill);
  });
  const arr2 = []
  ret[1].forEach((e) => {
    arr2.push(e.certification);
  });

  return {
    score: this.score,
    jobRole: this.jobRole,
    skills: arr1,
    workExperiences: ret[2],
    certifications: arr2,
  };
}

module.exports = { CV, Skills, WorkExp, Certs };
