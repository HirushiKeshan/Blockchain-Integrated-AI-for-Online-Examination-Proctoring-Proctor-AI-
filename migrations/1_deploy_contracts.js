const ExamLog = artifacts.require("ExamLog");

module.exports = function (deployer) {
  deployer.deploy(ExamLog);
};
